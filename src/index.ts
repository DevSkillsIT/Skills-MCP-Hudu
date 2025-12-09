#!/usr/bin/env node

import { config } from 'dotenv';
import { HuduMcpServer, HuduMcpServerConfig } from './server.js';
import { z } from 'zod';

// Load environment variables from .env file
config();

// Validate environment variables with proper MCP requirements
const envSchema = z.object({
  HUDU_API_KEY: z.string().min(1, 'HUDU_API_KEY is required'),
  HUDU_BASE_URL: z.string().url('HUDU_BASE_URL must be a valid URL'),
  HUDU_TIMEOUT: z.coerce.number().positive().optional().default(30000),
  HUDU_ALLOWED_COMPANY_IDS: z.string().optional().default('ALL'),
  MCP_SERVER_PORT: z.coerce.number().positive().optional().default(3050),
  MCP_TRANSPORT: z.enum(['stdio', 'http']).optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development')
});

async function main(): Promise<void> {
  try {
    // Validate environment variables
    const env = envSchema.parse(process.env);

    // Determine transport type
    // If MCP_SERVER_PORT is set, default to HTTP transport (for Docker)
    // Otherwise use stdio for direct CLI usage
    const transport = env.MCP_TRANSPORT || (env.MCP_SERVER_PORT ? 'http' : 'stdio');

    // Create MCP server configuration
    const serverConfig: HuduMcpServerConfig = {
      huduConfig: {
        baseUrl: env.HUDU_BASE_URL,
        apiKey: env.HUDU_API_KEY,
        timeout: env.HUDU_TIMEOUT
      },
      logLevel: env.LOG_LEVEL,
      port: env.MCP_SERVER_PORT
    };

    // Create and start the MCP server
    const server = new HuduMcpServer(serverConfig);

    // Run the server with the appropriate transport
    await server.run();

  } catch (error) {
    console.error('Failed to start Hudu MCP Server:', error);
    
    if (error instanceof z.ZodError) {
      console.error('\n⚠️  Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`   ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\n📋 Required environment variables:');
      console.error('   HUDU_API_KEY  - Your Hudu API key');
      console.error('   HUDU_BASE_URL - Your Hudu instance URL (e.g., https://company.huducloud.com)');
      console.error('\n⚙️  Optional environment variables:');
      console.error('   HUDU_TIMEOUT      - API request timeout in milliseconds (default: 30000)');
      console.error('   MCP_SERVER_PORT   - HTTP server port (default: 3050, required for HTTP-only transport)');
      console.error('   LOG_LEVEL         - Logging level: error, warn, info, debug (default: info)');
      console.error('   NODE_ENV          - Environment: development, production, test (default: development)');
      console.error('\n💡 Server configuration:');
      console.error('   - HTTP-only transport: For Claude Code, Docker, and all clients');
      console.error('   - No STDIO support: Use HTTP transport exclusively as per CLAUDE.md');
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});