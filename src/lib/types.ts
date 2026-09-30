export type SuperficieInput = {
  descripcion: string;
  ancho: number;
  alto: number;
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
  materiales: MaterialInput[];
};
