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
    borderBottomColor: "#059669",
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
    color: "#047857",
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
    color: "#047857",
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
    backgroundColor: "#f0fdf4",
    padding: 10,
    borderRadius: 4,
    marginRight: 10,
  },
  infoBoxLast: {
    flex: 1,
    backgroundColor: "#f0fdf4",
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
    backgroundColor: "#fef3c7",
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  vendorTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 5,
  },
  vendorInfo: {
    fontSize: 9,
    color: "#78350f",
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#047857",
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
  colQty: { width: "10%", textAlign: "right" },
  colHarga: { width: "18%", textAlign: "right" },
  colSubtotal: { width: "18%", textAlign: "right" },
  colKeterangan: { width: "4%" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusApproved: {
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
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
    width: 200,
  },
  totalLabel: {
    fontSize: 9,
    color: "#6b7280",
    width: 100,
    textAlign: "right",
    paddingRight: 10,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
    width: 100,
    textAlign: "right",
    color: "#111827",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 2,
    borderTopColor: "#047857",
    width: 200,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#047857",
    width: 100,
    textAlign: "right",
    paddingRight: 10,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    width: 100,
    textAlign: "right",
    color: "#047857",
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

export type PurchaseRequestPDFData = {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  tipePembelian: string;
  divisi?: string;
  requestedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  vendorNameDirect?: string;
  vendorAddressDirect?: string;
  vendorPhoneDirect?: string;
  status: string;
  keterangan?: string;
  items: Array<{
    id: string;
    jumlahRequest: number;
    estimasiHarga: number;
    keterangan?: string;
    material: {
      partNumber: string;
      namaMaterial: string;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
};

type InvoicePRPDFProps = {
  data: PurchaseRequestPDFData;
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
    case "APPROVED":
    case "COMPLETED":
      return styles.statusApproved;
    case "PENDING":
      return styles.statusPending;
    default:
      return styles.statusDraft;
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    PENDING: "Menunggu Approval",
    APPROVED: "Disetujui",
    COMPLETED: "Selesai",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
  };
  return labels[status] || status;
};

const getTipePembelianLabel = (tipe: string) => {
  const labels: Record<string, string> = {
    STOCK: "Pengadaan Stock",
    DIRECT: "Pembelian Langsung",
  };
  return labels[tipe] || tipe;
};

export const InvoicePRPDF: React.FC<InvoicePRPDFProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  const calculateTotal = () => {
    return data.items.reduce(
      (sum, item) => sum + item.estimasiHarga * item.jumlahRequest,
      0
    );
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
          <Text style={styles.title}>PURCHASE REQUEST</Text>
          <Text style={styles.documentNumber}>{data.nomorPR}</Text>
          <View style={[styles.statusBadge, getStatusStyle(data.status), { marginTop: 5 }]}>
            <Text style={{ fontSize: 8, fontWeight: "bold" }}>{getStatusLabel(data.status)}</Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Tanggal Request</Text>
          <Text style={styles.infoValue}>{formatDate(data.tanggalRequest)}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Tipe Pembelian</Text>
          <Text style={styles.infoValue}>{getTipePembelianLabel(data.tipePembelian)}</Text>
        </View>
        <View style={styles.infoBoxLast}>
          <Text style={styles.infoLabel}>Diminta Oleh</Text>
          <Text style={styles.infoValue}>{data.requestedBy}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        {data.divisi && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Divisi</Text>
            <Text style={styles.infoValue}>{data.divisi}</Text>
          </View>
        )}
        {data.approvedBy && (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Disetujui Oleh</Text>
              <Text style={styles.infoValue}>{data.approvedBy}</Text>
            </View>
            <View style={styles.infoBoxLast}>
              <Text style={styles.infoLabel}>Tanggal Approval</Text>
              <Text style={styles.infoValue}>
                {data.tanggalApproval ? formatDate(data.tanggalApproval) : "-"}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Vendor Section for Direct Purchase */}
      {data.tipePembelian === "DIRECT" && data.vendorNameDirect && (
        <View style={styles.vendorSection}>
          <Text style={styles.vendorTitle}>Informasi Vendor/Supplier</Text>
          <Text style={styles.vendorInfo}>Nama: {data.vendorNameDirect}</Text>
          {data.vendorAddressDirect && (
            <Text style={styles.vendorInfo}>Alamat: {data.vendorAddressDirect}</Text>
          )}
          {data.vendorPhoneDirect && (
            <Text style={styles.vendorInfo}>Telepon: {data.vendorPhoneDirect}</Text>
          )}
        </View>
      )}

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
          <Text style={[styles.tableHeaderCell, styles.colPartNumber]}>Part Number</Text>
          <Text style={[styles.tableHeaderCell, styles.colNama]}>Nama Material</Text>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
          <Text style={[styles.tableHeaderCell, styles.colHarga]}>Est. Harga</Text>
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
              {formatNumber(item.jumlahRequest)} {item.material.satuanMaterial.symbol}
            </Text>
            <Text style={[styles.tableCell, styles.colHarga]}>
              {formatCurrency(item.estimasiHarga)}
            </Text>
            <Text style={[styles.tableCell, styles.colSubtotal]}>
              {formatCurrency(item.estimasiHarga * item.jumlahRequest)}
            </Text>
          </View>
        ))}
      </View>

      {/* Total Section */}
      <View style={styles.totalSection}>
        <View style={styles.grandTotal}>
          <Text style={styles.grandTotalLabel}>Total Estimasi</Text>
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
          <Text style={styles.signatureLabel}>Diminta Oleh</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{data.requestedBy}</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Diketahui Oleh</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>..................</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Disetujui Oleh</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{data.approvedBy || ".................."}</Text>
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
