"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  CheckCircle,
  DollarSign,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

type Piutang = {
  id: string;
  tipeTransaksi: string;
  referensiNomor: string;
  tanggalTransaksi: string;
  tanggalJatuhTempo: string | null;
  buyerId: string | null;
  buyerNama: string;
  contractId: string | null;
  contractNumber: string | null;
  totalNilai: number;
  totalDiterima: number;
  sisaPiutang: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  keterangan: string | null;
  penerimaanPiutang: {
    id: string;
    tanggalTerima: string;
    jumlahTerima: number;
    metodePembayaran: string | null;
    nomorReferensi: string | null;
    diterimaOleh: string;
  }[];
};

type Summary = {
  totalPiutang: number;
  totalDiterima: number;
  sisaPiutang: number;
  jumlahUnpaid: number;
  jumlahPartial: number;
  jumlahPaid: number;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
    UNPAID: { label: "Belum Terima", variant: "destructive" },
    PARTIAL: { label: "Sebagian", variant: "secondary" },
    PAID: { label: "Lunas", variant: "default" },
  };
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function PiutangCustomerList() {
  const [data, setData] = useState<Piutang[]>([]);
  const [filteredData, setFilteredData] = useState<Piutang[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Receipt dialog
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [selectedPiutang, setSelectedPiutang] = useState<Piutang | null>(null);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptMethod, setReceiptMethod] = useState("");
  const [receiptRef, setReceiptRef] = useState("");
  const [processingReceipt, setProcessingReceipt] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSummary();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, filterStatus, data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pt-pks/keuangan/piutang");
      if (res.ok) {
        const piutangs = await res.json();
        setData(piutangs);
      }
    } catch (error) {
      console.error("Error fetching piutang:", error);
      toast.error("Gagal memuat data piutang");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/pt-pks/keuangan/piutang/summary");
      if (res.ok) {
        const summaryData = await res.json();
        setSummary(summaryData);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const filterData = () => {
    let filtered = [...data];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.referensiNomor.toLowerCase().includes(search) ||
          item.buyerNama.toLowerCase().includes(search) ||
          (item.contractNumber && item.contractNumber.toLowerCase().includes(search))
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    setFilteredData(filtered);
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/pt-pks/keuangan/piutang/sync", {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(`Berhasil sinkronisasi ${result.totalCreated} piutang baru`);
        fetchData();
        fetchSummary();
      } else {
        toast.error("Gagal sinkronisasi piutang");
      }
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error("Gagal sinkronisasi piutang");
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkPaid = async (piutang: Piutang) => {
    if (!confirm(`Tandai piutang ${piutang.referensiNomor} sebagai lunas?`)) return;

    try {
      const res = await fetch(`/api/pt-pks/keuangan/piutang/${piutang.id}/lunas`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Piutang berhasil ditandai lunas");
        fetchData();
        fetchSummary();
      } else {
        toast.error("Gagal menandai piutang sebagai lunas");
      }
    } catch (error) {
      console.error("Error marking paid:", error);
      toast.error("Gagal menandai piutang sebagai lunas");
    }
  };

  const openReceiptDialog = (piutang: Piutang) => {
    setSelectedPiutang(piutang);
    setReceiptAmount(piutang.sisaPiutang.toString());
    setReceiptMethod("");
    setReceiptRef("");
    setReceiptDialog(true);
  };

  const handleReceipt = async () => {
    if (!selectedPiutang || !receiptAmount) return;

    const amount = parseFloat(receiptAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Jumlah penerimaan tidak valid");
      return;
    }

    if (amount > selectedPiutang.sisaPiutang) {
      toast.error("Jumlah penerimaan melebihi sisa piutang");
      return;
    }

    try {
      setProcessingReceipt(true);
      const res = await fetch(`/api/pt-pks/keuangan/piutang/${selectedPiutang.id}/terima`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumlahTerima: amount,
          metodePembayaran: receiptMethod || null,
          nomorReferensi: receiptRef || null,
        }),
      });

      if (res.ok) {
        toast.success("Penerimaan berhasil dicatat");
        setReceiptDialog(false);
        fetchData();
        fetchSummary();
      } else {
        const error = await res.json();
        toast.error(error.error || "Gagal mencatat penerimaan");
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      toast.error("Gagal mencatat penerimaan");
    } finally {
      setProcessingReceipt(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Piutang</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalPiutang)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Diterima</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalDiterima)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sisa Piutang</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.sisaPiutang)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Belum Terima:</span>
                  <span className="font-semibold">{summary.jumlahUnpaid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sebagian:</span>
                  <span className="font-semibold">{summary.jumlahPartial}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lunas:</span>
                  <span className="font-semibold">{summary.jumlahPaid}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Piutang Customer</CardTitle>
              <CardDescription>
                Daftar piutang dari buyer/customer
              </CardDescription>
            </div>
            <Button onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sinkronisasi..." : "Sinkronisasi Data"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nomor referensi, buyer, atau kontrak..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="UNPAID">Belum Terima</SelectItem>
                <SelectItem value="PARTIAL">Sebagian</SelectItem>
                <SelectItem value="PAID">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Pengiriman</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>No. Kontrak</TableHead>
                  <TableHead className="text-right">Total Piutang</TableHead>
                  <TableHead className="text-right">Diterima</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Tidak ada data piutang
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((piutang) => (
                    <TableRow key={piutang.id}>
                      <TableCell>
                        {format(new Date(piutang.tanggalTransaksi), "dd/MM/yyyy", {
                          locale: idLocale,
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {piutang.referensiNomor}
                      </TableCell>
                      <TableCell>{piutang.buyerNama}</TableCell>
                      <TableCell>{piutang.contractNumber || "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(piutang.totalNilai)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(piutang.totalDiterima)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600 font-semibold">
                        {formatCurrency(piutang.sisaPiutang)}
                      </TableCell>
                      <TableCell>{getStatusBadge(piutang.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          {piutang.status !== "PAID" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReceiptDialog(piutang)}
                              >
                                Terima
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleMarkPaid(piutang)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Penerimaan Pembayaran</DialogTitle>
            <DialogDescription>
              {selectedPiutang && (
                <>
                  Penerimaan untuk {selectedPiutang.referensiNomor} -{" "}
                  {selectedPiutang.buyerNama}
                  <br />
                  Sisa Piutang: {formatCurrency(selectedPiutang.sisaPiutang)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Diterima</Label>
              <Input
                id="amount"
                type="number"
                value={receiptAmount}
                onChange={(e) => setReceiptAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Metode Pembayaran</Label>
              <Select value={receiptMethod} onValueChange={setReceiptMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                  <SelectItem value="GIRO">Giro</SelectItem>
                  <SelectItem value="CEK">Cek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ref">No. Referensi/Bukti Terima</Label>
              <Input
                id="ref"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                placeholder="Opsional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiptDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleReceipt} disabled={processingReceipt}>
              {processingReceipt ? "Memproses..." : "Simpan Penerimaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
