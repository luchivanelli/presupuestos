export type SuperficieInput = {
  descripcion: string;
  ancho: number;
  alto: number;
};

/** Puerta o ventana cuya superficie se descuenta de las paredes */
export type AberturaInput = {
  descripcion: string;
  ancho: number;
  alto: number;
  cantidad: number;
};

export type MaterialInput = {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
};

export type PresupuestoData = {
  cliente: string;
  direccion: string;
  notas: string;
  precioM2: number;
  superficies: SuperficieInput[];
  aberturas: AberturaInput[];
  materiales: MaterialInput[];
};
