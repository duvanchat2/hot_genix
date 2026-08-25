#!/usr/bin/env node
/**
 * Valida un curso antes de construirlo, y el elementor.json después.
 *
 *   node scripts/validate.mjs --course <slug>
 *
 * Tres capas:
 *   1. brief.yaml contra schemas/brief.schema.json  (estructura)
 *   2. reglas de negocio que un JSON Schema no puede expresar (ancla > precio, VSL presente…)
 *   3. si existe elementor.json: ids únicos y ningún {{placeholder}} sin resolver
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import { RAIZ, CourseError, cargarBrief, rutaCurso } from './lib/course.mjs';

const rojo = (s) => `\x1b[31m${s}\x1b[0m`;
const ambar = (s) => `\x1b[33m${s}\x1b[0m`;
const verde = (s) => `\x1b[32m${s}\x1b[0m`;

export function validarBrief(brief) {
  const schema = JSON.parse(readFileSync(join(RAIZ, 'schemas', 'brief.schema.json'), 'utf8'));
  // validateFormats: false — los "format" del schema son documentación; las URLs y fechas
  // se comprueban abajo en las reglas de negocio, con mensajes en español.
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
  const validar = ajv.compile(schema);

  const errores = [];
  const avisos = [];

  if (!validar(brief)) {
    for (const e of validar.errors) {
      const donde = e.instancePath || '(raíz)';
      errores.push(`${donde} ${e.message}${e.params?.allowedValues ? ` (${e.params.allowedValues.join(', ')})` : ''}`);
    }
  }

  // --- Reglas de negocio ---

  if (brief.hero_type === 'vsl' && !brief.vsl?.url) {
    errores.push('hero_type es "vsl" pero falta vsl.url');
  }

  if (brief.precio_ancla != null && brief.precio != null && brief.precio_ancla <= brief.precio) {
    errores.push(
      `precio_ancla (${brief.precio_ancla}) debe ser mayor que precio (${brief.precio}); ` +
        'si no hay descuento real, quita precio_ancla en vez de inventarlo'
    );
  }

  if (brief.urgencia?.tipo === 'fecha' && !brief.urgencia.fecha_limite) {
    errores.push('urgencia.tipo es "fecha" pero falta urgencia.fecha_limite');
  }

  if (brief.checkout_url && !/^https?:\/\//.test(brief.checkout_url)) {
    errores.push(`checkout_url debe ser una URL completa con https://. Recibido: "${brief.checkout_url}"`);
  }

  // Campos que quedaron con el placeholder del andamiaje.
  for (const [ruta, valor] of camposVacios(brief)) {
    avisos.push(`${ruta} está vacío`);
  }

  const sinTestimonios = (brief.prueba_social ?? []).length === 0;
  if (sinTestimonios) {
    avisos.push('sin prueba_social: la sección de testimonios se omitirá (correcto si aún no tienes testimonios reales)');
  }

  const noVerificables = (brief.prueba_social ?? []).filter((t) => t.verificable === false);
  if (noVerificables.length) {
    avisos.push(`${noVerificables.length} testimonio(s) marcados verificable: false — no los uses en anuncios de Meta`);
  }

  if (!brief.mecanismo?.nombre) {
    avisos.push('sin mecanismo.nombre: la landing quedará como un temario en vez de una oferta');
  }

  return { errores, avisos };
}

/** Recorre el brief buscando strings vacíos y arrays de strings vacíos (restos del andamiaje). */
function camposVacios(obj, prefijo = '') {
  const salida = [];
  for (const [clave, valor] of Object.entries(obj ?? {})) {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave;
    if (typeof valor === 'string' && valor.trim() === '') salida.push([ruta, valor]);
    else if (Array.isArray(valor)) {
      valor.forEach((v, i) => {
        if (typeof v === 'string' && v.trim() === '') salida.push([`${ruta}[${i}]`, v]);
        else if (v && typeof v === 'object') salida.push(...camposVacios(v, `${ruta}[${i}]`));
      });
    } else if (valor && typeof valor === 'object') {
      salida.push(...camposVacios(valor, ruta));
    }
  }
  return salida;
}

export function validarDocumento(doc) {
  const errores = [];
  const vistos = new Set();

  const recorrer = (nodos, ruta) => {
    for (const [i, nodo] of nodos.entries()) {
      const aqui = `${ruta}[${i}]`;
      if (!nodo.id) errores.push(`${aqui} sin id`);
      else if (vistos.has(nodo.id)) errores.push(`${aqui} id duplicado "${nodo.id}"`);
      else vistos.add(nodo.id);

      if (!nodo.elType) errores.push(`${aqui} sin elType`);
      if (nodo.elType === 'widget' && !nodo.widgetType) errores.push(`${aqui} widget sin widgetType`);

      recorrer(nodo.elements ?? [], `${aqui}/${nodo.widgetType ?? nodo.elType}`);
    }
  };
  recorrer(doc.content ?? [], 'content');

  const crudo = JSON.stringify(doc);
  const sinResolver = [...crudo.matchAll(/\{\{\s*([^}"]+?)\s*\}\}/g)].map((m) => m[1]);
  for (const p of new Set(sinResolver)) {
    errores.push(`placeholder sin resolver: {{${p}}}`);
  }

  return { errores, nodos: vistos.size };
}

function main() {
  const idx = process.argv.indexOf('--course');
  const slug = idx !== -1 ? process.argv[idx + 1] : process.argv[2];
  if (!slug) {
    console.error('Uso: node scripts/validate.mjs --course <slug>');
    process.exit(1);
  }

  const brief = cargarBrief(slug);
  const { errores, avisos } = validarBrief(brief);

  console.log(`brief.yaml — ${slug}`);
  for (const e of errores) console.log(`  ${rojo('✗')} ${e}`);
  for (const a of avisos) console.log(`  ${ambar('!')} ${a}`);
  if (!errores.length && !avisos.length) console.log(`  ${verde('✓')} completo`);

  const rutaDoc = join(rutaCurso(slug), 'elementor.json');
  let erroresDoc = [];
  if (existsSync(rutaDoc)) {
    const doc = JSON.parse(readFileSync(rutaDoc, 'utf8'));
    const r = validarDocumento(doc);
    erroresDoc = r.errores;
    console.log(`\nelementor.json — ${r.nodos} nodos`);
    for (const e of erroresDoc) console.log(`  ${rojo('✗')} ${e}`);
    if (!erroresDoc.length) console.log(`  ${verde('✓')} ids únicos, sin placeholders sueltos`);
  }

  const total = errores.length + erroresDoc.length;
  if (total) {
    console.log(`\n${rojo(`${total} error(es)`)} — corrígelos antes de publicar.`);
    process.exit(1);
  }
  console.log(`\n${verde('Listo.')}`);
}

const esEjecucionDirecta = process.argv[1]?.endsWith('validate.mjs');
if (esEjecucionDirecta) {
  try {
    main();
  } catch (e) {
    if (e instanceof CourseError) {
      console.error(`✗ ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
}
