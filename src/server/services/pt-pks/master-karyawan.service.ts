import { db } from "@/server/db";
import {
  masterKaryawanRepository,
  type CreateMasterKaryawanInput,
  type UpdateMasterKaryawanInput,
  type MasterKaryawanQueryInput,
} from "@/server/repositories/master-karyawan.repository";
import { penggajianRepository } from "@/server/repositories/penggajian.repository";
import type { CreatePenggajianInput } from "@/server/schema/penggajian";

export class MasterKaryawanService {
  /**
   * Get all master karyawan with pagination and filters
   */
  async getMasterKaryawan(query?: MasterKaryawanQueryInput) {
    return masterKaryawanRepository.findAll(query);
  }

  /**
   * Get master karyawan by id
   */
  async getMasterKaryawanById(id: string) {
    const karyawan = await masterKaryawanRepository.findById(id);
    if (!karyawan) {
      throw new Error("Data karyawan tidak ditemukan");
    }
    return karyawan;
  }

  /**
   * Get distinct devisi list
   */
  async getDevisiList() {
    return masterKaryawanRepository.getDistinctDevisi();
  }

  /**
   * Create new master karyawan
   */
  async createMasterKaryawan(data: CreateMasterKaryawanInput) {
    // Check if karyawan with same name exists
    const existing = await masterKaryawanRepository.findByName(data.namaKaryawan);
    if (existing) {
      throw new Error(`Karyawan dengan nama "${data.namaKaryawan}" sudah ada`);
    }
    return masterKaryawanRepository.create(data);
  }

  /**
   * Update master karyawan
   */
  async updateMasterKaryawan(id: string, data: UpdateMasterKaryawanInput) {
    const existing = await masterKaryawanRepository.findById(id);
    if (!existing) {
      throw new Error("Data karyawan tidak ditemukan");
    }

    // Check for duplicate name if name is being updated
    if (data.namaKaryawan && data.namaKaryawan !== existing.namaKaryawan) {
      const duplicate = await masterKaryawanRepository.findByName(data.namaKaryawan);
      if (duplicate) {
        throw new Error(`Karyawan dengan nama "${data.namaKaryawan}" sudah ada`);
      }
    }

    return masterKaryawanRepository.update(id, data);
  }

  /**
   * Delete master karyawan
   */
  async deleteMasterKaryawan(id: string) {
    const existing = await masterKaryawanRepository.findById(id);
    if (!existing) {
      throw new Error("Data karyawan tidak ditemukan");
    }
    return masterKaryawanRepository.delete(id);
  }

  /**
   * Sync master karyawan from existing penggajian data
   * This creates master data from penggajian records for existing employees
   */
  async syncFromPenggajian(periodeBulan: number, periodeTahun: number) {
    // Get all penggajian for the specified period
    const penggajianData = await db.penggajianKaryawan.findMany({
      where: {
        periodeBulan,
        periodeTahun,
      },
    });

    const synced: CreateMasterKaryawanInput[] = [];
    const skipped: string[] = [];

    for (const pg of penggajianData) {
      // Check if master already exists
      const existing = await masterKaryawanRepository.findByName(pg.namaKaryawan);
      if (existing) {
        skipped.push(pg.namaKaryawan);
        continue;
      }

      // Create master data
      const masterData: CreateMasterKaryawanInput = {
        namaKaryawan: pg.namaKaryawan,
        tktk: pg.tktk,
        gol: pg.gol,
        nomorRekening: pg.nomorRekening,
        devisi: pg.devisi,
        noBpjsTk: pg.noBpjsTk,
        noBpjsKesehatan: pg.noBpjsKesehatan,
        jabatan: pg.jabatan,
        gajiPokok: Number(pg.gajiPokok),
        tunjanganJabatan: Number(pg.tunjanganJabatan),
        tunjanganPerumahan: Number(pg.tunjanganPerumahan),
        isActive: true,
      };

      synced.push(masterData);
    }

    // Bulk create
    if (synced.length > 0) {
      await masterKaryawanRepository.createMany(synced);
    }

    return {
      synced: synced.length,
      skipped: skipped.length,
      skippedNames: skipped,
    };
  }

  /**
   * Generate penggajian for next period from master data
   */
  async generatePenggajian(periodeBulan: number, periodeTahun: number) {
    // Check if data already exists for this period
    const existing = await db.penggajianKaryawan.findFirst({
      where: { periodeBulan, periodeTahun },
    });

    if (existing) {
      throw new Error(
        `Data penggajian untuk periode ${periodeBulan}/${periodeTahun} sudah ada. Hapus terlebih dahulu jika ingin generate ulang.`
      );
    }

    // Get all active employees
    const karyawanList = await masterKaryawanRepository.getActiveKaryawan();
    if (karyawanList.length === 0) {
      throw new Error(
        "Tidak ada data master karyawan aktif. Silakan sinkronisasi dari data penggajian sebelumnya atau tambah data master karyawan terlebih dahulu."
      );
    }

    // Create penggajian entries with default values
    type MasterKaryawanType = Awaited<ReturnType<typeof masterKaryawanRepository.getActiveKaryawan>>[0];
    const penggajianData: CreatePenggajianInput[] = karyawanList.map((k: MasterKaryawanType, index: number) => ({
      periodeBulan,
      periodeTahun,
      masterKaryawanId: k.id,
      no: index + 1,
      namaKaryawan: k.namaKaryawan,
      tktk: k.tktk,
      gol: k.gol,
      nomorRekening: k.nomorRekening,
      devisi: k.devisi,
      noBpjsTk: k.noBpjsTk,
      noBpjsKesehatan: k.noBpjsKesehatan,
      jabatan: k.jabatan,
      tanggalKerja: null,
      lemburDetail: null,
      // Default lembur totals
      totalMenit: 0,
      totalMenitDibayar: 0,
      // Default HK values - to be filled by user
      hk: 0,
      liburDibayar: 0,
      hkTidakDibayar: 0,
      hkDibayar: 0,
      lemburHari: 0,
      // Salary from master
      gajiPokok: Number(k.gajiPokok),
      tunjanganJabatan: Number(k.tunjanganJabatan),
      tunjanganPerumahan: Number(k.tunjanganPerumahan),
      // Calculated values - default to 0
      overtime: 0,
      totalSebelumPotongan: 0,
      potKehadiran: 0,
      potBpjsTkJht: 0,
      potBpjsTkJn: 0,
      potBpjsKesehatan: 0,
      potPph21: 0,
      totalPotongan: 0,
      upahDiterima: 0,
    }));

    // Bulk create
    const result = await penggajianRepository.createMany(penggajianData);

    return {
      generated: result.count,
      period: `${periodeBulan}/${periodeTahun}`,
    };
  }

  /**
   * Calculate salary for a penggajian record based on HK inputs
   * Updated to use new overtime calculation: (gajiPokok / 173) * (totalMenitDibayar / 60)
   */
  calculateSalary(penggajian: {
    gajiPokok: number;
    tunjanganJabatan: number;
    tunjanganPerumahan: number;
    hkDibayar: number;
    hkTidakDibayar: number;
    lemburHari: number;
    hk: number;
    totalMenitDibayar?: number;
    pctBpjsTkJht?: number;
    pctBpjsTkJn?: number;
    pctBpjsKesehatan?: number;
  }) {
    const {
      gajiPokok,
      tunjanganJabatan,
      tunjanganPerumahan,
      hkDibayar,
      hkTidakDibayar,
      lemburHari,
      hk,
      totalMenitDibayar = 0,
      pctBpjsTkJht = 2,
      pctBpjsTkJn = 1,
      pctBpjsKesehatan = 1,
    } = penggajian;

    // Standard working days in a month (assume 26 or use hkDibayar + hkTidakDibayar if provided)
    const standardHK = 26;

    // Calculate daily rate
    const dailyRate = hk > 0 ? gajiPokok / hk : gajiPokok / standardHK;

    // Calculate overtime using new formula: (gajiPokok / 173) * (totalMenitDibayar / 60)
    // If totalMenitDibayar is provided, use new formula, otherwise use legacy formula
    let overtime: number;
    if (totalMenitDibayar > 0) {
      const hourlyRate = gajiPokok / 173;
      const overtimeHours = totalMenitDibayar / 60;
      overtime = Math.round(hourlyRate * overtimeHours);
    } else {
      // Legacy calculation (1.5x daily rate per overtime day)
      const overtimeRate = dailyRate * 1.5;
      overtime = Math.round(lemburHari * overtimeRate);
    }

    // Total before deductions
    const totalSebelumPotongan =
      gajiPokok + tunjanganJabatan + tunjanganPerumahan + overtime;

    // Deductions
    const potKehadiran = hkTidakDibayar > 0 ? Math.round(hkTidakDibayar * dailyRate) : 0;
    const potBpjsTkJht = Math.round((gajiPokok * pctBpjsTkJht) / 100);
    const potBpjsTkJn = Math.round((gajiPokok * pctBpjsTkJn) / 100);
    const potBpjsKesehatan = Math.round((gajiPokok * pctBpjsKesehatan) / 100);
    const potPph21 = 0; // PPH21 requires more complex calculation

    const totalPotongan =
      potKehadiran + potBpjsTkJht + potBpjsTkJn + potBpjsKesehatan + potPph21;

    const upahDiterima = totalSebelumPotongan - totalPotongan;

    return {
      overtime,
      totalSebelumPotongan,
      potKehadiran,
      potBpjsTkJht,
      potBpjsTkJn,
      potBpjsKesehatan,
      potPph21,
      totalPotongan,
      upahDiterima,
    };
  }

  /**
   * Update penggajian with HK data and recalculate salary
   * Updated to include lemburDetail, totalMenit, totalMenitDibayar
   */
  async updatePenggajianWithHK(
    id: string,
    data: {
      hk: number;
      liburDibayar: number;
      hkTidakDibayar: number;
      hkDibayar: number;
      lemburHari: number;
      tanggalKerja?: Record<string, string> | null;
      lemburDetail?: Record<string, { x15: number; x2: number; x3: number; x4: number }> | null;
      totalMenit?: number;
      totalMenitDibayar?: number;
    }
  ) {
    // Get existing penggajian
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await db.penggajianKaryawan.findUnique({ where: { id } }) as any;
    if (!existing) {
      throw new Error("Data penggajian tidak ditemukan");
    }

    // Get master karyawan for BPJS percentages if available
    let pctBpjsTkJht = 2;
    let pctBpjsTkJn = 1;
    let pctBpjsKesehatan = 1;

    if (existing.masterKaryawanId) {
      const master = await masterKaryawanRepository.findById(existing.masterKaryawanId);
      if (master) {
        pctBpjsTkJht = Number(master.pctBpjsTkJht);
        pctBpjsTkJn = Number(master.pctBpjsTkJn);
        pctBpjsKesehatan = Number(master.pctBpjsKesehatan);
      }
    }

    // Calculate salary with new overtime formula
    const calculated = this.calculateSalary({
      gajiPokok: Number(existing.gajiPokok),
      tunjanganJabatan: Number(existing.tunjanganJabatan),
      tunjanganPerumahan: Number(existing.tunjanganPerumahan),
      hkDibayar: data.hkDibayar,
      hkTidakDibayar: data.hkTidakDibayar,
      lemburHari: data.lemburHari,
      hk: data.hk,
      totalMenitDibayar: data.totalMenitDibayar || 0,
      pctBpjsTkJht,
      pctBpjsTkJn,
      pctBpjsKesehatan,
    });

    // Update penggajian
    return db.penggajianKaryawan.update({
      where: { id },
      data: {
        hk: data.hk,
        liburDibayar: data.liburDibayar,
        hkTidakDibayar: data.hkTidakDibayar,
        hkDibayar: data.hkDibayar,
        lemburHari: data.lemburHari,
        tanggalKerja: data.tanggalKerja ?? undefined,
        lemburDetail: data.lemburDetail ?? undefined,
        totalMenit: data.totalMenit ?? 0,
        totalMenitDibayar: data.totalMenitDibayar ?? 0,
        overtime: calculated.overtime,
        totalSebelumPotongan: calculated.totalSebelumPotongan,
        potKehadiran: calculated.potKehadiran,
        potBpjsTkJht: calculated.potBpjsTkJht,
        potBpjsTkJn: calculated.potBpjsTkJn,
        potBpjsKesehatan: calculated.potBpjsKesehatan,
        potPph21: calculated.potPph21,
        totalPotongan: calculated.totalPotongan,
        upahDiterima: calculated.upahDiterima,
      },
    });
  }
}

export const masterKaryawanService = new MasterKaryawanService();
