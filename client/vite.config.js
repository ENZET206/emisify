import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const hmrClientPort = env.VITE_HMR_CLIENT_PORT ? Number(env.VITE_HMR_CLIENT_PORT) : undefined;
  return {
    plugins: [react()],
    server: {
      port: 5173,
      allowedHosts: true,
      hmr: hmrClientPort ? { clientPort: hmrClientPort } : undefined,
      proxy: env.VITE_PROXY_TARGET ? { '/api': { target: env.VITE_PROXY_TARGET, changeOrigin: false } } : undefined,
    },
  };
});
