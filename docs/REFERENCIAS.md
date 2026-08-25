# Minar estructura de landings de referencia

## Qué extraemos y qué no

De una landing ajena **no queremos su código**: queremos su **estructura de venta**.
Qué secciones usa, en qué orden, dónde mete la prueba social, cómo ancla el precio,
cuántas veces repite el CTA. Eso es lo que se reutiliza; el HTML no.

## Cómo se hace

1. Capturas la referencia (página completa) y la dejas en `references/<nombre>/`.
   Varias capturas por scroll también valen.
2. Le pides el análisis a Claude:
   > analiza `references/xyz/` y dime qué secciones usa y en qué orden

3. Sale un `structure.json` propuesto, y las secciones que no existan en el catálogo se
   describen para crearlas en `templates/sections/`.

Conviene anotar en `references/<nombre>/notas.md` de dónde salió y por qué te interesó.

## Sobre screenshot-to-code

Se evaluó y **se descartó**. La razón concreta: `screenshot-to-code` produce
React/HTML/Tailwind, y nuestro destino es JSON de Elementor. Habría que traducir su
salida a mano, así que el trabajo que ahorra se pierde en el paso siguiente. Además pide
docker y claves de Gemini/OpenAI, con coste por generación.

Leer las capturas directamente sale gratis, no necesita infraestructura, y produce algo
reutilizable (una estructura) en vez de un volcado de un solo uso.

**Cuándo sí tendría sentido:** si algún día quieres clonar una sección concreta píxel a
píxel. En ese caso se levanta en local:

```bash
git clone https://github.com/duvanchat2/screenshot-to-code
cd screenshot-to-code && docker-compose up -d --build
# frontend en http://localhost:5173
```

y esa sección entra en la landing como **widget HTML** dentro de Elementor. Es una
excepción consciente: ese bloque deja de ser editable en el editor visual, así que no
conviene para el grueso de la página.

> Ojo: en Claude Code web el egress está restringido y las APIs de Gemini/OpenAI no son
> alcanzables. Esto solo funciona en local.

## Qué mirar al analizar una referencia

- **Orden de secciones** — ¿el precio va antes o después de los testimonios?
- **Frecuencia del CTA** — cuántas veces aparece y con qué texto
- **Tipo de prueba** — cifras, testimonios, logos, capturas de resultados
- **Manejo del precio** — ancla, stack de valor, comparación, cuotas
- **Longitud** — ¿scroll largo de venta o página corta con VSL?
- **Qué NO tiene** — a veces lo revelador es la sección que decidieron quitar
