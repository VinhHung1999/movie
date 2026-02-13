module.exports = {
  apps: [
    {
      name: 'webphim-be',
      cwd: './webphim-be',
      script: 'npm',
      args: 'run dev',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
        PORT: 5001,
      },
    },
    {
      name: 'webphim-fe',
      cwd: './webphim-fe',
      script: 'npm',
      args: 'run dev',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
