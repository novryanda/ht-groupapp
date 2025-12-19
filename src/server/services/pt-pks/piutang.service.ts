import { piutangRepository } from "@/server/repositories/piutang.repository";
import { neracaRepository } from "@/server/repositories/neraca.repository";
import {
  type PiutangQueryInput,
  type PenerimaanPiutangInput,
  type CreatePiutangInput,
} from "@/server/schema/keuangan";

export const piutangService = {
  async getAll(companyId: string, filters?: PiutangQueryInput) {
    return piutangRepository.findAll(companyId, filters);
  },

  async getById(id: string, companyId: string) {
    const piutang = await piutangRepository.findById(id, companyId);
    if (!piutang) {
      throw new Error("Piutang tidak ditemukan");
    }
    return piutang;
  },

  async getSummary(companyId: string) {
    return piutangRepository.getSummary(companyId);
  },

  async getByBuyer(companyId: string) {
    return piutangRepository.getByBuyer(companyId);
  },

  async terima(piutangId: string, companyId: string, data: PenerimaanPiutangInput, diterimaOleh: string) {
    // Verify piutang exists and belongs to company
    const piutang = await piutangRepository.findById(piutangId, companyId);
    if (!piutang) {
      throw new Error("Piutang tidak ditemukan");
    }

    if (piutang.status === "PAID") {
      throw new Error("Piutang sudah lunas");
    }

    if (data.jumlahTerima > piutang.sisaPiutang) {
      throw new Error("Jumlah terima melebihi sisa piutang");
    }

    return piutangRepository.terima(piutangId, data, diterimaOleh);
  },

  async markAsPaid(piutangId: string, companyId: string, diterimaOleh: string) {
    const piutang = await piutangRepository.findById(piutangId, companyId);
    if (!piutang) {
      throw new Error("Piutang tidak ditemukan");
    }

    if (piutang.status === "PAID") {
      throw new Error("Piutang sudah lunas");
    }

    return piutangRepository.markAsPaid(piutangId, diterimaOleh);
  },

  // Sync piutang dari pengiriman product
  async syncFromPengiriman(companyId: string) {
    const { belumAdaPiutang } = await neracaRepository.getPiutangPengiriman(companyId);

    const created = [];
    for (const pengiriman of belumAdaPiutang) {
      // Calculate nilai based on weight and price
      const nilaiPengiriman = pengiriman.beratNetto * pengiriman.contractItem.unitPrice;

      const piutangData: CreatePiutangInput = {
        tipeTransaksi: "PENGIRIMAN_PRODUCT",
        referensiId: pengiriman.id,
        referensiNomor: pengiriman.nomorPengiriman,
        tanggalTransaksi: pengiriman.tanggalPengiriman,
        tanggalJatuhTempo: null,
        buyerId: pengiriman.buyerId,
        buyerNama: pengiriman.buyer.name,
        contractId: pengiriman.contractId,
        contractNumber: pengiriman.contract.contractNumber,
        totalNilai: nilaiPengiriman,
        keterangan: `Pengiriman Product - ${pengiriman.nomorPengiriman}`,
      };

      const newPiutang = await piutangRepository.create(companyId, piutangData);
      created.push(newPiutang);
    }

    return { created, count: created.length };
  },

  // Sync all piutang
  async syncAll(companyId: string) {
    const pengiriman = await this.syncFromPengiriman(companyId);

    return {
      pengiriman,
      totalCreated: pengiriman.count,
    };
  },
};
