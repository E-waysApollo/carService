module.exports = {
  apps: [
    {
      name: "carservice-preview",
      script: "cmd.exe",
      args: "/c npm run preview:prod -- --strictPort",
      interpreter: "none",
      cwd: ".",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
