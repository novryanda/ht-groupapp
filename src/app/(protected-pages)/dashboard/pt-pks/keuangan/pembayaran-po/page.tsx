import { PembayaranPOList } from "@/components/dashboard/pt-pks/keuangan";

export const metadata = {
  title: "Pembayaran PO | Keuangan",
  description: "Daftar pembayaran untuk Purchase Order",
};

export default function PembayaranPOPage() {
  return (
    <div className="container mx-auto py-6">
      <PembayaranPOList />
    </div>
  );
}
