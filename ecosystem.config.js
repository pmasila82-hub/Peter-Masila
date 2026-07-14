// =========================================================================
// CELCOM ERP PRO - PM2 PRODUCTION PROCESS MANAGER SPECIFICATION
// Native Process Cluster Orchestration for High Availability
// =========================================================================

module.exports = {
  apps: [
    {
      name: "celcom-erp-pro",
      script: "./dist/server.cjs",
      instances: "max",        // Cluster mode: utilize all CPU cores available
      exec_mode: "cluster",    // Run as a distributed clustered web cluster
      watch: false,            // Strictly disabled in production to prevent crash loops
      autorestart: true,       // Auto-restart if server crashes abruptly
      max_memory_restart: "1G", // Safely recycle process if memory leaks exceed 1GB
      
      // Graceful termination timing bounds
      kill_timeout: 8000,      // Allow 8s before hard SIGKILL
      listen_timeout: 5000,    // Wait 5s for ready signal
      
      // Logging destinations
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      
      // Production Environment state injected into the process
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: "postgresql://postgres:postgres_secure_password@127.0.0.1:5432/celcom_erp?schema=public",
        JWT_ACCESS_SECRET: "your_production_secret_key_access_long_hash_string",
        JWT_REFRESH_SECRET: "your_production_secret_key_refresh_long_hash_string",
        RATE_LIMIT_MAX_REQUESTS: 100,
        LOG_LEVEL: "info"
      }
    }
  ]
};
