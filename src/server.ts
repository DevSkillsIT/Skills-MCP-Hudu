import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { HuduClient } from './hudu-client.js';
import { FilteredHuduClient } from './filtered-hudu-client.js';
import { HuduConfig } from './types.js';
import { WORKING_TOOLS, WORKING_TOOL_EXECUTORS, type ToolResponse } from './tools/working-index.js';

export interface HuduMcpServerConfig {
  huduConfig: HuduConfig;
  logLevel?: string;
  port?: number;
  // HTTP-only transport as per CLAUDE.md requirements
}

export interface AuthenticatedUser {
  email?: string;
  name?: string;
  groups?: string[];
  accessToken?: string;
}

// Extend Express Request to include user context
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export class HuduMcpServer {
  private server: Server;
  private huduClient: HuduClient | FilteredHuduClient;
  private logger!: winston.Logger;
  private config: HuduMcpServerConfig;

  constructor(config: HuduMcpServerConfig) {
    this.config = config;
    
    // Setup Winston logger with file rotation first
    this.setupLogger();

    // Initialize Hudu client (filtered or regular based on config)
    this.huduClient = this.createHuduClient(config);

    // Create MCP server with proper SDK patterns
    this.server = new Server(
      {
        name: 'hudu-mcp-server',
        version: '1.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    this.logger.info('Hudu MCP Server initialized', {
      version: '1.1.0',
      huduBaseUrl: config.huduConfig.baseUrl,
      logLevel: config.logLevel || 'info',
      transport: 'http' // HTTP-only as per CLAUDE.md
    });
  }

  /**
   * Creates HuduClient or FilteredHuduClient based on environment configuration
   */
  private createHuduClient(config: HuduMcpServerConfig): HuduClient | FilteredHuduClient {
    const allowedIds = this.parseAllowedCompanyIds();
    
    if (allowedIds.includes('ALL')) {
      this.logger.info('Hudu MCP configured with ALL companies access (unfiltered)');
      return new HuduClient(config.huduConfig);
    }
    
    this.logger.info('Hudu MCP configured with filtered access', { 
      allowedCompanies: allowedIds.length,
      companyIds: allowedIds
    });
    
    const originalClient = new HuduClient(config.huduConfig);
    return new FilteredHuduClient(originalClient, allowedIds, this.logger);
  }

  /**
   * Parses HUDU_ALLOWED_COMPANY_IDS from environment
   * Returns array of company IDs or ['ALL'] for unrestricted access
   */
  private parseAllowedCompanyIds(): string[] {
    const config = process.env.HUDU_ALLOWED_COMPANY_IDS || 'ALL';
    
    // Handle ALL case (retrocompatibility)
    if (config.toUpperCase() === 'ALL') {
      return ['ALL'];
    }
    
    // Parse comma-separated list of IDs
    const ids = config
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
    
    // Validate that all IDs are numeric
    const validIds = ids.filter(id => {
      const isNumeric = /^\d+$/.test(id);
      if (!isNumeric) {
        this.logger.warn(`Invalid company ID format: ${id}. Only numeric IDs are allowed.`, {
          invalidId: id,
          allIds: ids
        });
      }
      return isNumeric;
    });
    
    // Safety limit to prevent performance issues
    if (validIds.length > 10) {
      this.logger.warn(`Too many company IDs configured. Limiting to first 10 for performance reasons.`, {
        requestedCount: validIds.length,
        allowedCount: 10,
        companyIds: validIds.slice(0, 10)
      });
      return validIds.slice(0, 10);
    }
    
    if (validIds.length === 0) {
      this.logger.error(`No valid company IDs found in configuration: ${config}`, {
        originalConfig: config,
        parsedIds: ids,
        validIds: validIds
      });
      throw new Error('HUDU_ALLOWED_COMPANY_IDS must contain at least one valid numeric company ID or "ALL"');
    }
    
    return validIds;
  }

  private setupLogger(): void {
    // Ensure logs directory exists
    const logsDir = join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    // Initialize the logger
    this.logger = winston.createLogger({
      level: this.config.logLevel || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        // Console logging
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // Combined log file (all levels)
        new DailyRotateFile({
          filename: join(logsDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        }),
        // Error log file (error level only)
        new DailyRotateFile({
          filename: join(logsDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        }),
        // API log file (for API calls and responses)
        new DailyRotateFile({
          filename: join(logsDir, 'api-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '7d',
          level: 'debug',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        })
      ]
    });
  }

  private setupHandlers(): void {
    this.logger.debug('Setting up MCP request handlers');

    // Tools handler - using proper MCP SDK patterns
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Listing available tools');
      
      const tools = Object.values(WORKING_TOOLS).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));

      this.logger.info('Tools listed successfully', { 
        count: tools.length,
        tools: tools.map(t => t.name)
      });

      return { tools };
    });

    // Tool execution handler - proper MCP SDK pattern
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const requestId = Math.random().toString(36).substring(7);
      
      this.logger.info('Tool execution started', {
        requestId,
        toolName: name,
        arguments: args
      });

      const startTime = Date.now();

      try {
        const executor = WORKING_TOOL_EXECUTORS[name];
        
        if (!executor) {
          this.logger.error('Unknown tool requested', {
            requestId,
            toolName: name,
            availableTools: Object.keys(WORKING_TOOL_EXECUTORS)
          });
          throw new McpError(ErrorCode.InvalidRequest, `Unknown tool: ${name}`);
        }

        const result: ToolResponse = await executor(args, this.huduClient);
        const duration = Date.now() - startTime;

        if (result.success) {
          this.logger.info('Tool execution completed successfully', {
            requestId,
            toolName: name,
            duration,
            dataSize: JSON.stringify(result.data).length
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result.data || { success: true, message: result.message }, null, 2)
            }]
          };
        } else {
          this.logger.error('Tool execution failed', {
            requestId,
            toolName: name,
            duration,
            error: result.error
          });
          throw new McpError(ErrorCode.InternalError, result.error || 'Tool execution failed');
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        this.logger.error('Tool execution error', {
          requestId,
          toolName: name,
          duration,
          error: error.message,
          stack: error.stack
        });
        
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });

    // Resources handler - proper MCP SDK pattern
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Listing available resources');
      
      const resources = [
        {
          uri: 'hudu://articles',
          name: 'Hudu Articles',
          description: 'Knowledge base articles from Hudu',
          mimeType: 'application/json'
        },
        {
          uri: 'hudu://assets',
          name: 'Hudu Assets',
          description: 'IT assets inventory from Hudu',
          mimeType: 'application/json'
        },
        {
          uri: 'hudu://companies',
          name: 'Hudu Companies',
          description: 'Company information from Hudu',
          mimeType: 'application/json'
        },
        {
          uri: 'hudu://passwords',
          name: 'Hudu Passwords',
          description: 'Password entries from Hudu',
          mimeType: 'application/json'
        }
      ];

      this.logger.info('Resources listed successfully', { 
        count: resources.length 
      });

      return { resources };
    });

    // Resource read handler - proper MCP SDK pattern
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const requestId = Math.random().toString(36).substring(7);
      
      this.logger.info('Resource read started', {
        requestId,
        uri
      });

      try {
        let data: any[] = [];
        
        switch (uri) {
          case 'hudu://articles':
            data = await this.huduClient.getArticles({});
            break;
          case 'hudu://assets':
            data = await this.huduClient.getAssets({});
            break;
          case 'hudu://companies':
            data = await this.huduClient.getCompanies({});
            break;
          case 'hudu://passwords':
            data = await this.huduClient.getAssetPasswords({});
            break;
          default:
            throw new McpError(ErrorCode.InvalidRequest, `Unknown resource URI: ${uri}`);
        }

        this.logger.info('Resource read completed', {
          requestId,
          uri,
          dataSize: JSON.stringify(data).length
        });

        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2)
          }]
        };
      } catch (error: any) {
        this.logger.error('Resource read error', {
          requestId,
          uri,
          error: error.message
        });
        
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${error.message}`);
      }
    });

    // Prompts handler - proper MCP SDK pattern
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      this.logger.debug('Listing available prompts');
      
      const prompts = [
        {
          name: 'hudu_security_audit',
          description: 'Generate a comprehensive security audit report based on Hudu data',
          arguments: [
            {
              name: 'company_id',
              description: 'Company ID to audit (optional)',
              required: false
            }
          ]
        },
        {
          name: 'hudu_asset_report',
          description: 'Generate an asset inventory report',
          arguments: [
            {
              name: 'company_id',
              description: 'Company ID to report on (optional)',
              required: false
            }
          ]
        }
      ];

      this.logger.info('Prompts listed successfully', { 
        count: prompts.length 
      });

      return { prompts };
    });

    // Prompt get handler - proper MCP SDK pattern
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      this.logger.info('Prompt requested', { name, arguments: args });

      switch (name) {
        case 'hudu_security_audit':
          const companyId = args?.company_id;
          return {
            description: 'Security audit prompt for Hudu data',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Perform a comprehensive security audit${companyId ? ` for company ID ${companyId}` : ' across all companies'}. Review assets, passwords, and documentation for security compliance. Focus on:

1. Password strength and rotation policies
2. Asset inventory completeness
3. Documentation coverage
4. Access controls and permissions
5. Compliance with security standards

Provide actionable recommendations for improvement.`
                }
              }
            ]
          };

        case 'hudu_asset_report':
          const reportCompanyId = args?.company_id;
          return {
            description: 'Asset inventory report prompt for Hudu data',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Generate a comprehensive asset inventory report${reportCompanyId ? ` for company ID ${reportCompanyId}` : ' across all companies'}. Include:

1. Total asset count by type
2. Assets requiring updates
3. Missing documentation
4. Asset relationships and dependencies
5. Compliance status

Format as a professional report with executive summary.`
                }
              }
            ]
          };

        default:
          throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
      }
    });

    this.logger.debug('MCP request handlers setup complete');
  }

  // STDIO transport removed as per CLAUDE.md requirements - HTTP ONLY

  async runHttp(): Promise<void> {
    const port = this.config.port || 3050;
    this.logger.info('Starting MCP server with Streamable HTTP transport', { port });

    const app = express();

    // Security: Restrict CORS to localhost and local network only
    const allowedOrigins = process.env.MCP_ALLOWED_ORIGINS?.split(',') || [
      'http://localhost',
      'http://127.0.0.1',
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // Local network
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,   // Private network
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+:\d+$/  // Private network
    ];

    app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman, Claude Desktop)
        if (!origin) return callback(null, true);

        // Check if origin matches allowed patterns
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === 'string') {
            return origin.startsWith(allowed);
          }
          return allowed.test(origin);
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          this.logger.warn('CORS blocked request from origin', { origin });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Mcp-Session-Id']
    }));

    // Security: Rate limiting to prevent abuse
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per 15 minutes
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path
        });
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(15 * 60)
        });
      }
    });

    // Apply rate limiting to all routes
    app.use(limiter);

    // Use express.json with increased size limit for MCP messages
    app.use(express.json({
      limit: '50mb',
      strict: false
    }));

    // OAuth2-Proxy User Context Middleware
    // Extracts user information from headers injected by OAuth2-Proxy
    app.use((req, res, next) => {
      const oauthEnabled = process.env.OAUTH_ENABLED === 'true';

      if (oauthEnabled) {
        // Extract user information from OAuth2-Proxy headers
        const email = req.headers['x-auth-request-email'] as string;
        const user = req.headers['x-auth-request-user'] as string;
        const accessToken = req.headers['x-auth-request-access-token'] as string;
        const groupsHeader = req.headers['x-auth-request-groups'] as string;

        if (email || user) {
          req.user = {
            email: email || user,
            name: user || email,
            groups: groupsHeader ? groupsHeader.split(',').map(g => g.trim()) : [],
            accessToken: accessToken
          };

          this.logger.debug('OAuth user context extracted', {
            email: req.user.email,
            groups: req.user.groups,
            path: req.path,
            method: req.method
          });
        }
      }

      next();
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.1.0',
        transport: 'streamable-http'
      });
    });
    
    // Info endpoint
    app.get('/', (req, res) => {
      res.json({
        name: 'hudu-mcp-server',
        version: '1.1.0',
        mcp: {
          version: '2024-11-05',
          endpoint: '/mcp'
        }
      });
    });
    

    // ============================================
    // Streamable HTTP Transport (Dual: Claude + Gemini)
    // Suporta GET (SSE), POST (JSON-RPC), DELETE (session)
    // ============================================

    // Store active sessions for Streamable HTTP
    const sessions: Map<string, { createdAt: number; res?: any }> = new Map();

    // Cleanup old sessions periodically (15 min timeout)
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of sessions.entries()) {
        if (now - session.createdAt > 15 * 60 * 1000) {
          sessions.delete(sessionId);
          this.logger.debug('Session expired', { sessionId });
        }
      }
    }, 60000);

    // GET /mcp - SSE endpoint for server-to-client notifications (Gemini requirement)
    app.get('/mcp', (req, res) => {
      const sessionId = req.headers['mcp-session-id'] as string || randomUUID();

      this.logger.info('SSE connection opened', { sessionId });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Mcp-Session-Id', sessionId);
      res.flushHeaders();

      // Store session
      sessions.set(sessionId, { createdAt: Date.now(), res });

      // Send initial connection event
      res.write(`event: endpoint\ndata: /mcp\n\n`);

      // Keepalive to prevent connection timeout
      const keepAlive = setInterval(() => {
        res.write(':keepalive\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(keepAlive);
        sessions.delete(sessionId);
        this.logger.info('SSE connection closed', { sessionId });
      });
    });

    // DELETE /mcp - Session termination (Gemini requirement)
    app.delete('/mcp', (req, res) => {
      const sessionId = req.headers['mcp-session-id'] as string;

      if (sessionId && sessions.has(sessionId)) {
        sessions.delete(sessionId);
        this.logger.info('Session terminated', { sessionId });
      }

      res.status(200).json({ status: 'session_terminated' });
    });

    // POST /mcp - JSON-RPC handler (works for both Claude and Gemini)
    app.post('/mcp', async (req, res) => {
      // Generate or reuse session ID
      const sessionId = req.headers['mcp-session-id'] as string || randomUUID();
      res.setHeader('Mcp-Session-Id', sessionId);

      // Ensure session exists
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, { createdAt: Date.now() });
      }

      this.logger.info('MCP HTTP request received', {
        method: req.body?.method,
        id: req.body?.id,
        sessionId,
        user: req.user?.email || 'anonymous',
        userGroups: req.user?.groups || []
      });

      try {
        const { method, params, id, jsonrpc } = req.body;
        let result;

        // Handle MCP methods directly using server handlers
        switch (method) {
          case 'initialize':
            result = {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {},
                prompts: {}
              },
              serverInfo: {
                name: 'hudu-mcp-server',
                version: '1.1.0'
              }
            };
            break;
            
          case 'tools/list':
            const tools = Object.values(WORKING_TOOLS).map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema
            }));
            result = { tools };
            break;
            
          case 'tools/call':
            const { name, arguments: args } = params;
            const executor = WORKING_TOOL_EXECUTORS[name];

            if (!executor) {
              this.logger.error('Unknown tool requested', {
                toolName: name,
                user: req.user?.email || 'anonymous'
              });
              throw new Error(`Unknown tool: ${name}`);
            }

            this.logger.info('Tool execution started', {
              toolName: name,
              user: req.user?.email || 'anonymous',
              userGroups: req.user?.groups || [],
              arguments: JSON.stringify(args).substring(0, 200) // First 200 chars only
            });

            const toolResult = await executor(args, this.huduClient);

            if (toolResult.success) {
              this.logger.info('Tool execution completed', {
                toolName: name,
                user: req.user?.email || 'anonymous',
                success: true
              });

              result = {
                content: [{
                  type: 'text',
                  text: JSON.stringify(toolResult.data || { success: true, message: toolResult.message }, null, 2)
                }]
              };
            } else {
              this.logger.error('Tool execution failed', {
                toolName: name,
                user: req.user?.email || 'anonymous',
                error: toolResult.error
              });
              throw new Error(toolResult.error || 'Tool execution failed');
            }
            break;
            
          case 'resources/list':
            result = {
              resources: [
                {
                  uri: 'hudu://articles',
                  name: 'Hudu Articles',
                  description: 'Knowledge base articles from Hudu',
                  mimeType: 'application/json'
                },
                {
                  uri: 'hudu://assets',
                  name: 'Hudu Assets',
                  description: 'IT assets inventory from Hudu',
                  mimeType: 'application/json'
                },
                {
                  uri: 'hudu://companies',
                  name: 'Hudu Companies',
                  description: 'Company information from Hudu',
                  mimeType: 'application/json'
                },
                {
                  uri: 'hudu://passwords',
                  name: 'Hudu Passwords',
                  description: 'Password entries from Hudu',
                  mimeType: 'application/json'
                }
              ]
            };
            break;
            
          case 'resources/read':
            const { uri } = params;
            let data: any[] = [];
            
            switch (uri) {
              case 'hudu://articles':
                data = await this.huduClient.getArticles({});
                break;
              case 'hudu://assets':
                data = await this.huduClient.getAssets({});
                break;
              case 'hudu://companies':
                data = await this.huduClient.getCompanies({});
                break;
              case 'hudu://passwords':
                data = await this.huduClient.getAssetPasswords({});
                break;
              default:
                throw new Error(`Unknown resource URI: ${uri}`);
            }
            
            result = {
              contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(data, null, 2)
              }]
            };
            break;
            
          case 'prompts/list':
            result = {
              prompts: [
                {
                  name: 'hudu_security_audit',
                  description: 'Generate a comprehensive security audit report based on Hudu data',
                  arguments: [
                    {
                      name: 'company_id',
                      description: 'Company ID to audit (optional)',
                      required: false
                    }
                  ]
                },
                {
                  name: 'hudu_asset_report',
                  description: 'Generate an asset inventory report',
                  arguments: [
                    {
                      name: 'company_id',
                      description: 'Company ID to report on (optional)',
                      required: false
                    }
                  ]
                }
              ]
            };
            break;
            
          case 'prompts/get':
            const { name: promptName, arguments: promptArgs } = params;
            
            switch (promptName) {
              case 'hudu_security_audit':
                const companyId = promptArgs?.company_id;
                result = {
                  description: 'Security audit prompt for Hudu data',
                  messages: [
                    {
                      role: 'user',
                      content: {
                        type: 'text',
                        text: `Perform a comprehensive security audit${companyId ? ` for company ID ${companyId}` : ' across all companies'}. Review assets, passwords, and documentation for security compliance. Focus on:

1. Password strength and rotation policies
2. Asset inventory completeness
3. Documentation coverage
4. Access controls and permissions
5. Compliance with security standards

Provide actionable recommendations for improvement.`
                      }
                    }
                  ]
                };
                break;
                
              case 'hudu_asset_report':
                const reportCompanyId = promptArgs?.company_id;
                result = {
                  description: 'Asset inventory report prompt for Hudu data',
                  messages: [
                    {
                      role: 'user',
                      content: {
                        type: 'text',
                        text: `Generate a comprehensive asset inventory report${reportCompanyId ? ` for company ID ${reportCompanyId}` : ' across all companies'}. Include:

1. Total asset count by type
2. Assets requiring updates
3. Missing documentation
4. Asset relationships and dependencies
5. Compliance status

Format as a professional report with executive summary.`
                      }
                    }
                  ]
                };
                break;
                
              default:
                throw new Error(`Unknown prompt: ${promptName}`);
            }
            break;
            
          case "notifications/initialized":
            // Notificação do protocolo MCP - apenas confirmar recebimento
            // Cliente envia após initialize para confirmar que está pronto
            result = {};
            break;

          default:
            throw new Error(`Unsupported method: ${method}`);
        }
        
        res.json({
          jsonrpc: jsonrpc || '2.0',
          id: id,
          result: result
        });
        
        this.logger.info('MCP HTTP request completed', { method, id });
        
      } catch (error: any) {
        this.logger.error('MCP HTTP request failed', { 
          error: error.message,
          stack: error.stack
        });
        
        res.json({
          jsonrpc: req.body?.jsonrpc || '2.0',
          id: req.body?.id,
          error: {
            code: -32000,
            message: error.message
          }
        });
      }
    });
    
    // Start HTTP server
    const httpServer = app.listen(port, '0.0.0.0', () => {
      this.logger.info('MCP server started with Streamable HTTP transport (Claude + Gemini)', {
        port,
        endpoints: {
          health: `http://localhost:${port}/health`,
          info: `http://localhost:${port}/`,
          mcp_post: `POST http://localhost:${port}/mcp (JSON-RPC)`,
          mcp_get: `GET http://localhost:${port}/mcp (SSE)`,
          mcp_delete: `DELETE http://localhost:${port}/mcp (Session)`
        },
        compatibility: ['Claude Code', 'Gemini CLI', 'VS Code']
      });
    });
    
    // Handle graceful shutdown
    const shutdown = () => {
      this.logger.info('Shutting down HTTP server');
      httpServer.close(() => {
        this.logger.info('HTTP server closed');
        process.exit(0);
      });
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Keep the server running
    await new Promise(() => {});
  }

  async run(): Promise<void> {
    // HTTP-only transport as per CLAUDE.md requirements
    await this.runHttp();
  }
}