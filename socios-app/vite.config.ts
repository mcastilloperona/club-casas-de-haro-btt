import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  base: '/v14/socios/',
  plugins: [react()],
  build: {
    outDir: '../v14/socios',
    emptyOutDir: true,
  },
});
