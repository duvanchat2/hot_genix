#!/usr/bin/env node
/**
 * Paso 1 del pipeline: crea el andamiaje de un curso nuevo.
 *
 *   node scripts/new-course.mjs <slug>
 *
 * Deja brief.yaml con todos los campos comentados, la estructura canónica y las carpetas
 * vacías. A partir de ahí solo hay que rellenar el brief.
 */

import { mkdirSync, writeFileSync, existsSync, copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './lib/course.mjs';

const PLANTILLA_BRIEF = `# Brief del curso — rellena todo antes de generar el copy.
# Validar con:  npm run validate -- <slug>
# Esquema completo y comentarios de cada campo: schemas/brief.schema.json

slug: {{SLUG}}
nombre: ""
subtitulo: ""

# El resultado concreto en UNA frase. Es la materia prima del H1.
# Específica y medible: "Publica tu primer agente de IA que atiende clientes en 14 días".
promesa: ""

# vsl = hero con video de ventas · copy = hero de titular + subtítulo
hero_type: copy
# vsl:
#   url: "https://www.youtube.com/watch?v=..."
#   plataforma: youtube
#   duracion_seg: 240
#   portada: ""

avatar:
  quien: ""
  nivel: principiante          # principiante | intermedio | avanzado
  # En SUS palabras, no en las tuyas. Frases que esa persona diría en voz alta.
  dolor:
    - ""
    - ""
  # Cada objeción se convierte en una pregunta del FAQ.
  objeciones:
    - ""
    - ""
  estado_deseado: ""

transformacion:
  antes: ""
  despues: ""
  plazo: ""

# El "por qué esto sí funciona". Ponerle nombre propio al método lo vuelve un activo.
mecanismo:
  nombre: ""
  explicacion: ""
  pasos:
    - ""

modulos:
  - titulo: ""
    descripcion: ""
    clases: 0
    resultado: ""          # qué sabe HACER el alumno al terminar este módulo

bonus: []
# bonus:
#   - nombre: ""
#     descripcion: ""
#     valor: 97            # valor percibido, alimenta el stack de la sección de precio

precio: 0
precio_ancla: 0            # precio tachado; debe ser mayor que precio
moneda: USD
# pago:
#   cuotas: 3
#   nota: "o 3 cuotas de $19"

checkout_url: ""

garantia:
  dias: 7
  texto: ""

# Omitir si no hay escasez REAL. La escasez inventada se nota y quema la marca.
urgencia:
  tipo: ninguna            # fecha | cupos | precio | ninguna
  detalle: ""

# Solo testimonios reales. Inventarlos es fraude publicitario y Meta rechaza los anuncios.
prueba_social: []
# prueba_social:
#   - texto: ""
#     autor: ""
#     rol: ""
#     resultado: ""
#     verificable: true

# Solo cifras reales. Se omiten solas si no las pones.
metricas: {}
# metricas:
#   alumnos: 0
#   valoracion: 4.8
#   horas_contenido: 0

instructor:
  nombre: ""
  bio: ""
  credenciales:
    - ""
  foto: ""

faq_extra: []

seo:
  title: ""
  description: ""

idioma: es-419
`;

function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Uso: node scripts/new-course.mjs <slug>');
    console.error('Ejemplo: node scripts/new-course.mjs agentes-ia-para-negocios');
    process.exit(1);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    console.error(`✗ El slug debe ir en kebab-case: solo minúsculas, números y guiones. Recibido: "${slug}"`);
    process.exit(1);
  }

  const dir = join(RAIZ, 'courses', slug);
  if (existsSync(dir)) {
    console.error(`✗ Ya existe courses/${slug}`);
    process.exit(1);
  }

  mkdirSync(join(dir, 'assets'), { recursive: true });
  mkdirSync(join(dir, 'ads'), { recursive: true });
  writeFileSync(join(dir, 'assets', '.gitkeep'), '');
  writeFileSync(join(dir, 'brief.yaml'), PLANTILLA_BRIEF.replace('{{SLUG}}', slug), 'utf8');
  copyFileSync(join(RAIZ, 'templates', 'structure.default.json'), join(dir, 'structure.json'));

  console.log(`✓ courses/${slug}/`);
  console.log('\nSiguientes pasos:');
  console.log(`  1. Rellena courses/${slug}/brief.yaml`);
  console.log(`  2. npm run validate -- ${slug}`);
  console.log(`  3. Pide el copy:  "genera el copy de ${slug}"  (usa los skills copywriting + vsl-express)`);
  console.log(`  4. npm run build -- --course ${slug}`);
  console.log(`  5. Importa courses/${slug}/elementor.json en Elementor`);
}

main();
