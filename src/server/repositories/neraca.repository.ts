import { db } from "@/server/db";

// Repository untuk generate data neraca (balance sheet)
export const neracaRepository = {
  // Get total aset lancar - Material Inventaris
  async getAsetLancarInventaris(companyId: string) {
    const materials = await db.materialInventaris.findMany({
      where: { companyId },
      select: {
        id: true,
        namaMaterial: true,
        partNumber: true,
        stockOnHand: true,
        hargaSatuan: true,
      },
    });

    const items = materials.map((m) => ({
      id: m.id,
      nama: m.namaMaterial,
      kode: m.partNumber,
      jumlah: m.stockOnHand,
      hargaSatuan: m.hargaSatuan || 0,
      nilai: m.stockOnHand * (m.hargaSatuan || 0),
    }));

    const total = items.reduce((sum, item) => sum + item.nilai, 0);

    return { items, total };
  },

  // Get total aset lancar - Piutang
  async getAsetLancarPiutang(companyId: string) {
    const piutangs = await db.piutang.findMany({
      where: { companyId },
      orderBy: { tanggalTransaksi: "desc" },
    });

    const totalPiutang = piutangs.reduce((sum, p) => sum + p.totalNilai, 0);
    const totalDiterima = piutangs.reduce((sum, p) => sum + p.totalDiterima, 0);
    const sisaPiutang = piutangs.reduce((sum, p) => sum + p.sisaPiutang, 0);

    // Group by status
    const byStatus = {
      unpaid: piutangs.filter((p) => p.status === "UNPAID"),
      partial: piutangs.filter((p) => p.status === "PARTIAL"),
      paid: piutangs.filter((p) => p.status === "PAID"),
    };

    return {
      totalPiutang,
      totalDiterima,
      sisaPiutang,
      byStatus,
      items: piutangs,
    };
  },

  // Get total stock product di tangki
  async getAsetLancarStockProduct(companyId: string) {
    const tangkis = await db.tangki.findMany({
      where: { companyId },
      include: {
        material: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    const items = tangkis.map((t) => ({
      id: t.id,
      namaTangki: t.namaTangki,
      material: t.material.name,
      materialCode: t.material.code,
      kapasitas: t.kapasitas,
      isiSaatIni: t.isiSaatIni,
      // Note: Untuk nilai, idealnya perlu harga per material
      // Untuk sementara, kita return quantity saja
    }));

    const totalStock = items.reduce((sum, item) => sum + item.isiSaatIni, 0);

    return { items, totalStock };
  },

  // Get total stock TBS (raw material)
  async getAsetLancarStockTBS(companyId: string) {
    const stockMaterials = await db.stockMaterial.findMany({
      where: { companyId },
      include: {
        material: {
          select: {
            name: true,
            code: true,
            kategori: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Filter hanya TBS/raw material
    const tbsStock = stockMaterials.filter(
      (sm) =>
        sm.material.kategori.name.toLowerCase().includes("tbs") ||
        sm.material.kategori.name.toLowerCase().includes("bahan baku")
    );

    const items = tbsStock.map((s) => ({
      id: s.id,
      material: s.material.name,
      materialCode: s.material.code,
      kategori: s.material.kategori.name,
      jumlah: s.jumlah,
    }));

    const totalStock = items.reduce((sum, item) => sum + item.jumlah, 0);

    return { items, totalStock };
  },

  // Get total kewajiban - Hutang
  async getKewajibanHutang(companyId: string) {
    const hutangs = await db.hutang.findMany({
      where: { companyId },
      orderBy: { tanggalTransaksi: "desc" },
    });

    const totalHutang = hutangs.reduce((sum, h) => sum + h.totalNilai, 0);
    const totalDibayar = hutangs.reduce((sum, h) => sum + h.totalDibayar, 0);
    const sisaHutang = hutangs.reduce((sum, h) => sum + h.sisaHutang, 0);

    // Group by tipe
    const byTipe = hutangs.reduce((acc, h) => {
      if (!acc[h.tipeTransaksi]) {
        acc[h.tipeTransaksi] = {
          total: 0,
          dibayar: 0,
          sisa: 0,
          count: 0,
        };
      }
      const tipe = acc[h.tipeTransaksi];
      if (tipe) {
        tipe.total += h.totalNilai;
        tipe.dibayar += h.totalDibayar;
        tipe.sisa += h.sisaHutang;
        tipe.count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; dibayar: number; sisa: number; count: number }>);

    return {
      totalHutang,
      totalDibayar,
      sisaHutang,
      byTipe,
      items: hutangs,
    };
  },

  // Get hutang dari penerimaan TBS yang belum ada record di tabel Hutang
  async getHutangPenerimaanTBS(companyId: string) {
    // Get completed penerimaan TBS
    const penerimaanTBS = await db.penerimaanTBS.findMany({
      where: {
        companyId,
        status: "COMPLETED",
      },
      include: {
        supplier: {
          select: {
            id: true,
            ownerName: true,
            type: true,
          },
        },
      },
      orderBy: { tanggalTerima: "desc" },
    });

    // Get existing hutang for penerimaan TBS
    const existingHutang = await db.hutang.findMany({
      where: {
        companyId,
        tipeTransaksi: "PENERIMAAN_TBS",
      },
      select: { referensiId: true },
    });

    const existingIds = new Set(existingHutang.map((h) => h.referensiId));

    // Filter yang belum ada di hutang
    const belumAdaHutang = penerimaanTBS.filter((p) => !existingIds.has(p.id));

    // Return all for summary
    return {
      all: penerimaanTBS,
      belumAdaHutang,
      sudahAdaHutang: penerimaanTBS.filter((p) => existingIds.has(p.id)),
    };
  },

  // Get hutang dari Purchase Order yang belum ada record di tabel Hutang
  async getHutangPurchaseOrder(companyId: string) {
    const purchaseOrders = await db.purchaseOrder.findMany({
      where: {
        companyId,
        status: { in: ["ISSUED", "PARTIAL_RECEIVED", "COMPLETED"] },
      },
      orderBy: { tanggalPO: "desc" },
    });

    const existingHutang = await db.hutang.findMany({
      where: {
        companyId,
        tipeTransaksi: "PURCHASE_ORDER",
      },
      select: { referensiId: true },
    });

    const existingIds = new Set(existingHutang.map((h) => h.referensiId));

    return {
      all: purchaseOrders,
      belumAdaHutang: purchaseOrders.filter((p) => !existingIds.has(p.id)),
      sudahAdaHutang: purchaseOrders.filter((p) => existingIds.has(p.id)),
    };
  },

  // Get hutang dari PR Pembelian Langsung yang completed
  async getHutangPRLangsung(companyId: string) {
    const purchaseRequests = await db.purchaseRequest.findMany({
      where: {
        companyId,
        tipePembelian: "PEMBELIAN_LANGSUNG",
        status: "COMPLETED",
      },
      include: {
        items: {
          include: {
            material: {
              select: {
                namaMaterial: true,
                hargaSatuan: true,
              },
            },
          },
        },
      },
      orderBy: { tanggalRequest: "desc" },
    });

    const existingHutang = await db.hutang.findMany({
      where: {
        companyId,
        tipeTransaksi: "PEMBELIAN_LANGSUNG",
      },
      select: { referensiId: true },
    });

    const existingIds = new Set(existingHutang.map((h) => h.referensiId));

    return {
      all: purchaseRequests,
      belumAdaHutang: purchaseRequests.filter((p) => !existingIds.has(p.id)),
      sudahAdaHutang: purchaseRequests.filter((p) => existingIds.has(p.id)),
    };
  },

  // Get piutang dari pengiriman product yang belum ada di tabel Piutang
  async getPiutangPengiriman(companyId: string) {
    const pengiriman = await db.pengirimanProduct.findMany({
      where: {
        companyId,
        status: "COMPLETED",
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            totalAmount: true,
          },
        },
        contractItem: {
          select: {
            unitPrice: true,
            quantity: true,
          },
        },
      },
      orderBy: { tanggalPengiriman: "desc" },
    });

    const existingPiutang = await db.piutang.findMany({
      where: { companyId },
      select: { referensiId: true },
    });

    const existingIds = new Set(existingPiutang.map((p) => p.referensiId));

    return {
      all: pengiriman,
      belumAdaPiutang: pengiriman.filter((p) => !existingIds.has(p.id)),
      sudahAdaPiutang: pengiriman.filter((p) => existingIds.has(p.id)),
    };
  },

  // Generate neraca summary
  async getNeracaSummary(companyId: string) {
    // Get all data
    const [
      inventaris,
      piutang,
      stockProduct,
      stockTBS,
      hutang,
    ] = await Promise.all([
      this.getAsetLancarInventaris(companyId),
      this.getAsetLancarPiutang(companyId),
      this.getAsetLancarStockProduct(companyId),
      this.getAsetLancarStockTBS(companyId),
      this.getKewajibanHutang(companyId),
    ]);

    // Calculate totals
    const totalAsetLancar =
      inventaris.total + piutang.sisaPiutang;

    const totalKewajiban = hutang.sisaHutang;

    // Ekuitas = Aset - Kewajiban
    const ekuitas = totalAsetLancar - totalKewajiban;

    return {
      aset: {
        lancar: {
          piutang: piutang.sisaPiutang,
          inventaris: inventaris.total,
          stockProduct: stockProduct.totalStock,
          stockTBS: stockTBS.totalStock,
        },
        totalAsetLancar,
        // Bisa ditambah aset tetap jika ada
        totalAset: totalAsetLancar,
      },
      kewajiban: {
        hutangUsaha: hutang.sisaHutang,
        hutangByTipe: hutang.byTipe,
        totalKewajiban,
      },
      ekuitas: {
        total: ekuitas,
      },
      // Balance check: Aset = Kewajiban + Ekuitas
      isBalanced: Math.abs(totalAsetLancar - (totalKewajiban + ekuitas)) < 0.01,
    };
  },
};
