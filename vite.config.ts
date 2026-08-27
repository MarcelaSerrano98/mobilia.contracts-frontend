import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],

  server: {
    /*
     * IMPORTANTE: el back-end autoriza este origen concreto en su CORS
     * (`mobilia.cors.allowed-origins`). Con `strictPort` el fallo salta en la
     * terminal al arrancar, y no como una pantalla sin datos en el navegador.
     */
    port: 5173,
    strictPort: true,
  },
});
