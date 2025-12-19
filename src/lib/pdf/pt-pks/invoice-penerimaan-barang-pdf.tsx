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
    borderBottomColor: "#0891b2",
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
    color: "#0e7490",
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
    color: "#0e7490",
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
    backgroundColor: "#ecfeff",
    padding: 10,
    borderRadius: 4,
    marginRight: 10,
  },
  infoBoxLast: {
    flex: 1,
    backgroundColor: "#ecfeff",
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
  poSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#faf5ff",
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#9333ea",
  },
  poTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#7e22ce",
    marginBottom: 5,
  },
  poInfo: {
    fontSize: 9,
    color: "#581c87",
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0e7490",
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
  colNo: { width: "6%" },
  colPartNumber: { width: "14%" },
  colNama: { width: "30%" },
  colOrder: { width: "12%", textAlign: "right" },
  colDiterima: { width: "12%", textAlign: "right" },
  colHarga: { width: "14%", textAlign: "right" },
  colSubtotal: { width: "12%", textAlign: "right" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusCompleted: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusDraft: {
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
  },
  totalSection: {
    marginTop: 10,
    alignItems: "flex-end",
    paddingRight: 10,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 2,
    borderTopColor: "#0e7490",
    width: 220,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0e7490",
    width: 110,
    textAlign: "right",
    paddingRight: 10,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    width: 110,
    textAlign: "right",
    color: "#0e7490",
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
    marginTop: 40,
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
});

export type PenerimaanBarangPDFData = {
  id: string;
  nomorPenerimaan: string;
  tanggalPenerimaan: string;
  receivedBy: string;
  checkedBy?: string;
  status: string;
  keterangan?: string;
  vendorName?: string;
  purchaseOrder?: {
    id: string;
    nomorPO: string;
    tanggalPO: string;
    vendorName: string;
    totalAmount: number;
  };
  items: Array<{
    id: string;
    jumlahOrder?: number;
    jumlahDiterima: number;
    hargaSatuan: number;
    totalHarga: number;
    lokasiPenyimpanan?: string;
    keterangan?: string;
    material: {
      id: string;
      partNumber: string;
      namaMaterial: string;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
};

type InvoicePenerimaanBarangPDFProps = {
  data: PenerimaanBarangPDFData;
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
    case "COMPLETED":
      return styles.statusCompleted;
    case "PENDING":
      return styles.statusPending;
    default:
      return styles.statusDraft;
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING: "Menunggu Verifikasi",
    COMPLETED: "Selesai",
  };
  return labels[status] || status;
};

export const InvoicePenerimaanBarangPDF: React.FC<InvoicePenerimaanBarangPDFProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  const calculateTotal = () => {
    return data.items.reduce((sum, item) => sum + item.totalHarga, 0);
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
          <Text style={styles.title}>PENERIMAAN BARANG</Text>
          <Text style={styles.documentNumber}>{data.nomorPenerimaan}</Text>
          <View style={[styles.statusBadge, getStatusStyle(data.status), { marginTop: 5 }]}>
            <Text style={{ fontSize: 8, fontWeight: "bold" }}>{getStatusLabel(data.status)}</Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Tanggal Penerimaan</Text>
          <Text style={styles.infoValue}>{formatDate(data.tanggalPenerimaan)}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Diterima Oleh</Text>
          <Text style={styles.infoValue}>{data.receivedBy}</Text>
        </View>
        <View style={styles.infoBoxLast}>
          <Text style={styles.infoLabel}>Supplier</Text>
          <Text style={styles.infoValue}>
            {data.vendorName || data.purchaseOrder?.vendorName || "-"}
          </Text>
        </View>
      </View>

      {/* PO Reference */}
      {data.purchaseOrder && (
        <View style={styles.poSection}>
          <Text style={styles.poTitle}>Referensi Purchase Order</Text>
          <Text style={styles.poInfo}>No. PO: {data.purchaseOrder.nomorPO}</Text>
          <Text style={styles.poInfo}>
            Tanggal PO: {formatDate(data.purchaseOrder.tanggalPO)}
          </Text>
          <Text style={styles.poInfo}>
            Total PO: {formatCurrency(data.purchaseOrder.totalAmount)}
          </Text>
        </View>
      )}

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
          <Text style={[styles.tableHeaderCell, styles.colPartNumber]}>Part No.</Text>
          <Text style={[styles.tableHeaderCell, styles.colNama]}>Nama Material</Text>
          <Text style={[styles.tableHeaderCell, styles.colOrder]}>Order</Text>
          <Text style={[styles.tableHeaderCell, styles.colDiterima]}>Diterima</Text>
          <Text style={[styles.tableHeaderCell, styles.colHarga]}>Harga</Text>
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
            <Text style={[styles.tableCell, styles.colOrder]}>
              {item.jumlahOrder ? `${formatNumber(item.jumlahOrder)} ${item.material.satuanMaterial.symbol}` : "-"}
            </Text>
            <Text style={[styles.tableCell, styles.colDiterima]}>
              {formatNumber(item.jumlahDiterima)} {item.material.satuanMaterial.symbol}
            </Text>
            <Text style={[styles.tableCell, styles.colHarga]}>
              {formatCurrency(item.hargaSatuan)}
            </Text>
            <Text style={[styles.tableCell, styles.colSubtotal]}>
              {formatCurrency(item.totalHarga)}
            </Text>
          </View>
        ))}
      </View>

      {/* Total Section */}
      <View style={styles.totalSection}>
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>Total Nilai</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(calculateTotal())}</Text>
        </View>
      </View>

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
          <Text style={styles.signatureLabel}>Pengirim</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>..................</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Penerima</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{data.receivedBy}</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Diperiksa Oleh</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{data.checkedBy || ".................."}</Text>
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
