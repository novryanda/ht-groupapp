import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register fonts if needed
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Roboto",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 3,
  },
  nomor: {
    fontSize: 10,
    marginBottom: 15,
  },
  typeSection: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "center",
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginRight: 10,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  checkbox: {
    width: 12,
    height: 12,
    border: "1px solid black",
    marginLeft: 5,
    marginRight: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    fontSize: 10,
  },
  sectionContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  leftSection: {
    width: "48%",
    paddingRight: 10,
  },
  rightSection: {
    width: "52%",
    paddingLeft: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    textDecoration: "underline",
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  fieldLabel: {
    width: "40%",
    fontSize: 9,
  },
  fieldColon: {
    width: "5%",
    fontSize: 9,
  },
  fieldValue: {
    width: "55%",
    fontSize: 9,
    borderBottom: "1px solid black",
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid black",
    borderTop: "1px solid black",
    paddingVertical: 5,
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid black",
    paddingVertical: 5,
  },
  tableCol1: {
    width: "33.33%",
    paddingHorizontal: 5,
    fontSize: 9,
    textAlign: "center",
  },
  tableCol2: {
    width: "33.33%",
    paddingHorizontal: 5,
    fontSize: 9,
    textAlign: "center",
  },
  tableCol3: {
    width: "33.34%",
    paddingHorizontal: 5,
    fontSize: 9,
    textAlign: "center",
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  signatureBox: {
    width: "45%",
    textAlign: "center",
  },
  signatureLabel: {
    fontSize: 9,
    marginBottom: 50,
  },
  signatureRole: {
    fontSize: 9,
  },
});

type SupplierFormPDFProps = {
  supplier: {
    id: string;
    type: string;
    ownerName: string;
    companyName: string | null;
    address: string;
    personalPhone: string;
    companyPhone: string | null;
    rampPeronAddress: string | null;
    longitude: number;
    latitude: number;
    swadaya: boolean;
    kelompok: boolean;
    perusahaan: boolean;
    jenisBibit: string | null;
    certificationISPO: boolean;
    certificationRSPO: boolean;
    aktePendirian: string | null;
    aktePerubahan: string | null;
    nib: string | null;
    siup: string | null;
    npwp: string | null;
    salesChannel: string | null;
    salesChannelDetails: string | null;
    transportation: string | null;
    transportationUnits: number | null;
    gardenProfiles: Array<{
      tahunTanam: number;
      luasKebun: number;
      estimasiSupplyTBS: number;
    }>;
  };
};

export const SupplierFormPDF: React.FC<SupplierFormPDFProps> = ({
  supplier,
}) => {
  const supplierTypeLabels: { [key: string]: string } = {
    RAMP_PERON: "Ramp/Peron",
    KUD: "KUD",
    KELOMPOK_TANI: "Kelompok Tani",
  };

  const getCheckbox = (checked: boolean) => (
    <View style={styles.checkbox}>{checked && <Text>✓</Text>}</View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PT. TARO RAKAYA TASYRA</Text>
          <Text style={styles.subtitle}>FORM CALON SUPLIER TBS SAWIT</Text>
          <Text style={styles.nomor}>
            Nomor : ...... /PT.TRT/SUPP-TBS/mm/2024
          </Text>
        </View>

        {/* Type Section */}
        <View style={styles.typeSection}>
          <Text style={styles.typeLabel}>Type Supplier :</Text>
          <Text style={{ fontSize: 10 }}>{supplierTypeLabels[supplier.type] || supplier.type}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.sectionContainer}>
          {/* Left Section - Identitas */}
          <View style={styles.leftSection}>
            <Text style={styles.sectionTitle}>IDENTITAS</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Nama Pemilik</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>{supplier.ownerName}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Alamat</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>{supplier.address}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Nomor HP/Telp</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>{supplier.personalPhone}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Nama Perusahaan</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>
                {supplier.companyName || "-"}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Alamat Ramp/Peron</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>
                {supplier.rampPeronAddress || "-"}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Nomor HP/Telp</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>
                {supplier.companyPhone || "-"}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Tikoord Ramp/Peron</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Bujur</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>{supplier.longitude || "-"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Lintang</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>{supplier.latitude || "-"}</Text>
            </View>
          </View>

          {/* Right Section - Profil Kebun */}
          <View style={styles.rightSection}>
            <Text style={styles.sectionTitle}>PROFIL KEBUN</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol1}>Tahun Tanam</Text>
                <Text style={styles.tableCol2}>Luas Kebun</Text>
                <Text style={styles.tableCol3}>Estimasi Supply TBS</Text>
              </View>
              {supplier.gardenProfiles.map((profile, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCol1}>{profile.tahunTanam}</Text>
                  <Text style={styles.tableCol2}>{profile.luasKebun}</Text>
                  <Text style={styles.tableCol3}>
                    {profile.estimasiSupplyTBS}
                  </Text>
                </View>
              ))}
              <View style={styles.tableRow}>
                <Text style={styles.tableCol1}>Total</Text>
                <Text style={styles.tableCol2}>
                  {supplier.gardenProfiles.reduce(
                    (sum, p) => sum + p.luasKebun,
                    0
                  )}
                </Text>
                <Text style={styles.tableCol3}>
                  {supplier.gardenProfiles.reduce(
                    (sum, p) => sum + p.estimasiSupplyTBS,
                    0
                  )}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>TIPE PENGELOLAAN KEBUN</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Jenis Pengelolaan</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>
                {supplier.swadaya ? "Swadaya" : supplier.kelompok ? "Kelompok" : supplier.perusahaan ? "Perusahaan" : "-"}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Jenis Bibit</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>
                {supplier.jenisBibit || "-"}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Sertifikasi Kebun</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>
                {supplier.certificationISPO && supplier.certificationRSPO
                  ? "ISPO, RSPO"
                  : supplier.certificationISPO
                  ? "ISPO"
                  : supplier.certificationRSPO
                  ? "RSPO"
                  : "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Sections */}
        <View style={styles.sectionContainer}>
          <View style={styles.leftSection}>
            <Text style={styles.sectionTitle}>PROFIL IZIN USAHA</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Akte Pendirian</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>
                {supplier.aktePendirian || "-"}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Akte Perubahan</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>
                {supplier.aktePerubahan || "-"}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>NIB</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>{supplier.nib || "-"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>SIUP</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>{supplier.siup || "-"}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>NPWP</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>{supplier.npwp || "-"}</Text>
            </View>
          </View>

          <View style={styles.rightSection}>
            <Text style={styles.sectionTitle}>PENJUALAN TBS</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Kanal Penjualan</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>
                {supplier.salesChannel === "LANGSUNG_PKS"
                  ? "Langsung PKS"
                  : supplier.salesChannel === "AGEN"
                  ? supplier.salesChannelDetails
                    ? `Agen (${supplier.salesChannelDetails})`
                    : "Agen"
                  : "-"}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>TRANSPORTASI</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Jenis Transportasi</Text>
              <Text style={styles.fieldColon}>:</Text>
              <Text style={styles.fieldValue}>
                {supplier.transportation === "MILIK_SENDIRI"
                  ? `Milik Sendiri${supplier.transportationUnits ? ` (${supplier.transportationUnits} unit)` : ""}`
                  : supplier.transportation === "JASA_PIHAK_KE_3"
                  ? `Jasa Pihak ke-3${supplier.transportationUnits ? ` (${supplier.transportationUnits} unit)` : ""}`
                  : "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>catatan :</Text>
            <Text style={styles.signatureRole}>(tim pembelian)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>
              Pkl. Kerinci, .... / .... / 2024
            </Text>
            <Text style={styles.signatureRole}>(calon supplier)</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
