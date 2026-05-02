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

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    padding: 48,
    color: "#1A1612",
    backgroundColor: "#ffffff",
  },
  /* ── Header ──────────────────────────────── */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: "1px solid #E8E2D8",
  },
  clinicName: { fontSize: 13, fontWeight: 600, marginBottom: 2, color: "#1A1612" },
  clinicNameTH: { fontSize: 10, color: "#7A6F62", marginBottom: 1, fontFamily: "Sarabun" },
  clinicDetail: { fontSize: 9, color: "#7A6F62", marginBottom: 1 },
  invoiceLabel: { fontSize: 9, color: "#7A6F62", textAlign: "right", letterSpacing: 1 },
  invoiceNumber: { fontSize: 17, fontWeight: 600, color: "#0F4C81", textAlign: "right", marginTop: 2 },
  invoiceDate: { fontSize: 9, color: "#7A6F62", textAlign: "right", marginTop: 2 },
  /* ── Bill to ──────────────────────────────── */
  billSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "1px solid #E8E2D8",
  },
  billLabel: { fontSize: 8, color: "#7A6F62", marginBottom: 3, letterSpacing: 0.5 },
  billName: { fontSize: 11, fontWeight: 600, color: "#1A1612", fontFamily: "Sarabun" },
  billSubValue: { fontSize: 9, color: "#7A6F62", marginTop: 1 },
  /* ── Logo ────────────────────────────────── */
  logoImage: { width: 72, height: 72, objectFit: "contain", marginBottom: 8 },
  /* ── Table ────────────────────────────────── */
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F1EB",
    padding: "6 4",
    borderBottom: "1px solid #E8E2D8",
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 4",
    borderBottom: "1px solid #F0EBE3",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnitPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  colHeader: { fontSize: 8, fontWeight: 600, color: "#7A6F62", textTransform: "uppercase" },
  descEN: { fontSize: 10, color: "#1A1612" },
  descTH: { fontSize: 9, color: "#7A6F62", fontFamily: "Sarabun", marginTop: 1 },
  /* ── Totals ───────────────────────────────── */
  divider: { borderBottom: "1px solid #E8E2D8", marginVertical: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  totalBlock: { alignItems: "flex-end" },
  totalLabel: { fontSize: 8, color: "#7A6F62", letterSpacing: 0.5, marginBottom: 3 },
  totalValue: { fontSize: 16, fontWeight: 600, color: "#0F4C81" },
  paymentRow: { marginTop: 6, fontSize: 9, color: "#7A6F62" },
  notes: { marginTop: 10, fontSize: 9, color: "#374151" },
  /* ── Void watermark ───────────────────────── */
  voidWatermark: {
    position: "absolute",
    top: "38%",
    left: "8%",
    fontSize: 72,
    fontWeight: 600,
    color: "#DC2626",
    opacity: 0.12,
    transform: "rotate(-28deg)",
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  patientName: string;
  patientPhone: string | null;
  logoUrl?: string | null;
}

export function InvoicePDF({ invoice, patientName, patientPhone, logoUrl }: InvoicePDFProps) {
  const snapshot: ClinicSnapshot = invoice.clinic_snapshot ?? {};
  const isVoided = invoice.status === "void";

  const issueDate = new Date(invoice.issue_date);
  const dateStr = `${String(issueDate.getDate()).padStart(2, "0")}/${String(
    issueDate.getMonth() + 1
  ).padStart(2, "0")}/${issueDate.getFullYear()}`;

  const clinicNameEN = snapshot.clinic_name_en ?? "JangJin TCM Clinic";
  const clinicNameTH = snapshot.clinic_name_th;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {isVoided && <Text style={styles.voidWatermark}>VOID / โมฆะ</Text>}

        {/* Header */}
        <View style={styles.header}>
          <View>
            {logoUrl && <Image src={logoUrl} style={[styles.logoImage, { marginBottom: 8 }]} />}
            <Text style={styles.clinicName}>{clinicNameEN}</Text>
            {clinicNameTH && <Text style={styles.clinicNameTH}>{clinicNameTH}</Text>}
            {snapshot.clinic_address_en && (
              <Text style={styles.clinicDetail}>{snapshot.clinic_address_en}</Text>
            )}
            {snapshot.clinic_phone && (
              <Text style={styles.clinicDetail}>{snapshot.clinic_phone}</Text>
            )}
            {snapshot.clinic_tax_id && (
              <Text style={styles.clinicDetail}>Tax ID: {snapshot.clinic_tax_id}</Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceDate}>{dateStr}</Text>
          </View>
        </View>

        {/* Bill to */}
        <View style={styles.billSection}>
          <View>
            <Text style={styles.billLabel}>BILL TO</Text>
            <Text style={styles.billName}>{patientName}</Text>
            {patientPhone && <Text style={styles.billSubValue}>{patientPhone}</Text>}
          </View>
        </View>

        {/* Line items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colDesc, styles.colHeader]}>Description</Text>
          <Text style={[styles.colQty, styles.colHeader]}>Qty</Text>
          <Text style={[styles.colUnitPrice, styles.colHeader]}>Unit price</Text>
          <Text style={[styles.colTotal, styles.colHeader]}>Total</Text>
        </View>

        {invoice.line_items.map((item: InvoiceLineItem, i: number) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={styles.descEN}>{item.description_en}</Text>
              {item.description_th && (
                <Text style={styles.descTH}>{item.description_th}</Text>
              )}
            </View>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colUnitPrice}>
              <Text style={{ fontFamily: "Sarabun" }}>{"฿"}</Text>
              {item.unit_price_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.colTotal}>
              <Text style={{ fontFamily: "Sarabun" }}>{"฿"}</Text>
              {item.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Total */}
        <View style={styles.totalRow}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>
              <Text style={{ fontFamily: "Sarabun" }}>{"฿"}</Text>
              {invoice.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Payment method */}
        <Text style={styles.paymentRow}>
          Payment method: {invoice.payment_method === "cash" ? "Cash" : "QR PromptPay"}
        </Text>

        {invoice.notes && <Text style={styles.notes}>{invoice.notes}</Text>}

        {isVoided && invoice.void_reason && (
          <Text style={[styles.notes, { color: "#DC2626" }]}>
            Void reason: {invoice.void_reason}
          </Text>
        )}
      </Page>
    </Document>
  );
}
