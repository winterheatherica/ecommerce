"use client";

import { useSyncExternalStore } from "react";

const KUNCI = "menik-keranjang-v1";

export const MAKS_PER_UKURAN = 20;
export const MAKS_PER_PESANAN = 50;

export type ItemKeranjang = {
  slug: string;
  qty: number;
};

const KOSONG: ItemKeranjang[] = [];

let snapshot: ItemKeranjang[] = KOSONG;
let sudahMuat = false;
const pendengar = new Set<() => void>();

function bacaPenyimpanan(): ItemKeranjang[] {
  try {
    const mentah = window.localStorage.getItem(KUNCI);
    if (!mentah) return KOSONG;

    const isi = JSON.parse(mentah);
    if (!Array.isArray(isi)) return KOSONG;

    return isi
      .filter((x) => x && typeof x.slug === "string" && Number.isFinite(x.qty))
      .map((x) => ({
        slug: x.slug as string,
        qty: Math.min(MAKS_PER_UKURAN, Math.max(1, Math.floor(x.qty))),
      }));
  } catch {
    return KOSONG;
  }
}

function simpan(items: ItemKeranjang[]) {
  snapshot = items;
  sudahMuat = true;

  try {
    window.localStorage.setItem(KUNCI, JSON.stringify(items));
  } catch {}

  pendengar.forEach((cb) => cb());
}

function langgan(cb: () => void) {
  pendengar.add(cb);

  const dariTabLain = (e: StorageEvent) => {
    if (e.key !== KUNCI) return;
    sudahMuat = false;
    cb();
  };

  window.addEventListener("storage", dariTabLain);

  return () => {
    pendengar.delete(cb);
    window.removeEventListener("storage", dariTabLain);
  };
}

function ambilSnapshot(): ItemKeranjang[] {
  if (!sudahMuat) {
    snapshot = bacaPenyimpanan();
    sudahMuat = true;
  }
  return snapshot;
}

function snapshotServer(): ItemKeranjang[] {
  return KOSONG;
}

export function useKeranjang() {
  return useSyncExternalStore(langgan, ambilSnapshot, snapshotServer);
}

export function tambahKeKeranjang(slug: string, qty = 1, stok = Infinity) {
  const batas = Math.min(stok, MAKS_PER_UKURAN);
  const sekarang = ambilSnapshot();
  const ada = sekarang.find((i) => i.slug === slug);

  const berikut = ada
    ? sekarang.map((i) =>
        i.slug === slug ? { ...i, qty: Math.min(batas, i.qty + qty) } : i,
      )
    : [...sekarang, { slug, qty: Math.min(batas, qty) }];

  simpan(berikut);
}

export function ubahQty(slug: string, qty: number, stok = Infinity) {
  const bersih = Math.min(stok, MAKS_PER_UKURAN, Math.max(1, Math.floor(qty)));
  simpan(ambilSnapshot().map((i) => (i.slug === slug ? { ...i, qty: bersih } : i)));
}

export function hapusDariKeranjang(slug: string) {
  simpan(ambilSnapshot().filter((i) => i.slug !== slug));
}

export function buangYangTidakDijual(slugDijual: string[]) {
  const dijual = new Set(slugDijual);
  const sekarang = ambilSnapshot();
  const sisa = sekarang.filter((i) => dijual.has(i.slug));

  if (sisa.length !== sekarang.length) simpan(sisa);
}

export function kosongkanKeranjang() {
  simpan(KOSONG);
}
