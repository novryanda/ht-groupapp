import { notFound } from "next/navigation";
import { penggajianService } from "@/server/services/pt-pks/penggajian.service";
import { KaryawanDetailPage } from "@/components/dashboard/pt-pks/penggajian/karyawan-detail-page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Detail Penggajian Karyawan | PT PKS",
  description: "Detail penggajian dan kehadiran karyawan",
};

export default async function PenggajianDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  let penggajian;
  try {
    penggajian = await penggajianService.getPenggajianById(id);
  } catch {
    notFound();
  }

  const bulanOptions = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  const getBulanLabel = (bulan: number) => {
    return bulanOptions.find((o) => o.value === bulan)?.label || String(bulan);
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/pt-pks">PT PKS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/pt-pks/payroll">Payroll</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/pt-pks/payroll/penggajian">Penggajian</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{penggajian.namaKaryawan}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold mt-2">{penggajian.namaKaryawan}</h1>
        <p className="text-muted-foreground">
          Periode: {getBulanLabel(penggajian.periodeBulan)} {penggajian.periodeTahun} | {penggajian.devisi || '-'} - {penggajian.jabatan || '-'}
        </p>
      </div>

      <KaryawanDetailPage penggajianId={id} initialData={JSON.parse(JSON.stringify(penggajian))} />
    </div>
  );
}
