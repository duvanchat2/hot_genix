/**
 * Motor de plantillas para el JSON de Elementor.
 *
 * Una plantilla de sección es JSON de Elementor normal con cuatro directivas añadidas:
 *
 *   {{ruta.al.dato}}        Sustitución. Si el string es SOLO el placeholder, devuelve el
 *                           valor crudo (número, array, objeto). Si va incrustado en texto,
 *                           interpola como string.
 *                           Filtros con pipe: {{precio | money}}, {{nombre | upper}}
 *
 *   _if / _unless           En un nodo: lo elimina si la ruta está vacía / no vacía.
 *                           Así las secciones opcionales (bonus, garantía) desaparecen solas.
 *
 *   _repeat + _as           En un nodo: lo expande a N copias, una por elemento del array.
 *                           Cada copia ve su elemento bajo el alias _as, más {{_index}} y {{_n}}.
 *
 *   _map + _as + _template  En un VALOR: construye un array. Para los repeaters internos de
 *                           Elementor (icon_list, accordion.tabs, etc.).
 *
 * Vacío = null, undefined, "", [] o {}. Un 0 o un false NO son vacíos.
 */

const PLACEHOLDER_COMPLETO = /^\{\{\s*([^}]+?)\s*\}\}$/;
const PLACEHOLDER_INCRUSTADO = /\{\{\s*([^}]+?)\s*\}\}/g;

export class TemplateError extends Error {}

/** Resuelve "a.b[0].c" contra el contexto. Devuelve undefined si algo del camino no existe. */
export function resolverRuta(ctx, ruta) {
  const partes = ruta
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
  let actual = ctx;
  for (const parte of partes) {
    if (actual == null) return undefined;
    actual = actual[parte];
  }
  return actual;
}

export function estaVacio(valor) {
  if (valor == null || valor === '') return true;
  if (Array.isArray(valor)) return valor.length === 0;
  if (typeof valor === 'object') return Object.keys(valor).length === 0;
  return false;
}

/**
 * Miles con coma y decimales con punto: 1497 -> "1,497", 1497.5 -> "1,497.50".
 *
 * Escrito a mano en vez de con toLocaleString a propósito: los datos de ICU varían
 * entre entornos y el mismo brief acabaría generando archivos distintos según dónde
 * se construya. Es además la convención habitual para precios en USD, que es la
 * moneda por defecto de los cursos.
 */
export function formatearNumero(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return String(valor);
  const negativo = n < 0;
  const abs = Math.abs(n);
  const decimales = Number.isInteger(abs) ? 0 : 2;
  const [entera, fraccion] = abs.toFixed(decimales).split('.');
  const conMiles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negativo ? '-' : ''}${conMiles}${fraccion ? `.${fraccion}` : ''}`;
}

const FILTROS = {
  upper: (v) => String(v).toUpperCase(),
  lower: (v) => String(v).toLowerCase(),
  money: formatearNumero,
  number: formatearNumero,
  /** Escapa para incrustar dentro del HTML de un widget text-editor. */
  html: (v) =>
    String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;'),
};

function aplicarFiltros(valor, nombresFiltros, rutaOriginal) {
  return nombresFiltros.reduce((acc, nombre) => {
    const filtro = FILTROS[nombre];
    if (!filtro) {
      throw new TemplateError(
        `Filtro desconocido "${nombre}" en {{${rutaOriginal}}}. Disponibles: ${Object.keys(FILTROS).join(', ')}`
      );
    }
    return filtro(acc);
  }, valor);
}

/** Parte "precio | money | upper" en { ruta, filtros }. */
function parsearExpresion(expr) {
  const [ruta, ...filtros] = expr.split('|').map((s) => s.trim());
  return { ruta, filtros: filtros.filter(Boolean) };
}

function evaluar(ctx, expr, opciones) {
  const { ruta, filtros } = parsearExpresion(expr);
  let valor = resolverRuta(ctx, ruta);
  if (valor === undefined) {
    if (opciones.estricto) {
      throw new TemplateError(
        `No existe "${ruta}" en los datos del curso. Revisa brief.yaml / copy.json, o marca el nodo con "_if".`
      );
    }
    valor = '';
  }
  return filtros.length ? aplicarFiltros(valor, filtros, expr) : valor;
}

function resolverString(ctx, texto, opciones) {
  const completo = texto.match(PLACEHOLDER_COMPLETO);
  if (completo) return evaluar(ctx, completo[1], opciones);
  return texto.replace(PLACEHOLDER_INCRUSTADO, (_, expr) => {
    const v = evaluar(ctx, expr, opciones);
    return v == null ? '' : String(v);
  });
}

/** Decide si un nodo con _if/_unless sobrevive. */
function pasaCondicion(nodo, ctx) {
  if ('_if' in nodo && estaVacio(resolverRuta(ctx, nodo._if))) return false;
  if ('_unless' in nodo && !estaVacio(resolverRuta(ctx, nodo._unless))) return false;
  return true;
}

/**
 * Sube `_if` / `_unless` desde `settings` al nodo que los contiene.
 *
 * Al escribir una plantilla es natural poner la condición junto al contenido que
 * protege, que vive en `settings`. Sin este ajuste la condición borraría el objeto
 * `settings` y dejaría el widget vacío en la página en vez de quitarlo. Como una
 * condición dentro de `settings` nunca significa otra cosa, se normaliza aquí.
 */
function subirCondiciones(nodo) {
  const s = nodo.settings;
  if (!s || typeof s !== 'object' || Array.isArray(s)) return nodo;
  if (!('_if' in s) && !('_unless' in s)) return nodo;

  const settings = { ...s };
  const salida = { ...nodo };
  for (const clave of ['_if', '_unless']) {
    if (clave in settings) {
      if (!(clave in salida)) salida[clave] = settings[clave];
      delete settings[clave];
    }
  }
  salida.settings = settings;
  return salida;
}

const DIRECTIVAS = new Set(['_if', '_unless', '_repeat', '_as', '_map', '_template']);

/**
 * Renderiza cualquier estructura (objeto, array, string) contra el contexto.
 * Devuelve la estructura resuelta, o el símbolo OMITIR si una condición la eliminó.
 */
const OMITIR = Symbol('omitir');

/**
 * `_repeat` produce N nodos donde la plantilla escribió uno. Ese resultado se marca
 * con EXPANDIR para que el array padre lo despliegue en línea en vez de anidarlo:
 * sin la marca, `elements` acabaría con un array dentro de un array y Elementor
 * rechazaría el documento.
 */
const EXPANDIR = Symbol('expandir');
const expansion = (nodos) => ({ [EXPANDIR]: nodos });

function render(valor, ctx, opciones) {
  if (typeof valor === 'string') return resolverString(ctx, valor, opciones);
  if (Array.isArray(valor)) {
    return valor.flatMap((item) => {
      const r = render(item, ctx, opciones);
      if (r === OMITIR) return [];
      if (r && typeof r === 'object' && EXPANDIR in r) return r[EXPANDIR];
      return [r];
    });
  }
  if (valor === null || typeof valor !== 'object') return valor;

  // Directiva _map: el valor es un array construido a partir de otro array.
  if ('_map' in valor) {
    const origen = resolverRuta(ctx, valor._map);
    if (!Array.isArray(origen)) {
      if (estaVacio(origen)) return [];
      throw new TemplateError(`"_map": "${valor._map}" apunta a algo que no es un array.`);
    }
    const alias = valor._as ?? 'item';
    if (!('_template' in valor)) {
      throw new TemplateError(`"_map": "${valor._map}" necesita también "_template".`);
    }
    return origen.map((item, i) => {
      const sub = { ...ctx, [alias]: item, _index: i, _n: i + 1 };
      const r = render(valor._template, sub, opciones);
      return r === OMITIR ? null : r;
    }).filter((x) => x !== null);
  }

  valor = subirCondiciones(valor);
  if (!pasaCondicion(valor, ctx)) return OMITIR;

  // Directiva _repeat: el nodo se clona una vez por elemento del array.
  if ('_repeat' in valor) {
    const origen = resolverRuta(ctx, valor._repeat);
    if (!Array.isArray(origen)) {
      if (estaVacio(origen)) return OMITIR;
      throw new TemplateError(`"_repeat": "${valor._repeat}" apunta a algo que no es un array.`);
    }
    const alias = valor._as ?? 'item';
    const base = limpiarDirectivas(valor);
    const copias = origen
      .map((item, i) => {
        const sub = { ...ctx, [alias]: item, _index: i, _n: i + 1 };
        return render(base, sub, opciones);
      })
      .filter((c) => c !== OMITIR);
    return expansion(copias);
  }

  const salida = {};
  for (const [clave, v] of Object.entries(valor)) {
    if (DIRECTIVAS.has(clave)) continue;
    const r = render(v, ctx, opciones);
    if (r !== OMITIR) salida[clave] = r;
  }
  return salida;
}

function limpiarDirectivas(obj) {
  const salida = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!DIRECTIVAS.has(k)) salida[k] = v;
  }
  return salida;
}

/**
 * Renderiza una plantilla. `_repeat` en el nodo raíz produce un array de nodos,
 * por eso el resultado se normaliza siempre a array.
 */
export function renderizar(plantilla, contexto, { estricto = false } = {}) {
  const r = render(plantilla, contexto, { estricto });
  if (r === OMITIR) return [];
  if (r && typeof r === 'object' && EXPANDIR in r) return r[EXPANDIR];
  return Array.isArray(r) ? r : [r];
}

/**
 * IDs de Elementor: 7 caracteres hex, únicos dentro del documento.
 *
 * Se derivan por hash de una semilla estable (slug + ruta del nodo) en vez de al azar,
 * para que dos builds del mismo brief den byte a byte el mismo archivo. Así los diffs
 * de git muestran cambios reales de contenido y no ruido de IDs.
 */
export function crearGeneradorIds(semillaGlobal) {
  const usados = new Set();
  return function idPara(ruta) {
    let h = 0x811c9dc5;
    const entrada = `${semillaGlobal}::${ruta}`;
    for (let i = 0; i < entrada.length; i++) {
      h ^= entrada.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    let candidato = h.toString(16).padStart(8, '0').slice(0, 7);
    let intento = 0;
    while (usados.has(candidato)) {
      intento++;
      h = Math.imul(h ^ intento, 0x01000193) >>> 0;
      candidato = h.toString(16).padStart(8, '0').slice(0, 7);
    }
    usados.add(candidato);
    return candidato;
  };
}

/**
 * Recorre el árbol ya renderizado y asigna un id único a cada nodo de Elementor.
 * Las plantillas no llevan ids escritos a mano: siempre se generan aquí.
 */
export function asignarIds(nodos, idPara, prefijo = '') {
  return nodos.map((nodo, i) => {
    if (nodo == null || typeof nodo !== 'object') return nodo;
    const ruta = `${prefijo}/${nodo.elType ?? 'nodo'}[${i}]${nodo.widgetType ? `:${nodo.widgetType}` : ''}`;
    const salida = { ...nodo, id: idPara(ruta) };
    if (Array.isArray(nodo.elements)) {
      salida.elements = asignarIds(nodo.elements, idPara, ruta);
    }
    // Los repeaters internos de Elementor (icon_list, tabs...) también piden _id propio.
    if (salida.settings && typeof salida.settings === 'object') {
      salida.settings = asignarIdsRepeaters(salida.settings, idPara, ruta);
    }
    return salida;
  });
}

function asignarIdsRepeaters(settings, idPara, ruta) {
  const salida = {};
  for (const [clave, valor] of Object.entries(settings)) {
    if (Array.isArray(valor) && valor.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
      salida[clave] = valor.map((item, i) => ({ _id: idPara(`${ruta}/${clave}[${i}]`), ...item }));
    } else {
      salida[clave] = valor;
    }
  }
  return salida;
}
