/**
 * Carga de un curso: brief.yaml + copy.json + structure.json + la marca,
 * y construcción del contexto único que consumen las plantillas.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { formatearNumero } from './template.mjs';

export const RAIZ = resolve(fileURLToPath(import.meta.url), '../../..');

export class CourseError extends Error {}

function leerJSON(ruta, queEs) {
  if (!existsSync(ruta)) {
    throw new CourseError(`Falta ${queEs}: ${ruta}`);
  }
  try {
    return JSON.parse(readFileSync(ruta, 'utf8'));
  } catch (e) {
    throw new CourseError(`${queEs} no es JSON válido (${ruta}): ${e.message}`);
  }
}

export function rutaCurso(slug) {
  const dir = join(RAIZ, 'courses', slug);
  if (!existsSync(dir)) {
    throw new CourseError(`No existe el curso "${slug}". Créalo con: npm run new -- ${slug}`);
  }
  return dir;
}

export function cargarBrief(slug) {
  const ruta = join(rutaCurso(slug), 'brief.yaml');
  if (!existsSync(ruta)) throw new CourseError(`Falta el brief: ${ruta}`);
  let brief;
  try {
    brief = YAML.parse(readFileSync(ruta, 'utf8'));
  } catch (e) {
    throw new CourseError(`brief.yaml no es YAML válido: ${e.message}`);
  }
  if (!brief || typeof brief !== 'object') {
    throw new CourseError('brief.yaml está vacío.');
  }
  if (brief.slug && brief.slug !== slug) {
    throw new CourseError(
      `El slug del brief ("${brief.slug}") no coincide con la carpeta ("${slug}").`
    );
  }
  return brief;
}

/**
 * Marca efectiva de un curso.
 *
 * Cada landing se vende sola: no lleva la marca de la academia, sino la del propio
 * curso. Por eso brand/tokens.json es solo la base neutra y cada curso puede pisar
 * lo que quiera en courses/<slug>/brand.json — normalmente colores, nombre y logo.
 * Se fusiona en profundidad, así que un override de un color no borra los demás.
 */
export function cargarMarca(slug) {
  const base = leerJSON(join(RAIZ, 'brand', 'tokens.json'), 'el brand kit base');
  if (!slug) return base;

  const propia = join(RAIZ, 'courses', slug, 'brand.json');
  if (!existsSync(propia)) return base;
  return fusionar(base, leerJSON(propia, `la marca de ${slug}`));
}

/** Fusión en profundidad: los objetos se mezclan, todo lo demás lo pisa el override. */
export function fusionar(base, override) {
  if (Array.isArray(override) || override === null || typeof override !== 'object') return override;
  if (Array.isArray(base) || base === null || typeof base !== 'object') return override;

  const salida = { ...base };
  for (const [clave, valor] of Object.entries(override)) {
    salida[clave] = clave in base ? fusionar(base[clave], valor) : valor;
  }
  return salida;
}

const SIMBOLOS = { USD: '$', EUR: '€', COP: '$', MXN: '$', ARS: '$', PEN: 'S/', CLP: '$', BRL: 'R$' };

/**
 * Valores derivados del brief. Se calculan una vez aquí en vez de repetir la
 * misma aritmética en cada plantilla y en cada creativo de anuncio.
 */
export function derivar(brief) {
  const moneda = brief.moneda ?? 'USD';
  const simbolo = SIMBOLOS[moneda] ?? '';
  const bonus = brief.bonus ?? [];
  const valorBonus = bonus.reduce((suma, b) => suma + (b.valor ?? 0), 0);
  const valorTotal = (brief.precio_ancla ?? brief.precio ?? 0) + valorBonus;
  const precio = brief.precio ?? 0;

  const descuentoPct =
    brief.precio_ancla && brief.precio_ancla > precio
      ? Math.round(((brief.precio_ancla - precio) / brief.precio_ancla) * 100)
      : null;

  // Cada objeción del avatar se convierte en una pregunta del FAQ; faq_extra se añade
  // detrás. La respuesta queda a cargo del copy (paso 2), aquí solo se arma el esqueleto.
  const objeciones = (brief.avatar?.objeciones ?? []).map((o) => ({ pregunta: o, respuesta: '' }));

  const totalClases = (brief.modulos ?? []).reduce((s, m) => s + (m.clases ?? 0), 0);

  // Barra de prueba social: solo cifras que el brief declara de verdad.
  const m = brief.metricas ?? {};
  const metricasLista = [
    m.alumnos && { valor: `${formatearNumero(m.alumnos)}+`, etiqueta: 'alumnos' },
    m.valoracion && { valor: `${m.valoracion}/5`, etiqueta: 'valoración promedio' },
    m.horas_contenido && { valor: `${m.horas_contenido}h`, etiqueta: 'de contenido' },
    totalClases && { valor: String(totalClases), etiqueta: 'clases' },
    ...(m.otras ?? []),
  ].filter(Boolean);

  // Stack de valor de la sección de precio: el curso como primera línea y cada bonus
  // CON precio propio detrás. Un bonus con valor 0 (ej: acceso a comunidad) es un plus
  // sin etiqueta de precio — se muestra en la sección de bonus, pero no infla el stack.
  const stackValor = [
    { concepto: brief.nombre, valor: brief.precio_ancla ?? precio },
    ...bonus.filter((b) => (b.valor ?? 0) > 0).map((b) => ({ concepto: b.nombre, valor: b.valor })),
  ];

  return {
    metricas_lista: metricasLista,
    stack_valor: stackValor,
    moneda,
    simbolo,
    precio,
    precio_ancla: brief.precio_ancla ?? null,
    precio_fmt: `${simbolo}${precio}`,
    precio_ancla_fmt: brief.precio_ancla ? `${simbolo}${brief.precio_ancla}` : null,
    valor_bonus: valorBonus,
    valor_total: valorTotal,
    valor_total_fmt: `${simbolo}${valorTotal}`,
    descuento_pct: descuentoPct,
    ahorro: brief.precio_ancla ? brief.precio_ancla - precio : null,
    total_modulos: (brief.modulos ?? []).length,
    total_clases: totalClases || null,
    total_bonus: bonus.length,
    tiene_bonus: bonus.length > 0,
    tiene_vsl: brief.hero_type === 'vsl',
    tiene_garantia: Boolean(brief.garantia?.dias),
    tiene_urgencia: Boolean(brief.urgencia && brief.urgencia.tipo !== 'ninguna'),
    tiene_prueba_social: (brief.prueba_social ?? []).length > 0,
    objeciones_faq: objeciones,
  };
}

/** copy.json es opcional durante el andamiaje: sin él el build usa el brief crudo. */
export function cargarCopy(slug) {
  const ruta = join(rutaCurso(slug), 'copy.json');
  return existsSync(ruta) ? leerJSON(ruta, 'el copy') : null;
}

export function cargarEstructura(slug) {
  const ruta = join(rutaCurso(slug), 'structure.json');
  const estructura = leerJSON(ruta, 'la estructura');
  if (!Array.isArray(estructura?.secciones) || estructura.secciones.length === 0) {
    throw new CourseError('structure.json debe tener un array "secciones" con al menos una entrada.');
  }
  return estructura;
}

export function cargarAssets(slug) {
  const ruta = join(rutaCurso(slug), 'assets.json');
  return existsSync(ruta) ? leerJSON(ruta, 'los assets') : { imagenes: [] };
}

/**
 * El contexto que ven las plantillas. Un solo objeto plano y predecible:
 *   {{curso.nombre}}  {{copy.hero.headline}}  {{d.precio_fmt}}  {{marca.colores.primary.hex}}
 */
export function construirContexto(slug) {
  const brief = cargarBrief(slug);
  const copy = cargarCopy(slug);
  const marca = cargarMarca(slug);
  const assets = cargarAssets(slug);
  const d = derivar(brief);

  const mapaAssets = Object.fromEntries(
    (assets.imagenes ?? []).map((img) => [img.id, img.url ?? img.archivo ?? ''])
  );

  return {
    slug,
    curso: brief,
    copy: copy ?? {},
    marca,
    d,
    assets: mapaAssets,
  };
}
