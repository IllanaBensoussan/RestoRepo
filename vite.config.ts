import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative paths so the build works from any folder or host.
  base: './',
  plugins: [react()],
});
