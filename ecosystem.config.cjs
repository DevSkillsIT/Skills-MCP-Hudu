module.exports = {
  apps: [{
    name: 'mcp-hudu',
    script: 'dist/index.js',
    cwd: '/opt/mcp-servers/hudu',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
      HUDU_API_KEY: 'jamcbRS91ywBZdcwHii31MpU',
      HUDU_BASE_URL: 'https://doc.skillsit.com.br',
      HUDU_TIMEOUT: '30000',
      MCP_SERVER_PORT: '3100'
    },
    error_file: '/opt/mcp-servers/shared/logs/hudu-error.log',
    out_file: '/opt/mcp-servers/shared/logs/hudu-out.log',
    merge_logs: true
  }]
};
