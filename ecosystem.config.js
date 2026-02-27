module.exports = {
  apps: [
    {
      name: "vite-tpv",
      script: "pnpm",
      args: "--filter merchant-portal run dev",
      cwd: "/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core",
      instances: 1,
      exec_mode: "fork",

      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "500M",

      // Output logs
      output: "./logs/vite-out.log",
      error: "./logs/vite-err.log",

      // Timeout
      listen_timeout: 10000,
      kill_timeout: 5000,

      // Environment
      env: {
        NODE_ENV: "development",
        PORT: 5175,
      },
    },
  ],
};
