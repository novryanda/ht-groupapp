"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, FileText, Download, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PembayaranData = {
  id: string;
  nomorPenerimaan: string;
  tanggalTerima: string;
  operatorPenimbang: string;
  beratBruto: number;
  beratTarra: number;
  beratNetto1: number;
  potonganPersen: number;
  potonganKg: number;
  beratNetto2: number;
  hargaPerKg: number;
  totalBayar: number;
  status: string;
  supplier: {
    id: string;
    ownerName: string;
    type: string;
    bankName?: string | null;
    accountNumber?: string | null;
  };
  material: {
    name: string;
    satuan: {
      symbol: string;
    };
  };
  transporter: {
    nomorKendaraan: string;
    namaSupir: string;
  };
};

export function PembayaranSupplierTable() {
  const [data, setData] = useState<PembayaranData[]>([]);
  const [filteredData, setFilteredData] = useState<PembayaranData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [suppliers, setSuppliers] = useState<Array<{ id: string; ownerName: string }>>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, filterSupplier, filterDate, data]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/pt-pks/pembayaran-supplier");
      if (res.ok) {
        const pembayaranData = await res.json();
        setData(pembayaranData);
        
        // Extract unique suppliers
        const uniqueSuppliers = Array.from(
          new Map(
            pembayaranData.map((item: PembayaranData) => [
              item.supplier.id,
              { id: item.supplier.id, ownerName: item.supplier.ownerName },
            ])
          ).values()
        );
        setSuppliers(uniqueSuppliers as Array<{ id: string; ownerName: string }>);
      }
    } catch (error) {
      console.error("Error fetching pembayaran data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = [...data];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.nomorPenerimaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.transporter.nomorKendaraan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Supplier filter
    if (filterSupplier !== "all") {
      filtered = filtered.filter((item) => item.supplier.id === filterSupplier);
    }

    // Date filter
    if (filterDate) {
      const filterDateObj = new Date(filterDate);
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.tanggalTerima);
        return itemDate.toDateString() === filterDateObj.toDateString();
      });
    }

    setFilteredData(filtered);
  };

  const calculateTotals = () => {
    const totalBerat = filteredData.reduce((sum, item) => sum + item.beratNetto2, 0);
    const totalPembayaran = filteredData.reduce((sum, item) => sum + item.totalBayar, 0);
    return { totalBerat, totalPembayaran };
  };

  const { totalBerat, totalPembayaran } = calculateTotals();

  const exportToCSV = () => {
    const headers = [
      "No. Penerimaan",
      "Tanggal",
      "Supplier",
      "Tipe",
      "Bank",
      "No. Rekening",
      "Material",
      "Operator Timbangan",
      "Kendaraan",
      "Supir",
      "Berat Bruto (kg)",
      "Berat Tarra (kg)",
      "Berat Netto 1 (kg)",
      "Potongan (%)",
      "Potongan (kg)",
      "Berat Netto 2 (kg)",
      "Harga/kg",
      "Total Bayar",
    ];

    const rows = filteredData.map((item) => [
      item.nomorPenerimaan,
      new Date(item.tanggalTerima).toLocaleDateString("id-ID"),
      item.supplier.ownerName,
      item.supplier.type,
      item.supplier.bankName || "-",
      item.supplier.accountNumber || "-",
      item.material.name,
      item.operatorPenimbang,
      item.transporter.nomorKendaraan,
      item.transporter.namaSupir,
      item.beratBruto,
      item.beratTarra,
      item.beratNetto1,
      item.potonganPersen,
      item.potonganKg,
      item.beratNetto2,
      item.hargaPerKg,
      item.totalBayar,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pembayaran-supplier-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Memuat data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Transaksi</div>
            <div className="text-3xl font-bold">{filteredData.length}</div>
            <div className="text-xs text-muted-foreground mt-1">penerimaan TBS</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Berat</div>
            <div className="text-3xl font-bold text-primary">
              {totalBerat.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">kilogram</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Pembayaran</div>
            <div className="text-3xl font-bold text-green-600">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(totalPembayaran)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {filteredData.length > 0 ? `dari ${filteredData.length} transaksi` : "tidak ada transaksi"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Data Pembayaran Supplier TBS</CardTitle>
              <CardDescription>
                Daftar lengkap penerimaan TBS dari supplier beserta informasi pembayaran
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="No. penerimaan, supplier, kendaraan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterSupplier">Filter Supplier</Label>
              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger id="filterSupplier">
                  <SelectValue placeholder="Semua supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.ownerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterDate">Filter Tanggal</Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || filterSupplier !== "all" || filterDate) && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter aktif:</span>
              {searchTerm && (
                <Badge variant="secondary">
                  Pencarian: {searchTerm}
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-2 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filterSupplier !== "all" && (
                <Badge variant="secondary">
                  Supplier: {suppliers.find((s) => s.id === filterSupplier)?.ownerName}
                  <button
                    onClick={() => setFilterSupplier("all")}
                    className="ml-2 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filterDate && (
                <Badge variant="secondary">
                  Tanggal: {new Date(filterDate).toLocaleDateString("id-ID")}
                  <button
                    onClick={() => setFilterDate("")}
                    className="ml-2 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterSupplier("all");
                  setFilterDate("");
                }}
              >
                Reset semua filter
              </Button>
            </div>
          )}

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">No. Penerimaan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Bank & Rekening</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Operator Timbangan</TableHead>
                    <TableHead>Kendaraan</TableHead>
                    <TableHead className="text-right">Bruto (kg)</TableHead>
                    <TableHead className="text-right">Tarra (kg)</TableHead>
                    <TableHead className="text-right">Netto 1 (kg)</TableHead>
                    <TableHead className="text-right">Potongan</TableHead>
                    <TableHead className="text-right">Netto 2 (kg)</TableHead>
                    <TableHead className="text-right">Harga/kg</TableHead>
                    <TableHead className="text-right">Total Bayar</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                        {data.length === 0
                          ? "Belum ada data penerimaan TBS"
                          : "Tidak ada data yang sesuai dengan filter"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">
                          {item.nomorPenerimaan}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(item.tanggalTerima).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.supplier.ownerName}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.supplier.type}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{item.supplier.bankName || "-"}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {item.supplier.accountNumber || "-"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{item.material.name}</TableCell>
                        <TableCell className="text-sm font-medium">{item.operatorPenimbang}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{item.transporter.nomorKendaraan}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.transporter.namaSupir}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {item.beratBruto.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {item.beratTarra.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-blue-600">
                          {item.beratNetto1.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <div className="text-orange-600">
                            {item.potonganPersen}%
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            ({item.potonganKg.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg)
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {item.beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {new Intl.NumberFormat("id-ID", {
                            minimumFractionDigits: 0,
                          }).format(item.hargaPerKg)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(item.totalBayar)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === "COMPLETED"
                                ? "default"
                                : item.status === "DRAFT"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer Summary */}
          {filteredData.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Menampilkan {filteredData.length} dari {data.length} transaksi
              </div>
              <div className="flex gap-8">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total Berat Netto 2</div>
                  <div className="font-bold text-primary">
                    {totalBerat.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total Pembayaran</div>
                  <div className="font-bold text-green-600 text-lg">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(totalPembayaran)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
