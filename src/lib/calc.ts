import type { AberturaInput, MaterialInput, SuperficieInput } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

export const m2 = (s: Pick<SuperficieInput, "ancho" | "alto">) =>
  round2((s.ancho || 0) * (s.alto || 0));

/** m² de una fila: ancho × alto × cantidad (paredes o aberturas) */
export const m2Fila = (s: Pick<SuperficieInput, "ancho" | "alto" | "cantidad">) =>
  round2(m2(s) * (s.cantidad || 0));

export const totalM2 = (superficies: SuperficieInput[]) =>
  round2(superficies.reduce((acc, s) => acc + m2Fila(s), 0));

export const totalAberturas = (aberturas: AberturaInput[]) =>
  round2(aberturas.reduce((acc, a) => acc + m2Fila(a), 0));

/** Superficie a cobrar: paredes menos puertas y ventanas (nunca negativa) */
export const m2Neto = (superficies: SuperficieInput[], aberturas: AberturaInput[]) =>
  Math.max(0, round2(totalM2(superficies) - totalAberturas(aberturas)));

export const subtotalMaterial = (m: MaterialInput) =>
  round2((m.cantidad || 0) * (m.precioUnitario || 0));

export const totalMateriales = (materiales: MaterialInput[]) =>
  round2(materiales.reduce((acc, m) => acc + subtotalMaterial(m), 0));

const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});
const numFmt = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const money = (n: number) => moneyFmt.format(n);
export const num = (n: number) => numFmt.format(n);
