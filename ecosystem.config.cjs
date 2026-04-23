// ecosystem.config.cjs
//
// PM2 configuration for the Hudu MCP server.
//
// Configuration source: loads variables from `.env` in this directory.
// Never hardcode secrets here — keep the .env as the single source of truth
// and let PM2 inherit the values via `require('dotenv').config()`.
//
// Required keys in .env (see .env.example):
//   HUDU_BASE_URL, HUDU_API_KEY, HUDU_TIMEOUT, MCP_SERVER_PORT

const path = require('path');
const fs = require('fs');
const dotenvPath = path.join(__dirname, '.env');

// Load .env silently — missing file surfaces as a clear error in the server
// boot (src/server.ts validates required vars).
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
}

module.exports = {
  apps: [{
    name: 'mcp-hudu',
    script: 'dist/index.js',
    cwd: __dirname,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      HUDU_API_KEY: process.env.HUDU_API_KEY,
      HUDU_BASE_URL: process.env.HUDU_BASE_URL,
      HUDU_TIMEOUT: process.env.HUDU_TIMEOUT || '30000',
      MCP_SERVER_PORT: process.env.MCP_SERVER_PORT || '3100',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      HUDU_ALLOWED_COMPANY_IDS: process.env.HUDU_ALLOWED_COMPANY_IDS || 'ALL'
    },
    error_file: '/opt/mcp-servers/_shared/logs/mcp-hudu-error.log',
    out_file: '/opt/mcp-servers/_shared/logs/mcp-hudu-out.log',
    merge_logs: true
  }]
};
