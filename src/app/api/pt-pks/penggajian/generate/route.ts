import { requireAuthWithRole } from "@/lib/api-auth";
import { masterKaryawanService } from "@/server/services/pt-pks/master-karyawan.service";
import { NextResponse } from "next/server";

// POST /api/pt-pks/penggajian/generate - Generate penggajian from master data
export async function POST(request: Request) {
  const { error } = await requireAuthWithRole(["Admin", "Manager PT PKS"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { periodeBulan, periodeTahun } = body;

    if (!periodeBulan || !periodeTahun) {
      return NextResponse.json(
        { error: "Periode bulan dan tahun wajib diisi" },
        { status: 400 }
      );
    }

    const result = await masterKaryawanService.generatePenggajian(
      parseInt(periodeBulan),
      parseInt(periodeTahun)
    );

    return NextResponse.json({
      message: `Berhasil generate ${result.generated} data penggajian untuk periode ${result.period}`,
      ...result,
    });
  } catch (error: unknown) {
    console.error("Error generating penggajian:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to generate penggajian" },
      { status: 500 }
    );
  }
}
