import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Register fonts
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Roboto",
  },
  header: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 8,
    marginBottom: 1,
    color: "#333",
  },
  contractTitle: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    marginVertical: 10,
    textDecoration: "underline",
  },
  contractNumber: {
    textAlign: "center",
    fontSize: 10,
    marginBottom: 15,
  },
  section: {
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: "30%",
    fontSize: 9,
  },
  colon: {
    width: "3%",
    fontSize: 9,
  },
  value: {
    width: "67%",
    fontSize: 9,
  },
  table: {
    marginTop: 8,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    borderBottomStyle: "solid",
    paddingVertical: 3,
    paddingHorizontal: 3,
    fontSize: 8,
  },
  colNo: {
    width: "6%",
    textAlign: "center",
  },
  colProduct: {
    width: "30%",
  },
  colQty: {
    width: "15%",
    textAlign: "right",
  },
  colPrice: {
    width: "20%",
    textAlign: "right",
  },
  colTotal: {
    width: "29%",
    textAlign: "right",
  },
  totalSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    paddingTop: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  totalLabel: {
    width: "30%",
    textAlign: "right",
    paddingRight: 10,
    fontSize: 9,
  },
  totalValue: {
    width: "25%",
    textAlign: "right",
    fontSize: 9,
  },
  grandTotal: {
    fontWeight: "bold",
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    paddingTop: 3,
  },
  termsSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
  },
  termItem: {
    fontSize: 8,
    marginBottom: 2,
    paddingLeft: 10,
  },
  signature: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "40%",
    textAlign: "center",
  },
  signaturePlace: {
    fontSize: 9,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 9,
    marginBottom: 40,
  },
  signatureName: {
    fontSize: 9,
    fontWeight: "bold",
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    paddingTop: 3,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 7,
    color: "#666",
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    borderTopStyle: "solid",
    paddingTop: 5,
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 10,
  },
  infoColumn: {
    width: "50%",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
    textDecoration: "underline",
  },
});

const taxStatusLabels: Record<string, string> = {
  NON_PKP: "Non PKP (0%)",
  PKP_11: "PKP 11%",
  PKP_1_1: "PKP 1.1%",
};

type ContractItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
  material: {
    id: string;
    code: string;
    name: string;
    satuan: {
      name: string;
      symbol: string;
    };
  };
};

type ContractData = {
  id: string;
  contractNumber: string;
  contractDate: Date | string;
  startDate: Date | string;
  endDate: Date | string;
  deliveryDate: Date | string;
  deliveryAddress: string;
  notes?: string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  buyer: {
    id: string;
    code: string;
    name: string;
    contactPerson: string;
    phone: string;
    email?: string | null;
    address: string;
    npwp?: string | null;
    taxStatus: string;
  };
  company: {
    id: string;
    code: string;
    name: string;
  };
  contractItems: ContractItem[];
};

type ContractPDFProps = {
  data: ContractData;
};

export const ContractPDF: React.FC<ContractPDFProps> = ({ data }) => {
  const formatDate = (dateString: Date | string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: idLocale });
    } catch {
      return String(dateString);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Company */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{data.company.name}</Text>
          <Text style={styles.companyAddress}>
            Jl. Raya PKS, Kecamatan Industri, Kabupaten Riau
          </Text>
          <Text style={styles.companyAddress}>
            Telp: (0761) 123456 | Email: info@{data.company.code.toLowerCase()}.com
          </Text>
        </View>

        {/* Contract Title */}
        <Text style={styles.contractTitle}>PURCHASE CONTRACT</Text>
        <Text style={styles.contractNumber}>{data.contractNumber}</Text>

        {/* Buyer & Seller Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>BUYER</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nama</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{data.buyer.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>NPWP</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{data.buyer.npwp || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Alamat</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{data.buyer.address}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionTitle}>SELLER</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nama</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{data.company.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kode</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{data.company.code}</Text>
            </View>
          </View>
        </View>

        {/* Contract Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMMODITY & QUANTITY</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colNo}>No</Text>
              <Text style={styles.colProduct}>Product</Text>
              <Text style={styles.colQty}>Quantity</Text>
              <Text style={styles.colPrice}>Unit Price</Text>
              <Text style={styles.colTotal}>Total</Text>
            </View>
            {data.contractItems.map((item, index) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colProduct}>{item.material.name}</Text>
                <Text style={styles.colQty}>
                  {formatNumber(item.quantity)} {item.material.satuan.symbol}
                </Text>
                <Text style={styles.colPrice}>
                  {formatCurrency(item.unitPrice)}/{item.material.satuan.symbol}
                </Text>
                <Text style={styles.colTotal}>
                  {formatCurrency(item.totalPrice)}
                </Text>
              </View>
            ))}
          </View>

          {/* Total Section */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>NET AMOUNT</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                TAX AMOUNT ({taxStatusLabels[data.buyer.taxStatus]})
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(data.taxAmount)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>PAYMENT TERMS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>Payable in 2 Partial Amount (50-50)</Text>
          </View>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>INCO TERMS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Terms</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>Franco</Text>
          </View>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>DELIVERY</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery To</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{data.deliveryAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Date</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>
              {formatDate(data.startDate)} - {formatDate(data.endDate)}
            </Text>
          </View>
        </View>

        {data.notes && (
          <View style={styles.termsSection}>
            <Text style={styles.sectionTitle}>SPECIAL NOTES</Text>
            <Text style={styles.termItem}>{data.notes}</Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Seller,</Text>
            <Text style={styles.signatureLabel}>{data.company.name}</Text>
            <Text style={styles.signatureName}>(...........................)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signaturePlace}>
              {formatDate(data.contractDate)}
            </Text>
            <Text style={styles.signatureLabel}>Buyer,</Text>
            <Text style={styles.signatureLabel}>{data.buyer.name}</Text>
            <Text style={styles.signatureName}>{data.buyer.contactPerson}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Dokumen ini dicetak pada {format(new Date(), "dd MMMM yyyy HH:mm:ss", { locale: idLocale })}
          </Text>
          <Text>{data.company.name} - Contract No: {data.contractNumber}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ContractPDF;
