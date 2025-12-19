import { db } from "@/server/db";
import {
  type PiutangQueryInput,
  type PenerimaanPiutangInput,
  type CreatePiutangInput,
} from "@/server/schema/keuangan";
import { StatusPembayaran } from "@prisma/client";

export const piutangRepository = {
  async findAll(companyId: string, filters?: PiutangQueryInput) {
    const where: {
      companyId: string;
      status?: StatusPembayaran;
      buyerId?: string;
      contractId?: string;
      tanggalTransaksi?: { gte?: Date; lte?: Date };
    } = {
      companyId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.buyerId) {
      where.buyerId = filters.buyerId;
    }

    if (filters?.contractId) {
      where.contractId = filters.contractId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.tanggalTransaksi = {};
      if (filters.startDate) {
        where.tanggalTransaksi.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalTransaksi.lte = filters.endDate;
      }
    }

    return db.piutang.findMany({
      where,
      include: {
        penerimaanPiutang: {
          orderBy: { tanggalTerima: "desc" },
        },
      },
      orderBy: { tanggalTransaksi: "desc" },
    });
  },

  async findById(id: string, companyId: string) {
    return db.piutang.findFirst({
      where: { id, companyId },
      include: {
        penerimaanPiutang: {
          orderBy: { tanggalTerima: "desc" },
        },
      },
    });
  },

  async findByReferensi(referensiId: string, companyId: string) {
    return db.piutang.findFirst({
      where: { referensiId, companyId },
    });
  },

  async create(companyId: string, data: CreatePiutangInput) {
    return db.piutang.create({
      data: {
        companyId,
        tipeTransaksi: data.tipeTransaksi,
        referensiId: data.referensiId,
        referensiNomor: data.referensiNomor,
        tanggalTransaksi: data.tanggalTransaksi,
        tanggalJatuhTempo: data.tanggalJatuhTempo,
        buyerId: data.buyerId,
        buyerNama: data.buyerNama,
        contractId: data.contractId,
        contractNumber: data.contractNumber,
        totalNilai: data.totalNilai,
        sisaPiutang: data.totalNilai, // Initially equal to total
        keterangan: data.keterangan,
      },
    });
  },

  async terima(piutangId: string, data: PenerimaanPiutangInput, diterimaOleh: string) {
    // Get current piutang
    const piutang = await db.piutang.findUnique({
      where: { id: piutangId },
    });

    if (!piutang) {
      throw new Error("Piutang tidak ditemukan");
    }

    // Calculate new amounts
    const newTotalDiterima = piutang.totalDiterima + data.jumlahTerima;
    const newSisaPiutang = piutang.totalNilai - newTotalDiterima;

    // Determine status
    let newStatus: StatusPembayaran = "PARTIAL";
    if (newSisaPiutang <= 0) {
      newStatus = "PAID";
    } else if (newTotalDiterima <= 0) {
      newStatus = "UNPAID";
    }

    // Update piutang and create receipt record
    return db.$transaction([
      db.piutang.update({
        where: { id: piutangId },
        data: {
          totalDiterima: newTotalDiterima,
          sisaPiutang: Math.max(0, newSisaPiutang),
          status: newStatus,
        },
      }),
      db.penerimaanPiutang.create({
        data: {
          piutangId,
          tanggalTerima: data.tanggalTerima || new Date(),
          jumlahTerima: data.jumlahTerima,
          metodePembayaran: data.metodePembayaran,
          nomorReferensi: data.nomorReferensi,
          keterangan: data.keterangan,
          diterimaOleh,
        },
      }),
    ]);
  },

  async markAsPaid(piutangId: string, diterimaOleh: string) {
    const piutang = await db.piutang.findUnique({
      where: { id: piutangId },
    });

    if (!piutang) {
      throw new Error("Piutang tidak ditemukan");
    }

    const sisaTerima = piutang.sisaPiutang;

    return db.$transaction([
      db.piutang.update({
        where: { id: piutangId },
        data: {
          totalDiterima: piutang.totalNilai,
          sisaPiutang: 0,
          status: "PAID",
        },
      }),
      db.penerimaanPiutang.create({
        data: {
          piutangId,
          tanggalTerima: new Date(),
          jumlahTerima: sisaTerima,
          metodePembayaran: "LUNAS",
          keterangan: "Pembayaran lunas diterima",
          diterimaOleh,
        },
      }),
    ]);
  },

  async getSummary(companyId: string) {
    const piutangs = await db.piutang.findMany({
      where: { companyId },
    });

    const totalPiutang = piutangs.reduce((sum, p) => sum + p.totalNilai, 0);
    const totalDiterima = piutangs.reduce((sum, p) => sum + p.totalDiterima, 0);
    const sisaPiutang = piutangs.reduce((sum, p) => sum + p.sisaPiutang, 0);
    const jumlahUnpaid = piutangs.filter((p) => p.status === "UNPAID").length;
    const jumlahPartial = piutangs.filter((p) => p.status === "PARTIAL").length;
    const jumlahPaid = piutangs.filter((p) => p.status === "PAID").length;

    return {
      totalPiutang,
      totalDiterima,
      sisaPiutang,
      jumlahUnpaid,
      jumlahPartial,
      jumlahPaid,
    };
  },

  // Get piutang by buyer (for grouping)
  async getByBuyer(companyId: string) {
    const piutangs = await db.piutang.findMany({
      where: { companyId, status: { not: "PAID" } },
      orderBy: { buyerNama: "asc" },
    });

    // Group by buyer
    const grouped = piutangs.reduce((acc, p) => {
      const key = p.buyerId || p.buyerNama;
      if (!acc[key]) {
        acc[key] = {
          buyerId: p.buyerId,
          buyerNama: p.buyerNama,
          totalPiutang: 0,
          totalDiterima: 0,
          sisaPiutang: 0,
          jumlahTransaksi: 0,
          piutangs: [],
        };
      }
      acc[key].totalPiutang += p.totalNilai;
      acc[key].totalDiterima += p.totalDiterima;
      acc[key].sisaPiutang += p.sisaPiutang;
      acc[key].jumlahTransaksi += 1;
      acc[key].piutangs.push(p);
      return acc;
    }, {} as Record<string, {
      buyerId: string | null;
      buyerNama: string;
      totalPiutang: number;
      totalDiterima: number;
      sisaPiutang: number;
      jumlahTransaksi: number;
      piutangs: typeof piutangs;
    }>);

    return Object.values(grouped);
  },
};
