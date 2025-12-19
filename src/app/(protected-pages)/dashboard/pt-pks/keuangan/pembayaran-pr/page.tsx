import { PembayaranPRList } from "@/components/dashboard/pt-pks/keuangan";

export const metadata = {
  title: "Pembayaran PR Langsung | Keuangan",
  description: "Daftar pembayaran untuk Purchase Request Pembelian Langsung",
};

export default function PembayaranPRPage() {
  return (
    <div className="container mx-auto py-6">
      <PembayaranPRList />
    </div>
  );
}
