"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, RefreshCw, FileText } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { PurchaseOrderDetail } from "./purchase-order-detail";

interface PurchaseOrderItem {
  id: string;
  jumlahOrder: number;
  jumlahDiterima: number;
  hargaSatuan: number;
  subtotal: number;
  keterangan?: string;
  material: {
    id: string;
    partNumber: string;
    namaMaterial: string;
    satuanMaterial: {
      symbol: string;
    };
    kategoriMaterial: {
      namaKategori: string;
    };
  };
}

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  requestedBy: string;
  divisi?: string;
}

interface PenerimaanBarang {
  id: string;
  nomorPenerimaan: string;
  tanggalPenerimaan: string;
  receivedBy: string;
  status: string;
}

interface PurchaseOrder {
  id: string;
  nomorPO: string;
  tanggalPO: string;
  vendorName: string;
  vendorAddress?: string;
  vendorPhone?: string;
  tanggalKirimDiharapkan?: string;
  termPembayaran?: string;
  issuedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountType?: string;
  discountPercent: number;
  discountAmount: number;
  shipping: number;
  totalAmount: number;
  keterangan?: string;
  status: string;
  brosurPdfPath?: string;
  brosurPdfName?: string;
  purchaseRequest?: PurchaseRequest;
  items: PurchaseOrderItem[];
  penerimaanBarang: PenerimaanBarang[];
}

export function PurchaseOrderList() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/pt-pks/purchase-order?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      ISSUED: "default",
      PARTIAL_RECEIVED: "outline",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };

    const labels: Record<string, string> = {
      DRAFT: "Draft",
      ISSUED: "Diterbitkan",
      PARTIAL_RECEIVED: "Diterima Sebagian",
      COMPLETED: "Selesai",
      CANCELLED: "Dibatalkan",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleViewDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/pt-pks/purchase-order/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPO(data);
      }
    } catch (error) {
      console.error("Error fetching PO detail:", error);
    }
  };

  const handleRefresh = async () => {
    await fetchPurchaseOrders();
    if (selectedPO) {
      await handleViewDetail(selectedPO.id);
    }
  };

  if (selectedPO) {
    return (
      <PurchaseOrderDetail
        purchaseOrder={selectedPO}
        onBack={() => {
          setSelectedPO(null);
          fetchPurchaseOrders();
        }}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Order
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Daftar order pembelian ke vendor
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => router.push("/dashboard/pt-pks/gudang/purchase-order/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Buat PO Baru
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <Input
            placeholder="Cari nomor PO atau vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ISSUED">Diterbitkan</SelectItem>
              <SelectItem value="PARTIAL_RECEIVED">Diterima Sebagian</SelectItem>
              <SelectItem value="COMPLETED">Selesai</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Memuat data...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor PO</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Ref. PR</TableHead>
                  <TableHead className="text-center">Jumlah Item</TableHead>
                  <TableHead className="text-right">Total Nilai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Tidak ada data Purchase Order</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.nomorPO}</TableCell>
                      <TableCell>
                        {format(new Date(po.tanggalPO), "dd MMM yyyy", { locale: localeId })}
                      </TableCell>
                      <TableCell>{po.vendorName}</TableCell>
                      <TableCell>
                        {po.purchaseRequest ? (
                          <Badge variant="outline">{po.purchaseRequest.nomorPR}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{po.items.length} item</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {po.totalAmount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(po.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
