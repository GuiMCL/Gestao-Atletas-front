module.exports = {
  apps: [
    {
      name: "gestao-atletas-front",
      cwd: "/root/Gestao-Atletas-front",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=512"
      }
    }
  ]
};
