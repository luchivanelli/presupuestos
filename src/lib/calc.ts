import type { MaterialInput, SuperficieInput } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

export const m2 = (s: Pick<SuperficieInput, "ancho" | "alto">) =>
  round2((s.ancho || 0) * (s.alto || 0));

export const totalM2 = (superficies: SuperficieInput[]) =>
  round2(superficies.reduce((acc, s) => acc + m2(s), 0));

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
