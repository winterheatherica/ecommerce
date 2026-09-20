export function nomorWa(mentah: string): string | null {
  const angka = mentah.replace(/\D/g, "");

  if (angka.length < 9) return null;
  if (angka.startsWith("62")) return angka;
  if (angka.startsWith("0")) return `62${angka.slice(1)}`;
  if (angka.startsWith("8")) return `62${angka}`;

  return null;
}

export function tautanWa(mentah: string, pesan: string): string | null {
  const nomor = nomorWa(mentah);
  if (!nomor) return null;

  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
}
