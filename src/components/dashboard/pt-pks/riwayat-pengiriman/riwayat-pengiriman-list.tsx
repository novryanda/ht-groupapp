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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Truck,
  Package,
  FileText,
  Printer,
  Search,
  Filter,
  Eye,
  ArrowUpDown,
} from "lucide-react";

type Buyer = {
  id: string;
  code: string;
  name: string;
};

type Contract = {
  id: string;
  contractNumber: string;
  status: string;
  buyer: Buyer;
  startDate: string;
  endDate: string;
};

type ItemSummary = {
  contractItemId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  satuan: { name: string; symbol: string };
  contractQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  deliveryPercentage: number;
  unitPrice: number;
  deliveryCount: number;
};

type Delivery = {
  id: string;
  nomorPengiriman: string;
  noSegel: string;
  tanggalPengiriman: string;
  operatorPenimbang: string;
  status: string;
  beratTarra: number;
  beratGross: number;
  beratNetto: number;
  ffa: number;
  air: number;
  kotoran: number;
  waktuTimbangTarra: string;
  waktuTimbangGross: string;
  contractItemId: string;
  buyer: Buyer;
  contract: {
    contractNumber: string;
    buyer: Buyer;
  };
  contractItem: {
    material: {
      id: string;
      code: string;
      name: string;
      satuan: { name: string; symbol: string };
    };
  };
  vendorVehicle: {
    nomorKendaraan: string;
    namaSupir: string;
    noHpSupir?: string | null;
    vendor: { name: string; code: string };
  };
};

type ContractDeliveryData = {
  contract: Contract;
  itemSummaries: ItemSummary[];
  deliveries: Delivery[];
  overallSummary: {
    totalDeliveries: number;
    totalDeliveredWeight: number;
    pendingDeliveries: number;
  };
};

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  COMPLETED: { label: "Selesai", variant: "default" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

const contractStatusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ACTIVE: { label: "Aktif", variant: "default" },
  COMPLETED: { label: "Selesai", variant: "outline" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

export function RiwayatPengirimanList({
  contractId,
  buyerId,
}: {
  contractId?: string;
  buyerId?: string;
}) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<string>(buyerId || "");
  const [selectedContract, setSelectedContract] = useState<string>(contractId || "");
  const [deliveryData, setDeliveryData] = useState<ContractDeliveryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch buyers
  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const response = await fetch("/api/pt-pks/buyer/active");
        if (response.ok) {
          const data = await response.json();
          setBuyers(data);
        }
      } catch (error) {
        console.error("Error fetching buyers:", error);
      }
    };
    fetchBuyers();
  }, []);

  // Fetch contracts when buyer changes
  useEffect(() => {
    const fetchContracts = async () => {
      if (!selectedBuyer) {
        setContracts([]);
        return;
      }
      try {
        const response = await fetch(`/api/pt-pks/contract?buyerId=${selectedBuyer}`);
        if (response.ok) {
          const data = await response.json();
          setContracts(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching contracts:", error);
      }
    };
    fetchContracts();
  }, [selectedBuyer]);

  // Fetch delivery data when contract is selected
  useEffect(() => {
    const fetchDeliveryData = async () => {
      if (!selectedContract) {
        setDeliveryData(null);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/pt-pks/contract/${selectedContract}/deliveries`);
        if (response.ok) {
          const data = await response.json();
          setDeliveryData(data);
        }
      } catch (error) {
        console.error("Error fetching delivery data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeliveryData();
  }, [selectedContract]);

  // Auto-select contract if provided via URL
  useEffect(() => {
    if (contractId) {
      setSelectedContract(contractId);
      // Find the buyer from the contract
      const fetchContractDetails = async () => {
        try {
          const response = await fetch(`/api/pt-pks/contract/${contractId}/deliveries`);
          if (response.ok) {
            const data = await response.json();
            if (data.contract?.buyer?.id) {
              setSelectedBuyer(data.contract.buyer.id);
            }
            setDeliveryData(data);
          }
        } catch (error) {
          console.error("Error fetching contract details:", error);
        }
      };
      fetchContractDetails();
    }
  }, [contractId]);

  const handlePrintSuratPengantar = (deliveryId: string) => {
    window.open(`/api/pt-pks/pengiriman-product/${deliveryId}/surat-pengantar`, "_blank");
  };

  const handleViewDetail = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Pengiriman
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Buyer</Label>
              <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Buyer" />
                </SelectTrigger>
                <SelectContent>
                  {buyers.map((buyer) => (
                    <SelectItem key={buyer.id} value={buyer.id}>
                      {buyer.code} - {buyer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kontrak</Label>
              <Select
                value={selectedContract}
                onValueChange={setSelectedContract}
                disabled={!selectedBuyer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kontrak" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.contractNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat data...</p>
        </div>
      )}

      {/* No Selection State */}
      {!selectedContract && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Pilih Kontrak</h3>
            <p className="text-muted-foreground">
              Pilih buyer dan kontrak untuk melihat riwayat pengiriman
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contract Summary */}
      {deliveryData && !isLoading && (
        <>
          {/* Contract Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {deliveryData.contract.contractNumber}
                  </CardTitle>
                  <CardDescription>
                    {deliveryData.contract.buyer.name}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    contractStatusLabels[deliveryData.contract.status]?.variant ||
                    "default"
                  }
                >
                  {contractStatusLabels[deliveryData.contract.status]?.label ||
                    deliveryData.contract.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {deliveryData.overallSummary.totalDeliveries}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Pengiriman
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {deliveryData.overallSummary.totalDeliveredWeight.toLocaleString(
                      "id-ID",
                      {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      }
                    )}{" "}
                    kg
                  </p>
                  <p className="text-sm text-muted-foreground">Total Terkirim</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {deliveryData.overallSummary.pendingDeliveries}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Progress Pengiriman Per Item
              </CardTitle>
              <CardDescription>
                Kuantitas kontrak dan sisa yang harus dikirim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveryData.itemSummaries.map((item) => (
                  <div
                    key={item.contractItemId}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.materialName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.materialCode}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {item.deliveryCount} pengiriman
                        </Badge>
                      </div>
                    </div>

                    <Progress
                      value={item.deliveryPercentage}
                      className="h-3"
                    />

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Kuantitas Kontrak</p>
                        <p className="font-medium">
                          {item.contractQuantity.toLocaleString("id-ID")}{" "}
                          {item.satuan.symbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sudah Terkirim</p>
                        <p className="font-medium text-green-600">
                          {item.deliveredQuantity.toLocaleString("id-ID")}{" "}
                          {item.satuan.symbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sisa Pengiriman</p>
                        <p className="font-medium text-orange-600">
                          {item.remainingQuantity.toLocaleString("id-ID")}{" "}
                          {item.satuan.symbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Persentase</p>
                        <p className="font-medium">
                          {item.deliveryPercentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Daftar Pengiriman
              </CardTitle>
              <CardDescription>
                Riwayat semua pengiriman untuk kontrak ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deliveryData.deliveries.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. DO</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Berat Netto</TableHead>
                        <TableHead>Kendaraan</TableHead>
                        <TableHead>Supir</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryData.deliveries.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-medium">
                            {delivery.nomorPengiriman}
                          </TableCell>
                          <TableCell>
                            {new Date(
                              delivery.tanggalPengiriman
                            ).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {delivery.contractItem.material.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {delivery.contractItem.material.code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {delivery.beratNetto.toLocaleString("id-ID")} kg
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{delivery.vendorVehicle.nomorKendaraan}</p>
                              <p className="text-xs text-muted-foreground">
                                {delivery.vendorVehicle.vendor.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{delivery.vendorVehicle.namaSupir}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                statusLabels[delivery.status]?.variant || "default"
                              }
                            >
                              {statusLabels[delivery.status]?.label ||
                                delivery.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetail(delivery)}
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handlePrintSuratPengantar(delivery.id)
                                }
                                title="Cetak Surat Pengantar"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Belum Ada Pengiriman</h3>
                  <p className="text-muted-foreground">
                    Belum ada pengiriman yang tercatat untuk kontrak ini
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengiriman</DialogTitle>
            <DialogDescription>
              {selectedDelivery?.nomorPengiriman}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">No. DO</p>
                  <p className="font-medium">{selectedDelivery.nomorPengiriman}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No. Segel</p>
                  <p className="font-medium">{selectedDelivery.noSegel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {new Date(selectedDelivery.tanggalPengiriman).toLocaleDateString(
                      "id-ID",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operator</p>
                  <p className="font-medium">{selectedDelivery.operatorPenimbang}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Informasi Produk</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Produk</p>
                    <p className="font-medium">
                      {selectedDelivery.contractItem.material.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kode</p>
                    <p className="font-medium">
                      {selectedDelivery.contractItem.material.code}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Detail Timbangan</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Berat Tarra</p>
                    <p className="font-medium">
                      {selectedDelivery.beratTarra.toLocaleString("id-ID")} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Berat Gross</p>
                    <p className="font-medium">
                      {selectedDelivery.beratGross.toLocaleString("id-ID")} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Berat Netto</p>
                    <p className="font-medium text-green-600">
                      {selectedDelivery.beratNetto.toLocaleString("id-ID")} kg
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Mutu Kernel</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">FFA</p>
                    <p className="font-medium">{selectedDelivery.ffa}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kadar Air</p>
                    <p className="font-medium">{selectedDelivery.air}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kotoran</p>
                    <p className="font-medium">{selectedDelivery.kotoran}%</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Informasi Kendaraan</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-medium">
                      {selectedDelivery.vendorVehicle.vendor.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No. Kendaraan</p>
                    <p className="font-medium">
                      {selectedDelivery.vendorVehicle.nomorKendaraan}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Supir</p>
                    <p className="font-medium">
                      {selectedDelivery.vendorVehicle.namaSupir}
                    </p>
                  </div>
                  {selectedDelivery.vendorVehicle.noHpSupir && (
                    <div>
                      <p className="text-sm text-muted-foreground">No. HP Supir</p>
                      <p className="font-medium">
                        {selectedDelivery.vendorVehicle.noHpSupir}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handlePrintSuratPengantar(selectedDelivery.id)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak Surat Pengantar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
