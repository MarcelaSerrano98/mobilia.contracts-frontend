import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Configuración de Vite.
 *
 * Documentación: https://vite.dev/config/
 */
export default defineConfig({
  // El plugin de React habilita JSX y la recarga en caliente de componentes
  // (Fast Refresh), que conserva el estado del componente al guardar el archivo.
  plugins: [react()],

  server: {
    /**
     * Puerto fijado a propósito.
     *
     * 5173 es el valor por defecto de Vite, pero dejarlo implícito crearía una
     * dependencia oculta entre los dos repositorios: el back-end autoriza este
     * origen concreto en su configuración de CORS
     * (`mobilia.cors.allowed-origins`). Si Vite arrancara en otro puerto porque
     * el 5173 estuviera ocupado, el navegador bloquearía las peticiones y el
     * error sería difícil de diagnosticar.
     */
    port: 5173,

    /**
     * Con `strictPort` en true, Vite falla al arrancar si el puerto está
     * ocupado en lugar de buscar el siguiente libre en silencio. Es preferible
     * un error inmediato y explícito a una pantalla que no carga datos.
     */
    strictPort: true,
  },
});
