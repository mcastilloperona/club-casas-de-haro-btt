import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => ({
  base: mode === 'preview' ? '/v14/socios/' : '/socios/',
  plugins: [react()],
  build: {
    outDir: mode === 'preview' ? '../v14/socios' : '../socios',
    emptyOutDir: true,
  },
}));
