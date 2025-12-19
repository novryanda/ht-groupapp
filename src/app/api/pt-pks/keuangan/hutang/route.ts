import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { hutangService } from "@/server/services/pt-pks/hutang.service";
import { hutangQuerySchema } from "@/server/schema/keuangan";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get("status") || undefined,
      tipeTransaksi: searchParams.get("tipeTransaksi") || undefined,
      pihakKetigaId: searchParams.get("pihakKetigaId") || undefined,
      startDate: searchParams.get("startDate") 
        ? new Date(searchParams.get("startDate")!) 
        : undefined,
      endDate: searchParams.get("endDate") 
        ? new Date(searchParams.get("endDate")!) 
        : undefined,
    };

    const validatedFilters = hutangQuerySchema.parse(filters);
    const hutangs = await hutangService.getAll(
      session.user.company.id,
      validatedFilters
    );

    return NextResponse.json(hutangs);
  } catch (error) {
    console.error("Error fetching hutang:", error);
    return NextResponse.json(
      { error: "Failed to fetch hutang" },
      { status: 500 }
    );
  }
}
