module.exports = {
  apps: [
    {
      name: 'taxi-api',
      script: 'dist/main.js',
      instances: 'max', // 使用所有CPU核心
      exec_mode: 'cluster', // 集群模式
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // 日志配置
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // 自动重启配置
      min_uptime: '10s',
      max_restarts: 5,
      // 内存限制
      max_memory_restart: '1G',
      // 监控配置
      watch: false, // 生产环境关闭文件监控
      // 环境变量文件
      env_file: '.env',
      // 启动延迟
      listen_timeout: 8000,
      kill_timeout: 5000,
      // 优雅关闭
      wait_ready: true,
      // 健康检查
      health_check_url: 'http://localhost:3000/health',
      health_check_grace_period: 3000
    }
  ],
  // 部署配置
  deploy: {
    production: {
      user: 'taxi',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/taxi-api.git',
      path: '/var/www/taxi-api',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'post-setup': 'npm install && npm run build'
    }
  }
};