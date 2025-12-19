import { neracaRepository } from "@/server/repositories/neraca.repository";

export const neracaService = {
  // Get neraca summary
  async getSummary(companyId: string) {
    return neracaRepository.getNeracaSummary(companyId);
  },

  // Get detailed aset
  async getAsetDetail(companyId: string) {
    const [inventaris, piutang, stockProduct, stockTBS] = await Promise.all([
      neracaRepository.getAsetLancarInventaris(companyId),
      neracaRepository.getAsetLancarPiutang(companyId),
      neracaRepository.getAsetLancarStockProduct(companyId),
      neracaRepository.getAsetLancarStockTBS(companyId),
    ]);

    return {
      inventaris,
      piutang,
      stockProduct,
      stockTBS,
    };
  },

  // Get detailed kewajiban
  async getKewajibanDetail(companyId: string) {
    const hutang = await neracaRepository.getKewajibanHutang(companyId);
    return { hutang };
  },

  // Get pending transactions that need to be recorded
  async getPendingTransactions(companyId: string) {
    const [tbsPending, poPending, prPending, pengirimanPending] = await Promise.all([
      neracaRepository.getHutangPenerimaanTBS(companyId),
      neracaRepository.getHutangPurchaseOrder(companyId),
      neracaRepository.getHutangPRLangsung(companyId),
      neracaRepository.getPiutangPengiriman(companyId),
    ]);

    return {
      hutang: {
        penerimaanTBS: tbsPending,
        purchaseOrder: poPending,
        prLangsung: prPending,
      },
      piutang: {
        pengiriman: pengirimanPending,
      },
      summary: {
        totalHutangBelumRecord: 
          tbsPending.belumAdaHutang.length + 
          poPending.belumAdaHutang.length + 
          prPending.belumAdaHutang.length,
        totalPiutangBelumRecord: pengirimanPending.belumAdaPiutang.length,
      },
    };
  },

  // Get full neraca report
  async getFullReport(companyId: string, periodeStart?: Date, periodeEnd?: Date) {
    const summary = await this.getSummary(companyId);
    const asetDetail = await this.getAsetDetail(companyId);
    const kewajibanDetail = await this.getKewajibanDetail(companyId);

    return {
      periode: {
        start: periodeStart,
        end: periodeEnd,
      },
      summary,
      detail: {
        aset: asetDetail,
        kewajiban: kewajibanDetail,
      },
      generatedAt: new Date(),
    };
  },

  // Get aging analysis for hutang
  async getHutangAging(companyId: string) {
    const hutang = await neracaRepository.getKewajibanHutang(companyId);
    const today = new Date();

    // Group by age
    const aging = {
      current: { items: [] as typeof hutang.items, total: 0 }, // 0-30 days
      days31to60: { items: [] as typeof hutang.items, total: 0 },
      days61to90: { items: [] as typeof hutang.items, total: 0 },
      over90: { items: [] as typeof hutang.items, total: 0 },
    };

    hutang.items.forEach((h) => {
      if (h.status === "PAID") return;

      const daysDiff = Math.floor(
        (today.getTime() - new Date(h.tanggalTransaksi).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 30) {
        aging.current.items.push(h);
        aging.current.total += h.sisaHutang;
      } else if (daysDiff <= 60) {
        aging.days31to60.items.push(h);
        aging.days31to60.total += h.sisaHutang;
      } else if (daysDiff <= 90) {
        aging.days61to90.items.push(h);
        aging.days61to90.total += h.sisaHutang;
      } else {
        aging.over90.items.push(h);
        aging.over90.total += h.sisaHutang;
      }
    });

    return aging;
  },

  // Get aging analysis for piutang
  async getPiutangAging(companyId: string) {
    const piutang = await neracaRepository.getAsetLancarPiutang(companyId);
    const today = new Date();

    const aging = {
      current: { items: [] as typeof piutang.items, total: 0 },
      days31to60: { items: [] as typeof piutang.items, total: 0 },
      days61to90: { items: [] as typeof piutang.items, total: 0 },
      over90: { items: [] as typeof piutang.items, total: 0 },
    };

    piutang.items.forEach((p) => {
      if (p.status === "PAID") return;

      const daysDiff = Math.floor(
        (today.getTime() - new Date(p.tanggalTransaksi).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 30) {
        aging.current.items.push(p);
        aging.current.total += p.sisaPiutang;
      } else if (daysDiff <= 60) {
        aging.days31to60.items.push(p);
        aging.days31to60.total += p.sisaPiutang;
      } else if (daysDiff <= 90) {
        aging.days61to90.items.push(p);
        aging.days61to90.total += p.sisaPiutang;
      } else {
        aging.over90.items.push(p);
        aging.over90.total += p.sisaPiutang;
      }
    });

    return aging;
  },
};
