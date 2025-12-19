import { HutangSupplierList } from "@/components/dashboard/pt-pks/keuangan";

export const metadata = {
  title: "Hutang Supplier | Keuangan",
  description: "Daftar hutang kepada supplier dan vendor",
};

export default function HutangSupplierPage() {
  return (
    <div className="container mx-auto py-6">
      <HutangSupplierList />
    </div>
  );
}
