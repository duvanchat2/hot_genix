#!/usr/bin/env node
/**
 * Paso 7 del pipeline: creativos de Meta a PNG con dimensiones exactas.
 *
 *   node scripts/render.mjs --course <slug>                  todos los formatos
 *   node scripts/render.mjs --course <slug> --formato 9x16
 *   node scripts/render.mjs --course <slug> --angulo dolor
 *
 * El texto lo compone Chromium, no un modelo de imagen: tildes correctas,
 * tipografía de marca y píxeles exactos. La IA solo pone el fondo (opcional).
 * Sale también ads/manifest.csv para la carga masiva en Ads Manager.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RAIZ, CourseError, construirContexto, rutaCurso } from './lib/course.mjs';
import { renderizar } from './lib/template.mjs';

/** Tamaños oficiales de Meta. 4:5 es el que más rinde en feed. */
export const FORMATOS = {
  '1x1': { ancho: 1080, alto: 1080, uso: 'Feed cuadrado' },
  '4x5': { ancho: 1080, alto: 1350, uso: 'Feed vertical (mejor rendimiento)' },
  '9x16': { ancho: 1080, alto: 1920, uso: 'Historias y Reels' },
};

const CARRUSEL = { ancho: 1080, alto: 1080 };

/**
 * Chromium no puede salir a internet aquí, así que la fuente de marca se incrusta
 * como data URI desde brand/fonts/. Si no hay ninguna, se usa la pila del sistema
 * (Liberation/DejaVu cubren bien el español con tildes).
 */
function resolverFuente(marca) {
  const dir = join(RAIZ, 'brand', 'fonts');
  const fallback = marca.tipografia?.heading?.fallback ?? 'DejaVu Sans, sans-serif';

  const declarado = marca.tipografia?.heading?.archivoLocal;
  const candidatos = declarado
    ? [join(dir, declarado)]
    : existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => ['.woff2', '.woff', '.ttf', '.otf'].includes(extname(f).toLowerCase()))
          .map((f) => join(dir, f))
      : [];

  const archivo = candidatos.find((c) => existsSync(c));
  if (!archivo) {
    // src vacío no es CSS válido; se apunta a la familia local para que @font-face no rompa.
    return { src: 'local("__sin_fuente_de_marca__")', fallback, nombre: null };
  }

  const tipos = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf' };
  const mime = tipos[extname(archivo).toLowerCase()];
  const b64 = readFileSync(archivo).toString('base64');
  return { src: `url("data:${mime};base64,${b64}")`, fallback, nombre: archivo };
}

/**
 * Chromium a usar.
 *
 * El paquete `playwright` de npm espera la build exacta que descarga él mismo, y en
 * entornos que ya traen un Chromium preinstalado (como los contenedores de Claude Code
 * en la web) esas versiones no coinciden y el launch falla. Se prefiere, en orden:
 * CHROMIUM_PATH, el Chromium preinstalado del entorno, y si no, el que traiga Playwright.
 */
function ejecutableChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const preinstalado = process.env.PLAYWRIGHT_BROWSERS_PATH
    ? join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium')
    : null;
  if (preinstalado && existsSync(preinstalado)) return preinstalado;
  return undefined;
}

function rutaAsset(ctx, referencia) {
  if (!referencia) return null;
  if (/^https?:\/\//.test(referencia)) return referencia;
  const local = join(rutaCurso(ctx.slug), 'assets', referencia);
  return existsSync(local) ? `file://${local}` : null;
}

function escaparCss(url) {
  return url.replace(/["\\]/g, '\\$&');
}

/** Sustituye los tokens de una plantilla HTML. */
function componer(html, datos) {
  const [salida] = renderizar(html, datos);
  return salida;
}

async function fotografiar(page, html, { ancho, alto }, destino) {
  await page.setViewportSize({ width: ancho, height: alto });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const lienzo = await page.$('#lienzo');
  if (!lienzo) throw new CourseError('La plantilla no tiene un elemento #lienzo que fotografiar.');
  await lienzo.screenshot({ path: destino, type: 'png' });

  // El recorte se toma del elemento, así que un CSS mal puesto daría un tamaño
  // distinto al pedido. Se comprueba contra la cabecera del PNG, no se asume.
  const { width, height } = leerDimensionesPng(destino);
  if (width !== ancho || height !== alto) {
    throw new CourseError(
      `${destino} salió a ${width}×${height} y debía ser ${ancho}×${alto}. ` +
        'Revisa el CSS de #lienzo en la plantilla.'
    );
  }
  return { width, height };
}

/**
 * Ancho y alto desde la cabecera IHDR del PNG.
 * Firma 0..7, longitud 8..11, "IHDR" 12..15, ancho 16..19, alto 20..23.
 */
function leerDimensionesPng(ruta) {
  const buf = readFileSync(ruta);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function csv(filas) {
  const escapar = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return filas.map((f) => f.map(escapar).join(',')).join('\n') + '\n';
}

export async function renderizarCreativos(slug, { formato, angulo } = {}) {
  const ctx = construirContexto(slug);
  const anuncios = ctx.copy?.ads;
  if (!anuncios?.angulos?.length) {
    throw new CourseError(
      `copy.json de "${slug}" no tiene ads.angulos. Genera primero el copy de anuncios (paso 7).`
    );
  }

  const marca = ctx.marca;
  const fuente = resolverFuente(marca);

  // El logo sobre fondo oscuro es el que sirve para estos creativos.
  const rutaLogo = join(RAIZ, marca.logos?.sobreOscuro ?? '');
  const logo = marca.logos?.sobreOscuro && existsSync(rutaLogo) ? `file://${rutaLogo}` : null;

  const dirSalida = join(rutaCurso(slug), 'ads');
  mkdirSync(dirSalida, { recursive: true });

  const plantillaCreativo = readFileSync(join(RAIZ, 'templates', 'ads', 'creative.html'), 'utf8');
  const plantillaCarrusel = readFileSync(join(RAIZ, 'templates', 'ads', 'carousel.html'), 'utf8');

  const formatos = formato ? { [formato]: FORMATOS[formato] } : FORMATOS;
  if (formato && !FORMATOS[formato]) {
    throw new CourseError(`Formato "${formato}" desconocido. Opciones: ${Object.keys(FORMATOS).join(', ')}`);
  }

  const angulos = angulo ? anuncios.angulos.filter((a) => a.id === angulo) : anuncios.angulos;
  if (angulo && !angulos.length) {
    throw new CourseError(`No hay ningún ángulo con id "${angulo}" en copy.json.`);
  }

  const navegador = await chromium.launch({
    args: ['--font-render-hinting=none'],
    executablePath: ejecutableChromium(),
  });
  const page = await navegador.newPage({ deviceScaleFactor: 1 });
  const generados = [];

  try {
    for (const ang of angulos) {
      for (const [nombreFormato, medidas] of Object.entries(formatos)) {
        const fondo = rutaAsset(ctx, ang.fondo);
        const html = componer(plantillaCreativo, {
          ...ctx,
          formato: nombreFormato,
          ancho: medidas.ancho,
          alto: medidas.alto,
          titular: ang.titular ?? '',
          subtitulo: ang.subtitulo ?? '',
          // Sin marca propia declarada, el chip lleva el nombre del curso: la página
          // se vende sola, no bajo el paraguas de la academia.
          eyebrow: ang.eyebrow || marca.meta?.nombre || ctx.curso.nombre,
          cta: ang.cta ?? 'Más información',
          precio: `${ctx.d.simbolo}${ctx.d.precio}`,
          fondoCss: fondo ? `url("${escaparCss(fondo)}")` : 'none',
          tieneFondo: fondo ? 'si' : 'no',
          logoSrc: logo ?? '',
          tieneLogo: logo ? 'si' : 'no',
          fuenteTitularSrc: fuente.src,
          fuenteFallback: fuente.fallback,
        });

        const archivo = `${slug}_${ang.id}_${nombreFormato}.png`;
        const destino = join(dirSalida, archivo);
        await fotografiar(page, html, medidas, destino);

        generados.push({
          archivo,
          tipo: 'imagen',
          angulo: ang.id,
          formato: nombreFormato,
          medidas: `${medidas.ancho}x${medidas.alto}`,
          uso: medidas.uso,
          titular: ang.titular ?? '',
          texto_primario: ang.texto_primario ?? '',
          cta: ang.cta ?? '',
          destino: ctx.curso.checkout_url ?? '',
        });
        console.log(`  ✓ ${archivo}  ${medidas.ancho}×${medidas.alto}`);
      }
    }

    const slides = anuncios.carrusel ?? [];
    for (const [i, slide] of slides.entries()) {
      const html = componer(plantillaCarrusel, {
        ...ctx,
        ancho: CARRUSEL.ancho,
        alto: CARRUSEL.alto,
        nombreMarca: marca.meta?.nombre || ctx.curso.nombre,
        tipo: slide.tipo ?? 'gancho',
        titular: slide.titular ?? '',
        subtitulo: slide.subtitulo ?? '',
        indice: i + 1,
        total: slides.length,
        pie: i === slides.length - 1 ? (slide.pie ?? 'Toca para empezar') : (slide.pie ?? 'Desliza →'),
        fuenteTitularSrc: fuente.src,
        fuenteFallback: fuente.fallback,
      });

      const archivo = `${slug}_carrusel_${String(i + 1).padStart(2, '0')}.png`;
      const destino = join(dirSalida, archivo);
      await fotografiar(page, html, CARRUSEL, destino);

      generados.push({
        archivo,
        tipo: 'carrusel',
        angulo: `slide-${i + 1}`,
        formato: '1x1',
        medidas: `${CARRUSEL.ancho}x${CARRUSEL.alto}`,
        uso: 'Carrusel',
        titular: (slide.titular ?? '').replace(/\n/g, ' '),
        texto_primario: '',
        cta: '',
        destino: ctx.curso.checkout_url ?? '',
      });
      console.log(`  ✓ ${archivo}  ${CARRUSEL.ancho}×${CARRUSEL.alto}`);
    }
  } finally {
    await navegador.close();
  }

  const cabecera = [
    'archivo', 'tipo', 'angulo', 'formato', 'medidas', 'uso',
    'titular', 'texto_primario', 'cta', 'url_destino',
  ];
  const filas = [cabecera, ...generados.map((g) => [
    g.archivo, g.tipo, g.angulo, g.formato, g.medidas, g.uso,
    g.titular, g.texto_primario, g.cta, g.destino,
  ])];
  const rutaManifest = join(dirSalida, 'manifest.csv');
  writeFileSync(rutaManifest, csv(filas), 'utf8');

  return { generados, rutaManifest, fuente };
}

function parsearArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--course' || a === '-c') args.course = argv[++i];
    else if (a === '--formato' || a === '-f') args.formato = argv[++i];
    else if (a === '--angulo' || a === '-a') args.angulo = argv[++i];
    else if (!a.startsWith('-') && !args.course) args.course = a;
  }
  return args;
}

async function main() {
  const args = parsearArgs(process.argv.slice(2));
  if (!args.course) {
    console.error('Uso: node scripts/render.mjs --course <slug> [--formato 1x1|4x5|9x16] [--angulo <id>]');
    process.exit(1);
  }

  const { generados, rutaManifest, fuente } = await renderizarCreativos(args.course, args);
  if (!fuente.nombre) {
    console.log('\n! Sin fuente de marca en brand/fonts/ — se usó la del sistema.');
    console.log('  Suelta ahí el .woff2/.ttf de la marca y vuelve a lanzarlo.');
  }
  console.log(`\n${generados.length} creativos · ${rutaManifest}`);
}

const esEjecucionDirecta = process.argv[1]?.endsWith('render.mjs');
if (esEjecucionDirecta) {
  main().catch((e) => {
    if (e instanceof CourseError) {
      console.error(`✗ ${e.message}`);
      process.exit(1);
    }
    throw e;
  });
}
