# Checklist antes de publicar

## Automático

```bash
npm run validate -- <slug>
```

Cubre: brief contra el schema, reglas de negocio (ancla > precio, VSL con url…),
`elementor.json` con ids únicos y sin `{{placeholders}}` sin resolver.

## Manual, en Elementor

- [ ] Importaste `elementor.json` y **cada widget es editable** en el panel — si algo
      llegó como bloque muerto, la plantilla está mal, no la página.
- [ ] Revisado a 390px de ancho (el móvil real, no el preview de Elementor).
- [ ] El CTA es visible **sin hacer scroll** en el primer pantallazo.
- [ ] Precio y garantía están presentes y son legibles.
- [ ] Cero lorem ipsum, cero `[EJEMPLO]`, cero placeholder del andamiaje.
- [ ] `checkout_url` apunta al link real de venta, no a uno de prueba.
- [ ] Si hay Global Colors del kit del sitio, coinciden con `brand.json` del curso.

## Contenido y cumplimiento

- [ ] Todo testimonio en la página es real y tiene `verificable: true` en el brief.
- [ ] La urgencia (si existe) es real — Meta rechaza escasez falsa y además quema marca.
- [ ] Las cifras de la barra de prueba (`metricas`) son verificables.

## Creativos de Meta

- [ ] `npm run ads -- --course <slug>` corrió sin avisos de tamaño incorrecto.
- [ ] El 9:16 se ve bien con la interfaz de Meta encima (avatar, progreso, "Enviar
      mensaje") — nada importante cae en el 14% superior ni el 20% inferior.
- [ ] El texto de cada ángulo cabe sin cortarse (revisa `manifest.csv` visualmente).
- [ ] El texto primario de cada anuncio coincide con la promesa de la landing a la que
      apunta — inconsistencia entre anuncio y landing es la forma más común de quemar
      presupuesto.
