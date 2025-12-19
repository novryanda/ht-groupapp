import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { piutangService } from "@/server/services/pt-pks/piutang.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id || !session?.user?.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const result = await piutangService.markAsPaid(
      id,
      session.user.company.id,
      session.user.name
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error marking as paid:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark as paid" },
      { status: 500 }
    );
  }
}
