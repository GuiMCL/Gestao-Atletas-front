dule.exports = {
  apps: [
    {
      name: "gestao-atletas-front-dev",
      cwd: "./Gestao-Atletas-front", // ⚠️ pasta onde está o package.json
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 3000",
      exec_mode: "fork",
      instances: 1,
      watch: true,
      ignore_watch: ["node_modules", ".next", ".git"],
      env: {
        NODE_ENV: "development"
      }
    }
  ]
}