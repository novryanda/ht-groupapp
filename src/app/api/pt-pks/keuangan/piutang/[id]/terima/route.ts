import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { piutangService } from "@/server/services/pt-pks/piutang.service";
import { penerimaanPiutangSchema } from "@/server/schema/keuangan";

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
    const body = await request.json();

    const validatedData = penerimaanPiutangSchema.parse({
      ...body,
      piutangId: id,
      tanggalTerima: body.tanggalTerima ? new Date(body.tanggalTerima) : undefined,
    });

    const result = await piutangService.terima(
      id,
      session.user.company.id,
      validatedData,
      session.user.name
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing receipt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process receipt" },
      { status: 500 }
    );
  }
}
