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
     * IMPORTANTE (estudiar) — Con `strictPort` en true, Vite falla al arrancar
     * si el puerto está ocupado, en lugar de buscar el siguiente libre en
     * silencio.
     *
     * Es una decisión sobre dónde falla el error. Sin esta línea, un puerto
     * ocupado hace que Vite arranque en el 5174, el navegador bloquee todas
     * las peticiones por CORS y la pantalla aparezca vacía sin explicación: el
     * síntoma se ve muy lejos de la causa. Con ella, el fallo ocurre en la
     * terminal, en el primer segundo y diciendo exactamente qué pasa.
     */
    strictPort: true,
  },
});
