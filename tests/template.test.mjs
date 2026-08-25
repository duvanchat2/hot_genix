import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderizar,
  resolverRuta,
  estaVacio,
  asignarIds,
  crearGeneradorIds,
  TemplateError,
  formatearNumero,
} from '../scripts/lib/template.mjs';

const ctx = {
  curso: { nombre: 'Agentes de IA', precio: 47, modulos: [{ titulo: 'Uno' }, { titulo: 'Dos' }] },
  copy: { hero: { headline: 'Titular', eyebrow: '' } },
  vacios: { lista: [], texto: '', cero: 0, falso: false },
};

test('resolverRuta navega puntos e índices', () => {
  assert.equal(resolverRuta(ctx, 'curso.nombre'), 'Agentes de IA');
  assert.equal(resolverRuta(ctx, 'curso.modulos[1].titulo'), 'Dos');
  assert.equal(resolverRuta(ctx, 'no.existe.nada'), undefined);
});

test('estaVacio: 0 y false NO son vacíos', () => {
  assert.equal(estaVacio(''), true);
  assert.equal(estaVacio([]), true);
  assert.equal(estaVacio(null), true);
  assert.equal(estaVacio(0), false);
  assert.equal(estaVacio(false), false);
});

test('placeholder completo conserva el tipo; incrustado interpola', () => {
  // renderizar() siempre devuelve una lista de nodos, de ahí el array envolvente.
  assert.deepEqual(renderizar('{{curso.precio}}', ctx), [47]);
  assert.deepEqual(renderizar('Solo {{curso.precio}} USD', ctx), ['Solo 47 USD']);

  // Lo que de verdad importa: dentro de un objeto, un placeholder completo
  // entrega el valor crudo — no su versión en texto.
  const [nodo] = renderizar([{ elType: 'widget', settings: { lista: '{{curso.modulos}}', n: '{{curso.precio}}' } }], ctx);
  assert.deepEqual(nodo.settings.lista, ctx.curso.modulos);
  assert.equal(nodo.settings.n, 47);
});

test('filtros con pipe', () => {
  assert.deepEqual(renderizar('{{curso.nombre | upper}}', ctx), ['AGENTES DE IA']);
  assert.throws(() => renderizar('{{curso.nombre | inventado}}', ctx), TemplateError);
});

test('money formatea igual en cualquier entorno (sin depender del ICU)', () => {
  assert.equal(formatearNumero(1497), '1,497');
  assert.equal(formatearNumero(1497.5), '1,497.50');
  assert.equal(formatearNumero(47), '47');
  assert.equal(formatearNumero(1234567), '1,234,567');
  assert.equal(formatearNumero(-250), '-250');
  assert.deepEqual(renderizar('{{ n | money }}', { n: 1497 }), ['1,497']);
});

test('modo estricto avisa de rutas inexistentes', () => {
  assert.deepEqual(renderizar('{{no.existe}}', ctx), ['']);
  assert.throws(() => renderizar('{{no.existe}}', ctx, { estricto: true }), TemplateError);
});

test('_if descarta el nodo cuando la ruta está vacía', () => {
  const plantilla = [
    { _if: 'copy.hero.headline', elType: 'widget', settings: { title: '{{copy.hero.headline}}' } },
    { _if: 'copy.hero.eyebrow', elType: 'widget', settings: { title: 'no debería salir' } },
  ];
  const r = renderizar(plantilla, ctx);
  assert.equal(r.length, 1);
  assert.equal(r[0].settings.title, 'Titular');
});

test('_if dentro de settings se sube al nodo y borra el widget entero', () => {
  const plantilla = [{ elType: 'widget', settings: { _if: 'vacios.texto', title: 'x' } }];
  assert.deepEqual(renderizar(plantilla, ctx), []);
});

test('_repeat se expande EN LÍNEA dentro de elements, sin anidar arrays', () => {
  const plantilla = [
    {
      elType: 'container',
      elements: [
        { _repeat: 'curso.modulos', _as: 'm', elType: 'widget', settings: { title: '{{m.titulo}}' } },
      ],
    },
  ];
  const [contenedor] = renderizar(plantilla, ctx);
  assert.equal(contenedor.elements.length, 2);
  for (const hijo of contenedor.elements) {
    assert.equal(hijo.elType, 'widget', 'cada hijo debe ser un nodo, no un array anidado');
  }
  assert.deepEqual(
    contenedor.elements.map((e) => e.settings.title),
    ['Uno', 'Dos']
  );
});

test('_repeat expone _n empezando en 1', () => {
  const plantilla = [
    { _repeat: 'curso.modulos', _as: 'm', elType: 'widget', settings: { title: 'MÓDULO {{_n}}' } },
  ];
  assert.deepEqual(
    renderizar(plantilla, ctx).map((e) => e.settings.title),
    ['MÓDULO 1', 'MÓDULO 2']
  );
});

test('_repeat sobre array vacío no deja nada', () => {
  const plantilla = [{ _repeat: 'vacios.lista', _as: 'x', elType: 'widget' }];
  assert.deepEqual(renderizar(plantilla, ctx), []);
});

test('_map construye el array de un repeater interno de Elementor', () => {
  const plantilla = [
    {
      elType: 'widget',
      widgetType: 'icon-list',
      settings: {
        icon_list: { _map: 'curso.modulos', _as: 'm', _template: { text: '{{m.titulo}}' } },
      },
    },
  ];
  const [w] = renderizar(plantilla, ctx);
  assert.deepEqual(w.settings.icon_list, [{ text: 'Uno' }, { text: 'Dos' }]);
});

test('asignarIds da ids únicos y estables a todo el árbol', () => {
  const plantilla = [
    {
      elType: 'container',
      elements: [
        { _repeat: 'curso.modulos', _as: 'm', elType: 'widget', widgetType: 'heading', settings: { title: '{{m.titulo}}' } },
      ],
    },
  ];
  const construir = () => asignarIds(renderizar(plantilla, ctx), crearGeneradorIds('demo'));

  const a = construir();
  const b = construir();
  assert.deepEqual(a, b, 'dos builds del mismo input deben dar el mismo archivo');

  const ids = [];
  const recoger = (nodos) => nodos.forEach((n) => (ids.push(n.id), recoger(n.elements ?? [])));
  recoger(a);
  assert.equal(ids.length, 3);
  assert.equal(new Set(ids).size, 3, 'sin ids repetidos');
  for (const id of ids) assert.match(id, /^[0-9a-f]{7}$/);
});

test('asignarIds pone _id en los repeaters internos', () => {
  const nodos = [
    { elType: 'widget', widgetType: 'icon-list', settings: { icon_list: [{ text: 'a' }, { text: 'b' }] }, elements: [] },
  ];
  const [w] = asignarIds(nodos, crearGeneradorIds('demo'));
  assert.equal(w.settings.icon_list.length, 2);
  for (const item of w.settings.icon_list) assert.match(item._id, /^[0-9a-f]{7}$/);
  assert.notEqual(w.settings.icon_list[0]._id, w.settings.icon_list[1]._id);
});
