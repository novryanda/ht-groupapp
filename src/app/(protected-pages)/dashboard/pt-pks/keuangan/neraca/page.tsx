import { NeracaDashboard } from "@/components/dashboard/pt-pks/keuangan";

export const metadata = {
  title: "Neraca | Keuangan",
  description: "Laporan posisi keuangan perusahaan",
};

export default function NeracaPage() {
  return (
    <div className="container mx-auto py-6">
      <NeracaDashboard />
    </div>
  );
}
