import React from "react";
import {
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getLogoBase64, COMPANY_NAME, COMPANY_SUBTITLE } from "../logo";

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf" },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Roboto",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#7c3aed",
    paddingBottom: 15,
  },
  logo: {
    width: 80,
    height: 80,
  },
  headerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6d28d9",
  },
  companySubtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  documentTitle: {
    textAlign: "right",
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6d28d9",
  },
  documentNumber: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 5,
    color: "#374151",
  },
  infoSection: {
    flexDirection: "row",
    marginBottom: 15,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#faf5ff",
    padding: 10,
    borderRadius: 4,
    marginRight: 10,
  },
  infoBoxLast: {
    flex: 1,
    backgroundColor: "#faf5ff",
    padding: 10,
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
  },
  vendorSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#0ea5e9",
  },
  vendorTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0369a1",
    marginBottom: 5,
  },
  vendorInfo: {
    fontSize: 9,
    color: "#0c4a6e",
    marginBottom: 2,
  },
  prSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
  },
  prTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 5,
  },
  prInfo: {
    fontSize: 9,
    color: "#14532d",
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#6d28d9",
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 8,
    backgroundColor: "#ffffff",
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    padding: 8,
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    fontSize: 9,
    color: "#374151",
  },
  colNo: { width: "5%" },
  colPartNumber: { width: "12%" },
  colNama: { width: "28%" },
  colQty: { width: "10%", textAlign: "right" },
  colHarga: { width: "15%", textAlign: "right" },
  colSubtotal: { width: "18%", textAlign: "right" },
  colKeterangan: { width: "12%" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusIssued: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  statusDraft: {
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
  },
  statusCompleted: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusCancelled: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  totalSection: {
    marginTop: 10,
    alignItems: "flex-end",
    paddingRight: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
    width: 220,
  },
  totalLabel: {
    fontSize: 9,
    color: "#6b7280",
    width: 110,
    textAlign: "right",
    paddingRight: 10,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
    width: 110,
    textAlign: "right",
    color: "#111827",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 2,
    borderTopColor: "#6d28d9",
    width: 220,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#6d28d9",
    width: 110,
    textAlign: "right",
    paddingRight: 10,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    width: 110,
    textAlign: "right",
    color: "#6d28d9",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  signatureBox: {
    width: "30%",
    textAlign: "center",
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 40,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#374151",
    paddingTop: 5,
  },
  signatureName: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  keterangan: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fffbeb",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  keteranganLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 3,
  },
  keteranganText: {
    fontSize: 9,
    color: "#78350f",
  },
  paymentTerms: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  paymentTermsLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#991b1b",
    marginBottom: 3,
  },
  paymentTermsText: {
    fontSize: 9,
    color: "#7f1d1d",
  },
});

export type PurchaseOrderPDFData = {
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
  purchaseRequest?: {
    id: string;
    nomorPR: string;
    tanggalRequest: string;
    requestedBy: string;
    divisi?: string;
  };
  items: Array<{
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
  }>;
};

type InvoicePOPDFProps = {
  data: PurchaseOrderPDFData;
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

const getStatusStyle = (status: string) => {
  switch (status) {
    case "ISSUED":
      return styles.statusIssued;
    case "COMPLETED":
    case "PARTIAL_RECEIVED":
      return styles.statusCompleted;
    case "CANCELLED":
      return styles.statusCancelled;
    default:
      return styles.statusDraft;
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    ISSUED: "Diterbitkan",
    PARTIAL_RECEIVED: "Diterima Sebagian",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };
  return labels[status] || status;
};

export const InvoicePOPDF: React.FC<InvoicePOPDFProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  const logoSrc = getLogoBase64();

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Image style={styles.logo} src={logoSrc} />
        <View style={styles.headerInfo}>
          <Text style={styles.companyName}>{COMPANY_NAME}</Text>
          <Text style={styles.companySubtitle}>{COMPANY_SUBTITLE}</Text>
        </View>
        <View style={styles.documentTitle}>
          <Text style={styles.title}>PURCHASE ORDER</Text>
          <Text style={styles.documentNumber}>{data.nomorPO}</Text>
          <View style={[styles.statusBadge, getStatusStyle(data.status), { marginTop: 5 }]}>
            <Text style={{ fontSize: 8, fontWeight: "bold" }}>{getStatusLabel(data.status)}</Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Tanggal PO</Text>
          <Text style={styles.infoValue}>{formatDate(data.tanggalPO)}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Diterbitkan Oleh</Text>
          <Text style={styles.infoValue}>{data.issuedBy}</Text>
        </View>
        <View style={styles.infoBoxLast}>
          <Text style={styles.infoLabel}>Tgl Kirim Diharapkan</Text>
          <Text style={styles.infoValue}>
            {data.tanggalKirimDiharapkan ? formatDate(data.tanggalKirimDiharapkan) : "-"}
          </Text>
        </View>
      </View>

      {/* Vendor Section */}
      <View style={styles.vendorSection}>
        <Text style={styles.vendorTitle}>Vendor / Supplier</Text>
        <Text style={styles.vendorInfo}>Nama: {data.vendorName}</Text>
        {data.vendorAddress && (
          <Text style={styles.vendorInfo}>Alamat: {data.vendorAddress}</Text>
        )}
        {data.vendorPhone && (
          <Text style={styles.vendorInfo}>Telepon: {data.vendorPhone}</Text>
        )}
      </View>

      {/* PR Reference */}
      {data.purchaseRequest && (
        <View style={styles.prSection}>
          <Text style={styles.prTitle}>Referensi Purchase Request</Text>
          <Text style={styles.prInfo}>No. PR: {data.purchaseRequest.nomorPR}</Text>
          <Text style={styles.prInfo}>
            Tanggal: {formatDate(data.purchaseRequest.tanggalRequest)}
          </Text>
          <Text style={styles.prInfo}>Diminta oleh: {data.purchaseRequest.requestedBy}</Text>
          {data.purchaseRequest.divisi && (
            <Text style={styles.prInfo}>Divisi: {data.purchaseRequest.divisi}</Text>
          )}
        </View>
      )}

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
          <Text style={[styles.tableHeaderCell, styles.colPartNumber]}>Part No.</Text>
          <Text style={[styles.tableHeaderCell, styles.colNama]}>Nama Material</Text>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.colHarga]}>Harga Satuan</Text>
          <Text style={[styles.tableHeaderCell, styles.colSubtotal]}>Subtotal</Text>
        </View>
        {data.items.map((item, index) => (
          <View
            key={item.id}
            style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
            <Text style={[styles.tableCell, styles.colPartNumber]}>
              {item.material.partNumber}
            </Text>
            <Text style={[styles.tableCell, styles.colNama]}>
              {item.material.namaMaterial}
            </Text>
            <Text style={[styles.tableCell, styles.colQty]}>
              {formatNumber(item.jumlahOrder)} {item.material.satuanMaterial.symbol}
            </Text>
            <Text style={[styles.tableCell, styles.colHarga]}>
              {formatCurrency(item.hargaSatuan)}
            </Text>
            <Text style={[styles.tableCell, styles.colSubtotal]}>
              {formatCurrency(item.subtotal)}
            </Text>
          </View>
        ))}
      </View>

      {/* Total Section */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
        </View>
        {data.discountAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Diskon {data.discountType === "PERCENT" ? `(${data.discountPercent}%)` : ""}
            </Text>
            <Text style={[styles.totalValue, { color: "#16a34a" }]}>
              - {formatCurrency(data.discountAmount)}
            </Text>
          </View>
        )}
        {data.taxAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>PPN ({data.taxPercent}%)</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.taxAmount)}</Text>
          </View>
        )}
        {data.shipping > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Biaya Pengiriman</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.shipping)}</Text>
          </View>
        )}
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>TOTAL</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(data.totalAmount)}</Text>
        </View>
      </View>

      {/* Payment Terms */}
      {data.termPembayaran && (
        <View style={styles.paymentTerms}>
          <Text style={styles.paymentTermsLabel}>Syarat Pembayaran:</Text>
          <Text style={styles.paymentTermsText}>{data.termPembayaran}</Text>
        </View>
      )}

      {/* Keterangan */}
      {data.keterangan && (
        <View style={styles.keterangan}>
          <Text style={styles.keteranganLabel}>Keterangan:</Text>
          <Text style={styles.keteranganText}>{data.keterangan}</Text>
        </View>
      )}

      {/* Signature Section */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Diterbitkan Oleh</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{data.issuedBy}</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Disetujui Oleh</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{data.approvedBy || ".................."}</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Penerima</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>..................</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Dokumen ini dicetak pada {format(new Date(), "dd MMMM yyyy HH:mm", { locale: idLocale })} • {COMPANY_NAME}
        </Text>
      </View>
    </Page>
  );
};
