import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { hutangService } from "@/server/services/pt-pks/hutang.service";
import { pembayaranHutangSchema } from "@/server/schema/keuangan";

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

    const validatedData = pembayaranHutangSchema.parse({
      ...body,
      hutangId: id,
      tanggalBayar: body.tanggalBayar ? new Date(body.tanggalBayar) : undefined,
    });

    const result = await hutangService.bayar(
      id,
      session.user.company.id,
      validatedData,
      session.user.name
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process payment" },
      { status: 500 }
    );
  }
}
