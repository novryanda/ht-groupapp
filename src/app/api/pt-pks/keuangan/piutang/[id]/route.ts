import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { piutangService } from "@/server/services/pt-pks/piutang.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const piutang = await piutangService.getById(id, session.user.company.id);

    return NextResponse.json(piutang);
  } catch (error) {
    console.error("Error fetching piutang:", error);
    return NextResponse.json(
      { error: "Failed to fetch piutang" },
      { status: 500 }
    );
  }
}
