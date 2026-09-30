# Presupuestos

App para armar presupuestos de **mano de obra** (calculada por m²) y **materiales**, y descargarlos en PDF. No usa base de datos: los datos viven solo en la pantalla hasta que descargás el PDF.

Stack: Next.js (App Router) y Tailwind CSS.

## Uso

```bash
npm install
npm run dev
```

## Estructura

- `src/components/PresupuestoEditor.tsx`: editor con los cálculos en vivo.
- `src/lib/calc.ts`: cálculos de m², subtotales y formato de moneda.
- `src/lib/pdf.ts`: genera el PDF en el navegador (jsPDF + autotable).
