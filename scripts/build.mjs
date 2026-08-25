#!/usr/bin/env node
/**
 * Paso 6 del pipeline: brief + copy + structure + plantillas → elementor.json
 *
 *   node scripts/build.mjs --course <slug> [--estricto] [--out <ruta>]
 *
 * El archivo resultante se importa en Elementor → Plantillas → Importar plantillas.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import {
  RAIZ,
  CourseError,
  construirContexto,
  cargarEstructura,
  rutaCurso,
} from './lib/course.mjs';
import {
  renderizar,
  asignarIds,
  crearGeneradorIds,
  resolverRuta,
  TemplateError,
} from './lib/template.mjs';

const DIR_SECCIONES = join(RAIZ, 'templates', 'sections');

export function cargarPlantillaSeccion(nombre) {
  const ruta = join(DIR_SECCIONES, `${nombre}.json`);
  if (!existsSync(ruta)) {
    throw new CourseError(
      `No existe la sección "${nombre}". Disponibles en templates/sections/. ` +
        `Si es nueva, créala ahí primero.`
    );
  }
  const plantilla = JSON.parse(readFileSync(ruta, 'utf8'));
  if (!Array.isArray(plantilla.nodos)) {
    throw new CourseError(`La sección "${nombre}" no tiene un array "nodos".`);
  }
  revisarDirectivas(plantilla.nodos, nombre);
  return plantilla;
}

/**
 * `_if` y `_unless` dentro de `settings` los sube el motor solo. `_repeat` y `_as` no:
 * ahí dentro no harían nada y el fallo sería silencioso, así que se rechazan de entrada.
 */
function revisarDirectivas(nodo, seccion, ruta = '') {
  if (Array.isArray(nodo)) {
    nodo.forEach((n, i) => revisarDirectivas(n, seccion, `${ruta}[${i}]`));
    return;
  }
  if (nodo == null || typeof nodo !== 'object') return;

  const settings = nodo.settings;
  if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
    for (const mala of ['_repeat', '_as']) {
      if (mala in settings) {
        throw new CourseError(
          `[${seccion}] "${mala}" está dentro de "settings" en ${ruta || 'la raíz'}. ` +
            'Va en el nodo, al mismo nivel que "elType".'
        );
      }
    }
  }
  for (const [clave, valor] of Object.entries(nodo)) {
    revisarDirectivas(valor, seccion, `${ruta}.${clave}`);
  }
}

/**
 * Resuelve las directivas de marca `_color` y `_font` en un árbol ya renderizado.
 *
 * Cada una escribe DOS cosas: el valor literal (hex / familia) en su propia clave y una
 * referencia global en el `__globals__` hermano. Elementor prioriza el global cuando existe
 * en el kit del sitio y cae al literal cuando no. Así la landing se ve bien en el primer
 * import (antes de cargar el kit) y queda centralizada después.
 */
function resolverMarca(nodo, marca) {
  if (Array.isArray(nodo)) return nodo.map((n) => resolverMarca(n, marca));
  if (nodo == null || typeof nodo !== 'object') return nodo;

  const salida = {};
  for (const [clave, valor] of Object.entries(nodo)) {
    if (clave === 'settings' && valor && typeof valor === 'object') {
      salida.settings = resolverSettings(valor, marca);
    } else {
      salida[clave] = resolverMarca(valor, marca);
    }
  }
  return salida;
}

function resolverSettings(settings, marca) {
  const salida = {};
  const globals = { ...(settings.__globals__ ?? {}) };

  for (const [clave, valor] of Object.entries(settings)) {
    if (clave === '__globals__') continue;

    if (valor && typeof valor === 'object' && !Array.isArray(valor) && '_color' in valor) {
      const token = marca.colores?.[valor._color];
      if (!token) {
        throw new CourseError(
          `Color de marca desconocido "${valor._color}". Definidos en brand/tokens.json: ` +
            `${Object.keys(marca.colores ?? {}).join(', ')}`
        );
      }
      salida[clave] = token.hex;
      globals[clave] = `globals/colors?id=${token.elementorId}`;
      continue;
    }

    if (valor && typeof valor === 'object' && !Array.isArray(valor) && '_font' in valor) {
      const token = marca.tipografia?.[valor._font];
      if (!token) {
        throw new CourseError(`Tipografía de marca desconocida "${valor._font}".`);
      }
      salida[clave] = token.familia;
      globals[clave] = `globals/typography?id=${token.elementorId}`;
      continue;
    }

    salida[clave] = resolverMarca(valor, marca);
  }

  if (Object.keys(globals).length > 0) salida.__globals__ = globals;
  return salida;
}

/** Avisa si el copy no trae lo que la sección declara en "requiere". */
function comprobarRequisitos(plantilla, ctx, avisos) {
  for (const ruta of plantilla.requiere ?? []) {
    const v = resolverRuta(ctx, ruta);
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) {
      avisos.push(`[${plantilla.nombre}] falta "${ruta}"`);
    }
  }
}

export function construir(slug, { estricto = false } = {}) {
  const ctx = construirContexto(slug);
  const estructura = cargarEstructura(slug);
  const idPara = crearGeneradorIds(slug);
  const avisos = [];
  const contenido = [];

  for (const entrada of estructura.secciones) {
    const nombre = typeof entrada === 'string' ? entrada : entrada.seccion;
    if (!nombre) throw new CourseError(`Entrada inválida en structure.json: ${JSON.stringify(entrada)}`);
    if (typeof entrada === 'object' && entrada.activa === false) continue;

    const plantilla = cargarPlantillaSeccion(nombre);
    comprobarRequisitos(plantilla, ctx, avisos);

    // Una sección puede recibir overrides puntuales desde structure.json sin tocar la plantilla.
    const ctxSeccion =
      typeof entrada === 'object' && entrada.datos
        ? { ...ctx, seccion: entrada.datos }
        : { ...ctx, seccion: {} };

    const renderizado = renderizar(plantilla.nodos, ctxSeccion, { estricto });
    const conMarca = resolverMarca(renderizado, ctx.marca);
    contenido.push(...conMarca);
  }

  if (contenido.length === 0) {
    throw new CourseError(
      'El build no produjo ninguna sección. Todas se descartaron por sus condiciones "_if" — ' +
        'revisa que el brief y el copy tengan datos.'
    );
  }

  const documento = {
    version: '0.4',
    title: ctx.curso.nombre,
    type: 'page',
    content: asignarIds(contenido, idPara),
    page_settings: {
      hide_title: 'yes',
      content_width: { unit: 'px', size: ctx.marca.escala?.anchoContenido ?? 1140 },
    },
  };

  return { documento, avisos, ctx };
}

function parsearArgs(argv) {
  const args = { estricto: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--course' || a === '-c') args.course = argv[++i];
    else if (a === '--out' || a === '-o') args.out = argv[++i];
    else if (a === '--estricto' || a === '--strict') args.estricto = true;
    else if (!a.startsWith('-') && !args.course) args.course = a;
  }
  return args;
}

async function main() {
  const args = parsearArgs(process.argv.slice(2));
  if (!args.course) {
    console.error('Uso: node scripts/build.mjs --course <slug> [--estricto]');
    process.exit(1);
  }

  const { documento, avisos } = construir(args.course, { estricto: args.estricto });
  const destino = args.out ?? join(rutaCurso(args.course), 'elementor.json');
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, JSON.stringify(documento, null, 2) + '\n', 'utf8');

  const nSecciones = documento.content.length;
  console.log(`✓ ${destino}`);
  console.log(`  ${nSecciones} secciones de primer nivel · ${contarNodos(documento.content)} nodos`);

  if (avisos.length) {
    console.log('\n⚠ Faltan datos que las secciones esperan:');
    for (const a of avisos) console.log(`  · ${a}`);
    console.log('  (la landing se generó igual; esos huecos saldrán vacíos)');
  }
}

function contarNodos(nodos) {
  return nodos.reduce((n, nodo) => n + 1 + contarNodos(nodo.elements ?? []), 0);
}

const esEjecucionDirecta = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (esEjecucionDirecta) {
  main().catch((e) => {
    if (e instanceof CourseError || e instanceof TemplateError) {
      console.error(`✗ ${e.message}`);
      process.exit(1);
    }
    throw e;
  });
}
