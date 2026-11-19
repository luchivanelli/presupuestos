import { jsPDF } from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import {
  m2Fila,
  m2Neto,
  money,
  num,
  subtotalMaterial,
  totalAberturas,
  totalM2,
  totalMateriales,
} from "./calc";
import type { PresupuestoData } from "./types";

type DocWithTable = jsPDF & { lastAutoTable: { finalY: number } };

const ACCENT: [number, number, number] = [30, 64, 175];

// Alinea a la derecha encabezado y pie de las columnas numéricas
const alignNumericCols = (data: CellHookData) => {
  if (data.section !== "body" && data.column.index > 0) data.cell.styles.halign = "right";
};

export function descargarPdf(p: PresupuestoData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as DocWithTable;
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  const fecha = new Date().toLocaleDateString("es-AR");
  const m2Bruto = totalM2(p.superficies);
  const m2Aberturas = totalAberturas(p.aberturas);
  const hayAberturas = m2Aberturas > 0;
  const m2Total = m2Neto(p.superficies, p.aberturas);
  const manoObra = m2Total * p.precioM2;
  const materiales = totalMateriales(p.materiales);

  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(...ACCENT);
  doc.text("PRESUPUESTO", margin, 22);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(80);
  doc.text(`Fecha: ${fecha}`, pageW - margin, 22, { align: "right" });

  doc.setTextColor(20).setFontSize(11);
  let y = 34;
  doc.setFont("helvetica", "bold").text("Cliente:", margin, y);
  doc.setFont("helvetica", "normal").text(p.cliente || "-", margin + 22, y);
  if (p.direccion) {
    y += 6;
    doc.setFont("helvetica", "bold").text("Dirección:", margin, y);
    doc.setFont("helvetica", "normal").text(p.direccion, margin + 22, y);
  }
  y += 10;

  // Mano de obra
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...ACCENT);
  doc.text("1. Mano de obra", margin, y);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin },
    head: [["Descripción", "Ancho (m)", "Alto (m)", "Cant.", "Superficie (m²)"]],
    body: p.superficies.map((s) => [
      s.descripcion,
      num(s.ancho),
      num(s.alto),
      num(s.cantidad),
      num(m2Fila(s)),
    ]),
    foot: [[hayAberturas ? "Subtotal paredes" : "Total superficie", "", "", "", `${num(m2Bruto)} m²`]],
    headStyles: { fillColor: ACCENT },
    didParseCell: alignNumericCols,
    footStyles: { fillColor: [229, 231, 235], textColor: 20 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  if (hayAberturas) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 4,
      margin: { left: margin, right: margin },
      head: [["A descontar (puertas y ventanas)", "Ancho (m)", "Alto (m)", "Cant.", "Superficie (m²)"]],
      body: p.aberturas
        .filter((a) => m2Fila(a) > 0)
        .map((a) => [a.descripcion, num(a.ancho), num(a.alto), num(a.cantidad), `-${num(m2Fila(a))}`]),
      foot: [
        ["Total a descontar", "", "", "", `-${num(m2Aberturas)} m²`],
        ["Total superficie", "", "", "", `${num(m2Total)} m²`],
      ],
      headStyles: { fillColor: [100, 116, 139] },
      didParseCell: alignNumericCols,
      footStyles: { fillColor: [229, 231, 235], textColor: 20 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });
  }
  y = doc.lastAutoTable.finalY + 6;
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(20);
  doc.text(
    `${num(m2Total)} m² x ${money(p.precioM2)} / m²`,
    margin,
    y,
  );
  doc.setFont("helvetica", "bold");
  doc.text(`Subtotal mano de obra: ${money(manoObra)}`, pageW - margin, y, {
    align: "right",
  });
  y += 12;

  // Materiales
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...ACCENT);
  doc.text("2. Materiales", margin, y);
  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin, right: margin },
    head: [["Material", "Cantidad", "Precio unit.", "Subtotal"]],
    body: p.materiales.map((m) => [
      m.descripcion,
      num(m.cantidad),
      money(m.precioUnitario),
      money(subtotalMaterial(m)),
    ]),
    foot: [["Subtotal materiales", "", "", money(materiales)]],
    headStyles: { fillColor: ACCENT },
    didParseCell: alignNumericCols,
    footStyles: { fillColor: [229, 231, 235], textColor: 20 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });
  y = doc.lastAutoTable.finalY + 10;

  // Resumen
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  autoTable(doc, {
    startY: y,
    margin: { left: pageW / 2, right: margin },
    theme: "plain",
    body: [
      ["Mano de obra", money(manoObra)],
      ["Materiales", money(materiales)],
      ["TOTAL", money(manoObra + materiales)],
    ],
    columnStyles: { 1: { halign: "right" } },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fontSize = 13;
        data.cell.styles.textColor = ACCENT;
      }
    },
  });

  if (p.notas) {
    y = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(20);
    doc.text("Notas", margin, y);
    doc.setFont("helvetica", "normal").setFontSize(10);
    doc.text(doc.splitTextToSize(p.notas, pageW - margin * 2), margin, y + 6);
  }

  const slug = (p.cliente || "presupuesto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  doc.save(`presupuesto-${slug}-${fecha.replaceAll("/", "-")}.pdf`);
}
