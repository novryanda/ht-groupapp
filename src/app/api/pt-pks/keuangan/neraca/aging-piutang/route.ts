import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { neracaService } from "@/server/services/pt-pks/neraca.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const aging = await neracaService.getPiutangAging(session.user.company.id);
    return NextResponse.json(aging);
  } catch (error) {
    console.error("Error fetching piutang aging:", error);
    return NextResponse.json(
      { error: "Failed to fetch piutang aging" },
      { status: 500 }
    );
  }
}
