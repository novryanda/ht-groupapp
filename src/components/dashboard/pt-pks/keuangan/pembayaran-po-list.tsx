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
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  RefreshCw,
  DollarSign,
  Filter,
  FileText,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

type PembayaranPO = {
  id: string;
  tanggalBayar: string;
  jumlahBayar: number;
  metodePembayaran: string | null;
  nomorReferensi: string | null;
  keterangan: string | null;
  dibayarOleh: string;
  createdAt: string;
};

type PurchaseOrder = {
  id: string;
  nomorPO: string;
  tanggalPO: string;
  vendorName: string;
  vendorAddress: string | null;
  issuedBy: string;
  approvedBy: string | null;
  totalAmount: number;
  status: string;
  termPembayaran: string | null;
  keterangan: string | null;
  pembayaranPO: PembayaranPO[];
};

type Summary = {
  totalNilai: number;
  totalDibayar: number;
  sisaBelumBayar: number;
  jumlahPOLunas: number;
  jumlahPOBelumLunas: number;
  jumlahPOBelumBayar: number;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const getStatusBadge = (totalNilai: number, totalDibayar: number) => {
  if (totalDibayar >= totalNilai) {
    return <Badge variant="default">Lunas</Badge>;
  } else if (totalDibayar > 0) {
    return <Badge variant="secondary">Sebagian</Badge>;
  }
  return <Badge variant="destructive">Belum Bayar</Badge>;
};

const getPOStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    ISSUED: { label: "Diterbitkan", variant: "default" },
    PARTIAL_RECEIVED: { label: "Diterima Sebagian", variant: "outline" },
    COMPLETED: { label: "Selesai", variant: "default" },
    CANCELLED: { label: "Dibatalkan", variant: "destructive" },
  };
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export function PembayaranPOList() {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [filteredData, setFilteredData] = useState<PurchaseOrder[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
    calculateSummary();
  }, [searchTerm, filterStatus, data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pt-pks/keuangan/pembayaran-po");
      if (res.ok) {
        const poList = await res.json();
        setData(poList);
      }
    } catch (error) {
      console.error("Error fetching PO:", error);
      toast.error("Gagal memuat data PO");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const summary: Summary = {
      totalNilai: 0,
      totalDibayar: 0,
      sisaBelumBayar: 0,
      jumlahPOLunas: 0,
      jumlahPOBelumLunas: 0,
      jumlahPOBelumBayar: 0,
    };

    data.forEach((po) => {
      const totalDibayar = po.pembayaranPO.reduce((sum, p) => sum + p.jumlahBayar, 0);
      summary.totalNilai += po.totalAmount;
      summary.totalDibayar += totalDibayar;
      summary.sisaBelumBayar += po.totalAmount - totalDibayar;

      if (totalDibayar >= po.totalAmount) {
        summary.jumlahPOLunas++;
      } else if (totalDibayar > 0) {
        summary.jumlahPOBelumLunas++;
      } else {
        summary.jumlahPOBelumBayar++;
      }
    });

    setSummary(summary);
  };

  const filterData = () => {
    let filtered = [...data];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (po) =>
          po.nomorPO.toLowerCase().includes(term) ||
          po.vendorName.toLowerCase().includes(term) ||
          po.issuedBy.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((po) => {
        const totalDibayar = po.pembayaranPO.reduce((sum, p) => sum + p.jumlahBayar, 0);
        if (filterStatus === "lunas") return totalDibayar >= po.totalAmount;
        if (filterStatus === "sebagian") return totalDibayar > 0 && totalDibayar < po.totalAmount;
        if (filterStatus === "belum") return totalDibayar === 0;
        return true;
      });
    }

    setFilteredData(filtered);
  };

  const openPaymentDialog = (po: PurchaseOrder) => {
    const totalDibayar = po.pembayaranPO.reduce((sum, p) => sum + p.jumlahBayar, 0);
    const sisa = po.totalAmount - totalDibayar;
    setSelectedPO(po);
    setPaymentAmount(sisa.toString());
    setPaymentMethod("");
    setPaymentRef("");
    setPaymentNote("");
    setPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedPO) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Jumlah pembayaran harus lebih dari 0");
      return;
    }

    const totalDibayar = selectedPO.pembayaranPO.reduce((sum, p) => sum + p.jumlahBayar, 0);
    const sisa = selectedPO.totalAmount - totalDibayar;

    if (amount > sisa) {
      toast.error(`Jumlah pembayaran tidak boleh lebih dari sisa ${formatCurrency(sisa)}`);
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await fetch(`/api/pt-pks/keuangan/pembayaran-po/${selectedPO.id}/bayar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumlahBayar: amount,
          metodePembayaran: paymentMethod || null,
          nomorReferensi: paymentRef || null,
          keterangan: paymentNote || null,
        }),
      });

      if (res.ok) {
        toast.success("Pembayaran berhasil dicatat");
        setPaymentDialog(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Gagal mencatat pembayaran");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Pembayaran Purchase Order
          </h1>
          <p className="text-muted-foreground">
            Kelola pembayaran untuk Purchase Order
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Nilai PO</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(summary.totalNilai)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Dibayar</CardDescription>
              <CardTitle className="text-xl text-green-600">
                {formatCurrency(summary.totalDibayar)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sisa Belum Bayar</CardDescription>
              <CardTitle className="text-xl text-red-600">
                {formatCurrency(summary.sisaBelumBayar)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status PO</CardDescription>
              <CardTitle className="text-sm">
                <span className="text-green-600">{summary.jumlahPOLunas} Lunas</span> •{" "}
                <span className="text-yellow-600">{summary.jumlahPOBelumLunas} Sebagian</span> •{" "}
                <span className="text-red-600">{summary.jumlahPOBelumBayar} Belum</span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filter</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nomor PO, vendor, atau penerbit..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="sebagian">Sebagian</SelectItem>
                <SelectItem value="belum">Belum Bayar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. PO</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Term Bayar</TableHead>
                <TableHead className="text-right">Total Nilai</TableHead>
                <TableHead className="text-right">Dibayar</TableHead>
                <TableHead className="text-right">Sisa</TableHead>
                <TableHead>Status Bayar</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Memuat data...</p>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Tidak ada data Purchase Order</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((po) => {
                  const totalDibayar = po.pembayaranPO.reduce((sum, p) => sum + p.jumlahBayar, 0);
                  const sisa = po.totalAmount - totalDibayar;
                  return (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.nomorPO}</TableCell>
                      <TableCell>
                        {format(new Date(po.tanggalPO), "dd MMM yyyy", { locale: idLocale })}
                      </TableCell>
                      <TableCell>{po.vendorName}</TableCell>
                      <TableCell>{po.termPembayaran || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(po.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(totalDibayar)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(sisa)}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.totalAmount, totalDibayar)}</TableCell>
                      <TableCell className="text-center">
                        {sisa > 0 && po.status !== "CANCELLED" && (
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog(po)}
                          >
                            <DollarSign className="mr-1 h-4 w-4" />
                            Bayar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran PO</DialogTitle>
            <DialogDescription>
              {selectedPO && `Pembayaran untuk PO ${selectedPO.nomorPO}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Vendor:</span>
                  <span className="font-medium">{selectedPO.vendorName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Nilai:</span>
                  <span className="font-medium">{formatCurrency(selectedPO.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sudah Dibayar:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      selectedPO.pembayaranPO.reduce((sum, p) => sum + p.jumlahBayar, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sisa:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(
                      selectedPO.totalAmount -
                        selectedPO.pembayaranPO.reduce((sum, p) => sum + p.jumlahBayar, 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah Bayar *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Masukkan jumlah pembayaran"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRANSFER">Transfer Bank</SelectItem>
                    <SelectItem value="CASH">Tunai</SelectItem>
                    <SelectItem value="GIRO">Giro</SelectItem>
                    <SelectItem value="CHEQUE">Cek</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ref">No. Referensi / Bukti Bayar</Label>
                <Input
                  id="ref"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Contoh: TRF-123456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Keterangan</Label>
                <Textarea
                  id="note"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Catatan pembayaran (opsional)"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>
              Batal
            </Button>
            <Button onClick={handlePayment} disabled={processingPayment}>
              {processingPayment ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
