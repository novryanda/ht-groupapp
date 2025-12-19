import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { piutangService } from "@/server/services/pt-pks/piutang.service";
import { piutangQuerySchema } from "@/server/schema/keuangan";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get("status") || undefined,
      buyerId: searchParams.get("buyerId") || undefined,
      contractId: searchParams.get("contractId") || undefined,
      startDate: searchParams.get("startDate") 
        ? new Date(searchParams.get("startDate")!) 
        : undefined,
      endDate: searchParams.get("endDate") 
        ? new Date(searchParams.get("endDate")!) 
        : undefined,
    };

    const validatedFilters = piutangQuerySchema.parse(filters);
    const piutangs = await piutangService.getAll(
      session.user.company.id,
      validatedFilters
    );

    return NextResponse.json(piutangs);
  } catch (error) {
    console.error("Error fetching piutang:", error);
    return NextResponse.json(
      { error: "Failed to fetch piutang" },
      { status: 500 }
    );
  }
}
