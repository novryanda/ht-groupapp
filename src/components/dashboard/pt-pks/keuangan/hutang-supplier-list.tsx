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
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

type Hutang = {
  id: string;
  tipeTransaksi: string;
  referensiNomor: string;
  tanggalTransaksi: string;
  tanggalJatuhTempo: string | null;
  pihakKetigaId: string | null;
  pihakKetigaNama: string;
  pihakKetigaTipe: string | null;
  totalNilai: number;
  totalDibayar: number;
  sisaHutang: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  keterangan: string | null;
  pembayaranHutang: {
    id: string;
    tanggalBayar: string;
    jumlahBayar: number;
    metodePembayaran: string | null;
    nomorReferensi: string | null;
    dibayarOleh: string;
  }[];
};

type Summary = {
  totalHutang: number;
  totalDibayar: number;
  sisaHutang: number;
  jumlahUnpaid: number;
  jumlahPartial: number;
  jumlahPaid: number;
  byTipe: Record<string, { total: number; dibayar: number; sisa: number; count: number }>;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const getTipeLabel = (tipe: string) => {
  const labels: Record<string, string> = {
    PENERIMAAN_TBS: "Penerimaan TBS",
    PURCHASE_ORDER: "Purchase Order",
    PEMBELIAN_LANGSUNG: "Pembelian Langsung",
  };
  return labels[tipe] || tipe;
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
    UNPAID: { label: "Belum Bayar", variant: "destructive" },
    PARTIAL: { label: "Sebagian", variant: "secondary" },
    PAID: { label: "Lunas", variant: "default" },
  };
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function HutangSupplierList() {
  const [data, setData] = useState<Hutang[]>([]);
  const [filteredData, setFilteredData] = useState<Hutang[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTipe, setFilterTipe] = useState("all");
  
  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedHutang, setSelectedHutang] = useState<Hutang | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSummary();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, filterStatus, filterTipe, data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pt-pks/keuangan/hutang");
      if (res.ok) {
        const hutangs = await res.json();
        setData(hutangs);
      }
    } catch (error) {
      console.error("Error fetching hutang:", error);
      toast.error("Gagal memuat data hutang");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/pt-pks/keuangan/hutang/summary");
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
          item.pihakKetigaNama.toLowerCase().includes(search)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    if (filterTipe !== "all") {
      filtered = filtered.filter((item) => item.tipeTransaksi === filterTipe);
    }

    setFilteredData(filtered);
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/pt-pks/keuangan/hutang/sync", {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(`Berhasil sinkronisasi ${result.totalCreated} hutang baru`);
        fetchData();
        fetchSummary();
      } else {
        toast.error("Gagal sinkronisasi hutang");
      }
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error("Gagal sinkronisasi hutang");
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkPaid = async (hutang: Hutang) => {
    if (!confirm(`Tandai hutang ${hutang.referensiNomor} sebagai lunas?`)) return;

    try {
      const res = await fetch(`/api/pt-pks/keuangan/hutang/${hutang.id}/lunas`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Hutang berhasil ditandai lunas");
        fetchData();
        fetchSummary();
      } else {
        toast.error("Gagal menandai hutang sebagai lunas");
      }
    } catch (error) {
      console.error("Error marking paid:", error);
      toast.error("Gagal menandai hutang sebagai lunas");
    }
  };

  const openPaymentDialog = (hutang: Hutang) => {
    setSelectedHutang(hutang);
    setPaymentAmount(hutang.sisaHutang.toString());
    setPaymentMethod("");
    setPaymentRef("");
    setPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedHutang || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Jumlah pembayaran tidak valid");
      return;
    }

    if (amount > selectedHutang.sisaHutang) {
      toast.error("Jumlah pembayaran melebihi sisa hutang");
      return;
    }

    try {
      setProcessingPayment(true);
      const res = await fetch(`/api/pt-pks/keuangan/hutang/${selectedHutang.id}/bayar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumlahBayar: amount,
          metodePembayaran: paymentMethod || null,
          nomorReferensi: paymentRef || null,
        }),
      });

      if (res.ok) {
        toast.success("Pembayaran berhasil dicatat");
        setPaymentDialog(false);
        fetchData();
        fetchSummary();
      } else {
        const error = await res.json();
        toast.error(error.error || "Gagal mencatat pembayaran");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Gagal mencatat pembayaran");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hutang</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalHutang)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dibayar</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalDibayar)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sisa Hutang</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.sisaHutang)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Belum Bayar:</span>
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
              <CardTitle>Hutang Supplier</CardTitle>
              <CardDescription>
                Daftar hutang kepada supplier dan vendor
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
                  placeholder="Cari nomor referensi atau nama..."
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
                <SelectItem value="UNPAID">Belum Bayar</SelectItem>
                <SelectItem value="PARTIAL">Sebagian</SelectItem>
                <SelectItem value="PAID">Lunas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTipe} onValueChange={setFilterTipe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipe Transaksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="PENERIMAAN_TBS">Penerimaan TBS</SelectItem>
                <SelectItem value="PURCHASE_ORDER">Purchase Order</SelectItem>
                <SelectItem value="PEMBELIAN_LANGSUNG">Pembelian Langsung</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No. Referensi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Supplier/Vendor</TableHead>
                  <TableHead className="text-right">Total Hutang</TableHead>
                  <TableHead className="text-right">Dibayar</TableHead>
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
                      Tidak ada data hutang
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((hutang) => (
                    <TableRow key={hutang.id}>
                      <TableCell>
                        {format(new Date(hutang.tanggalTransaksi), "dd/MM/yyyy", {
                          locale: idLocale,
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {hutang.referensiNomor}
                      </TableCell>
                      <TableCell>{getTipeLabel(hutang.tipeTransaksi)}</TableCell>
                      <TableCell>{hutang.pihakKetigaNama}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(hutang.totalNilai)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(hutang.totalDibayar)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">
                        {formatCurrency(hutang.sisaHutang)}
                      </TableCell>
                      <TableCell>{getStatusBadge(hutang.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          {hutang.status !== "PAID" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPaymentDialog(hutang)}
                              >
                                Bayar
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleMarkPaid(hutang)}
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

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
            <DialogDescription>
              {selectedHutang && (
                <>
                  Pembayaran untuk {selectedHutang.referensiNomor} -{" "}
                  {selectedHutang.pihakKetigaNama}
                  <br />
                  Sisa Hutang: {formatCurrency(selectedHutang.sisaHutang)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Bayar</Label>
              <Input
                id="amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
              <Label htmlFor="ref">No. Referensi/Bukti Bayar</Label>
              <Input
                id="ref"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Opsional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>
              Batal
            </Button>
            <Button onClick={handlePayment} disabled={processingPayment}>
              {processingPayment ? "Memproses..." : "Simpan Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
