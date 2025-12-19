import { requireAuthWithRole } from "@/lib/api-auth";
import { buyerService } from "@/server/services/pt-pks/buyer.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/buyer/active - Get all active buyers
export async function GET() {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const buyers = await buyerService.getActiveBuyers(companyId);

    return NextResponse.json(buyers);
  } catch (error: any) {
    console.error("Error fetching active buyers:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch active buyers" },
      { status: 500 }
    );
  }
}
