# Mobilia · Front-end de consulta de contratos

Pantalla de búsqueda que consume la API de contratos e inmuebles y presenta los
resultados en una tabla.

Prueba técnica de desarrollo para **Mobilia Software**.

| | |
|---|---|
| **Repositorio back-end** | https://github.com/MarcelaSerrano98/mobilia.contracts-backend |
| **Repositorio front-end** | https://github.com/MarcelaSerrano98/mobilia.contracts-frontend |

---

## Qué hace

Un campo de texto y un botón. Al buscar, consume
`GET /api/v1/contracts/search` y pinta cada contrato encontrado con:

| Columna | Origen |
|---|---|
| Código | `contractCode` |
| Estado | `contractStatus` — añadido para distinguir el historial de lo vigente |
| Dirección del inmueble | `propertyAddress` + `propertyType` |
| Arrendatario | `tenant.fullName` |
| Propietarios | `owners[]` — uno o más |
| Deudores solidarios | `guarantors[]` — vacío si no aplican |

---

## Stack

| Componente | Tecnología | Motivo |
|---|---|---|
| Librería | React 19 | Solicitada como preferible en el enunciado |
| Build | Vite | Arranque casi instantáneo y configuración mínima |
| Lenguaje | TypeScript | El contrato de la API queda tipado: si el back-end cambia un campo, lo avisa el compilador y no la pantalla en blanco |
| Estilos | CSS plano con variables | Sin dependencias extra; el proyecto es pequeño y no justifica un framework de estilos |
| Peticiones | `fetch` nativo | No hace falta añadir Axios para una única petición GET |

---

## Requisitos previos

- **Node.js 20 o superior** (`node --version`).
- **El back-end levantado** en `http://localhost:8080`. Instrucciones en el
  [repositorio del back-end](https://github.com/MarcelaSerrano98/mobilia.contracts-backend).

---

## Cómo ejecutarlo

```bash
# 1. Clonar e instalar
git clone https://github.com/MarcelaSerrano98/mobilia.contracts-frontend.git
cd mobilia.contracts-frontend
npm install

# 2. Configurar la URL del back-end
cp .env.example .env

# 3. Arrancar
npm run dev
```

Abrir **http://localhost:5173**.

### Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprueba los tipos y genera el build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción en local |
| `npm run lint` | Análisis estático con oxlint |

### Configuración

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | URL base del back-end |

Se lee de `.env`, que **no se versiona**; el repositorio incluye `.env.example`
como plantilla. Vite sólo expone al navegador las variables con prefijo `VITE_`,
lo que evita filtrar por accidente cualquier otra variable del entorno.

---

## Estructura

```
src/
├── main.tsx                     # Punto de entrada
├── App.tsx                      # Compone la pantalla
├── api/
│   └── contractsApi.ts          # Cliente HTTP y traducción de errores
├── types/
│   └── contract.ts              # Tipos que reflejan el contrato de la API
├── hooks/
│   └── useContractSearch.ts     # Estados de la búsqueda y cancelación
├── components/
│   ├── SearchBar.tsx            # Campo de texto y botón
│   ├── ContractsTable.tsx       # Tabla de resultados
│   ├── PartyList.tsx            # Lista de personas dentro de una celda
│   └── SearchFeedback.tsx       # Mensajes de estado
├── index.css                    # Variables de diseño y estilos base
└── App.css                      # Estilos de los componentes
```

La lógica de red vive en `api/`, la de estado en `hooks/` y la de presentación
en `components/`. Ningún componente llama a `fetch` directamente.

---

## Decisiones técnicas

### `strict: true` en TypeScript

El scaffold de Vite **no** lo activa, y sin él TypeScript pierde la mitad de su
utilidad: con `strictNullChecks` desactivado, un tipo como `Party | null` no
significa nada y el compilador acepta `contract.tenant.fullName` sin protestar,
para fallar después en tiempo de ejecución.

Con `strict` activado, ese mismo código no compila:

```
error TS18047: 'contract.tenant' is possibly 'null'.
```

Se añade además `noUncheckedIndexedAccess`, que hace que `array[0]` tenga el
tipo `T | undefined` — que es lo que realmente devuelve si el array está vacío.

### El puerto del servidor de desarrollo está fijado

`5173` es el valor por defecto de Vite, pero dejarlo implícito crearía una
dependencia oculta entre los dos repositorios: el back-end autoriza ese origen
concreto en su configuración de CORS. Si el puerto estuviera ocupado, Vite
arrancaría en otro y el navegador bloquearía todas las peticiones, con un error
difícil de relacionar con la causa.

Por eso se declara `port: 5173` junto con `strictPort: true`, que hace que Vite
**falle al arrancar** si el puerto no está libre, en lugar de cambiarlo en
silencio. Un error inmediato y explícito es preferible a una pantalla que no
carga datos sin decir por qué.

### Cancelación de peticiones (`AbortController`)

Si se lanzan dos búsquedas seguidas y la primera tarda más que la segunda, su
respuesta llegaría después y **sobrescribiría en pantalla un resultado más
reciente**. Es una condición de carrera clásica en interfaces de búsqueda. Cada
búsqueda nueva cancela la anterior, y una petición cancelada no se trata como
error.

El hook también cancela la petición pendiente al desmontarse el componente, para
no actualizar el estado de algo que ya no está en pantalla.

### Los cuatro estados de la búsqueda

Se modelan de forma explícita: `idle`, `loading`, `success` y `error`. Mostrar
una tabla vacía sin explicación deja a la persona sin saber si falló la conexión
o si simplemente no hay resultados.

El bloque de mensajes lleva `aria-live="polite"` para que un lector de pantalla
anuncie el cambio de estado.

### El `key` de React es el documento de identidad, no el índice

Usar el índice del array como `key` hace que React reutilice mal los nodos
cuando la lista cambia de orden o de tamaño. El documento de identidad es único
y estable, que es exactamente lo que `key` necesita.

### El buscador es un `<form>`

Envolver el campo y el botón en un formulario hace que la tecla Intro lance la
búsqueda sin escribir ni una línea de código adicional, con el comportamiento
que cualquier persona espera de un buscador.

### Una tabla HTML real, no una rejilla de `<div>`

Los datos son tabulares. El marcado semántico (`<table>`, `<th scope="col">`,
`<caption>`) permite que un lector de pantalla anuncie a qué columna pertenece
cada celda. El `<caption>` se oculta visualmente pero sigue disponible para las
tecnologías de asistencia.

### Sin librería de peticiones ni de estado

Una sola petición `GET` no justifica añadir Axios, y un estado que cabe en un
hook no justifica Redux ni React Query. Cada dependencia es código que hay que
mantener, actualizar y saber explicar.
