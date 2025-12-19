import { db } from "@/server/db";
import {
  type HutangQueryInput,
  type PembayaranHutangInput,
  type CreateHutangInput,
} from "@/server/schema/keuangan";
import { StatusPembayaran, TipeTransaksiKeuangan } from "@prisma/client";

export const hutangRepository = {
  async findAll(companyId: string, filters?: HutangQueryInput) {
    const where: {
      companyId: string;
      status?: StatusPembayaran;
      tipeTransaksi?: TipeTransaksiKeuangan;
      pihakKetigaId?: string;
      tanggalTransaksi?: { gte?: Date; lte?: Date };
    } = {
      companyId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.tipeTransaksi) {
      where.tipeTransaksi = filters.tipeTransaksi;
    }

    if (filters?.pihakKetigaId) {
      where.pihakKetigaId = filters.pihakKetigaId;
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

    return db.hutang.findMany({
      where,
      include: {
        pembayaranHutang: {
          orderBy: { tanggalBayar: "desc" },
        },
      },
      orderBy: { tanggalTransaksi: "desc" },
    });
  },

  async findById(id: string, companyId: string) {
    return db.hutang.findFirst({
      where: { id, companyId },
      include: {
        pembayaranHutang: {
          orderBy: { tanggalBayar: "desc" },
        },
      },
    });
  },

  async findByReferensi(referensiId: string, companyId: string) {
    return db.hutang.findFirst({
      where: { referensiId, companyId },
    });
  },

  async create(companyId: string, data: CreateHutangInput) {
    return db.hutang.create({
      data: {
        companyId,
        tipeTransaksi: data.tipeTransaksi,
        referensiId: data.referensiId,
        referensiNomor: data.referensiNomor,
        tanggalTransaksi: data.tanggalTransaksi,
        tanggalJatuhTempo: data.tanggalJatuhTempo,
        pihakKetigaId: data.pihakKetigaId,
        pihakKetigaNama: data.pihakKetigaNama,
        pihakKetigaTipe: data.pihakKetigaTipe,
        totalNilai: data.totalNilai,
        sisaHutang: data.totalNilai, // Initially equal to total
        keterangan: data.keterangan,
      },
    });
  },

  async bayar(hutangId: string, data: PembayaranHutangInput, dibayarOleh: string) {
    // Get current hutang
    const hutang = await db.hutang.findUnique({
      where: { id: hutangId },
    });

    if (!hutang) {
      throw new Error("Hutang tidak ditemukan");
    }

    // Calculate new amounts
    const newTotalDibayar = hutang.totalDibayar + data.jumlahBayar;
    const newSisaHutang = hutang.totalNilai - newTotalDibayar;

    // Determine status
    let newStatus: StatusPembayaran = "PARTIAL";
    if (newSisaHutang <= 0) {
      newStatus = "PAID";
    } else if (newTotalDibayar <= 0) {
      newStatus = "UNPAID";
    }

    // Update hutang and create payment record
    return db.$transaction([
      db.hutang.update({
        where: { id: hutangId },
        data: {
          totalDibayar: newTotalDibayar,
          sisaHutang: Math.max(0, newSisaHutang),
          status: newStatus,
        },
      }),
      db.pembayaranHutang.create({
        data: {
          hutangId,
          tanggalBayar: data.tanggalBayar || new Date(),
          jumlahBayar: data.jumlahBayar,
          metodePembayaran: data.metodePembayaran,
          nomorReferensi: data.nomorReferensi,
          keterangan: data.keterangan,
          dibayarOleh,
        },
      }),
    ]);
  },

  async markAsPaid(hutangId: string, dibayarOleh: string) {
    const hutang = await db.hutang.findUnique({
      where: { id: hutangId },
    });

    if (!hutang) {
      throw new Error("Hutang tidak ditemukan");
    }

    const sisaBayar = hutang.sisaHutang;

    return db.$transaction([
      db.hutang.update({
        where: { id: hutangId },
        data: {
          totalDibayar: hutang.totalNilai,
          sisaHutang: 0,
          status: "PAID",
        },
      }),
      db.pembayaranHutang.create({
        data: {
          hutangId,
          tanggalBayar: new Date(),
          jumlahBayar: sisaBayar,
          metodePembayaran: "LUNAS",
          keterangan: "Pembayaran lunas",
          dibayarOleh,
        },
      }),
    ]);
  },

  async getSummary(companyId: string) {
    const hutangs = await db.hutang.findMany({
      where: { companyId },
    });

    const totalHutang = hutangs.reduce((sum, h) => sum + h.totalNilai, 0);
    const totalDibayar = hutangs.reduce((sum, h) => sum + h.totalDibayar, 0);
    const sisaHutang = hutangs.reduce((sum, h) => sum + h.sisaHutang, 0);
    const jumlahUnpaid = hutangs.filter((h) => h.status === "UNPAID").length;
    const jumlahPartial = hutangs.filter((h) => h.status === "PARTIAL").length;
    const jumlahPaid = hutangs.filter((h) => h.status === "PAID").length;

    // Group by tipe transaksi
    const byTipe = hutangs.reduce((acc, h) => {
      if (!acc[h.tipeTransaksi]) {
        acc[h.tipeTransaksi] = { total: 0, dibayar: 0, sisa: 0, count: 0 };
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
      jumlahUnpaid,
      jumlahPartial,
      jumlahPaid,
      byTipe,
    };
  },

  // Get hutang by pihak ketiga (for grouping)
  async getByPihakKetiga(companyId: string) {
    const hutangs = await db.hutang.findMany({
      where: { companyId, status: { not: "PAID" } },
      orderBy: { pihakKetigaNama: "asc" },
    });

    // Group by pihak ketiga
    const grouped = hutangs.reduce((acc, h) => {
      const key = h.pihakKetigaId || h.pihakKetigaNama;
      if (!acc[key]) {
        acc[key] = {
          pihakKetigaId: h.pihakKetigaId,
          pihakKetigaNama: h.pihakKetigaNama,
          pihakKetigaTipe: h.pihakKetigaTipe,
          totalHutang: 0,
          totalDibayar: 0,
          sisaHutang: 0,
          jumlahTransaksi: 0,
          hutangs: [],
        };
      }
      acc[key].totalHutang += h.totalNilai;
      acc[key].totalDibayar += h.totalDibayar;
      acc[key].sisaHutang += h.sisaHutang;
      acc[key].jumlahTransaksi += 1;
      acc[key].hutangs.push(h);
      return acc;
    }, {} as Record<string, {
      pihakKetigaId: string | null;
      pihakKetigaNama: string;
      pihakKetigaTipe: string | null;
      totalHutang: number;
      totalDibayar: number;
      sisaHutang: number;
      jumlahTransaksi: number;
      hutangs: typeof hutangs;
    }>);

    return Object.values(grouped);
  },
};
