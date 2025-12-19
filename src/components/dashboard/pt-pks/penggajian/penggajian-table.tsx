"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Download, Trash2, Users, DollarSign, TrendingDown } from "lucide-react";
import { ImportPenggajianDialog } from "./import-penggajian-dialog";
import { GeneratePenggajianDialog } from "./generate-penggajian-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

// Type sesuai dengan mapping Excel yang baru
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
  tanggalKerja: Record<string, string> | null;
  // Hari Kerja Section
  hk: number;
  liburDibayar: number;
  hkTidakDibayar: number;
  hkDibayar: number;
  lemburHari: number; // float
  // Gaji & Tunjangan
  gajiPokok: number;
  tunjanganJabatan: number;
  tunjanganPerumahan: number;
  // Overtime
  overtime: number;
  // Total sebelum potongan
  totalSebelumPotongan: number;
  // Potongan
  potKehadiran: number;
  potBpjsTkJht: number;
  potBpjsTkJn: number;
  potBpjsKesehatan: number;
  potPph21: number;
  // Total Potongan
  totalPotongan: number;
  // Upah Diterima
  upahDiterima: number;
  createdAt: string;
};

type Summary = {
  totalKaryawan: number;
  totalGajiPokok: number;
  totalTunjanganJabatan: number;
  totalTunjanganPerumahan: number;
  totalOvertime: number;
  totalSebelumPotongan: number;
  totalPotKehadiran: number;
  totalPotBpjsTkJht: number;
  totalPotBpjsTkJn: number;
  totalPotBpjsKesehatan: number;
  totalPotPph21: number;
  totalPotongan: number;
  totalUpahDiterima: number;
};

const bulanOptions = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const currentYear = new Date().getFullYear();
const tahunOptions = Array.from({ length: 7 }, (_, i) => ({
  value: String(currentYear - 5 + i),
  label: String(currentYear - 5 + i),
}));

// Attendance status colors
const getAttendanceColor = (status: string) => {
  const upperStatus = status?.toUpperCase() || '';
  switch (upperStatus) {
    case 'H':
    case 'P':
    case '√':
    case '1':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'SC':
    case 'S':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'OFF':
    case 'L':
    case 'C':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'A':
    case 'M':
    case 'MK':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'PC':
    case 'CL':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID").format(value);
};

export function PenggajianTable() {
  const router = useRouter();
  const [data, setData] = useState<PenggajianKaryawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [devisiFilter, setDevisiFilter] = useState("all");
  const [periodeBulan, setPeriodeBulan] = useState<string>("");
  const [periodeTahun, setPeriodeTahun] = useState<string>("");
  const [devisiList, setDevisiList] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (devisiFilter && devisiFilter !== "all") params.append("devisi", devisiFilter);
      if (periodeBulan) params.append("periodeBulan", periodeBulan);
      if (periodeTahun) params.append("periodeTahun", periodeTahun);
      params.append("page", page.toString());
      params.append("limit", "100");

      const [dataResponse, summaryResponse] = await Promise.all([
        fetch(`/api/pt-pks/penggajian?${params.toString()}`),
        fetch(`/api/pt-pks/penggajian?summary=true&${params.toString()}`),
      ]);

      if (!dataResponse.ok) throw new Error("Failed to fetch data");
      if (!summaryResponse.ok) throw new Error("Failed to fetch summary");

      const dataResult = await dataResponse.json();
      const summaryResult = await summaryResponse.json();

      setData(dataResult.data || []);
      setTotalPages(dataResult.pagination?.totalPages || 1);
      setSummary(summaryResult.summary || null);
    } catch (error) {
      console.error("Error fetching penggajian:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch devisi list
  const fetchDevisiList = async () => {
    try {
      const response = await fetch("/api/pt-pks/penggajian?devisiList=true");
      if (!response.ok) throw new Error("Failed to fetch devisi list");
      const result = await response.json();
      setDevisiList(result.devisi || []);
    } catch (error) {
      console.error("Error fetching devisi list:", error);
    }
  };

  useEffect(() => {
    fetchDevisiList();
  }, []);

  useEffect(() => {
    fetchData();
  }, [searchTerm, devisiFilter, periodeBulan, periodeTahun, page]);

  // Group data by devisi
  const groupedData = useMemo(() => {
    const groups: Record<string, PenggajianKaryawan[]> = {};
    data.forEach((item) => {
      const devisi = item.devisi || "Lainnya";
      if (!groups[devisi]) {
        groups[devisi] = [];
      }
      groups[devisi].push(item);
    });
    return groups;
  }, [data]);

  // Handle delete by periode
  const handleDeletePeriode = async () => {
    if (!periodeBulan || !periodeTahun) return;

    try {
      const response = await fetch(
        `/api/pt-pks/penggajian?periodeBulan=${periodeBulan}&periodeTahun=${periodeTahun}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete");
      }

      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting penggajian:", error);
    }
  };

  // Handle export
  const handleExport = () => {
    const params = new URLSearchParams();
    if (periodeBulan) params.append("periodeBulan", periodeBulan);
    if (periodeTahun) params.append("periodeTahun", periodeTahun);

    window.open(`/api/pt-pks/penggajian/export?${params.toString()}`, "_blank");
  };

  // Get bulan label
  const getBulanLabel = (bulan: number) => {
    const option = bulanOptions.find((o) => o.value === String(bulan));
    return option?.label || String(bulan);
  };

  // Handle click on karyawan name - navigate to detail page
  const handleKaryawanClick = (karyawan: PenggajianKaryawan) => {
    router.push(`/dashboard/pt-pks/payroll/penggajian/${karyawan.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalKaryawan}</div>
              <p className="text-xs text-muted-foreground">karyawan terdaftar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gaji</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {formatCurrency(Number(summary.totalSebelumPotongan))}
              </div>
              <p className="text-xs text-muted-foreground">total sebelum potongan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Upah Diterima</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rp {formatCurrency(Number(summary.totalUpahDiterima))}
              </div>
              <p className="text-xs text-muted-foreground">
                upah diterima karyawan
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={devisiFilter} onValueChange={setDevisiFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Divisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Divisi</SelectItem>
            {devisiList.map((devisi) => (
              <SelectItem key={devisi} value={devisi}>
                {devisi}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodeBulan} onValueChange={setPeriodeBulan}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Bulan" />
          </SelectTrigger>
          <SelectContent>
            {bulanOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodeTahun} onValueChange={setPeriodeTahun}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Tahun" />
          </SelectTrigger>
          <SelectContent>
            {tahunOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <GeneratePenggajianDialog onSuccess={fetchData} />
        <ImportPenggajianDialog onSuccess={fetchData} />
        <Button variant="outline" onClick={handleExport} disabled={data.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        {periodeBulan && periodeTahun && data.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Periode
          </Button>
        )}
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Belum ada data penggajian. Silakan import dari file Excel.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="w-full">
            <div className="min-w-[2000px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 w-[50px]">NO</TableHead>
                    <TableHead className="sticky left-[50px] bg-background z-10 min-w-[180px]">NAMA KARYAWAN</TableHead>
                    <TableHead className="min-w-[60px]">TK/K</TableHead>
                    <TableHead className="min-w-[60px]">GOL</TableHead>
                    <TableHead className="min-w-[130px]">NOMOR REKENING</TableHead>
                    <TableHead className="min-w-[120px]">DEVISI</TableHead>
                    <TableHead className="min-w-[120px]">NO BPJS TK</TableHead>
                    <TableHead className="min-w-[120px]">NO BPJS KES</TableHead>
                    <TableHead className="min-w-[120px]">JABATAN</TableHead>
                    {/* Tanggal Kerja (1-31) */}
                    {Array.from({ length: 31 }, (_, i) => (
                      <TableHead key={i + 1} className="w-[35px] text-center px-1">
                        {i + 1}
                      </TableHead>
                    ))}
                    {/* Hari Kerja Section */}
                    <TableHead className="min-w-[50px] text-center">HK</TableHead>
                    <TableHead className="min-w-[80px] text-center">LIBUR DIBAYAR</TableHead>
                    <TableHead className="min-w-[80px] text-center">HK TDK DIBAYAR</TableHead>
                    <TableHead className="min-w-[80px] text-center">HK DIBAYAR</TableHead>
                    <TableHead className="min-w-[60px] text-center">LEMBUR</TableHead>
                    {/* Gaji & Tunjangan */}
                    <TableHead className="min-w-[100px] text-right">GAJI POKOK</TableHead>
                    <TableHead className="min-w-[100px] text-right">TUNJ. JABATAN</TableHead>
                    <TableHead className="min-w-[100px] text-right">TUNJ. PERUMAHAN</TableHead>
                    {/* Overtime */}
                    <TableHead className="min-w-[100px] text-right">OVERTIME</TableHead>
                    {/* Total Sebelum Potongan */}
                    <TableHead className="min-w-[120px] text-right">TOTAL</TableHead>
                    {/* Potongan */}
                    <TableHead className="min-w-[100px] text-right">POT KEHADIRAN</TableHead>
                    <TableHead className="min-w-[100px] text-right">POT BPJS TK JHT</TableHead>
                    <TableHead className="min-w-[100px] text-right">POT BPJS TK JN</TableHead>
                    <TableHead className="min-w-[100px] text-right">POT BPJS KES</TableHead>
                    <TableHead className="min-w-[100px] text-right">POT PPH 21</TableHead>
                    {/* Total Potongan */}
                    <TableHead className="min-w-[120px] text-right">TOTAL POT</TableHead>
                    {/* Upah Diterima */}
                    <TableHead className="min-w-[130px] text-right">UPAH DITERIMA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const devisiNames = Object.keys(groupedData);
                    const lainnyaIdx = devisiNames.indexOf("Lainnya");
                    const devisiToShow = lainnyaIdx >= 0 ? devisiNames.slice(0, lainnyaIdx) : devisiNames;
                    let globalNo = 1; // Mulai dari 1 untuk seluruh tabel
                    return devisiToShow.map((devisi) => {
                      const items = groupedData[devisi] ?? [];
                      return (
                        <React.Fragment key={devisi}>
                          {/* Devisi Header */}
                          <TableRow key={`header-${devisi}`} className="bg-muted/50">
                            <TableCell
                              colSpan={56}
                              className="font-semibold sticky left-0 bg-muted/50"
                            >
                              {devisi}
                            </TableCell>
                          </TableRow>
                          {/* Data Rows */}
                          {items.map((item) => (
                            <TableRow key={item.id} className="hover:bg-muted/30">
                              <TableCell className="sticky left-0 bg-background">
                                {globalNo++}
                              </TableCell>
                              <TableCell 
                                className="sticky left-[50px] bg-background font-medium cursor-pointer hover:text-primary hover:underline"
                                onClick={() => handleKaryawanClick(item)}
                              >
                                {item.namaKaryawan}
                              </TableCell>
                              <TableCell className="text-xs">
                                {item.tktk || '-'}
                              </TableCell>
                              <TableCell>
                                {item.gol && (
                                  <Badge variant="outline">{item.gol}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {item.nomorRekening || '-'}
                              </TableCell>
                              <TableCell>{item.devisi}</TableCell>
                              <TableCell className="font-mono text-xs">{item.noBpjsTk || '-'}</TableCell>
                              <TableCell className="font-mono text-xs">{item.noBpjsKesehatan || '-'}</TableCell>
                              <TableCell>{item.jabatan}</TableCell>
                              {/* Attendance cells */}
                              {Array.from({ length: 31 }, (_, i) => {
                                const day = String(i + 1);
                                const status = item.tanggalKerja?.[day] || '';
                                return (
                                  <TableCell
                                    key={i + 1}
                                    className={`text-center px-1 py-1 text-xs ${getAttendanceColor(status)}`}
                                  >
                                    {status || '-'}
                                  </TableCell>
                                );
                              })}
                              {/* Hari Kerja Section */}
                              <TableCell className="text-center font-medium">
                                {item.hk}
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs">
                                {item.liburDibayar}
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs">
                                {item.hkTidakDibayar}
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs">
                                {item.hkDibayar}
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs">
                                {item.lemburHari}
                              </TableCell>
                              {/* Gaji & Tunjangan */}
                              <TableCell className="text-right font-mono text-xs">
                                {formatCurrency(Number(item.gajiPokok))}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs">
                                {formatCurrency(Number(item.tunjanganJabatan))}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs">
                                {formatCurrency(Number(item.tunjanganPerumahan))}
                              </TableCell>
                              {/* Overtime */}
                              <TableCell className="text-right font-mono text-xs">
                                {formatCurrency(Number(item.overtime))}
                              </TableCell>
                              {/* Total Sebelum Potongan */}
                              <TableCell className="text-right font-mono text-xs font-medium">
                                {formatCurrency(Number(item.totalSebelumPotongan))}
                              </TableCell>
                              {/* Potongan */}
                              <TableCell className="text-right font-mono text-xs text-red-600">
                                {Number(item.potKehadiran) > 0 ? `-${formatCurrency(Number(item.potKehadiran))}` : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-red-600">
                                {Number(item.potBpjsTkJht) > 0 ? `-${formatCurrency(Number(item.potBpjsTkJht))}` : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-red-600">
                                {Number(item.potBpjsTkJn) > 0 ? `-${formatCurrency(Number(item.potBpjsTkJn))}` : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-red-600">
                                {Number(item.potBpjsKesehatan) > 0 ? `-${formatCurrency(Number(item.potBpjsKesehatan))}` : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-red-600">
                                {Number(item.potPph21) > 0 ? `-${formatCurrency(Number(item.potPph21))}` : '-'}
                              </TableCell>
                              {/* Total Potongan */}
                              <TableCell className="text-right font-mono text-xs text-red-600">
                                {Number(item.totalPotongan) > 0 ? `-${formatCurrency(Number(item.totalPotongan))}` : '-'}
                              </TableCell>
                              {/* Upah Diterima */}
                              <TableCell className="text-right font-mono text-xs font-bold text-green-600">
                                {formatCurrency(Number(item.upahDiterima))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Penggajian</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus semua data penggajian untuk periode{" "}
              {periodeBulan && getBulanLabel(parseInt(periodeBulan))} {periodeTahun}?
              <br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePeriode}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
