"use client";

import { useEffect } from "react";

type Gtag = (...isi: unknown[]) => void;

function sudahTerkirim(kunci: string): boolean {
  try {
    return localStorage.getItem(kunci) !== null;
  } catch {
    return false;
  }
}

function tandaiTerkirim(kunci: string): void {
  try {
    localStorage.setItem(kunci, "1");
  } catch {
    return;
  }
}

export default function KonversiBeli({
  sendTo,
  orderNo,
  nilai,
}: {
  sendTo: string;
  orderNo: string;
  nilai: number;
}) {
  useEffect(() => {
    const kunci = `konversi-iklan:${orderNo}`;
    if (sudahTerkirim(kunci)) return;

    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    if (!gtag) return;

    gtag("event", "conversion", {
      send_to: sendTo,
      value: nilai,
      currency: "IDR",
      transaction_id: orderNo,
    });
    tandaiTerkirim(kunci);
  }, [sendTo, orderNo, nilai]);

  return null;
}
