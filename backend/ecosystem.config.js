module.exports = {
  apps: [{
    name: 'my-blog-backend',
    script: 'index.js',
    cwd: '/var/www/my-blog/backend',
    instances: 'max', // 使用所有CPU核心，或指定数量如 2
    exec_mode: 'cluster',
    watch: false, // 生产环境不建议使用 watch
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/my-blog-error.log',
    out_file: '/var/log/pm2/my-blog-out.log',
    log_file: '/var/log/pm2/my-blog-combined.log',
    time: true,
    // 自动重启配置
    min_uptime: '10s',
    max_restarts: 10,
    // 优雅关闭
    kill_timeout: 1600,
    // 监控配置
    pmx: true,
    // 定时重启（可选，每天凌晨2点重启）
    cron_restart: '0 2 * * *'
  }]
};
