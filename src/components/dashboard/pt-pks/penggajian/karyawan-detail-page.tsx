"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Save, Loader2, User, Calendar, Clock, DollarSign } from "lucide-react";
import { AttendanceCalendar } from "./attendance-calendar";
import { ATTENDANCE_CATEGORIES } from "@/server/schema/penggajian";

// Types
type LemburDetailItem = {
  x15: number;
  x2: number;
  x3: number;
  x4: number;
};

type LemburDetail = Record<string, LemburDetailItem | undefined>;
type TanggalKerja = Record<string, string | undefined>;

type PenggajianKaryawan = {
  id: string;
  periodeBulan: number;
  periodeTahun: number;
  no: number | null;
  namaKaryawan: string;
  tktk: string | null;
  gol: string | null;
  nomorRekening: string | null;
  devisi: string | null;
  noBpjsTk: string | null;
  noBpjsKesehatan: string | null;
  jabatan: string | null;
  tanggalKerja: TanggalKerja | null;
  lemburDetail: LemburDetail | null;
  totalMenit: number;
  totalMenitDibayar: number;
  hk: number;
  liburDibayar: number;
  hkTidakDibayar: number;
  hkDibayar: number;
  lemburHari: number;
  gajiPokok: number;
  tunjanganJabatan: number;
  tunjanganPerumahan: number;
  overtime: number;
  totalSebelumPotongan: number;
  potKehadiran: number;
  potBpjsTkJht: number;
  potBpjsTkJn: number;
  potBpjsKesehatan: number;
  potPph21: number;
  totalPotongan: number;
  upahDiterima: number;
};

type KaryawanDetailPageProps = {
  penggajianId: string;
  initialData: PenggajianKaryawan;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID").format(value);
};

// Calculate attendance statistics from tanggalKerja
const calculateAttendanceStats = (tanggalKerja: TanggalKerja | null) => {
  let hk = 0;
  let liburDibayar = 0;
  let hkTidakDibayar = 0;
  let hkDibayar = 0;

  if (!tanggalKerja) return { hk, liburDibayar, hkTidakDibayar, hkDibayar };

  Object.values(tanggalKerja).forEach((status) => {
    if (!status) return;
    
    const category = ATTENDANCE_CATEGORIES.find((c) => c.code === status);
    if (category) {
      if (category.countAsHK) hk++;
      if (category.countAsLiburDibayar) liburDibayar++;
      if (category.countAsHKTidakDibayar) hkTidakDibayar++;
    }
  });

  // HK Dibayar = HK + Libur Dibayar
  hkDibayar = hk + liburDibayar;

  return { hk, liburDibayar, hkTidakDibayar, hkDibayar };
};

// Calculate lembur totals
const calculateLemburTotals = (lemburDetail: LemburDetail | null) => {
  let totalMenit = 0;
  let totalMenitDibayar = 0;

  if (!lemburDetail) return { totalMenit, totalMenitDibayar };

  Object.values(lemburDetail).forEach((item) => {
    if (!item) return;
    
    const menitX15 = item.x15 || 0;
    const menitX2 = item.x2 || 0;
    const menitX3 = item.x3 || 0;
    const menitX4 = item.x4 || 0;

    totalMenit += menitX15 + menitX2 + menitX3 + menitX4;
    totalMenitDibayar += (menitX15 * 1.5) + (menitX2 * 2) + (menitX3 * 3) + (menitX4 * 4);
  });

  return { totalMenit, totalMenitDibayar: Math.round(totalMenitDibayar) };
};

// Calculate overtime amount: (gajiPokok / 173) * totalMenitDibayar / 60
const calculateOvertime = (gajiPokok: number, totalMenitDibayar: number) => {
  const hourlyRate = gajiPokok / 173;
  const overtimeHours = totalMenitDibayar / 60;
  return Math.round(hourlyRate * overtimeHours);
};

export function KaryawanDetailPage({ penggajianId, initialData }: KaryawanDetailPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PenggajianKaryawan>(initialData);
  
  // Attendance and lembur state
  const [tanggalKerja, setTanggalKerja] = useState<TanggalKerja>(
    (initialData.tanggalKerja as TanggalKerja) || {}
  );
  const [lemburDetail, setLemburDetail] = useState<LemburDetail>(
    (initialData.lemburDetail as LemburDetail) || {}
  );

  // Calculated values
  const attendanceStats = useMemo(() => calculateAttendanceStats(tanggalKerja), [tanggalKerja]);
  const lemburTotals = useMemo(() => calculateLemburTotals(lemburDetail), [lemburDetail]);
  const overtime = useMemo(() => calculateOvertime(Number(data.gajiPokok), lemburTotals.totalMenitDibayar), [data.gajiPokok, lemburTotals.totalMenitDibayar]);

  // Calculated salary preview
  const calculatedSalary = useMemo(() => {
    const gajiPokok = Number(data.gajiPokok);
    const tunjanganJabatan = Number(data.tunjanganJabatan);
    const tunjanganPerumahan = Number(data.tunjanganPerumahan);
    
    const totalSebelumPotongan = gajiPokok + tunjanganJabatan + tunjanganPerumahan + overtime;

    // Calculate deductions
    const standardHK = 26;
    const dailyRate = attendanceStats.hk > 0 ? gajiPokok / attendanceStats.hk : gajiPokok / standardHK;
    const potKehadiran = attendanceStats.hkTidakDibayar > 0 ? Math.round(attendanceStats.hkTidakDibayar * dailyRate) : 0;
    const potBpjsTkJht = Math.round((gajiPokok * 2) / 100);
    const potBpjsTkJn = Math.round((gajiPokok * 1) / 100);
    const potBpjsKesehatan = Math.round((gajiPokok * 1) / 100);
    const potPph21 = 0;

    const totalPotongan = potKehadiran + potBpjsTkJht + potBpjsTkJn + potBpjsKesehatan + potPph21;
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
  }, [data.gajiPokok, data.tunjanganJabatan, data.tunjanganPerumahan, overtime, attendanceStats]);

  // Handle attendance change
  const handleAttendanceChange = useCallback((day: string, status: string | null) => {
    setTanggalKerja((prev) => {
      const newData = { ...prev };
      if (status === null) {
        delete newData[day];
      } else {
        newData[day] = status;
      }
      return newData;
    });
  }, []);

  // Handle lembur change
  const handleLemburChange = useCallback((day: string, lembur: LemburDetailItem | null) => {
    setLemburDetail((prev) => {
      const newData = { ...prev };
      if (lembur === null || (lembur.x15 === 0 && lembur.x2 === 0 && lembur.x3 === 0 && lembur.x4 === 0)) {
        delete newData[day];
      } else {
        newData[day] = lembur;
      }
      return newData;
    });
  }, []);

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/pt-pks/penggajian/${penggajianId}/hk`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hk: attendanceStats.hk,
          liburDibayar: attendanceStats.liburDibayar,
          hkTidakDibayar: attendanceStats.hkTidakDibayar,
          hkDibayar: attendanceStats.hkDibayar,
          lemburHari: lemburTotals.totalMenit / 60, // Convert minutes to hours for backward compatibility
          tanggalKerja,
          lemburDetail,
          totalMenit: lemburTotals.totalMenit,
          totalMenitDibayar: lemburTotals.totalMenitDibayar,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menyimpan data");
      }

      // Refresh data
      const refreshResponse = await fetch(`/api/pt-pks/penggajian/${penggajianId}`);
      if (refreshResponse.ok) {
        const result = await refreshResponse.json();
        setData(result.penggajian);
      }

      alert("Data berhasil disimpan");
    } catch (error) {
      console.error("Error saving:", error);
      alert(error instanceof Error ? error.message : "Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  // Get number of days in the month
  const daysInMonth = new Date(data.periodeTahun, data.periodeBulan, 0).getDate();

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard/pt-pks/payroll/penggajian")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Simpan Perubahan
        </Button>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Karyawan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">TK/K:</span>{" "}
              <span className="font-medium">{data.tktk || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Golongan:</span>{" "}
              {data.gol ? <Badge variant="outline">{data.gol}</Badge> : "-"}
            </div>
            <div>
              <span className="text-muted-foreground">No. Rekening:</span>{" "}
              <span className="font-medium font-mono">{data.nomorRekening || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Gaji Pokok:</span>{" "}
              <span className="font-medium">Rp {formatCurrency(Number(data.gajiPokok))}</span>
            </div>
            <div>
              <span className="text-muted-foreground">BPJS TK:</span>{" "}
              <span className="font-medium font-mono">{data.noBpjsTk || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">BPJS Kesehatan:</span>{" "}
              <span className="font-medium font-mono">{data.noBpjsKesehatan || "-"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tunj. Jabatan:</span>{" "}
              <span className="font-medium">Rp {formatCurrency(Number(data.tunjanganJabatan))}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tunj. Perumahan:</span>{" "}
              <span className="font-medium">Rp {formatCurrency(Number(data.tunjanganPerumahan))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kalender Kehadiran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar
            year={data.periodeTahun}
            month={data.periodeBulan}
            tanggalKerja={tanggalKerja}
            lemburDetail={lemburDetail}
            onAttendanceChange={handleAttendanceChange}
            onLemburChange={handleLemburChange}
          />
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{attendanceStats.hk}</div>
              <div className="text-xs text-muted-foreground">HK (Hari Kerja)</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{attendanceStats.liburDibayar}</div>
              <div className="text-xs text-muted-foreground">Libur Dibayar</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{attendanceStats.hkTidakDibayar}</div>
              <div className="text-xs text-muted-foreground">HK Tidak Dibayar</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{attendanceStats.hkDibayar}</div>
              <div className="text-xs text-muted-foreground">HK Dibayar</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{lemburTotals.totalMenitDibayar}</div>
              <div className="text-xs text-muted-foreground">Total Menit Lembur</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lembur Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ringkasan Lembur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jam Lembur (Menit)</TableHead>
                <TableHead className="text-center">x1.5</TableHead>
                <TableHead className="text-center">x2</TableHead>
                <TableHead className="text-center">x3</TableHead>
                <TableHead className="text-center">x4</TableHead>
                <TableHead className="text-center">Total Menit</TableHead>
                <TableHead className="text-center">Total Mnt Dibayar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-center">
                  {Object.values(lemburDetail).reduce((acc, item) => acc + (item?.x15 || 0), 0)}
                </TableCell>
                <TableCell className="text-center">
                  {Object.values(lemburDetail).reduce((acc, item) => acc + (item?.x2 || 0), 0)}
                </TableCell>
                <TableCell className="text-center">
                  {Object.values(lemburDetail).reduce((acc, item) => acc + (item?.x3 || 0), 0)}
                </TableCell>
                <TableCell className="text-center">
                  {Object.values(lemburDetail).reduce((acc, item) => acc + (item?.x4 || 0), 0)}
                </TableCell>
                <TableCell className="text-center font-semibold">{lemburTotals.totalMenit}</TableCell>
                <TableCell className="text-center font-semibold text-orange-600">{lemburTotals.totalMenitDibayar}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">
              Rumus Overtime: (Gaji Pokok / 173) × (Total Menit Dibayar / 60)
            </div>
            <div className="text-lg font-semibold">
              Overtime: <span className="text-orange-600">Rp {formatCurrency(overtime)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Preview Perhitungan Gaji
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2} className="text-center bg-muted">
                  Gaji & Tunjangan
                </TableHead>
                <TableHead colSpan={2} className="text-center bg-muted">
                  Potongan
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Gaji Pokok</TableCell>
                <TableCell className="text-right font-mono">
                  Rp {formatCurrency(Number(data.gajiPokok))}
                </TableCell>
                <TableCell className="font-medium">Pot. Kehadiran</TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {calculatedSalary.potKehadiran > 0 ? `-Rp ${formatCurrency(calculatedSalary.potKehadiran)}` : "-"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tunj. Jabatan</TableCell>
                <TableCell className="text-right font-mono">
                  Rp {formatCurrency(Number(data.tunjanganJabatan))}
                </TableCell>
                <TableCell className="font-medium">Pot. BPJS TK JHT</TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {calculatedSalary.potBpjsTkJht > 0 ? `-Rp ${formatCurrency(calculatedSalary.potBpjsTkJht)}` : "-"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tunj. Perumahan</TableCell>
                <TableCell className="text-right font-mono">
                  Rp {formatCurrency(Number(data.tunjanganPerumahan))}
                </TableCell>
                <TableCell className="font-medium">Pot. BPJS TK JN</TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {calculatedSalary.potBpjsTkJn > 0 ? `-Rp ${formatCurrency(calculatedSalary.potBpjsTkJn)}` : "-"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Overtime</TableCell>
                <TableCell className="text-right font-mono text-orange-600">
                  Rp {formatCurrency(calculatedSalary.overtime)}
                </TableCell>
                <TableCell className="font-medium">Pot. BPJS Kes</TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {calculatedSalary.potBpjsKesehatan > 0 ? `-Rp ${formatCurrency(calculatedSalary.potBpjsKesehatan)}` : "-"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell className="font-medium">Pot. PPH 21</TableCell>
                <TableCell className="text-right font-mono text-red-600">
                  {calculatedSalary.potPph21 > 0 ? `-Rp ${formatCurrency(calculatedSalary.potPph21)}` : "-"}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-semibold">Total Gaji</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  Rp {formatCurrency(calculatedSalary.totalSebelumPotongan)}
                </TableCell>
                <TableCell className="font-semibold">Total Potongan</TableCell>
                <TableCell className="text-right font-mono font-semibold text-red-600">
                  {calculatedSalary.totalPotongan > 0 ? `-Rp ${formatCurrency(calculatedSalary.totalPotongan)}` : "-"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Net Pay */}
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Upah Diterima</span>
              <span className="text-2xl font-bold text-green-600">
                Rp {formatCurrency(calculatedSalary.upahDiterima)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
