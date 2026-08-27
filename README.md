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

Un campo de texto y un botón. Mientras se escribe, un desplegable adelanta las
coincidencias y señala **en qué campo** está el texto; al buscar, consume
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
| Tipografía | Google Fonts por `<link>` | Tres familias sin añadir nada a `package.json`, y con pila de reserva si no hay red |
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

### Si el puerto 5173 está ocupado

Vite no arranca y muestra:

```
error when starting dev server:
Error: Port 5173 is already in use
```

Es el comportamiento buscado: el puerto está fijado a propósito
([por qué](#el-puerto-del-servidor-de-desarrollo-está-fijado)). La solución es
**liberar el 5173**, no arrancar en otro: el back-end sólo autoriza el origen
`http://localhost:5173` en su configuración de CORS, así que cambiar el puerto
sustituiría este error por peticiones bloqueadas por el navegador.

La causa habitual es un servidor de desarrollo anterior que sigue vivo — por
ejemplo, si se cerró la terminal sin pararlo con `Ctrl+C`.

```bash
# 1. Ver qué proceso ocupa el puerto
lsof -nP -iTCP:5173 -sTCP:LISTEN

# 2. Comprobar de qué se trata antes de cerrarlo
ps -p <PID> -o pid,etime,command

# 3. Cerrarlo
kill <PID>
```

Si el proceso no responde, `kill -9 <PID>` lo fuerza.

Todo en un solo paso, cuando ya se sabe que es un Vite propio:

```bash
kill $(lsof -t -iTCP:5173 -sTCP:LISTEN)
```

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
│   ├── useContractSearch.ts     # Estados de la búsqueda y cancelación
│   └── useContractSuggestions.ts # Coincidencias mientras se escribe
├── lib/
│   └── matchField.ts            # Localiza el campo que contiene el texto
├── components/
│   ├── SearchBar.tsx            # Campo de texto, desplegable y botón
│   ├── SearchSuggestions.tsx    # Panel de coincidencias
│   ├── ContractsTable.tsx       # Tabla de resultados
│   ├── PartyList.tsx            # Lista de personas dentro de una celda
│   └── SearchFeedback.tsx       # Mensajes de estado
├── index.css                    # Sistema de diseño y estilos base
└── App.css                      # Estilos de los componentes
```

La lógica de red vive en `api/`, la de estado en `hooks/`, las funciones puras
en `lib/` y la de presentación en `components/`. Ningún componente llama a
`fetch` directamente.

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

### El desplegable dice en qué campo está el texto

El servicio busca contra seis campos a la vez —nombre, apellidos, documento,
email, dirección y código— y devuelve los contratos que contienen el texto,
pero no dice **por cuál** de ellos ha entrado cada uno. Con solo una tabla de
resultados, quien busca «1098» ve dos contratos y no sabe si ese número es la
cédula del arrendatario, la del propietario o parte de una dirección.

Mientras se escribe, un desplegable cuelga del campo y adelanta hasta seis
coincidencias. Cada línea enseña el dato concreto que contiene el texto, con
el fragmento subrayado, y debajo el papel que juega: `DOCUMENTO ·
PROPIETARIO · Laura Sofía Martínez Ríos`. Elegir una línea completa el campo
con ese valor —con sus tildes, que probablemente no se escribieron— y lanza la
búsqueda.

La coincidencia se recalcula en el cliente (`lib/matchField.ts`) con las
mismas reglas que el back-end: sin mayúsculas y sin tildes. Escribir `martin`
resalta `Martín`, y para que el subrayado caiga sobre las letras correctas hay
que conservar la correspondencia entre el texto normalizado y el original: la
forma descompuesta de una vocal con tilde ocupa una posición más, y sin ese
mapa el resaltado se desplazaría una letra.

Cuando el back-end encuentra un contrato por el email —campo que la respuesta
no incluye— la línea muestra la dirección del inmueble y el rótulo `otro
campo`, en lugar de inventarse una coincidencia que no puede demostrar.

### El desplegable no toca el estado de la búsqueda

Las sugerencias viven en su propio hook, con su propia cancelación. Si una
petición de sugerencias falla, el panel se cierra sin decir nada: la tabla que
ya estaba en pantalla no se borra por un tropiezo de algo que solo era una
ayuda mientras se teclea. El error, si persiste, lo cuenta la búsqueda de
verdad al pulsar **Buscar**.

Cada respuesta se guarda junto al texto que la pidió, y al pintar se comprueba
que ese texto siga siendo el que hay escrito. Sin esa comprobación, al añadir
una letra el panel enseñaría durante un instante las coincidencias de la
palabra anterior.

### La línea recorrida se guarda por contrato, no por posición

El teclado mueve la selección con las flechas y la confirma con Intro, sin que
el foco salga nunca de la caja de texto. Lo que se guarda no es el índice de
la línea sino el código del contrato que ocupa: cuando llegan coincidencias
nuevas, la marca sigue al contrato si continúa en la lista y desaparece sola
si ya no está. Con un índice haría falta un efecto que lo reiniciara, y el
número acabaría señalando una línea distinta de la que señalaba.

### El foco no dibuja un recuadro

El campo de búsqueda es un renglón, no una caja. Un contorno de foco
rectangular alrededor le devolvería justo la caja que el diseño evita, así que
el indicador es la propia línea: al recibir el foco de teclado pasa de dos a
cuatro píxeles y se tiñe de verde. Es un cambio de grosor **y** de color, con
contraste de 4,8:1 contra el fondo, que es lo que se le pide a un indicador de
foco visible. El relleno inferior se reduce en la misma cantidad para que la
línea engorde sin mover nada de sitio.

### El texto buscado se muestra tal y como se escribió

El recuento sobre la tabla va en versales —«2 CONTRATOS»— porque es un dato,
no una frase. La consulta no: forzarle las mayúsculas a un apellido o a una
dirección que la persona acaba de teclear los deforma y hace dudar de si la
búsqueda entendió bien. Va en un `<span>` aparte que anula la transformación.

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

Dos peticiones `GET` contra el mismo endpoint no justifican añadir Axios:
`fetch` ya trae la cancelación por `AbortSignal`, que es lo único que hacía
falta. Un estado que cabe en dos hooks tampoco justifica Redux.

React Query sí resolvería de fábrica lo que aquí se escribe a mano para el
desplegable —la espera antes de preguntar, la cancelación y descartar
respuestas que llegan tarde—, y en un proyecto que creciera sería la elección
razonable. Son unas treinta líneas en `useContractSuggestions`, explicables
una por una, frente a una dependencia más que mantener y actualizar; en una
pantalla como ésta, la balanza cae del lado de escribirlas.
