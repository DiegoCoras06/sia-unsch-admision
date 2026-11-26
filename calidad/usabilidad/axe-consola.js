// AC07 Usabilidad (EQ-07): revisión de accesibilidad WCAG 2.2 AA con axe-core.
// Cómo usarlo: abre una página del portal en Chrome, presiona F12, ve a la pestaña «Consola»,
// pega todo este archivo y presiona Enter. Repite en cada página que quieras revisar.
// El navegador debe estar visible (con la pestaña oculta, el contraste de color puede salir mal).
(async () => {
  if (!window.axe) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar axe-core'));
      document.head.appendChild(s);
    });
  }
  const r = await axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  });
  console.log(`%cAC07 accesibilidad en ${location.pathname}`, 'font-weight:bold;font-size:14px');
  if (!r.violations.length) {
    console.log(
      `%c✅ Sin fallas WCAG 2.2 A y AA (${r.passes.length} reglas aprobadas)`,
      'color:green;font-weight:bold',
    );
    return;
  }
  console.log(`%c❌ ${r.violations.length} reglas con fallas`, 'color:#b42323;font-weight:bold');
  console.table(
    r.violations.map((v) => ({ regla: v.id, impacto: v.impact, elementos: v.nodes.length, ayuda: v.help })),
  );
  for (const v of r.violations)
    console.log(
      v.id,
      v.nodes.map((n) => n.target.join(' ')),
    );
})();
