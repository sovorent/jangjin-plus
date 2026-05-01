import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Invoice, InvoiceLineItem, ClinicSnapshot } from "@/types/supabase";

// Register fonts — using system fonts as fallback; replace with actual font files for production
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff", fontWeight: 600 },
  ],
});

Font.register({
  family: "Sarabun",
  fonts: [
    { src: "https://fonts.gstatic.com/s/sarabun/v15/DtVmJx26TKEr37c9YHZJmnYI5gnOpg.woff", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/sarabun/v15/DtVhJx26TKEr37c9YK5sulMM-vmHIXZmDw.woff", fontWeight: 600 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    padding: 48,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  clinicName: { fontSize: 14, fontWeight: 600, marginBottom: 2 },
  clinicDetail: { fontSize: 9, color: "#6B7280", marginBottom: 1 },
  invoiceLabel: { fontSize: 20, fontWeight: 600, color: "#0F4C81", textAlign: "right" },
  invoiceNumber: { fontSize: 11, textAlign: "right", marginTop: 4 },
  invoiceDate: { fontSize: 9, color: "#6B7280", textAlign: "right" },
  divider: { borderBottom: "1px solid #E5E7EB", marginVertical: 12 },
  billRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  billLabel: { fontSize: 8, color: "#6B7280", marginBottom: 2 },
  billValue: { fontSize: 10, fontWeight: 600 },
  billSubValue: { fontSize: 9, color: "#6B7280" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: "6 4",
    borderBottom: "1px solid #E5E7EB",
  },
  tableRow: {
    flexDirection: "row",
    padding: "6 4",
    borderBottom: "1px solid #F3F4F6",
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnitPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  colHeader: { fontSize: 8, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" },
  descEN: { fontSize: 10 },
  descTH: { fontSize: 9, color: "#6B7280", fontFamily: "Sarabun" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 24,
  },
  totalLabel: { fontSize: 10, color: "#6B7280" },
  totalValue: { fontSize: 14, fontWeight: 600, color: "#0F4C81" },
  paymentRow: { marginTop: 8, fontSize: 9, color: "#6B7280" },
  notes: { marginTop: 12, fontSize: 9, color: "#374151" },
  voidWatermark: {
    position: "absolute",
    top: "40%",
    left: "10%",
    fontSize: 80,
    fontWeight: 600,
    color: "#FCA5A5",
    opacity: 0.4,
    transform: "rotate(-30deg)",
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  patientName: string;
  patientPhone: string | null;
}

export function InvoicePDF({ invoice, patientName, patientPhone }: InvoicePDFProps) {
  const snapshot: ClinicSnapshot = invoice.clinic_snapshot;
  const isVoided = invoice.status === "void";

  const issueDate = new Date(invoice.issue_date);
  const dateStr = `${String(issueDate.getDate()).padStart(2, "0")}/${String(
    issueDate.getMonth() + 1
  ).padStart(2, "0")}/${issueDate.getFullYear()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {isVoided && (
          <Text style={styles.voidWatermark}>VOID / โมฆะ</Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.clinicName}>
              {snapshot.clinic_name_en ?? snapshot.clinic_name_th ?? "Clinic"}
            </Text>
            {snapshot.clinic_name_th && snapshot.clinic_name_en && (
              <Text style={[styles.clinicDetail, { fontFamily: "Sarabun" }]}>
                {snapshot.clinic_name_th}
              </Text>
            )}
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
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceDate}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill to */}
        <View style={styles.billRow}>
          <View>
            <Text style={styles.billLabel}>BILL TO</Text>
            <Text style={styles.billValue}>{patientName}</Text>
            {patientPhone && <Text style={styles.billSubValue}>{patientPhone}</Text>}
          </View>
        </View>

        <View style={styles.divider} />

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
              ฿{item.unit_price_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.colTotal}>
              ฿{item.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Total */}
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ฿{invoice.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Payment method */}
        <Text style={styles.paymentRow}>
          Payment: {invoice.payment_method === "cash" ? "Cash" : "QR PromptPay"}
        </Text>

        {/* Notes */}
        {invoice.notes && <Text style={styles.notes}>{invoice.notes}</Text>}

        {/* Void reason */}
        {isVoided && invoice.void_reason && (
          <Text style={[styles.notes, { color: "#DC2626" }]}>
            Void reason: {invoice.void_reason}
          </Text>
        )}
      </Page>
    </Document>
  );
}
