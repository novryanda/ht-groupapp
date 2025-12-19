import { penggajianRepository } from "@/server/repositories/penggajian.repository";
import {
  createPenggajianSchema,
  updatePenggajianSchema,
  type CreatePenggajianInput,
  type UpdatePenggajianInput,
  type PenggajianQueryInput,
} from "@/server/schema/penggajian";
import * as XLSX from "xlsx";

export class PenggajianService {
  /**
   * Get all penggajian with pagination and filters
   */
  async getPenggajian(query?: PenggajianQueryInput) {
    return penggajianRepository.findAll(query);
  }

  /**
   * Get penggajian by id
   */
  async getPenggajianById(id: string) {
    const penggajian = await penggajianRepository.findById(id);
    if (!penggajian) {
      throw new Error("Data penggajian tidak ditemukan");
    }
    return penggajian;
  }

  /**
   * Get distinct devisi list
   */
  async getDevisiList() {
    return penggajianRepository.getDistinctDevisi();
  }

  /**
   * Get distinct periode list
   */
  async getPeriodeList() {
    return penggajianRepository.getDistinctPeriode();
  }

  /**
   * Create new penggajian
   */
  async createPenggajian(data: CreatePenggajianInput) {
    const validatedData = createPenggajianSchema.parse(data);
    return penggajianRepository.create(validatedData);
  }

  /**
   * Update penggajian
   */
  async updatePenggajian(id: string, data: UpdatePenggajianInput) {
    const validatedData = updatePenggajianSchema.parse(data);

    const existing = await penggajianRepository.findById(id);
    if (!existing) {
      throw new Error("Data penggajian tidak ditemukan");
    }

    return penggajianRepository.update(id, validatedData);
  }

  /**
   * Delete penggajian
   */
  async deletePenggajian(id: string) {
    const existing = await penggajianRepository.findById(id);
    if (!existing) {
      throw new Error("Data penggajian tidak ditemukan");
    }

    return penggajianRepository.delete(id);
  }

  /**
   * Delete all penggajian by periode
   */
  async deletePenggajianByPeriode(periodeBulan: number, periodeTahun: number) {
    return penggajianRepository.deleteByPeriode(periodeBulan, periodeTahun);
  }

  /**
   * Get summary statistics
   */
  async getSummary(periodeBulan?: number, periodeTahun?: number) {
    return penggajianRepository.getSummary(periodeBulan, periodeTahun);
  }

  /**
   * Import penggajian from Excel buffer (flexible)
   * Matches exact Excel format from the image
   */
  async importFromExcelFlexible(
    buffer: Buffer,
    periodeBulan: number,
    periodeTahun: number,
    replaceExisting: boolean = false
  ) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("File Excel tidak memiliki sheet");
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error("Sheet tidak ditemukan");
    }

    // Get all data as 2D array
    const allData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: "",
    });

    if (allData.length < 3) {
      throw new Error("File Excel tidak memiliki data yang cukup");
    }

    // Delete existing data if replaceExisting is true
    if (replaceExisting) {
      await penggajianRepository.deleteByPeriode(periodeBulan, periodeTahun);
    }

    const penggajianData: CreatePenggajianInput[] = [];
    let currentDevisi = "";

    // Process each row
    for (let rowIndex = 0; rowIndex < allData.length; rowIndex++) {
      const row = allData[rowIndex] as unknown[];
      if (!row || row.length < 5) continue;

      const firstCell = String(row[0] || "").trim();
      
      // Check for section headers to get current devisi
      // e.g., "A. PROSES & SHIFT", "B. MAINTENANCE", etc.
      if (firstCell.match(/^[A-Z]\.\s*[A-Z]/)) {
        const match = firstCell.match(/^[A-Z]\.\s*(.+)/);
        if (match && match[1]) {
          currentDevisi = match[1].trim();
        }
        continue;
      }

      // Skip Grand Total and other summary rows
      if (firstCell.toLowerCase().includes('total') || 
          firstCell.toLowerCase().includes('grand')) {
        continue;
      }

      // Check if this is a data row (has employee name)
      const namaKaryawan = row[1];
      
      if (!namaKaryawan) continue;
      
      const namaStr = String(namaKaryawan).trim();
      if (namaStr === '' || namaStr.toLowerCase() === 'nama karyawan') continue;

      // Extract attendance for days 1-31 (columns start at index 9)
      const tanggalKerja: Record<string, string> = {};
      let hk = 0;
      
      const attendanceStartCol = 9; // Column J (0-indexed = 9)
      for (let day = 1; day <= 31; day++) {
        const colIndex = attendanceStartCol + day - 1;
        if (colIndex < row.length && row[colIndex] !== undefined && row[colIndex] !== '') {
          const status = String(row[colIndex]).trim().toUpperCase();
          if (status) {
            tanggalKerja[String(day)] = status;
            // Count as work day if marked as present
            if (['H', '√', '1', 'P'].includes(status)) {
              hk++;
            }
          }
        }
      }

      // Column mapping based on Excel structure:
      // A=0: NO, B=1: NAMA KARYAWAN, C=2: TK/K, D=3: GOL, E=4: NOMOR REKENING
      // F=5: DEVISI, G=6: NO BPJS TK, H=7: NO BPJS KESEHATAN, I=8: JABATAN
      // J-AN (9-39): TANGGAL KERJA 1-31
      // AO=40: HK (Hari Kerja)
      // AP=41: Libur Dibayar
      // AQ=42: HK Tidak Dibayar
      // AR=43: HK Dibayar
      // AS=44: Lembur (hari)
      // AT=45: Gaji Pokok (SALARY)
      // AU=46: Tunjangan Jabatan
      // AV=47: Tunjangan Perumahan
      // AW=48: Overtime
      // AX=49: Total (sebelum potongan)
      // AY=50: Potongan Kehadiran
      // AZ=51: Potongan BPJS TK JHT
      // BA=52: Potongan BPJS TK JN
      // BB=53: Potongan BPJS Kesehatan
      // BC=54: Potongan PPH 21
      // BD=55: Total Potongan
      // BE=56: Upah Diterima

      const penggajian: CreatePenggajianInput = {
        periodeBulan,
        periodeTahun,
        no: this.parseIntNumber(row[0]) || null,
        namaKaryawan: namaStr,
        tktk: row[2] ? String(row[2]).trim() : null,
        gol: row[3] ? String(row[3]).trim() : null,
        nomorRekening: row[4] ? String(row[4]).trim() : null,
        devisi: currentDevisi || (row[5] ? String(row[5]).trim() : null),
        noBpjsTk: row[6] ? String(row[6]).trim() : null,
        noBpjsKesehatan: row[7] ? String(row[7]).trim() : null,
        jabatan: row[8] ? String(row[8]).trim() : null,
        tanggalKerja,
        lemburDetail: null,
        totalMenit: 0,
        totalMenitDibayar: 0,
        hk: this.parseIntNumber(row[40]) || hk,
        liburDibayar: this.parseIntNumber(row[41]),
        hkTidakDibayar: this.parseIntNumber(row[42]),
        hkDibayar: this.parseIntNumber(row[43]),
        lemburHari: this.parseNumber(row[44]),
        gajiPokok: this.parseIntNumber(row[45]),
        tunjanganJabatan: this.parseIntNumber(row[46]),
        tunjanganPerumahan: this.parseIntNumber(row[47]),
        overtime: this.parseIntNumber(row[48]),
        totalSebelumPotongan: this.parseIntNumber(row[49]),
        potKehadiran: this.parseIntNumber(row[50]),
        potBpjsTkJht: this.parseIntNumber(row[51]),
        potBpjsTkJn: this.parseIntNumber(row[52]),
        potBpjsKesehatan: this.parseIntNumber(row[53]),
        potPph21: this.parseIntNumber(row[54]),
        totalPotongan: this.parseIntNumber(row[55]),
        upahDiterima: this.parseIntNumber(row[56]),
      };

      penggajianData.push(penggajian);
    }

    if (penggajianData.length === 0) {
      throw new Error("Tidak ada data yang dapat diimport dari file Excel");
    }

    // Bulk insert
    const result = await penggajianRepository.createMany(penggajianData);

    return {
      imported: result.count,
      total: penggajianData.length,
    };
  }

  /**
   * Helper to parse number from various Excel cell types
   */
  private parseNumber(value: unknown): number {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Helper to parse integer number (no decimals)
   */
  private parseIntNumber(value: unknown): number {
    return Math.round(this.parseNumber(value));
  }

  /**
   * Export penggajian to Excel format
   */
  async exportToExcel(periodeBulan?: number, periodeTahun?: number) {
    const query: PenggajianQueryInput = {
      limit: 10000,
      page: 1,
    };
    if (periodeBulan) query.periodeBulan = periodeBulan;
    if (periodeTahun) query.periodeTahun = periodeTahun;

    const result = await penggajianRepository.findAll(query);
    
    const workbook = XLSX.utils.book_new();
    
    type PenggajianItem = typeof result.data[number];
    const exportData = result.data.map((item: PenggajianItem, index: number) => ({
      'NO': item.no || index + 1,
      'NAMA KARYAWAN': item.namaKaryawan,
      'TK/K': item.tktk || '',
      'GOL': item.gol || '',
      'NOMOR REKENING': item.nomorRekening || '',
      'DEVISI': item.devisi || '',
      'NO BPJS TK': item.noBpjsTk || '',
      'NO BPJS KESEHATAN': item.noBpjsKesehatan || '',
      'JABATAN': item.jabatan || '',
      'HK': item.hk,
      'LIBUR DIBAYAR': item.liburDibayar,
      'HK TIDAK DIBAYAR': item.hkTidakDibayar,
      'HK DIBAYAR': item.hkDibayar,
        'LEMBUR (HARI)': Number(item.lemburHari),
      'GAJI POKOK': Number(item.gajiPokok),
      'TUNJANGAN JABATAN': Number(item.tunjanganJabatan),
      'TUNJANGAN PERUMAHAN': Number(item.tunjanganPerumahan),
      'OVERTIME': Number(item.overtime),
      'TOTAL': Number(item.totalSebelumPotongan),
      'POT KEHADIRAN': Number(item.potKehadiran),
      'POT BPJS TK JHT': Number(item.potBpjsTkJht),
      'POT BPJS TK JN': Number(item.potBpjsTkJn),
      'POT BPJS KESEHATAN': Number(item.potBpjsKesehatan),
      'POT PPH 21': Number(item.potPph21),
      'TOTAL POTONGAN': Number(item.totalPotongan),
      'UPAH DITERIMA': Number(item.upahDiterima),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penggajian');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const penggajianService = new PenggajianService();
