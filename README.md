# hot_genix — fábrica de landings de venta

Sistema para producir páginas de venta de cursos, una por curso, todas desde el mismo
motor: rellenas un brief, generas el copy, y sale la landing (Elementor) más los
creativos de Meta (feed, historias, carrusel).

**Cada landing se vende sola.** No lleva la marca de una academia — es una página
genérica del curso, con su propia identidad de marca.

## Empezar

```bash
npm install
npm run new -- mi-curso        # crea courses/mi-curso/ con el brief comentado
# rellenar courses/mi-curso/brief.yaml
npm run validate -- mi-curso
# generar courses/mi-curso/copy.json (skills: copywriting, vsl-express)
# opcional: courses/mi-curso/brand.json con la identidad del curso
npm run build -- --course mi-curso     # → courses/mi-curso/elementor.json
npm run ads -- --course mi-curso       # → courses/mi-curso/ads/*.png + manifest.csv
npm test                               # motor de plantillas
```

`elementor.json` se importa en **Elementor → Plantillas → Importar plantillas**.

## El proceso completo

Ver **[docs/PIPELINE.md](docs/PIPELINE.md)** — los 7 pasos, de principio a fin.

| Documento | Contenido |
|---|---|
| [docs/PIPELINE.md](docs/PIPELINE.md) | el proceso completo, paso a paso |
| [docs/ELEMENTOR.md](docs/ELEMENTOR.md) | formato del JSON, directivas de plantilla, bucle de calibración |
| [docs/REFERENCIAS.md](docs/REFERENCIAS.md) | cómo minar estructura de landings ajenas |
| [docs/QA.md](docs/QA.md) | checklist antes de publicar |

## Estructura

```
brand/tokens.json          base neutra de marca (escala, ids de Elementor)
courses/<slug>/
  brief.yaml                paso 1 — la única entrada obligatoria
  brand.json                opcional — identidad propia del curso
  copy.json                 paso 2
  structure.json             paso 3 — qué secciones y en qué orden
  assets.json                paso 5 — prompts de imagen para kie.ai
  elementor.json              paso 6 — se importa en Elementor
  ads/*.png + manifest.csv   paso 7
templates/sections/*.json    catálogo de secciones de Elementor
templates/ads/*.html         plantillas de creativos de Meta
schemas/brief.schema.json    contrato del brief
scripts/                     new-course · validate · build · render · kie.py
```

## Requisitos

- Node ≥ 20, Python 3.
- `KIEAI_API_KEY` (o `~/.config/kieai/api-key`) para el paso 5. **En Claude Code web,
  `api.kie.ai` necesita estar permitido en la política de red del entorno** — por
  defecto da 403.
- Chromium para el paso 7 (ya viene resuelto vía Playwright).

## Curso de ejemplo

`courses/ejemplo-agentes-ia/` existe solo para que el pipeline tenga siempre algo que
construir y como referencia de formato. Todo su contenido va marcado `[EJEMPLO]` — no
publicar tal cual.
