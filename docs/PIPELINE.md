# El pipeline

Siete pasos de los datos de un curso a la landing publicada y sus anuncios.

La idea que sostiene todo: **el contenido vive en datos, el diseño vive en plantillas.**
Una landing nueva es un brief nuevo, no un diseño nuevo.

Cada landing **se vende sola**. No lleva la marca de la academia: es una página genérica
del curso, con su propia identidad. Por eso la marca es por curso (paso 0).

```
brief.yaml ──► copy.json ──► structure.json ──► elementor.json ──► WordPress
    │              │                                   ▲
    │              └──────────► assets.json ───────────┘
    │                               (kie.ai)
    └──────────────────────────► ads/*.png + manifest.csv
```

---

## Paso 0 — Marca del curso

`brand/tokens.json` es la **base neutra**: la escala tipográfica, los radios, los ids con
los que se referencian los Global Colors de Elementor. No lleva marca de nadie.

Cada curso pisa lo que necesite en `courses/<slug>/brand.json`:

```json
{
  "meta": { "nombre": "Agentes IA Pro" },
  "colores": {
    "primary":   { "hex": "#E0452C" },
    "secondary": { "hex": "#0F9D58" }
  },
  "tipografia": { "heading": { "familia": "Sora", "archivoLocal": "sora.woff2" } }
}
```

La fusión es **en profundidad**: cambias `primary.hex` y el resto del token se mantiene.

**Por qué importa:** los colores no van escritos en cada sección. Las plantillas usan
`{"_color": "primary"}` y el build escribe dos cosas a la vez — el hex literal y la
referencia al Global Color de Elementor. Elementor prefiere el global si existe en el
kit del sitio, y si no cae al hex. Así la página se ve bien en el primer import (antes
de cargar ningún kit) y queda centralizada después.

> La fuente de los creativos de Meta se lee de `brand/fonts/`. Sin archivo ahí, se usa
> la del sistema y el render lo avisa.

---

## Paso 1 — Brief del curso

```bash
npm run new -- agentes-ia-para-negocios
```

Crea `courses/<slug>/` con `brief.yaml` comentado campo por campo y la estructura canónica.

Rellenas el brief y lo validas:

```bash
npm run validate -- agentes-ia-para-negocios
```

`schemas/brief.schema.json` es el contrato. **Si el brief está completo, ningún paso
posterior tiene que adivinar nada** — de ahí sale la automatización.

Además del schema hay reglas que un JSON Schema no puede expresar y el validador sí:
`precio_ancla` tiene que ser mayor que `precio`, `hero_type: vsl` obliga a `vsl.url`,
y avisa si no hay `mecanismo.nombre` (sin eso la landing queda como un temario, no como
una oferta).

---

## Paso 2 — Copy persuasivo

Se apoya en los skills que ya están instalados, no se reinventa:

| Skill | Para qué |
|---|---|
| `copywriting` | framework de secciones, fórmulas de headline, reglas de CTA |
| `vsl-express` | guion del VSL cuando `hero_type: vsl` (low ticket, $5–50) |
| `vsl` | cadena de creencias, para tickets más altos |
| `guion-retencion` | la voz real de Duvan, si la landing debe sonar a él |

Salida: `courses/<slug>/copy.json`, **estructurado por bloque** (`hero.headline`,
`pain.bullets[]`, `faq[]`…), nunca prosa suelta. Así el build mapea copy→sección sin
interpretar nada.

Genera siempre **3 headlines y 2 CTAs** en `hero.variantes`. Cuestan lo mismo y te dan
qué testear desde el primer día.

---

## Paso 3 — Estructura

`structure.json` es una lista ordenada. Reordenar la página es reordenar este array.

```json
{ "secciones": [
  { "seccion": "hero-vsl" },
  { "seccion": "pain" },
  { "seccion": "faq-plain", "activa": false }
]}
```

Catálogo actual en `templates/sections/`:

| Sección | Se omite sola si… |
|---|---|
| `hero-copy` / `hero-vsl` | — (elige una) |
| `proof-bar` | no hay métricas reales |
| `pain` | — |
| `mechanism` | — |
| `offer` | — |
| `bonus` | `bonus: []` |
| `testimonials` | `prueba_social: []` |
| `instructor` | — |
| `price` | — |
| `guarantee` | no hay `garantia.dias` |
| `faq` / `faq-plain` | no hay `copy.faq` |
| `final-cta` | — |

Que una sección **desaparezca sola** cuando faltan sus datos es deliberado: mejor una
landing más corta que una con un hueco de testimonios vacío.

Para añadir secciones nuevas a partir de landings de referencia → `REFERENCIAS.md`.

---

## Paso 4 — Diseño

Cada sección es un `templates/sections/<nombre>.json`: JSON de Elementor con placeholders.
El detalle del formato y del bucle de calibración está en `ELEMENTOR.md`.

---

## Paso 5 — Imágenes con kie.ai

`courses/<slug>/assets.json` describe qué imagen necesita cada sección:

```json
{ "imagenes": [
  { "id": "hero-fondo", "modelo": "flux2-pro",
    "prompt": "Dark abstract tech gradient, deep purple and teal, subtle grain, no text",
    "params": { "aspect_ratio": "16:9" } }
]}
```

```bash
python3 scripts/kie.py --course <slug> --dry-run   # qué se generaría y cuánto cuesta
python3 scripts/kie.py --course <slug>             # generar y descargar
```

Escribe la URL y el archivo de vuelta en `assets.json`, así que **relanzarlo no
regenera lo ya pagado** (`--forzar` si de verdad quieres rehacerlo).

**Regla que ahorra dinero y disgustos: el modelo de IA no escribe el texto.** Genera el
fondo o la escena; el titular, el precio y el logo se componen en HTML/CSS y se renderizan
con Chromium. Tipografía perfecta, tildes correctas, medidas exactas, coste cero, y
cambiar un titular no cuesta otra generación.

Los prompts van **en inglés** — los modelos rinden mejor así — aunque el copy sea español.

---

## Paso 6 — Build y publicación

```bash
npm run build -- --course <slug>
npm run validate -- <slug>      # ids únicos, sin placeholders sueltos
```

Produce `courses/<slug>/elementor.json`. En WordPress:
**Plantillas → Importar plantillas → subir el JSON.**

Queda como página **editable widget por widget** en Elementor, no como un bloque de HTML
muerto. Eso es justo el punto de generar JSON de Elementor en vez de HTML plano.

El build es **determinista**: el mismo brief da el mismo archivo byte a byte, porque los
ids se derivan por hash del slug y la ruta del nodo en vez de al azar. Los diffs de git
muestran cambios de contenido reales, no ruido.

---

## Paso 7 — Creativos para Meta

```bash
npm run ads -- --course <slug>
npm run ads -- --course <slug> --formato 9x16
npm run ads -- --course <slug> --angulo dolor
```

Salen de `copy.json` → bloque `ads`:

```json
{ "ads": {
  "angulos": [ { "id": "dolor", "titular": "...", "subtitulo": "...",
                 "texto_primario": "...", "cta": "Más información",
                 "fondo": "hero-fondo.png" } ],
  "carrusel": [ { "titular": "...", "tipo": "gancho" } ]
}}
```

| Formato | Píxeles | Uso |
|---|---|---|
| 1:1 | 1080×1080 | feed cuadrado |
| **4:5** | 1080×1350 | **feed vertical — el que más rinde** |
| 9:16 | 1080×1920 | Historias y Reels |
| Carrusel | N × 1080×1080 | arco: gancho → dolor → mecanismo → oferta → CTA |

Tres ángulos por defecto: **dolor**, **resultado**, **objeción**.

El 9:16 reserva el 14% superior y el 20% inferior: ahí van el avatar, la barra de progreso
y el "Enviar mensaje" de Meta, y cualquier cosa que pongas debajo queda tapada.

Cada PNG se verifica contra la cabecera del propio archivo antes de darlo por bueno —
si el CSS se descuadra, el render falla en vez de entregar un creativo de tamaño raro.

Sale también `ads/manifest.csv` con archivo, ángulo, formato, titular, texto primario,
CTA y URL de destino, listo para la carga masiva en Ads Manager.

---

## Todo seguido

```bash
npm run new -- mi-curso
# rellenar brief.yaml, generar copy.json
npm run validate -- mi-curso
python3 scripts/kie.py --course mi-curso     # opcional
npm run build -- --course mi-curso
npm run ads -- --course mi-curso
```
