# Guía técnica del front-end

Documento de estudio: qué hace este proyecto, por qué está hecho así y qué
hay que saber defender de él. Complementa al [README](README.md), que explica
cómo ejecutarlo.

---

## 1. El proyecto en dos minutos

Una pantalla que consulta el **historial de inmuebles**: dado un texto, busca
contratos por persona, dirección o código, y muestra las partes de cada uno.

El reto real no es pintar la tabla. Son tres cosas que no se ven:

1. **Una búsqueda es asíncrona y desordenada.** Dos peticiones pueden llegar
   en orden distinto al que se enviaron.
2. **El texto humano no es comparable tal cual.** «martin» debe encontrar a
   «Martín», y «nunez» a «Núñez».
3. **La API describe un mundo con huecos.** Un contrato puede no traer
   arrendatario, y un array puede estar vacío.

Las tres decisiones que estructuran el código responden a esas tres cosas.

### Las capas

```
components/  →  pintan            (no saben que existe la red)
hooks/       →  coordinan estado  (no saben cómo se pinta)
lib/         →  funciones puras   (no saben que existe React)
api/         →  hablan HTTP       (no saben que existe la pantalla)
types/       →  el contrato de la API
```

La regla que las mantiene separadas: **ningún componente llama a `fetch`**. Si
mañana la búsqueda tuviera que lanzarse desde otra pantalla, se reutiliza el
hook y no se toca nada más.

---

## 2. El recorrido de una tecla

Merece la pena seguirlo entero, porque casi todas las decisiones del proyecto
aparecen por el camino.

**Se escribe `martin`:**

1. `SearchBar` guarda el texto en su estado y abre el panel.
2. `useContractSuggestions` recibe el texto. Arranca un temporizador de 250 ms
   y **crea un `AbortController`**.
3. Si llega otra tecla antes de esos 250 ms, la función de limpieza del efecto
   cancela el temporizador y aborta la petición. Escribir ocho letras produce
   **una** petición, no ocho.
4. Vencido el plazo, se pide `GET /api/v1/contracts/search?q=martin&size=6`.
5. La respuesta se guarda **junto al texto que la pidió**.
6. Al pintar, se comprueba que ese texto siga siendo el que hay escrito. Si no,
   la lista se considera caducada y se devuelve vacía.
7. Por cada contrato, `findMatch` averigua **en qué campo** está el texto,
   recorriendo los campos de lo más identificativo a lo más general.
8. `splitMatch` parte el valor en tres para subrayar el fragmento.

**Se pulsa Intro sobre una línea:**

9. `accept` completa el campo con el valor entero —con sus tildes— y llama a
   `onSearch`.
10. `useContractSearch` aborta cualquier búsqueda anterior, pone el estado en
    `loading` y lanza la petición completa.
11. La respuesta pasa a `success`; `SearchFeedback` anuncia el recuento por
    `aria-live` y `ContractsTable` pinta las filas.

---

## 3. Los cinco problemas invisibles

Son los que un evaluador busca. Cada uno tiene su marcador `IMPORTANTE` en el
código.

### 3.1. La condición de carrera

`src/hooks/useContractSearch.ts`

Se buscan dos cosas seguidas. La primera petición tarda más que la segunda. Su
respuesta llega **después** y sobrescribe un resultado más reciente: la persona
ve los resultados de lo que escribió antes, sin ninguna pista.

No es un problema de red lenta sino de **orden de llegada**: dos peticiones
independientes no prometen responder en el orden en que salieron.

La solución es que solo pueda haber una petición viva. Se guarda en un `useRef`
y se aborta al lanzar la siguiente. Se usa `useRef` y no `useState` porque
cambiar de petición no debe repintar nada.

> **Consecuencia:** abortar rechaza la promesa con `AbortError`. Hay que
> filtrarlo en el `catch`, o cancelar se mostraría como un fallo.

### 3.2. La lectura caducada

`src/hooks/useContractSuggestions.ts`

El desplegable tiene el mismo problema en versión sutil: entre que se teclea
una letra y llega la respuesta, el panel enseñaría un instante las
coincidencias de la palabra anterior.

Se resuelve **derivando durante el render** en lugar de reaccionando con un
efecto. Cada respuesta se guarda con el texto que la pidió, y al pintar se
comprueba que coincida con lo que hay escrito.

La alternativa —un efecto que vacíe la lista cuando cambia el texto— provoca un
render de más y, sobre todo, describe el estado en dos sitios: lo guardado y lo
que el efecto hará con ello. Entre ambos hay un instante en que discrepan, y
ese instante es exactamente el parpadeo.

> **Regla general:** si un valor se puede calcular a partir de otros, se
> calcula. Un efecto es para sincronizar con algo de fuera de React.

### 3.3. La normalización que mueve las letras

`src/lib/matchField.ts`

Para **comparar** basta con bajar a minúsculas y quitar tildes. Para
**subrayar** hace falta saber en qué posición del texto original empieza la
coincidencia, y ahí aparece el problema: normalizar cambia la longitud.

`'í'.normalize('NFD')` devuelve dos caracteres: la `i` y la tilde suelta. Al
borrar la tilde el texto encoge, y el índice 5 del texto normalizado deja de
ser el índice 5 del original. El subrayado caería corrido una letra.

Se normaliza carácter a carácter guardando, por cada letra del resultado, de
qué posición venía. El bucle interior existe porque un carácter puede producir
varios — y es la razón de que «nunez» encuentre «Núñez»: la eñe se descompone
en `n` más tilde.

### 3.4. La `key` de React

`src/components/PartyList.tsx`

La `key` es como React decide, entre dos renders, qué nodo viejo corresponde a
cuál nuevo. Con el índice, «el primero» siempre corresponde con «el primero»:
al reordenar, React conserva el nodo y le cambia el contenido en lugar de
moverlo. El estado interno —el foco, una selección, una animación a medias— se
queda con la persona equivocada.

Se usa el documento de identidad: único y estable.

### 3.5. La especificidad del CSS

`src/App.css`

Todos los selectores son de **una sola clase**, sin mezclar clase y elemento.
Si una regla fuera `.ledger td` (0,1,1) y otra `.ledger__cell` (0,1,0), la
primera ganaría siempre aunque estuviera escrita antes, y el margen que se
intenta cambiar no se movería.

Con especificidad plana, el orden del archivo es la única regla que decide. Es
la razón de que las clases estén puestas en cada `<th>` y `<td>` del componente
en lugar de apoyarse en selectores de elemento.

---

## 4. Los tipos como red de seguridad

El scaffold de Vite **no** activa `strict`. Sin él, `strictNullChecks` está
apagado y un tipo como `Party | null` no significa nada: el compilador acepta
`contract.tenant.fullName` y el fallo aparece en tiempo de ejecución.

Con `strict` activado, ese código no compila:

```
error TS18047: 'contract.tenant' is possibly 'null'.
```

Se añade además **`noUncheckedIndexedAccess`**, que hace que `array[0]` tenga
el tipo `T | undefined` — que es lo que realmente devuelve si el array está
vacío. Es lo que obliga a los `!` y los `?? ''` que aparecen en `matchField.ts`:
cada uno es un sitio donde hubo que pararse a pensar qué pasa si no hay nada.

> **Pregunta probable:** «¿por qué tantos `!`?» La respuesta no es «para callar
> al compilador» sino que en cada uno de esos puntos ya hay una comprobación
> previa que garantiza el valor, y el `!` documenta que se ha razonado.

---

## 5. Accesibilidad

No es un añadido: son cuatro decisiones puntuales.

| Qué | Dónde | Por qué |
|---|---|---|
| `<table>` con `<th scope="col">` | `ContractsTable` | El lector anuncia a qué columna pertenece cada celda. Con una rejilla de `<div>` se oye «Juan Carlos Pérez Gómez» sin saber si es el arrendatario o un deudor |
| `aria-live="polite"` | `SearchFeedback` | Quien busca a oídas pulsa Buscar y necesita una señal. `polite` espera turno; el error lleva además `role="alert"`, que interrumpe |
| Patrón ARIA de combobox | `SearchBar` | El foco **no se mueve** de la caja de texto al recorrer el panel: cambia `aria-activedescendant`. Si el foco saltara, no se podría seguir escribiendo |
| Foco visible sin recuadro | `App.css` | La línea del campo pasa de 2 a 4 px y cambia de color: grosor **y** color, con contraste 4,8:1 |

También: `prefers-reduced-motion` anula las transiciones, y el `<caption>` de
la tabla se oculta visualmente pero sigue disponible.

---

## 6. El diseño, como decisiones

Conviene poder explicarlo en términos de problemas resueltos, no de gusto.

- **La paleta** sale del asunto: papelería de administración de inmuebles.
  Papel gris verdoso, tinta de petróleo, y dos acentos que son sellos —
  verdigris para lo vigente, óxido para lo histórico—. El estado del contrato
  se lee sin leerlo.
- **Tres tipografías con un papel cada una.** La monoespaciada se reserva para
  lo que se coteja carácter a carácter: códigos y documentos. Separa de un
  vistazo lo que se lee de lo que se verifica.
- **El desplegable** existe porque el servicio busca contra seis campos pero no
  dice por cuál entró cada contrato. Quien busca `1098` ve dos resultados sin
  saber si ese número es la cédula del arrendatario o del propietario.
- **El recuento va en versales pero la consulta no.** Forzar mayúsculas sobre
  un apellido recién tecleado lo deforma y hace dudar de si la búsqueda
  entendió bien.

---

## 7. Preguntas probables, con respuesta

**¿Por qué React y no HTML plano?**
El enunciado lo señala como preferible. Además la pantalla tiene estado real
—cuatro estados de búsqueda, un desplegable con navegación por teclado— y
manejarlo a mano con el DOM es donde aparecen los errores.

**¿Por qué no Axios?**
`fetch` ya trae cancelación por `AbortSignal`, que es lo único que hacía falta.
Dos peticiones contra el mismo endpoint no justifican una dependencia más.

**¿Por qué no React Query?**
Resolvería de fábrica el debounce, la cancelación y las respuestas que llegan
tarde. Son unas treinta líneas escritas a mano y explicables una por una,
frente a una dependencia que mantener. En un proyecto que creciera, sería la
elección razonable — y conviene decirlo así, porque la respuesta honesta no es
«no hace falta» sino «aquí la balanza cae del otro lado».

**¿Por qué el estado no está en un contexto global?**
Solo hay una pantalla y un consumidor. Un contexto se añade cuando dos ramas
distintas del árbol necesitan el mismo dato; antes de eso solo añade
indirección.

**¿Qué pasa si el back-end añade un campo?**
Nada se rompe: TypeScript no valida en tiempo de ejecución. Si **renombra** o
**quita** uno, el compilador señala todos los puntos a ajustar. Esa es la razón
principal de tener `types/contract.ts`.

**¿Y si la respuesta no tiene la forma esperada?**
Ahí está el límite conocido de este diseño: `as PagedResponse<…>` es una
promesa, no una comprobación. Validarla en tiempo de ejecución (con Zod, por
ejemplo) sería el siguiente paso si la API no fuera propia.

**¿Cómo se prueba?**
Ver la sección [Cómo probarlo](README.md#cómo-probarlo) del README: hay una
consulta por cada campo de búsqueda y por cada caso límite.

---

## 8. Índice de marcadores

Los puntos del código que conviene entender están marcados. Para listarlos:

```bash
grep -rn "IMPORTANTE" src/ vite.config.ts
```

| Archivo | Concepto |
|---|---|
| `types/contract.ts` | Por qué `tenant` puede ser `null` |
| `api/contractsApi.ts` | Por qué existe la clase `ApiError` |
| `hooks/useContractSearch.ts` | La condición de carrera, y el `AbortError` |
| `hooks/useContractSuggestions.ts` | Derivar en el render frente a reaccionar |
| `lib/matchField.ts` | Normalizar sin perder las posiciones |
| `components/SearchBar.tsx` | El patrón combobox, y la marca por identidad |
| `components/ContractsTable.tsx` | Tabla semántica frente a rejilla |
| `components/PartyList.tsx` | La `key` de React |
| `components/SearchFeedback.tsx` | `aria-live` y `role="alert"` |
| `vite.config.ts` | `strictPort` y el acoplamiento con CORS |

---

## 9. Límites conocidos

Vale más nombrarlos que esperar a que los encuentren.

- **La respuesta no se valida en tiempo de ejecución.** `as` es una promesa al
  compilador, no una comprobación.
- **No hay paginación en la interfaz.** La API la ofrece (`page`, `size`,
  `totalPages`) y el cliente la usa, pero la pantalla pide 20 y muestra 20.
  Con la base de datos de ejemplo, de 7 contratos, no llega a notarse.
- **No hay pruebas automatizadas.** `matchField.ts` es el candidato evidente:
  funciones puras, con casos claros —tildes, eñes, posiciones— y sin nada que
  simular.
- **El desplegable no resalta la coincidencia por email**, porque la API no
  devuelve ese campo. La línea lo dice (`otro campo`) en lugar de inventarlo.
