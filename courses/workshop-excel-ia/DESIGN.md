# Excel con IA: brief de diseño para Claude Design

Landing de venta de un **workshop en vivo de $10**: 3 clases, 12, 13 y 14 de octubre de 2026, 8:00 p.m.
La página se vende sola, sin marca de academia. **La marca es el nombre del curso: "Excel con IA".**

Datos del curso en la misma carpeta: `brief.yaml` (información), `copy.json` (todos los textos),
`brand.json` (colores y fuentes), `structure.json` (orden de secciones).
Si cambias un texto o un color en el diseño, dilo en la entrega y yo actualizo los JSON.

---

## 1. Dirección visual

**Sensación:** moderna, tecnológica y práctica. Debe verse como "trabajo real en Excel potenciado
por IA", no como un curso académico. Bajo ticket y decisión rápida: mucho aire, pocos elementos y
un CTA siempre a la vista.

**Idea gráfica central:** la hoja de cálculo se encuentra con el chat de IA. Usa la cuadrícula de
celdas como textura sutil de fondo, fórmulas tipo `=SUMA()` como detalle decorativo y mockups de
una ventana de chat al lado de un dashboard.

### Paleta (propuesta, se puede ajustar)

| Token | Hex | Uso |
|---|---|---|
| primary | `#16A34A` | Verde hoja de cálculo: botones, checks, acentos |
| secondary | `#7C3AED` | Violeta IA: degradados, chips, detalles de "IA" |
| accent | `#FACC15` | Amarillo: resaltar una palabra o el precio, con moderación |
| surface_dark | `#0B1410` | Fondo de hero, agenda y cierre |
| surface_light | `#FFFFFF` | Secciones claras |
| surface_muted | `#F1F7F3` | Secciones claras alternas |
| text | `#0F1A14` | Texto sobre claro |
| text_on_dark | `#ECFDF3` | Texto sobre oscuro |
| text_muted | `#5B6B62` | Microcopy, notas |

**Degradado de marca:** primary → secondary a 135° (de verde a violeta = "Excel → IA"). Úsalo en
botones principales, en la palabra clave del titular o en bordes de tarjetas, no en fondos completos.

### Tipografía (Google Fonts)

- Títulos: **Plus Jakarta Sans** 800 / 700
- Cuerpo: **Inter** 400 / 500 / 600
- Detalles de fórmulas y celdas: una monoespaciada (JetBrains Mono), solo decorativa

Escala sugerida en desktop: H1 56px · H2 40px · cuerpo 18px. En móvil: H1 32px · H2 27px · cuerpo 16px.

### Botón principal

Degradado verde → violeta, texto blanco en 800, radio 12px y padding generoso. Siempre el mismo
texto: **"Reservar mi cupo por $10"**. Todos los botones llevan al checkout (`checkout_url`).

---

## 2. Estructura y copy, sección por sección

Alterna fondo oscuro y claro para dar ritmo:
oscuro (hero) → claro (dolor) → oscuro (agenda) → claro → muted → claro → oscuro (cierre).

### 0 · Topbar (nueva)
Franja delgada fija arriba, con fondo degradado de marca y texto blanco de 14px centrado.
> Workshop en vivo · 12, 13 y 14 de octubre · 8:00 p.m. · Cupos limitados

### 1 · Hero (fondo oscuro)
**Layout:** dos columnas en desktop (texto a la izquierda, visual a la derecha) y una sola en
móvil, con el visual debajo del CTA.

- **Eyebrow** (chip violeta translúcido): Workshop en vivo · 12, 13 y 14 de octubre
- **H1:** Deja de pelearte con Excel. **Ponle la IA a trabajar por ti.** ← la segunda frase va con el degradado de marca
- **Subtítulo:** En 3 clases en vivo aprendes a usar Claude y ChatGPT junto con Excel para crear desde un dashboard hasta sistemas completos, empezando desde cero y sin saber fórmulas.
- **Chips de fecha:** 3 "tarjetas de calendario" pequeñas: `LUN 12 OCT` · `MAR 13 OCT` · `MIÉ 14 OCT`, con "8:00 p.m." debajo
- **CTA:** Reservar mi cupo por $10
- **Microcopy:** Cupos limitados · Acceso a las grabaciones · Certificado incluido

**Visual:** mockup de laptop o ventana con una hoja de Excel con un dashboard (gráficos verdes) y,
encima, una burbuja de chat de IA que dice algo como *"Crea un dashboard de ventas por mes"*.
Debe dejar claro de un vistazo "IA + Excel".

### 2 · Dolor (fondo claro)
**Layout:** dos columnas, imagen a la izquierda y lista a la derecha (plantilla `pain-split-image`).

- **H2:** El problema no es Excel. Es que lo estás usando como en 2010.
- **Lista** con ícono ✕ en rojo suave o gris:
  - Buscas en Google cómo hacer una fórmula, la copias, y no funciona
  - Armas reportes a mano, fila por fila, y te toma toda la tarde
  - Ves dashboards bonitos de otros y no sabes ni por dónde empezar
  - Tienes ChatGPT o Claude abiertos, pero no sabes cómo hacer que trabajen con tu Excel
  - Sientes que todos avanzan con IA y tú te estás quedando atrás
- **Cierre** (bold, 21px): Hoy la diferencia entre quien domina Excel y quien no ya no es memorizar fórmulas. Es saber pedirle a la IA lo que necesitas.

**Imagen:** persona frustrada frente a una hoja de cálculo llena de celdas y errores `#¡REF!`, de
noche y con luz de pantalla. Tono realista, no caricatura.

### 3 · Agenda: las 3 clases (fondo oscuro) ← sección más importante
**Layout:** 3 tarjetas en fila en desktop y apiladas en móvil. Pueden ir unidas por una línea de
tiempo horizontal (desktop) o vertical (móvil).

- **H2:** 3 noches. De cero a construir sistemas en Excel con IA.
- **Intro:** Cada clase termina con algo construido, no con más teoría.

Cada tarjeta lleva un bloque de fecha grande arriba (día y número), número de clase, título,
descripción y una franja inferior "Sales con:" con fondo verde translúcido.

| | Clase 1 | Clase 2 | Clase 3 |
|---|---|---|---|
| Fecha | LUN 12 · 8:00 p.m. | MAR 13 · 8:00 p.m. | MIÉ 14 · 8:00 p.m. |
| Título | Tu copiloto de Excel | Dashboards sin sufrir | Sistemas avanzados |
| Texto | Cómo pedirle a Claude y ChatGPT las fórmulas exactas que necesitas, que te expliquen una hoja que no entiendes y que limpien datos desordenados en segundos. | Tablas dinámicas, gráficos y un dashboard interactivo construido paso a paso con ayuda de la IA, aunque nunca hayas hecho uno. | Cómo conectar la IA con Excel y usarla para crear automatizaciones y sistemas completos: control de ventas, inventario, finanzas. |
| Sales con | Tu primer reporte hecho con IA | Un dashboard listo para presentar | Un sistema funcionando que puedes adaptar a tu trabajo o negocio |

Ícono por tarjeta (línea, no relleno): chat/varita → gráfico de barras → engranajes o flujo.
Cierra la sección con el CTA: Reservar mi cupo por $10.

### 4 · Para quién es (fondo claro) (nueva)
**Layout:** grid de 2×2 tarjetas con ícono + texto. En móvil, una columna.

- **H2:** Este workshop es para ti si…
- Tarjetas (con ícono ✓ verde):
  - Trabajas con Excel y quieres hacer en minutos lo que hoy te toma horas
  - Buscas empleo o un ascenso y "Excel avanzado" aparece en todas las ofertas
  - Tienes un negocio y quieres llevar ventas, inventario o finanzas sin pagarle a alguien
  - Nunca has usado IA para trabajar y quieres empezar con algo práctico, no teórico
- **Remate** (chip o banda centrada, en bold): No necesitas saber fórmulas. Empezamos desde cero.

### 5 · Qué incluye tu cupo (fondo muted)
**Layout:** dos columnas (plantilla `offer-mockup`). A la izquierda, mockup (laptop con la clase
en vivo + certificado) con el precio debajo; a la derecha, la lista con checks verdes.

- **H2:** Todo lo que incluye tu cupo
- ✔ 3 clases en vivo: 12, 13 y 14 de octubre, 8:00 p.m.
- ✔ Acceso a las grabaciones: si no puedes conectarte en vivo, no te pierdes nada
- ✔ Preguntas en vivo con el instructor *(confirmar)*
- ✔ Certificado de participación
- ✔ Los archivos de Excel que construimos en clase *(confirmar)*
- **Precio:** $10 USD, grande y sin tachar nada
- **CTA:** Reservar mi cupo por $10

### 6 · Instructor (fondo claro)
**Layout:** foto redonda o recortada a la izquierda y texto a la derecha (plantilla `instructor`).

- **H2:** Quién te va a enseñar
- **Bio:** [NOMBRE DEL INSTRUCTOR]: [1-2 líneas reales].

Deja un placeholder de foto claro y no uses una cara generada por IA como si fuera el instructor.

### 7 · Precio (fondo oscuro o tarjeta destacada)
**Layout:** una tarjeta central grande, tipo ticket o entrada de evento (con muesca lateral o borde
punteado, si encaja).

- **H2:** Lo que cuesta quedarte haciendo Excel a mano
- **Texto:** Un curso de Excel tradicional cuesta fácil $100 o más, y ninguno te enseña a usarlo con IA.
- **Antes del precio:** Las 3 clases en vivo, las grabaciones y el certificado:
- **Precio:** **$10 USD**, el número más grande de la página y en amarillo o con el degradado de marca
- **Remate:** Menos que una pizza. Y lo que aprendes te ahorra horas cada semana desde el día siguiente.
- **CTA:** Reservar mi cupo por $10
- **Urgencia** (pequeña, con ícono de reloj): Los cupos son limitados para poder responder preguntas en vivo. Cuando se llenen, se cierran las inscripciones.

⚠ **No tachar "$100"**: no es un precio anterior del workshop, solo una comparación.

### 8 · FAQ (fondo claro)
Acordeón con la primera pregunta abierta.

- **H2:** Preguntas frecuentes
- ¿Necesito saber Excel? · No. Empezamos desde cero. Si sabes abrir un archivo de Excel, tienes el nivel.
- ¿Necesito pagar Claude o ChatGPT? · Puedes seguir el workshop con las versiones gratuitas. Te mostramos qué puedes hacer con cada una. *(confirmar)*
- ¿Qué pasa si no puedo conectarme en vivo? · Tienes acceso a las grabaciones, así que puedes verlas cuando quieras.
- ¿A qué hora son las clases? · Lunes 12, martes 13 y miércoles 14 de octubre, a las 8:00 p.m. [zona horaria por confirmar].
- ¿Dónde son las clases? · 100% online, en vivo. Te llega el link de acceso al correo al reservar. *(confirmar)*
- ¿Recibo certificado? · Sí, al terminar el workshop recibes tu certificado de participación.

### 9 · CTA final (fondo oscuro con brillo del degradado)
Centrado, con mucho aire.

- **H2:** El lunes empiezas a trabajar con Excel de otra forma. O sigues como hasta hoy.
- **Subtítulo:** 3 clases en vivo, grabaciones y certificado por $10.
- **CTA:** Reservar mi cupo ahora
- **Microcopy:** 12, 13 y 14 de octubre · 8:00 p.m. · Cupos limitados

### 10 · Sticky CTA móvil (nueva)
Barra fija abajo, solo en móvil, que aparece después del hero.
> Excel con IA · 12-14 oct · $10 **[Reservar cupo]**

---

## 3. Imágenes que hacen falta

Genéralas o deja placeholders con estas descripciones. Yo las produzco con IA si hace falta.

| Archivo | Sección | Descripción |
|---|---|---|
| `hero-excel-ia.png` | Hero | Laptop o ventana con dashboard de Excel en verde y burbuja de chat IA encima. Fondo transparente u oscuro. |
| `dolor-excel.png` | Dolor | Persona frustrada de noche frente a una hoja llena de errores. Realista. |
| `incluye-mockup.png` | Qué incluye | Laptop con clase en vivo + certificado + archivo .xlsx. |
| `instructor.jpg` | Instructor | **Foto real**, pendiente. |
| Íconos (línea) | Agenda / Para quién | Chat, gráfico de barras, engranajes, maletín, tienda, foco. |

Sobre logos: si aparecen los de Excel, ChatGPT o Claude, que sea solo como "herramientas que vas a
usar", pequeños y en una fila. Que no parezca un producto oficial de Microsoft, OpenAI ni Anthropic.

---

## 4. Reglas

- **No inventar testimonios, cifras de alumnos ni valoraciones.** El brief no tiene ninguno, así que no hay sección de testimonios.
- **No poner contador de "quedan X cupos"** ni números de cupos inventados. Basta con "Cupos limitados".
- Una cuenta regresiva hasta el **lunes 12 de octubre a las 8:00 p.m.** sí es válida (la fecha es real). Es opcional y debe ir en el hero o el precio.
- Sin garantía de devolución: el brief no la menciona, así que no aparece.
- Pensado para **convertir a Elementor**: secciones apiladas en contenedores flex, Google Fonts, degradados lineales y sombras simples. Evita efectos que Elementor no reproduce (blend modes complejos, máscaras SVG, animaciones con JS).
- Mobile first: CTA visible sin hacer scroll en el hero móvil, ningún scroll horizontal y gutter de 16px.

---

## 5. Por confirmar (no bloquea el diseño)

- [ ] Zona horaria de las 8:00 p.m.
- [ ] Nombre, bio y foto del instructor
- [ ] Link de checkout
- [ ] Si aplican "Preguntas en vivo" y "Archivos de Excel"
- [ ] Si se puede seguir con las versiones gratis de Claude/ChatGPT
- [ ] Si el link de acceso llega por correo

## 6. Entrega esperada de Claude Design

Un `index.html` exportado (o el zip del proyecto) con el diseño final en desktop y móvil. Con eso
yo armo el JSON de Elementor nativo, como con la landing de Canva.
