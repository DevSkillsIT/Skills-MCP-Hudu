import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(join(__dirname, 'public')));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Token portal endpoint
app.get('/token', (req, res) => {
  // Extract user information from OAuth2-Proxy headers
  const userEmail = req.headers['x-auth-request-email'] || 'unknown';
  const userName = req.headers['x-auth-request-user'] || userEmail;
  const accessToken = req.headers['x-auth-request-access-token'] || req.headers['authorization']?.replace('Bearer ', '') || '';

  // Read and serve the HTML template
  const htmlTemplate = readFileSync(join(__dirname, 'index.html'), 'utf-8');

  // Replace placeholders with actual values
  const html = htmlTemplate
    .replace('{{USER_EMAIL}}', userEmail)
    .replace('{{USER_NAME}}', userName)
    .replace('{{ACCESS_TOKEN}}', accessToken)
    .replace('{{MCP_HOSTNAME}}', process.env.MCP_HOSTNAME || 'mcp.hudu.247mgmt.com');

  res.send(html);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Token Portal listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
