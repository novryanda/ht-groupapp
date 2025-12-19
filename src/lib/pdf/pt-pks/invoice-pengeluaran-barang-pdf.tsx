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
    borderBottomColor: "#dc2626",
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
    color: "#b91c1c",
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
    color: "#b91c1c",
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
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 4,
    marginRight: 10,
  },
  infoBoxLast: {
    flex: 1,
    backgroundColor: "#fef2f2",
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
  srSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#eff6ff",
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  srTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 5,
  },
  srInfo: {
    fontSize: 9,
    color: "#1e3a8a",
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#b91c1c",
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
  colQty: { width: "12%", textAlign: "right" },
  colHarga: { width: "16%", textAlign: "right" },
  colTotal: { width: "16%", textAlign: "right" },
  colKeterangan: { width: "6%" },
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
  statusApproved: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
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
    borderTopColor: "#b91c1c",
    width: 220,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#b91c1c",
    width: 110,
    textAlign: "right",
    paddingRight: 10,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    width: 110,
    textAlign: "right",
    color: "#b91c1c",
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
    width: "22%",
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

export type PengeluaranBarangPDFData = {
  id: string;
  nomorPengeluaran: string;
  tanggalPengeluaran: string;
  divisi: string;
  requestedBy: string;
  approvedBy?: string;
  tanggalApproval?: string;
  issuedBy?: string;
  receivedByDivisi?: string;
  tanggalDiterima?: string;
  status: string;
  keterangan?: string;
  storeRequest?: {
    nomorSR: string;
    tanggalRequest: string;
  };
  items: Array<{
    id: string;
    jumlahKeluar: number;
    hargaSatuan: number;
    totalHarga: number;
    keterangan?: string;
    material: {
      namaMaterial: string;
      partNumber: string;
      kategoriMaterial: {
        nama: string;
      };
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
};

type InvoicePengeluaranBarangPDFProps = {
  data: PengeluaranBarangPDFData;
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
    case "APPROVED":
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

export const InvoicePengeluaranBarangPDF: React.FC<InvoicePengeluaranBarangPDFProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy HH:mm", { locale: idLocale });
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
          <Text style={styles.title}>PENGELUARAN BARANG</Text>
          <Text style={styles.documentNumber}>{data.nomorPengeluaran}</Text>
          <View style={[styles.statusBadge, getStatusStyle(data.status), { marginTop: 5 }]}>
            <Text style={{ fontSize: 8, fontWeight: "bold" }}>{getStatusLabel(data.status)}</Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Tanggal Pengeluaran</Text>
          <Text style={styles.infoValue}>{formatDateTime(data.tanggalPengeluaran)}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Divisi</Text>
          <Text style={styles.infoValue}>{data.divisi}</Text>
        </View>
        <View style={styles.infoBoxLast}>
          <Text style={styles.infoLabel}>Diminta Oleh</Text>
          <Text style={styles.infoValue}>{data.requestedBy}</Text>
        </View>
      </View>

      {/* Approval Info */}
      <View style={styles.infoSection}>
        {data.approvedBy && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Disetujui Oleh</Text>
            <Text style={styles.infoValue}>{data.approvedBy}</Text>
            {data.tanggalApproval && (
              <Text style={{ fontSize: 7, color: "#6b7280", marginTop: 2 }}>
                {formatDateTime(data.tanggalApproval)}
              </Text>
            )}
          </View>
        )}
        {data.issuedBy && (
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Dikeluarkan Oleh</Text>
            <Text style={styles.infoValue}>{data.issuedBy}</Text>
          </View>
        )}
        {data.receivedByDivisi && (
          <View style={styles.infoBoxLast}>
            <Text style={styles.infoLabel}>Diterima Oleh</Text>
            <Text style={styles.infoValue}>{data.receivedByDivisi}</Text>
            {data.tanggalDiterima && (
              <Text style={{ fontSize: 7, color: "#6b7280", marginTop: 2 }}>
                {formatDateTime(data.tanggalDiterima)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* SR Reference */}
      {data.storeRequest && (
        <View style={styles.srSection}>
          <Text style={styles.srTitle}>Referensi Store Request</Text>
          <Text style={styles.srInfo}>No. SR: {data.storeRequest.nomorSR}</Text>
          <Text style={styles.srInfo}>
            Tanggal: {formatDate(data.storeRequest.tanggalRequest)}
          </Text>
        </View>
      )}

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
          <Text style={[styles.tableHeaderCell, styles.colPartNumber]}>Part No.</Text>
          <Text style={[styles.tableHeaderCell, styles.colNama]}>Nama Material</Text>
          <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty Keluar</Text>
          <Text style={[styles.tableHeaderCell, styles.colHarga]}>Harga Satuan</Text>
          <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total Harga</Text>
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
              {formatNumber(item.jumlahKeluar)} {item.material.satuanMaterial.symbol}
            </Text>
            <Text style={[styles.tableCell, styles.colHarga]}>
              {formatCurrency(item.hargaSatuan)}
            </Text>
            <Text style={[styles.tableCell, styles.colTotal]}>
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
          <Text style={styles.signatureLabel}>Diminta Oleh</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{data.requestedBy}</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Disetujui Oleh</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{data.approvedBy || ".................."}</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Dikeluarkan Oleh</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{data.issuedBy || ".................."}</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Diterima Oleh</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureName}>{data.receivedByDivisi || ".................."}</Text>
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
