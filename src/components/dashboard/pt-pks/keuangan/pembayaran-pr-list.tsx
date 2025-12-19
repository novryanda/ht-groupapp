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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  RefreshCw,
  CheckCircle,
  DollarSign,
  AlertCircle,
  Filter,
  FileText,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

type PembayaranPR = {
  id: string;
  tanggalBayar: string;
  jumlahBayar: number;
  metodePembayaran: string | null;
  nomorReferensi: string | null;
  keterangan: string | null;
  dibayarOleh: string;
  createdAt: string;
};

type PurchaseRequest = {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  vendorName: string | null;
  requestedBy: string;
  approvedBy: string | null;
  totalNilai: number;
  status: string;
  purchaseType: string;
  divisi: string | null;
  keterangan: string | null;
  pembayaranPR: PembayaranPR[];
};

type Summary = {
  totalNilai: number;
  totalDibayar: number;
  sisaBelumBayar: number;
  jumlahPRLunas: number;
  jumlahPRBelumLunas: number;
  jumlahPRBelumBayar: number;
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

export function PembayaranPRList() {
  const [data, setData] = useState<PurchaseRequest[]>([]);
  const [filteredData, setFilteredData] = useState<PurchaseRequest[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Payment dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
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
      const res = await fetch("/api/pt-pks/keuangan/pembayaran-pr");
      if (res.ok) {
        const prList = await res.json();
        setData(prList);
      }
    } catch (error) {
      console.error("Error fetching PR:", error);
      toast.error("Gagal memuat data PR");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const summary: Summary = {
      totalNilai: 0,
      totalDibayar: 0,
      sisaBelumBayar: 0,
      jumlahPRLunas: 0,
      jumlahPRBelumLunas: 0,
      jumlahPRBelumBayar: 0,
    };

    data.forEach((pr) => {
      const totalDibayar = pr.pembayaranPR.reduce((sum, p) => sum + p.jumlahBayar, 0);
      summary.totalNilai += pr.totalNilai;
      summary.totalDibayar += totalDibayar;
      summary.sisaBelumBayar += pr.totalNilai - totalDibayar;

      if (totalDibayar >= pr.totalNilai) {
        summary.jumlahPRLunas++;
      } else if (totalDibayar > 0) {
        summary.jumlahPRBelumLunas++;
      } else {
        summary.jumlahPRBelumBayar++;
      }
    });

    setSummary(summary);
  };

  const filterData = () => {
    let filtered = [...data];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pr) =>
          pr.nomorPR.toLowerCase().includes(term) ||
          pr.vendorName?.toLowerCase().includes(term) ||
          pr.requestedBy.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((pr) => {
        const totalDibayar = pr.pembayaranPR.reduce((sum, p) => sum + p.jumlahBayar, 0);
        if (filterStatus === "lunas") return totalDibayar >= pr.totalNilai;
        if (filterStatus === "sebagian") return totalDibayar > 0 && totalDibayar < pr.totalNilai;
        if (filterStatus === "belum") return totalDibayar === 0;
        return true;
      });
    }

    setFilteredData(filtered);
  };

  const openPaymentDialog = (pr: PurchaseRequest) => {
    const totalDibayar = pr.pembayaranPR.reduce((sum, p) => sum + p.jumlahBayar, 0);
    const sisa = pr.totalNilai - totalDibayar;
    setSelectedPR(pr);
    setPaymentAmount(sisa.toString());
    setPaymentMethod("");
    setPaymentRef("");
    setPaymentNote("");
    setPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedPR) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Jumlah pembayaran harus lebih dari 0");
      return;
    }

    const totalDibayar = selectedPR.pembayaranPR.reduce((sum, p) => sum + p.jumlahBayar, 0);
    const sisa = selectedPR.totalNilai - totalDibayar;

    if (amount > sisa) {
      toast.error(`Jumlah pembayaran tidak boleh lebih dari sisa ${formatCurrency(sisa)}`);
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await fetch(`/api/pt-pks/keuangan/pembayaran-pr/${selectedPR.id}/bayar`, {
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
            <Wallet className="h-6 w-6" />
            Pembayaran PR Langsung
          </h1>
          <p className="text-muted-foreground">
            Kelola pembayaran untuk Purchase Request Pembelian Langsung
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
              <CardDescription>Total Nilai PR</CardDescription>
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
              <CardDescription>Status PR</CardDescription>
              <CardTitle className="text-sm">
                <span className="text-green-600">{summary.jumlahPRLunas} Lunas</span> •{" "}
                <span className="text-yellow-600">{summary.jumlahPRBelumLunas} Sebagian</span> •{" "}
                <span className="text-red-600">{summary.jumlahPRBelumBayar} Belum</span>
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
                  placeholder="Cari nomor PR, vendor, atau pembuat..."
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
                <TableHead>No. PR</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead className="text-right">Total Nilai</TableHead>
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
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Memuat data...</p>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Tidak ada data PR Pembelian Langsung</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((pr) => {
                  const totalDibayar = pr.pembayaranPR.reduce((sum, p) => sum + p.jumlahBayar, 0);
                  const sisa = pr.totalNilai - totalDibayar;
                  return (
                    <TableRow key={pr.id}>
                      <TableCell className="font-medium">{pr.nomorPR}</TableCell>
                      <TableCell>
                        {format(new Date(pr.tanggalRequest), "dd MMM yyyy", { locale: idLocale })}
                      </TableCell>
                      <TableCell>{pr.vendorName || "-"}</TableCell>
                      <TableCell>{pr.divisi || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(pr.totalNilai)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(totalDibayar)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(sisa)}
                      </TableCell>
                      <TableCell>{getStatusBadge(pr.totalNilai, totalDibayar)}</TableCell>
                      <TableCell className="text-center">
                        {sisa > 0 && (
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog(pr)}
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
            <DialogTitle>Catat Pembayaran PR</DialogTitle>
            <DialogDescription>
              {selectedPR && `Pembayaran untuk PR ${selectedPR.nomorPR}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPR && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Total Nilai:</span>
                  <span className="font-medium">{formatCurrency(selectedPR.totalNilai)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sudah Dibayar:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      selectedPR.pembayaranPR.reduce((sum, p) => sum + p.jumlahBayar, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sisa:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(
                      selectedPR.totalNilai -
                        selectedPR.pembayaranPR.reduce((sum, p) => sum + p.jumlahBayar, 0)
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
