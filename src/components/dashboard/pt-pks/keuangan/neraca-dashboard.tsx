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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  FileText,
  Building2,
  Download,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

type NeracaSummary = {
  aset: {
    lancar: {
      piutang: number;
      inventaris: number;
      stockProduct: number;
      stockTBS: number;
    };
    totalAsetLancar: number;
    totalAset: number;
  };
  kewajiban: {
    hutangUsaha: number;
    hutangByTipe: Record<string, { total: number; dibayar: number; sisa: number; count: number }>;
    totalKewajiban: number;
  };
  ekuitas: {
    total: number;
  };
  isBalanced: boolean;
};

type AsetDetail = {
  inventaris: {
    items: {
      id: string;
      nama: string;
      kode: string;
      jumlah: number;
      hargaSatuan: number;
      nilai: number;
    }[];
    total: number;
  };
  piutang: {
    totalPiutang: number;
    totalDiterima: number;
    sisaPiutang: number;
    items: {
      id: string;
      referensiNomor: string;
      buyerNama: string;
      totalNilai: number;
      sisaPiutang: number;
      status: string;
    }[];
  };
  stockProduct: {
    items: {
      id: string;
      namaTangki: string;
      material: string;
      isiSaatIni: number;
    }[];
    totalStock: number;
  };
  stockTBS: {
    items: {
      id: string;
      material: string;
      jumlah: number;
    }[];
    totalStock: number;
  };
};

type AgingData = {
  current: { total: number; items: unknown[] };
  days31to60: { total: number; items: unknown[] };
  days61to90: { total: number; items: unknown[] };
  over90: { total: number; items: unknown[] };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("id-ID").format(value);
};

const getTipeLabel = (tipe: string) => {
  const labels: Record<string, string> = {
    PENERIMAAN_TBS: "Penerimaan TBS",
    PURCHASE_ORDER: "Purchase Order",
    PEMBELIAN_LANGSUNG: "Pembelian Langsung",
    PENGIRIMAN_PRODUCT: "Pengiriman Product",
  };
  return labels[tipe] || tipe;
};

export function NeracaDashboard() {
  const [summary, setSummary] = useState<NeracaSummary | null>(null);
  const [asetDetail, setAsetDetail] = useState<AsetDetail | null>(null);
  const [agingHutang, setAgingHutang] = useState<AgingData | null>(null);
  const [agingPiutang, setAgingPiutang] = useState<AgingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSummary(),
        fetchAsetDetail(),
        fetchAgingHutang(),
        fetchAgingPiutang(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/pt-pks/keuangan/neraca");
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast.error("Gagal memuat ringkasan neraca");
    }
  };

  const fetchAsetDetail = async () => {
    try {
      const res = await fetch("/api/pt-pks/keuangan/neraca/aset");
      if (res.ok) {
        const data = await res.json();
        setAsetDetail(data);
      }
    } catch (error) {
      console.error("Error fetching aset detail:", error);
    }
  };

  const fetchAgingHutang = async () => {
    try {
      const res = await fetch("/api/pt-pks/keuangan/neraca/aging-hutang");
      if (res.ok) {
        const data = await res.json();
        setAgingHutang(data);
      }
    } catch (error) {
      console.error("Error fetching aging hutang:", error);
    }
  };

  const fetchAgingPiutang = async () => {
    try {
      const res = await fetch("/api/pt-pks/keuangan/neraca/aging-piutang");
      if (res.ok) {
        const data = await res.json();
        setAgingPiutang(data);
      }
    } catch (error) {
      console.error("Error fetching aging piutang:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Neraca</h2>
          <p className="text-muted-foreground">
            Laporan posisi keuangan per {format(new Date(), "dd MMMM yyyy", { locale: idLocale })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAllData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aset</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.aset.totalAset)}
              </div>
              <p className="text-xs text-muted-foreground">
                Aset Lancar: {formatCurrency(summary.aset.totalAsetLancar)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kewajiban</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.kewajiban.totalKewajiban)}
              </div>
              <p className="text-xs text-muted-foreground">
                Hutang Usaha: {formatCurrency(summary.kewajiban.hutangUsaha)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ekuitas</CardTitle>
              <Wallet className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.ekuitas.total >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(summary.ekuitas.total)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.isBalanced ? (
                  <Badge variant="default" className="mt-1">Neraca Balance</Badge>
                ) : (
                  <Badge variant="destructive" className="mt-1">Neraca Tidak Balance</Badge>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="neraca" className="space-y-4">
        <TabsList>
          <TabsTrigger value="neraca">Neraca</TabsTrigger>
          <TabsTrigger value="aset">Detail Aset</TabsTrigger>
          <TabsTrigger value="aging">Aging Analysis</TabsTrigger>
        </TabsList>

        {/* Neraca Tab */}
        <TabsContent value="neraca" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* ASET */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  ASET
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Aset Lancar
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1">
                      <span className="text-sm">Piutang Usaha</span>
                      <span className="font-medium">
                        {formatCurrency(summary?.aset.lancar.piutang || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-sm">Persediaan Inventaris</span>
                      <span className="font-medium">
                        {formatCurrency(summary?.aset.lancar.inventaris || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-sm">Stock Product (Tangki)</span>
                      <span className="font-medium text-muted-foreground">
                        {formatNumber(summary?.aset.lancar.stockProduct || 0)} unit
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-sm">Stock Bahan Baku (TBS)</span>
                      <span className="font-medium text-muted-foreground">
                        {formatNumber(summary?.aset.lancar.stockTBS || 0)} kg
                      </span>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between py-1 font-semibold">
                    <span>Total Aset Lancar</span>
                    <span className="text-blue-600">
                      {formatCurrency(summary?.aset.totalAsetLancar || 0)}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>TOTAL ASET</span>
                  <span className="text-blue-600">
                    {formatCurrency(summary?.aset.totalAset || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* KEWAJIBAN & EKUITAS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  KEWAJIBAN & EKUITAS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Kewajiban Lancar
                  </h4>
                  <div className="space-y-2">
                    {summary?.kewajiban.hutangByTipe &&
                      Object.entries(summary.kewajiban.hutangByTipe).map(([tipe, data]) => (
                        <div key={tipe} className="flex justify-between py-1">
                          <span className="text-sm">{getTipeLabel(tipe)}</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(data.sisa)}
                          </span>
                        </div>
                      ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between py-1 font-semibold">
                    <span>Total Kewajiban</span>
                    <span className="text-red-600">
                      {formatCurrency(summary?.kewajiban.totalKewajiban || 0)}
                    </span>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    Ekuitas
                  </h4>
                  <div className="flex justify-between py-1 font-semibold">
                    <span>Ekuitas Pemilik</span>
                    <span className={summary?.ekuitas.total && summary.ekuitas.total >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(summary?.ekuitas.total || 0)}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>TOTAL KEWAJIBAN & EKUITAS</span>
                  <span>
                    {formatCurrency((summary?.kewajiban.totalKewajiban || 0) + (summary?.ekuitas.total || 0))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detail Aset Tab */}
        <TabsContent value="aset" className="space-y-4">
          <div className="space-y-4">
            {/* Inventaris */}
            <Collapsible defaultOpen className="border rounded-lg">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Persediaan Inventaris</span>
                  <Badge variant="secondary" className="ml-2">
                    {formatCurrency(asetDetail?.inventaris.total || 0)}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Material</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Harga Satuan</TableHead>
                        <TableHead className="text-right">Nilai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asetDetail?.inventaris.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.kode}</TableCell>
                          <TableCell>{item.nama}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.jumlah)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.hargaSatuan)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.nilai)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!asetDetail?.inventaris.items || asetDetail.inventaris.items.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            Tidak ada data inventaris
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Piutang */}
            <Collapsible defaultOpen className="border rounded-lg">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Piutang Usaha</span>
                  <Badge variant="secondary" className="ml-2">
                    {formatCurrency(asetDetail?.piutang.sisaPiutang || 0)}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Referensi</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Sisa</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asetDetail?.piutang.items
                        .filter((item) => item.status !== "PAID")
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-sm">{item.referensiNomor}</TableCell>
                            <TableCell>{item.buyerNama}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.totalNilai)}</TableCell>
                            <TableCell className="text-right font-semibold text-blue-600">
                              {formatCurrency(item.sisaPiutang)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.status === "PARTIAL" ? "secondary" : "destructive"}>
                                {item.status === "PARTIAL" ? "Sebagian" : "Belum Bayar"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Stock Product */}
            <Collapsible className="border rounded-lg">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Stock Product (Tangki)</span>
                  <Badge variant="secondary" className="ml-2">
                    {formatNumber(asetDetail?.stockProduct.totalStock || 0)} unit
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tangki</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Isi Saat Ini</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asetDetail?.stockProduct.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.namaTangki}</TableCell>
                          <TableCell>{item.material}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.isiSaatIni)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </TabsContent>

        {/* Aging Analysis Tab */}
        <TabsContent value="aging" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Aging Hutang */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aging Hutang</CardTitle>
                <CardDescription>Analisis umur hutang berdasarkan tanggal transaksi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">0-30 Hari</p>
                      <p className="text-xs text-muted-foreground">Current</p>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(agingHutang?.current.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">31-60 Hari</p>
                      <p className="text-xs text-muted-foreground">Overdue</p>
                    </div>
                    <span className="font-bold text-yellow-600">
                      {formatCurrency(agingHutang?.days31to60.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">61-90 Hari</p>
                      <p className="text-xs text-muted-foreground">Seriously Overdue</p>
                    </div>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(agingHutang?.days61to90.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">&gt; 90 Hari</p>
                      <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                    <span className="font-bold text-red-600">
                      {formatCurrency(agingHutang?.over90.total || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aging Piutang */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aging Piutang</CardTitle>
                <CardDescription>Analisis umur piutang berdasarkan tanggal transaksi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">0-30 Hari</p>
                      <p className="text-xs text-muted-foreground">Current</p>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(agingPiutang?.current.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">31-60 Hari</p>
                      <p className="text-xs text-muted-foreground">Overdue</p>
                    </div>
                    <span className="font-bold text-yellow-600">
                      {formatCurrency(agingPiutang?.days31to60.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">61-90 Hari</p>
                      <p className="text-xs text-muted-foreground">Seriously Overdue</p>
                    </div>
                    <span className="font-bold text-orange-600">
                      {formatCurrency(agingPiutang?.days61to90.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">&gt; 90 Hari</p>
                      <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                    <span className="font-bold text-red-600">
                      {formatCurrency(agingPiutang?.over90.total || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
