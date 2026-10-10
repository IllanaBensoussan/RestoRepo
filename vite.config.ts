import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Absolute paths: shared links like /recette/{id} serve the same page from a deeper address.
  base: '/',
  plugins: [react()],
});
