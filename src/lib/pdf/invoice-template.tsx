import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import type { Invoice, InvoiceLineItem, ClinicSnapshot } from "@/types/supabase";

// Fonts are registered on-demand by calling registerFonts() from the route handler.
// We do NOT call Font.register() at module-top to avoid Turbopack cwd() issues.

export function registerFonts(inter400: string, inter600: string, sarabun400: string, sarabun600: string) {
  Font.register({
    family: "Inter",
    fonts: [
      { src: inter400, fontWeight: 400 },
      { src: inter600, fontWeight: 600 },
    ],
  });
  Font.register({
    family: "Sarabun",
    fonts: [
      { src: sarabun400, fontWeight: 400 },
      { src: sarabun600, fontWeight: 600 },
    ],
  });
}

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
  "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
  "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

function toBuddhistDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function fmt(n: number): string {
  return n.toLocaleString("en", { minimumFractionDigits: 2 });
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 10,
    paddingHorizontal: 50,
    paddingVertical: 40,
    color: "#1A1612",
    backgroundColor: "#ffffff",
  },
  /* ── Header ── */
  headerBlock: { alignItems: "center", marginBottom: 8 },
  logoImage: { width: 72, height: 72, objectFit: "contain", marginBottom: 6 },
  clinicName: { fontSize: 13, fontWeight: 600, textAlign: "center", marginBottom: 4 },
  clinicDetail: { fontSize: 9, textAlign: "center", color: "#444444", marginBottom: 2 },
  divider: { borderBottom: "1px solid #888888", marginVertical: 10 },
  /* ── Title ── */
  receiptTitle: { fontSize: 15, fontWeight: 600, textAlign: "center", marginBottom: 12 },
  /* ── Meta (right-aligned) ── */
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 3 },
  metaLabel: { fontSize: 10, color: "#333333", marginRight: 4 },
  metaValue: { fontSize: 10 },
  /* ── Patient ── */
  patientRow: { marginTop: 6, marginBottom: 12 },
  patientName: { fontSize: 11 },
  /* ── Table ── */
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F1EB",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderTop: "1px solid #888888",
    borderBottom: "1px solid #888888",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottom: "0.5px solid #CCCCCC",
  },
  colNum:   { width: 30, textAlign: "center" },
  colDesc:  { flex: 1 },
  colQty:   { width: 38, textAlign: "center" },
  colUnit:  { width: 42, textAlign: "center" },
  colPrice: { width: 65, textAlign: "right" },
  colHeaderText: { fontSize: 9, fontWeight: 600, color: "#333333" },
  cellText: { fontSize: 10 },
  descTH:   { fontSize: 10 },
  descEN:   { fontSize: 8, color: "#777777", marginTop: 1, fontFamily: "Inter" },
  /* ── Total row ── */
  totalSection: { borderTop: "1px solid #888888", marginTop: 4, paddingTop: 7 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center" },
  totalLabel: { fontSize: 11, fontWeight: 600, marginRight: 10 },
  totalValue: { fontSize: 11, fontWeight: 600, width: 65, textAlign: "right" },
  /* ── Signature ── */
  signatureBlock: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: { fontSize: 10, color: "#333333" },
  /* ── Void watermark ── */
  voidWatermark: {
    position: "absolute",
    top: "38%",
    left: "8%",
    fontSize: 72,
    fontWeight: 600,
    color: "#DC2626",
    opacity: 0.12,
    transform: "rotate(-28deg)",
    fontFamily: "Inter",
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  patientName: string;
  patientPhone: string | null;
  logoUrl?: string | null;
}

export function InvoicePDF({ invoice, patientName, logoUrl }: InvoicePDFProps) {
  const snapshot: ClinicSnapshot = invoice.clinic_snapshot ?? {};
  const isVoided = invoice.status === "void";

  const clinicName = snapshot.clinic_name_th ?? snapshot.clinic_name_en ?? "จางจิน คลินิก";
  const address = snapshot.clinic_address_th ?? snapshot.clinic_address_en ?? null;
  const addressLine = [address, snapshot.clinic_phone ? `โทร.${snapshot.clinic_phone}` : null]
    .filter(Boolean)
    .join("  ");
  const doctorLine = [snapshot.clinic_doctor_name, snapshot.clinic_tax_id ? `TAX ID ${snapshot.clinic_tax_id}` : null]
    .filter(Boolean)
    .join("  ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {isVoided && <Text style={styles.voidWatermark}>VOID / โมฆะ</Text>}

        {/* Header — centered logo + clinic info */}
        <View style={styles.headerBlock}>
          {logoUrl && <Image src={logoUrl} style={styles.logoImage} />}
          <Text style={styles.clinicName}>{clinicName}</Text>
          {addressLine ? <Text style={styles.clinicDetail}>{addressLine}</Text> : null}
          {doctorLine ? <Text style={styles.clinicDetail}>{doctorLine}</Text> : null}
        </View>

        <View style={styles.divider} />

        {/* Title */}
        <Text style={styles.receiptTitle}>ใบเสร็จรับเงิน/Receipt</Text>

        {/* Invoice meta — right-aligned */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>เลขที่:</Text>
          <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>วันที่:</Text>
          <Text style={styles.metaValue}>{toBuddhistDate(invoice.issue_date)}</Text>
        </View>

        {/* Patient name */}
        <View style={styles.patientRow}>
          <Text style={styles.patientName}>ชื่อ คุณ {patientName}</Text>
        </View>

        {/* Table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colNum,   styles.colHeaderText]}>ลำดับ</Text>
          <Text style={[styles.colDesc,  styles.colHeaderText]}>รายการ</Text>
          <Text style={[styles.colQty,   styles.colHeaderText]}>จำนวน</Text>
          <Text style={[styles.colUnit,  styles.colHeaderText]}>หน่วย</Text>
          <Text style={[styles.colPrice, styles.colHeaderText]}>ราคา</Text>
        </View>

        {invoice.line_items.map((item: InvoiceLineItem, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.colNum, styles.cellText]}>{i + 1}</Text>
            <View style={styles.colDesc}>
              <Text style={styles.descTH}>{item.description_th}</Text>
              {item.description_en && (
                <Text style={styles.descEN}>{item.description_en}</Text>
              )}
            </View>
            <Text style={[styles.colQty,   styles.cellText]}>{item.quantity}</Text>
            <Text style={[styles.colUnit,  styles.cellText]}>{item.unit}</Text>
            <Text style={[styles.colPrice, styles.cellText]}>{fmt(item.total_thb)}</Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>รวมทั้งสิ้น</Text>
            <Text style={styles.totalValue}>{fmt(invoice.total_thb)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <Text style={{ marginTop: 8, fontSize: 9, color: "#555555" }}>{invoice.notes}</Text>
        )}

        {/* Void reason */}
        {isVoided && invoice.void_reason && (
          <Text style={{ marginTop: 6, fontSize: 9, color: "#DC2626", fontFamily: "Inter" }}>
            Void reason: {invoice.void_reason}
          </Text>
        )}

        {/* Signature block */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>วันที่ ............................................</Text>
          <Text style={styles.signatureLine}>ผู้รับเงิน ............................................</Text>
        </View>
      </Page>
    </Document>
  );
}
