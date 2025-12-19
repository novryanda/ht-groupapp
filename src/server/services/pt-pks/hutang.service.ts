import { hutangRepository } from "@/server/repositories/hutang.repository";
import { neracaRepository } from "@/server/repositories/neraca.repository";
import {
  type HutangQueryInput,
  type PembayaranHutangInput,
  type CreateHutangInput,
} from "@/server/schema/keuangan";

export const hutangService = {
  async getAll(companyId: string, filters?: HutangQueryInput) {
    return hutangRepository.findAll(companyId, filters);
  },

  async getById(id: string, companyId: string) {
    const hutang = await hutangRepository.findById(id, companyId);
    if (!hutang) {
      throw new Error("Hutang tidak ditemukan");
    }
    return hutang;
  },

  async getSummary(companyId: string) {
    return hutangRepository.getSummary(companyId);
  },

  async getByPihakKetiga(companyId: string) {
    return hutangRepository.getByPihakKetiga(companyId);
  },

  async bayar(hutangId: string, companyId: string, data: PembayaranHutangInput, dibayarOleh: string) {
    // Verify hutang exists and belongs to company
    const hutang = await hutangRepository.findById(hutangId, companyId);
    if (!hutang) {
      throw new Error("Hutang tidak ditemukan");
    }

    if (hutang.status === "PAID") {
      throw new Error("Hutang sudah lunas");
    }

    if (data.jumlahBayar > hutang.sisaHutang) {
      throw new Error("Jumlah bayar melebihi sisa hutang");
    }

    return hutangRepository.bayar(hutangId, data, dibayarOleh);
  },

  async markAsPaid(hutangId: string, companyId: string, dibayarOleh: string) {
    const hutang = await hutangRepository.findById(hutangId, companyId);
    if (!hutang) {
      throw new Error("Hutang tidak ditemukan");
    }

    if (hutang.status === "PAID") {
      throw new Error("Hutang sudah lunas");
    }

    return hutangRepository.markAsPaid(hutangId, dibayarOleh);
  },

  // Sync hutang dari penerimaan TBS
  async syncFromPenerimaanTBS(companyId: string) {
    const { belumAdaHutang } = await neracaRepository.getHutangPenerimaanTBS(companyId);

    const created = [];
    for (const penerimaan of belumAdaHutang) {
      const hutangData: CreateHutangInput = {
        tipeTransaksi: "PENERIMAAN_TBS",
        referensiId: penerimaan.id,
        referensiNomor: penerimaan.nomorPenerimaan,
        tanggalTransaksi: penerimaan.tanggalTerima,
        tanggalJatuhTempo: null,
        pihakKetigaId: penerimaan.supplierId,
        pihakKetigaNama: penerimaan.supplier.ownerName,
        pihakKetigaTipe: "SUPPLIER",
        totalNilai: penerimaan.totalBayar + penerimaan.totalUpahBongkar,
        keterangan: `Penerimaan TBS - ${penerimaan.nomorPenerimaan}`,
      };

      const newHutang = await hutangRepository.create(companyId, hutangData);
      created.push(newHutang);
    }

    return { created, count: created.length };
  },

  // Sync hutang dari Purchase Order
  async syncFromPurchaseOrder(companyId: string) {
    const { belumAdaHutang } = await neracaRepository.getHutangPurchaseOrder(companyId);

    const created = [];
    for (const po of belumAdaHutang) {
      const hutangData: CreateHutangInput = {
        tipeTransaksi: "PURCHASE_ORDER",
        referensiId: po.id,
        referensiNomor: po.nomorPO,
        tanggalTransaksi: po.tanggalPO,
        tanggalJatuhTempo: null,
        pihakKetigaId: null,
        pihakKetigaNama: po.vendorName,
        pihakKetigaTipe: "VENDOR",
        totalNilai: po.totalAmount,
        keterangan: `Purchase Order - ${po.nomorPO}`,
      };

      const newHutang = await hutangRepository.create(companyId, hutangData);
      created.push(newHutang);
    }

    return { created, count: created.length };
  },

  // Sync hutang dari PR Pembelian Langsung
  async syncFromPRLangsung(companyId: string) {
    const { belumAdaHutang } = await neracaRepository.getHutangPRLangsung(companyId);

    const created = [];
    for (const pr of belumAdaHutang) {
      // Calculate total from items
      const totalNilai = pr.items.reduce((sum, item) => {
        const harga = item.material.hargaSatuan || item.estimasiHarga || 0;
        return sum + item.jumlahRequest * harga;
      }, 0);

      const hutangData: CreateHutangInput = {
        tipeTransaksi: "PEMBELIAN_LANGSUNG",
        referensiId: pr.id,
        referensiNomor: pr.nomorPR,
        tanggalTransaksi: pr.tanggalRequest,
        tanggalJatuhTempo: null,
        pihakKetigaId: null,
        pihakKetigaNama: pr.vendorNameDirect || "Vendor Langsung",
        pihakKetigaTipe: "VENDOR",
        totalNilai,
        keterangan: `PR Pembelian Langsung - ${pr.nomorPR}`,
      };

      const newHutang = await hutangRepository.create(companyId, hutangData);
      created.push(newHutang);
    }

    return { created, count: created.length };
  },

  // Sync all hutang
  async syncAll(companyId: string) {
    const [tbs, po, pr] = await Promise.all([
      this.syncFromPenerimaanTBS(companyId),
      this.syncFromPurchaseOrder(companyId),
      this.syncFromPRLangsung(companyId),
    ]);

    return {
      penerimaanTBS: tbs,
      purchaseOrder: po,
      prLangsung: pr,
      totalCreated: tbs.count + po.count + pr.count,
    };
  },
};
