export type Region = {
  id: string;
  province: string;
  city: string;
  district: string;
  postal_code: string;
  label: string;
};

export const regions: Region[] = [
  { id: "50001", province: "Jawa Barat", city: "Kota Bandung", district: "Coblong", postal_code: "40132", label: "Coblong, Kota Bandung, Jawa Barat" },
  { id: "50002", province: "Jawa Barat", city: "Kota Bandung", district: "Cicendo", postal_code: "40172", label: "Cicendo, Kota Bandung, Jawa Barat" },
  { id: "50003", province: "Jawa Barat", city: "Kota Bekasi", district: "Bekasi Selatan", postal_code: "17141", label: "Bekasi Selatan, Kota Bekasi, Jawa Barat" },
  { id: "50004", province: "DKI Jakarta", city: "Jakarta Selatan", district: "Cilandak", postal_code: "12430", label: "Cilandak, Jakarta Selatan, DKI Jakarta" },
  { id: "50005", province: "DKI Jakarta", city: "Jakarta Pusat", district: "Menteng", postal_code: "10310", label: "Menteng, Jakarta Pusat, DKI Jakarta" },
  { id: "50006", province: "Jawa Tengah", city: "Kota Semarang", district: "Semarang Tengah", postal_code: "50139", label: "Semarang Tengah, Kota Semarang, Jawa Tengah" },
  { id: "50007", province: "DI Yogyakarta", city: "Sleman", district: "Depok", postal_code: "55281", label: "Depok, Sleman, DI Yogyakarta" },
  { id: "50008", province: "Jawa Timur", city: "Kota Surabaya", district: "Genteng", postal_code: "60271", label: "Genteng, Kota Surabaya, Jawa Timur" },
  { id: "50009", province: "Jawa Timur", city: "Kota Malang", district: "Klojen", postal_code: "65119", label: "Klojen, Kota Malang, Jawa Timur" },
  { id: "50010", province: "Bali", city: "Kota Denpasar", district: "Denpasar Barat", postal_code: "80119", label: "Denpasar Barat, Kota Denpasar, Bali" },
  { id: "50011", province: "Sumatera Utara", city: "Kota Medan", district: "Medan Kota", postal_code: "20212", label: "Medan Kota, Kota Medan, Sumatera Utara" },
  { id: "50012", province: "Sulawesi Selatan", city: "Kota Makassar", district: "Panakkukang", postal_code: "90231", label: "Panakkukang, Kota Makassar, Sulawesi Selatan" },
];
