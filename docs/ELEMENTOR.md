# Elementor: formato, directivas y calibración

## Qué produce el build

Un archivo de plantilla de Elementor:

```json
{
  "version": "0.4",
  "title": "Nombre del curso",
  "type": "page",
  "content": [ /* contenedores y widgets */ ],
  "page_settings": { "hide_title": "yes", "content_width": { "unit": "px", "size": 1140 } }
}
```

Cada nodo es `{ id, elType, settings, elements }`, y los widgets añaden `widgetType`.
`elType` puede ser `container` (flexbox, Elementor 3.16+) o `widget`.

Los `id` son 7 caracteres hex, únicos en el documento. **No se escriben a mano en las
plantillas**: los genera el build por hash de (slug + ruta del nodo), de modo que el
mismo brief siempre produce el mismo archivo.

## Cómo importarlo

**Plantillas → Importar plantillas → subir `elementor.json`.**
Luego se inserta en una página desde la biblioteca.

## Directivas de plantilla

Una sección es JSON de Elementor normal más cinco directivas.

### `{{ruta}}` — sustitución

```json
"title": "{{copy.hero.headline}}"
"title": "MÓDULO {{_n}}: {{mod.titulo}}"
```

Si el string es **solo** el placeholder, devuelve el valor crudo (número, array, objeto).
Si va incrustado, interpola como texto.

Filtros con pipe: `{{curso.precio | money}}` → `1,497` · `{{nombre | upper}}`
Disponibles: `money`, `number`, `upper`, `lower`, `html`.

### `_if` / `_unless` — secciones que desaparecen solas

```json
{ "_if": "curso.bonus", "elType": "container", ... }
```

Vacío = `null`, `""`, `[]` o `{}`. Un `0` o un `false` **no** son vacíos.

Puedes escribirlo en el nodo o dentro de `settings` — el motor lo sube solo al nodo,
porque poner la condición junto al contenido que protege es lo natural y la alternativa
era un fallo silencioso (borraba los ajustes y dejaba el widget vacío en la página).

### `_repeat` + `_as` — un nodo por elemento

```json
{ "_repeat": "curso.modulos", "_as": "mod",
  "elType": "container",
  "elements": [ { "elType": "widget", "widgetType": "heading",
                  "settings": { "title": "{{mod.titulo}}" } } ] }
```

Dentro tienes el alias (`mod`), más `{{_index}}` (desde 0) y `{{_n}}` (desde 1).

`_repeat` va **en el nodo**, nunca dentro de `settings`. Ahí no haría nada, así que el
build lo rechaza con un error explícito en vez de generar una página incompleta.

### `_map` + `_as` + `_template` — repeaters internos de Elementor

Para `icon_list`, `tabs` del acordeón y demás, que son arrays **dentro de** `settings`:

```json
"icon_list": {
  "_map": "copy.pain.bullets", "_as": "b",
  "_template": { "text": "{{b}}",
                 "selected_icon": { "value": "fas fa-check", "library": "fa-solid" } }
}
```

El `_id` de cada fila lo pone el build.

### `_color` / `_font` — marca

```json
"title_color": { "_color": "text_on_dark" }
"background_color": { "_color": "primary" }
```

Se expande a **dos cosas**: el hex literal en la clave, y una referencia en el
`__globals__` hermano (`globals/colors?id=…`). Elementor prefiere el global si está
definido en el kit del sitio, y si no cae al hex.

Ventaja: la página se ve bien en el primer import aunque no hayas cargado ningún kit, y
queda centralizada en cuanto lo cargues.

Los nombres válidos son las claves de `colores` / `tipografia` en `brand/tokens.json`
(fusionado con el `brand.json` del curso). Un nombre inexistente detiene el build.

---

## El bucle de calibración

Escribir JSON de Elementor a mano es frágil: cada versión mueve claves y widgets. En vez
de adivinar, el catálogo **converge contra tu instalación real**:

```
1. npm run build -- --course <slug>
2. Importas elementor.json en Elementor
3. Arreglas a mano lo que salga torcido, en el editor
4. Exportas esa sección como plantilla (JSON)
5. Reemplazas templates/sections/<nombre>.json con tu export,
   volviendo a poner los {{placeholders}} donde iba el contenido
```

A partir de la segunda vuelta las secciones salen bien a la primera. Al re-tokenizar,
recuerda **borrar los `id`** del export: los pone el build.

---

## Compatibilidad de widgets

Widgets usados: `heading`, `text-editor`, `button`, `image`, `icon-list`, `icon-box`,
`video`, `divider`, `accordion`. Todos son del Elementor gratuito.

**`accordion` es el único con riesgo.** Elementor 3.24+ lo esconde en instalaciones
nuevas a favor del acordeón anidado. Si no aparece:

- actívalo en *Ajustes → Funciones experimentales → widgets clásicos*, **o**
- cambia `faq` por `faq-plain` en `structure.json` — misma función con widgets básicos,
  sin depender de nada.

Los contenedores flexbox necesitan **Elementor 3.16 o superior**. Si el sitio es más
antiguo y sigue en `section` + `column`, hay que recalibrar el catálogo con el bucle de
arriba.

---

## Publicación automática (pendiente, fase 4)

El import manual no necesita nada instalado. Para publicar por API haría falta un
mu-plugin que escriba los metadatos que Elementor espera:

| Meta | Valor |
|---|---|
| `_elementor_data` | el array `content`, como string JSON |
| `_elementor_edit_mode` | `builder` |
| `_elementor_template_type` | `wp-page` |

Es el mismo patrón del *Genix Course Loader* que ya usas para LearnPress. La REST API de
WordPress no deja escribir metadatos arbitrarios sin registrarlos antes, de ahí el plugin.
