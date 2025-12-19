import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { RiwayatPengirimanList } from "@/components/dashboard/pt-pks/riwayat-pengiriman/riwayat-pengiriman-list";

export const metadata = {
  title: "Riwayat Pengiriman - PT PKS",
  description: "Riwayat pengiriman product berdasarkan kontrak buyer",
};

export default async function RiwayatPengirimanPage({
  searchParams,
}: {
  searchParams: { contractId?: string; buyerId?: string };
}) {
  const session = await auth();

  if (!session?.user?.company?.id) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Pengiriman</h1>
          <p className="text-muted-foreground">
            Pantau pengiriman product dan sisa kuantitas kontrak
          </p>
        </div>
      </div>

      <RiwayatPengirimanList
        contractId={searchParams.contractId}
        buyerId={searchParams.buyerId}
      />
    </div>
  );
}
