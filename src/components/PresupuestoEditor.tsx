"use client";

import { useState } from "react";
import {
  m2,
  money,
  num,
  subtotalMaterial,
  totalM2,
  totalMateriales,
} from "@/lib/calc";
import type {
  MaterialInput,
  PresupuestoData,
  SuperficieInput,
} from "@/lib/types";

const nuevaSuperficie = (): SuperficieInput => ({ descripcion: "", ancho: 0, alto: 0 });
const nuevoMaterial = (): MaterialInput => ({ descripcion: "", cantidad: 1, precioUnitario: 0 });

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20";
const numCls = `${inputCls} text-right tabular-nums`;

function NumberInput({
  value,
  onChange,
  ...rest
}: {
  value: number;
  onChange: (n: number) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  // Guardamos el texto para permitir escribir "1," o "0." sin perder lo tecleado
  const [text, setText] = useState(value ? String(value) : "");
  return (
    <input
      {...rest}
      inputMode="decimal"
      className={numCls}
      value={text}
      placeholder="0"
      onChange={(e) => {
        const t = e.target.value.replace(",", ".");
        if (!/^\d*\.?\d*$/.test(t)) return;
        setText(t);
        onChange(Number(t) || 0);
      }}
    />
  );
}

export default function PresupuestoEditor() {
  // Cambiar esta clave remonta el formulario y lo deja vacío
  const [version, setVersion] = useState(0);
  return <Formulario key={version} onLimpiar={() => setVersion((v) => v + 1)} />;
}

function Formulario({ onLimpiar }: { onLimpiar: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false);

  const [cliente, setCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [precioM2, setPrecioM2] = useState(0);
  const [superficies, setSuperficies] = useState<SuperficieInput[]>([nuevaSuperficie()]);
  const [materiales, setMateriales] = useState<MaterialInput[]>([nuevoMaterial()]);
  // Claves estables para las filas (evita que los inputs se mezclen al borrar)
  const [supKeys, setSupKeys] = useState(() => superficies.map(() => crypto.randomUUID()));
  const [matKeys, setMatKeys] = useState(() => materiales.map(() => crypto.randomUUID()));

  const m2Total = totalM2(superficies);
  const manoObra = m2Total * precioM2;
  const matTotal = totalMateriales(materiales);
  const total = manoObra + matTotal;

  const data: PresupuestoData = {
    cliente,
    direccion,
    notas,
    precioM2,
    superficies,
    materiales,
  };

  const updateSup = (i: number, patch: Partial<SuperficieInput>) =>
    setSuperficies((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const updateMat = (i: number, patch: Partial<MaterialInput>) =>
    setMateriales((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const pdf = async () => {
    if (!cliente.trim()) {
      setError("Indicá el nombre del cliente.");
      return;
    }
    setError(null);
    const { descargarPdf } = await import("@/lib/pdf");
    descargarPdf(data);
  };


  return (
    <div className="space-y-8">
      {/* Datos del cliente */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Cliente *</span>
            <input className={inputCls} value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Dirección / obra</span>
            <input className={inputCls} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </label>
        </div>
      </section>

      {/* 1. Mano de obra */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">1. Mano de obra</h2>

        <div className="hidden grid-cols-[1fr_7rem_7rem_8rem_2.5rem] gap-2 px-1 pb-1 text-xs font-medium uppercase tracking-wide text-slate-500 md:grid">
          <span>Descripción</span>
          <span className="text-right">Ancho (m)</span>
          <span className="text-right">Alto (m)</span>
          <span className="text-right">m²</span>
          <span />
        </div>
        <div className="space-y-3 md:space-y-2">
          {superficies.map((s, i) => (
            <div
              key={supKeys[i]}
              className="grid grid-cols-2 gap-2 rounded-lg border border-slate-100 p-2 md:grid-cols-[1fr_7rem_7rem_8rem_2.5rem] md:border-0 md:p-0"
            >
              <input
                className={`${inputCls} col-span-2 md:col-span-1`}
                placeholder="Ej: Pared living"
                value={s.descripcion}
                onChange={(e) => updateSup(i, { descripcion: e.target.value })}
              />
              <NumberInput aria-label="Ancho" value={s.ancho} onChange={(ancho) => updateSup(i, { ancho })} />
              <NumberInput aria-label="Alto" value={s.alto} onChange={(alto) => updateSup(i, { alto })} />
              <div className="flex items-center justify-end rounded-md bg-slate-50 px-3 py-2 text-sm font-medium tabular-nums text-slate-900">
                {num(m2(s))} m²
              </div>
              <button
                type="button"
                title="Quitar"
                onClick={() => {
                  setSuperficies((p) => p.filter((_, j) => j !== i));
                  setSupKeys((p) => p.filter((_, j) => j !== i));
                }}
                className="rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setSuperficies((p) => [...p, nuevaSuperficie()]);
            setSupKeys((p) => [...p, crypto.randomUUID()]);
          }}
          className="mt-3 text-sm font-medium text-blue-700 hover:underline"
        >
          + Agregar superficie
        </button>

        <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Total superficie</p>
            <p className="text-2xl font-bold tabular-nums text-slate-900">{num(m2Total)} m²</p>
          </div>
          <label className="block sm:w-48">
            <span className="mb-1 block text-sm font-medium text-slate-700">Precio por m²</span>
            <NumberInput value={precioM2} onChange={setPrecioM2} />
          </label>
          <div className="sm:text-right">
            <p className="text-sm text-slate-500">Subtotal mano de obra</p>
            <p className="text-xl font-semibold tabular-nums text-slate-900">{money(manoObra)}</p>
          </div>
        </div>
      </section>

      {/* 2. Materiales */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">2. Materiales</h2>

        <div className="hidden grid-cols-[1fr_6rem_9rem_9rem_2.5rem] gap-2 px-1 pb-1 text-xs font-medium uppercase tracking-wide text-slate-500 md:grid">
          <span>Material</span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Precio unit.</span>
          <span className="text-right">Subtotal</span>
          <span />
        </div>
        <div className="space-y-3 md:space-y-2">
          {materiales.map((m, i) => (
            <div
              key={matKeys[i]}
              className="grid grid-cols-2 gap-2 rounded-lg border border-slate-100 p-2 md:grid-cols-[1fr_6rem_9rem_9rem_2.5rem] md:border-0 md:p-0"
            >
              <input
                className={`${inputCls} col-span-2 md:col-span-1`}
                placeholder="Ej: Pintura látex 20 L"
                value={m.descripcion}
                onChange={(e) => updateMat(i, { descripcion: e.target.value })}
              />
              <NumberInput aria-label="Cantidad" value={m.cantidad} onChange={(cantidad) => updateMat(i, { cantidad })} />
              <NumberInput
                aria-label="Precio unitario"
                value={m.precioUnitario}
                onChange={(precioUnitario) => updateMat(i, { precioUnitario })}
              />
              <div className="flex items-center justify-end rounded-md bg-slate-50 px-3 py-2 text-sm font-medium tabular-nums text-slate-900">
                {money(subtotalMaterial(m))}
              </div>
              <button
                type="button"
                title="Quitar"
                onClick={() => {
                  setMateriales((p) => p.filter((_, j) => j !== i));
                  setMatKeys((p) => p.filter((_, j) => j !== i));
                }}
                className="rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setMateriales((p) => [...p, nuevoMaterial()]);
            setMatKeys((p) => [...p, crypto.randomUUID()]);
          }}
          className="mt-3 text-sm font-medium text-blue-700 hover:underline"
        >
          + Agregar material
        </button>

        <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
          <div className="text-right">
            <p className="text-sm text-slate-500">Subtotal materiales</p>
            <p className="text-xl font-semibold tabular-nums text-slate-900">{money(matTotal)}</p>
          </div>
        </div>
      </section>

      {/* Notas + total */}
      <section className="grid gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Notas / condiciones</span>
          <textarea
            rows={4}
            className={inputCls}
            placeholder="Validez, forma de pago, plazos..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </label>
        <dl className="space-y-2 self-end text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Mano de obra</dt>
            <dd className="tabular-nums">{money(manoObra)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Materiales</dt>
            <dd className="tabular-nums">{money(matTotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-blue-800">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(total)}</dd>
          </div>
        </dl>
      </section>

      {/* Acciones */}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={pdf}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Descargar PDF
        </button>
        {confirmarLimpiar ? (
          <span className="flex items-center gap-2 text-sm">
            ¿Borrar todos los datos?
            <button type="button" onClick={onLimpiar} className="font-semibold text-red-700 hover:underline">
              Sí
            </button>
            <button type="button" onClick={() => setConfirmarLimpiar(false)} className="text-slate-600 hover:underline">
              No
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmarLimpiar(true)} className="text-sm text-red-700 hover:underline">
            Limpiar
          </button>
        )}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </div>
  );
}
