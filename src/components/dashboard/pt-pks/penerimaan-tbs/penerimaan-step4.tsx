"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BadgeDollarSign, CheckCircle2, FileText } from "lucide-react";
import type { PenerimaanFormData } from "./penerimaan-wizard";

type Step4Props = {
  data: Partial<PenerimaanFormData>;
  onUpdate: (data: Partial<PenerimaanFormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
};

type Supplier = {
  id: string;
  ownerName: string;
  type: string;
  address: string;
};

type Material = {
  id: string;
  name: string;
  code: string;
  satuan: { symbol: string };
};

export function PenerimaanStep4({ data, onUpdate, onSubmit, onBack, loading }: Step4Props) {
  // Use parent data directly instead of local state
  const hargaPerKg = data.hargaPerKg || 0;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [transporter, setTransporter] = useState<{ nomorKendaraan: string; namaSupir: string } | null>(null);
  const [nomorPenerimaan] = useState("TBS-" + new Date().getFullYear() + ("0" + (new Date().getMonth() + 1)).slice(-2) + "-XXXXX");

  // Get calculated values from previous steps
  const beratBruto = data.beratBruto || 0;
  const beratTarra = data.beratTarra || 0;
  const beratNetto1 = data.beratNetto1 || 0;
  const potonganPersen = data.potonganPersen || 0;
  const potonganKg = data.potonganKg || 0;
  const beratNetto2 = data.beratNetto2 || 0;
  const totalBayar = beratNetto2 * hargaPerKg;

  useEffect(() => {
    // Fetch all details for preview
    const fetchDetails = async () => {
      if (data.supplierId) {
        try {
          const res = await fetch("/api/pt-pks/penerimaan-tbs/suppliers");
          if (res.ok) {
            const suppliers = await res.json();
            const supplierData = Array.isArray(suppliers)
              ? suppliers.find((s: any) => s.id === data.supplierId)
              : null;
            if (supplierData) {
              setSupplier(supplierData);
            }
          }
        } catch (error) {
          console.error("Error fetching supplier:", error);
        }
      }

      if (data.materialId) {
        try {
          const res = await fetch("/api/pt-pks/material");
          if (res.ok) {
            const materials = await res.json();
            const mat = materials.find((m: Material) => m.id === data.materialId);
            setMaterial(mat || null);
          }
        } catch (error) {
          console.error("Error fetching material:", error);
        }
      }

      // Get transporter info
      if (data.transporterType === "existing" && data.transporterId) {
        try {
          const res = await fetch(`/api/pt-pks/transporter?id=${data.transporterId}`);
          if (res.ok) {
            const transporterData = await res.json();
            setTransporter({
              nomorKendaraan: transporterData.nomorKendaraan,
              namaSupir: transporterData.namaSupir,
            });
          }
        } catch (error) {
          console.error("Error fetching transporter:", error);
        }
      } else if (data.transporterType === "new") {
        setTransporter({
          nomorKendaraan: data.nomorKendaraan || "",
          namaSupir: data.namaSupir || "",
        });
      }
    };

    fetchDetails();
  }, [data]);

  const handleSubmit = () => {
    if (hargaPerKg <= 0) {
      alert("Harga per kg harus lebih dari 0");
      return;
    }

    onUpdate({
      hargaPerKg,
      totalBayar,
    });
    onSubmit();
  };

  return (
    <div className="space-y-6">
      {/* Harga Input Section */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <BadgeDollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Harga & Pembayaran</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hargaPerKg">Harga per Kilogram *</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                Rp
              </div>
              <Input
                id="hargaPerKg"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={hargaPerKg || ""}
                onChange={(e) =>
                  onUpdate({ hargaPerKg: parseFloat(e.target.value) || 0 })
                }
                className="text-right text-lg font-semibold pl-12 pr-16"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                / kg
              </div>
            </div>
            {hargaPerKg > 0 && (
              <p className="text-sm text-muted-foreground">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(hargaPerKg)} per kilogram
              </p>
            )}
          </div>

          {/* Total Bayar */}
          {hargaPerKg > 0 && beratNetto2 > 0 && (
            <div className="p-6 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg mt-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm opacity-90">Total Pembayaran</div>
                  <div className="text-xs opacity-75 mt-1">
                    {beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg × {" "}
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(hargaPerKg)}
                  </div>
                </div>
                <BadgeDollarSign className="h-8 w-8 opacity-50" />
              </div>
              <div className="text-4xl font-bold mb-1">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(totalBayar)}
              </div>
              <div className="text-sm opacity-90">
                {new Intl.NumberFormat("id-ID", {
                  notation: "compact",
                  compactDisplay: "long",
                }).format(totalBayar)} rupiah
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Data Lengkap */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Preview Data Lengkap</h3>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">No. Penerimaan</div>
                <div className="font-mono font-semibold">{nomorPenerimaan}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Tanggal/Jam</div>
                <div className="font-medium">
                  {data.tanggalTerima
                    ? new Date(data.tanggalTerima).toLocaleString("id-ID", {
                        dateStyle: "full",
                        timeStyle: "short",
                      })
                    : "-"}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Produk</div>
                <div className="font-medium">
                  {material ? `${material.name} (${material.code})` : "Loading..."}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Operator Penimbang</div>
                <div className="font-medium">{data.operatorPenimbang || "-"}</div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Supplier</div>
              {supplier ? (
                <div>
                  <div className="font-semibold">{supplier.ownerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {supplier.type} - {supplier.address}
                  </div>
                </div>
              ) : (
                <div>Loading...</div>
              )}
            </div>

            <Separator />

            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Kendaraan & Supir</div>
              {transporter ? (
                <div>
                  <div className="font-semibold">{transporter.nomorKendaraan}</div>
                  <div className="text-sm text-muted-foreground">Supir: {transporter.namaSupir}</div>
                </div>
              ) : (
                <div>Loading...</div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Berat Bruto</div>
                <div className="font-bold text-lg">{beratBruto.toLocaleString("id-ID")} kg</div>
                <div className="text-xs text-muted-foreground">
                  {data.metodeBruto === "SISTEM_TIMBANGAN" ? "Sistem Timbangan" : "Input Manual"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Berat Tarra</div>
                <div className="font-bold text-lg">{beratTarra.toLocaleString("id-ID")} kg</div>
                <div className="text-xs text-muted-foreground">
                  {data.metodeTarra === "SISTEM_TIMBANGAN" ? "Sistem Timbangan" : "Input Manual"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Berat Netto 1</div>
                <div className="font-bold text-lg text-blue-600">
                  {beratNetto1.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                </div>
                <div className="text-xs text-muted-foreground">Bruto - Tarra</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Potongan</div>
                <div className="font-bold text-lg text-orange-600">
                  {potonganPersen}% ({potonganKg.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg)
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Berat Netto 2 (Final)</div>
                <div className="font-bold text-xl text-primary">
                  {beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Harga per kg</div>
                <div className="font-bold text-lg">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(hargaPerKg)}
                </div>
              </div>
            </div>

            <Separator className="border-primary/30" />

            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Total Pembayaran</div>
              <div className="text-3xl font-bold text-primary">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(totalBayar)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Terbilang: <span className="font-medium">{numberToWords(totalBayar)} rupiah</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 mb-2">Konfirmasi Data</h4>
              <p className="text-sm text-green-800 mb-3">
                Pastikan semua data yang ditampilkan sudah benar dan sesuai. Setelah data disimpan, 
                transaksi ini akan tercatat dalam sistem dan stock TBS akan bertambah secara otomatis.
              </p>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Data penerimaan akan tersimpan dengan status <strong>COMPLETED</strong></li>
                <li>Stock material akan bertambah sebesar {beratNetto2.toLocaleString("id-ID")} kg</li>
                <li>Data dapat dilihat di laporan pembayaran supplier</li>
                <li>Nota/dokumen penerimaan dapat dicetak setelah penyimpanan</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Kembali
        </Button>
        <Button
          onClick={handleSubmit}
          size="lg"
          disabled={loading || hargaPerKg <= 0}
          className="min-w-[200px]"
        >
          {loading ? (
            "Menyimpan Data..."
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Simpan & Selesai
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Helper function to convert number to Indonesian words
function numberToWords(num: number): string {
  if (num === 0) return "nol";

  const ones = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
  const tens = ["", "sepuluh", "dua puluh", "tiga puluh", "empat puluh", "lima puluh", "enam puluh", "tujuh puluh", "delapan puluh", "sembilan puluh"];
  const teens = ["sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas", "tujuh belas", "delapan belas", "sembilan belas"];

  if (num < 10) return ones[num] || "";
  if (num >= 10 && num < 20) return teens[num - 10] || "";
  if (num >= 20 && num < 100) {
    return (tens[Math.floor(num / 10)] || "") + (num % 10 !== 0 ? " " + (ones[num % 10] || "") : "");
  }
  if (num >= 100 && num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    return (hundreds === 1 ? "seratus" : (ones[hundreds] || "") + " ratus") + (remainder !== 0 ? " " + numberToWords(remainder) : "");
  }
  if (num >= 1000 && num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return (thousands === 1 ? "seribu" : numberToWords(thousands) + " ribu") + (remainder !== 0 ? " " + numberToWords(remainder) : "");
  }
  if (num >= 1000000 && num < 1000000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    return numberToWords(millions) + " juta" + (remainder !== 0 ? " " + numberToWords(remainder) : "");
  }

  return num.toLocaleString("id-ID");
}
