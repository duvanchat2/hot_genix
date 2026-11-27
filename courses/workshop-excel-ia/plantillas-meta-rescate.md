# Plantillas de WhatsApp (Meta) para rescate: taller Excel con IA
Para leads cuyo último mensaje tiene más de 24 horas. Categoría: **Marketing** · Idioma: **Español**.
Variable `{{1}}` = nombre del lead (ejemplo para Meta: "Carlos"). Si el nombre no es real, envía "Hola" sin nombre.
Botón de URL en todas: **Reservar mi cupo** → https://pay.hotmart.com/I107901880V?off=nqon6kng

> **Urgencia y escasez solo con datos reales:**
> - "Arranca mañana / hoy" es real.
> - "Cupos limitados para responder preguntas en vivo" es real.
> - No uses números de cupos ni "se cierran las inscripciones": el miércoles y el jueves se sigue vendiendo con la grabación.
> - Meta rechaza más fácil los textos en MAYÚSCULAS, con muchos emojis o con promesas exageradas.

---

## 1. `excel_ia_manana_arranca`: leads que nunca respondieron
**Cuándo:** lunes 12, a las 7 p.m.
```
Hola {{1}}, te escribe Valeria del Grupo Genix.

Mañana martes a las 8 p.m. (hora Colombia) arranca el taller en vivo de Excel con IA y los cupos son limitados para poder responder las preguntas de cada participante en vivo.

En 3 clases aprendes a usar ChatGPT y Claude para hacer fórmulas, reportes y dashboards desde cero. Son 10 dólares con grabación y certificado.

¿Te reservo tu cupo antes de que empiece?
```
Botones: [URL] Reservar mi cupo · [Respuesta rápida] Tengo una duda

## 2. `excel_ia_cupo_pendiente`: recibieron el link y no pagaron, o tibios
**Cuándo:** lunes 12, a las 3–4 p.m.
```
Hola {{1}}, vi que no alcanzaste a reservar tu cupo para el taller de Excel con IA.

Arrancamos mañana martes a las 8 p.m. y quiero que alcances a entrar desde la primera clase, porque ahí aprendes a pedirle a la IA las fórmulas exactas que necesitas.

¿Qué te frenó para reservar?
```
Botones: [URL] Reservar mi cupo · [Respuesta rápida] Medio de pago · [Respuesta rápida] Horario

## 3. `excel_ia_ayuda_pago`: tuvieron problema con el pago
**Cuándo:** lunes 12, lo antes posible.
```
Hola {{1}}, perdona la demora en responderte.

Sí puedes pagar el taller de Excel con IA: en el link aparecen los medios de pago de tu país y lo haces desde el celular en 2 minutos. Si te sale algún error, respóndeme con una captura y te ayudo.

Arrancamos mañana martes a las 8 p.m. y los cupos son limitados.
```
Botones: [URL] Reservar mi cupo · [Respuesta rápida] Necesito ayuda

## 4. `excel_ia_como_quedamos`: aplazaron el pago ("mañana pago")
**Cuándo:** a la hora que prometieron, o lunes 12 a las 3–4 p.m.
```
Hola {{1}}, te escribo como quedamos.

El taller de Excel con IA arranca mañana martes a las 8 p.m. No tienes que ir a depositar: en el link pagas desde el celular en 2 minutos y aseguras tu cupo de una vez.

¿Lo hacemos ahora?
```
Botones: [URL] Reservar mi cupo · [Respuesta rápida] Tengo una duda

## 5. `excel_ia_hoy_ultimo_llamado`: último llamado (todos los no compradores que no dijeron que no)
**Cuándo:** martes 13, a las 12 m.
```
Hola {{1}}, hoy a las 8 p.m. es la primera clase del taller en vivo de Excel con IA.

Es el último llamado para entrar desde el inicio. Los cupos son limitados para poder responder preguntas en vivo, y si no puedes conectarte, la clase queda grabada.

Son 10 dólares con grabación, material y certificado.
```
Botones: [URL] Reservar mi cupo · [Respuesta rápida] Tengo una duda

## 6. `excel_ia_en_2_horas`: dos horas antes
**Cuándo:** martes 13, a las 6 p.m. (solo a quien respondió alguna vez y no dijo que no).
```
Hola {{1}}, en 2 horas empezamos el taller de Excel con IA.

Si te inscribes ahora, alcanzas a entrar a la primera clase en vivo a las 8 p.m. Te enviamos el acceso apenas confirmes.
```
Botones: [URL] Reservar mi cupo

## 7. `excel_ia_clase1_grabada`: seguir vendiendo
**Cuándo:** miércoles 14, a las 12 m.
```
Hola {{1}}, ayer fue la primera clase del taller de Excel con IA y quedó grabada.

Si te inscribes hoy, ves la clase 1 en la grabación y te conectas en vivo esta noche a las 8 p.m. a la clase 2, donde armamos un dashboard desde cero.
```
Botones: [URL] Reservar mi cupo · [Respuesta rápida] Tengo una duda

## 8. `excel_ia_ultima_clase`: última oportunidad en vivo
**Cuándo:** jueves 15, a las 12 m.
```
Hola {{1}}, hoy a las 8 p.m. es la última clase en vivo del taller de Excel con IA: creamos un sistema completo de ventas, inventario o finanzas.

Si te inscribes hoy, entras en vivo esta noche y recibes las grabaciones de las 3 clases.
```
Botones: [URL] Reservar mi cupo

---

## Para compradores (categoría Utilidad)

### `excel_ia_recordatorio_inscrito`
**Cuándo:** martes, miércoles y jueves, a las 7:30 p.m.
```
Hola {{1}}, en 30 minutos empieza la clase de hoy del taller de Excel con IA.

El link de Zoom está en el grupo privado. Ten a mano Excel y tu cuenta de ChatGPT o Claude. Te esperamos.
```
Botones: [URL] Ir al grupo → [LINK GRUPO]
