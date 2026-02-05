module.exports = {
  apps: [
    {
      name: "gestao-atletas-front-dev",
      cwd: "/root/Gestao-Atletas-front",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 3000",
      instances: 1,
      exec_mode: "fork",
      watch: true,
      ignore_watch: ["node_modules", ".next", ".git"],
      env: {
        NODE_ENV: "development"
      }
    }
  ]
};
