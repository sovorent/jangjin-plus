import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { TreatmentLog, Patient, ClinicSettings } from "@/types/supabase";

// registerFonts is provided by invoice-template.tsx and called once per process
// from the route handler — no need to call it again here.

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
  "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
  "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
const EN_MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function toBuddhistDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function toEnglishDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  return age;
}

const GENDER_TH: Record<string, string> = {
  male: "ชาย", female: "หญิง", other: "อื่นๆ", prefer_not_to_say: "-",
};
const GENDER_EN: Record<string, string> = {
  male: "MALE", female: "FEMALE", other: "OTHER", prefer_not_to_say: "-",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 10,
    paddingHorizontal: 50,
    paddingVertical: 36,
    color: "#1A1612",
    backgroundColor: "#ffffff",
  },
  /* ── Header ── */
  headerRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  logoImage: { width: 64, height: 64, objectFit: "contain", marginRight: 12 },
  headerText: { flex: 1 },
  clinicNameTH: { fontSize: 11, fontWeight: 600, marginBottom: 2 },
  clinicNameEN: { fontSize: 18, fontWeight: 600, marginBottom: 4 },
  clinicDetail: { fontSize: 9, color: "#444444", marginBottom: 1 },
  divider: { borderBottom: "1px solid #888888", marginVertical: 10 },
  /* ── Title ── */
  titleBlock: { alignItems: "center", marginBottom: 14 },
  titleTH: { fontSize: 16, fontWeight: 600, marginBottom: 3 },
  titleEN: { fontSize: 13, fontWeight: 600, fontFamily: "Inter" },
  /* ── Ref + date ── */
  refBlock: { alignItems: "flex-end", marginBottom: 10 },
  refRow: { flexDirection: "row", marginBottom: 2 },
  refLabel: { fontSize: 10, color: "#444444", marginRight: 4 },
  refValue: { fontSize: 10 },
  dateRow: { flexDirection: "row", marginTop: 4 },
  dateLabel: { fontSize: 10, color: "#444444", marginRight: 4 },
  dateValue: { fontSize: 10 },
  /* ── Body lines ── */
  bodyTH: { fontSize: 10, marginBottom: 2 },
  bodyEN: { fontSize: 9, color: "#444444", fontFamily: "Inter", marginBottom: 10 },
  /* ── Diagnosis / Recommendation ── */
  sectionLabel: { fontSize: 10, fontWeight: 600, marginBottom: 2 },
  sectionEN: { fontSize: 9, fontFamily: "Inter", color: "#444444", marginBottom: 2 },
  diagnosisLine: { fontSize: 10, marginBottom: 12 },
  dottedLine: { fontSize: 10, color: "#888888", marginBottom: 6 },
  /* ── Signature ── */
  signatureBlock: { marginTop: 36, flexDirection: "row", justifyContent: "space-between" },
  sigCol: { alignItems: "center", width: "45%" },
  sigLabel: { fontSize: 10, marginBottom: 24 },
  sigLine: { borderBottom: "1px solid #888888", width: "100%", marginBottom: 4 },
  sigName: { fontSize: 9, color: "#444444" },
});

interface MedicalCertPDFProps {
  treatmentLog: TreatmentLog;
  patient: Patient;
  clinicSettings: ClinicSettings;
  certRef: string;
  logoUrl?: string | null;
}

export function MedicalCertPDF({
  treatmentLog,
  patient,
  clinicSettings,
  certRef,
  logoUrl,
}: MedicalCertPDFProps) {
  const visitDate = treatmentLog.visit_date;
  const age = calcAge(patient.date_of_birth);
  const genderTH = patient.gender ? (GENDER_TH[patient.gender] ?? "-") : "-";
  const genderEN = patient.gender ? (GENDER_EN[patient.gender] ?? "-") : "-";
  const patientName = patient.full_name ?? "";
  const patientNumber = patient.patient_number ?? "-";

  const clinicNameTH = clinicSettings.clinic_name_th ?? clinicSettings.clinic_name_en ?? "จางจิน คลินิก";
  const clinicNameEN = clinicSettings.clinic_name_en ?? "JANGJIN TCM CLINIC";
  const addressTH = clinicSettings.clinic_address_th ?? clinicSettings.clinic_address_en ?? "";
  const addressEN = clinicSettings.clinic_address_en ?? "";
  const phone = clinicSettings.clinic_phone ?? "";
  const doctorNameTH = clinicSettings.clinic_doctor_name ?? "";
  const doctorNameEN = clinicSettings.clinic_doctor_name_en ?? "";
  const license = clinicSettings.clinic_doctor_license ?? "";
  const diagnosis = treatmentLog.treatment_notes ?? "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.headerRow}>
          {logoUrl && <Image src={logoUrl} style={styles.logoImage} />}
          <View style={styles.headerText}>
            <Text style={styles.clinicNameTH}>{clinicNameTH}</Text>
            <Text style={styles.clinicNameEN}>{clinicNameEN}</Text>
            {addressTH ? <Text style={styles.clinicDetail}>{addressTH}{phone ? `  โทร.${phone}` : ""}</Text> : null}
            {addressEN ? <Text style={styles.clinicDetail}>{addressEN}{phone ? `  Tel.${phone}` : ""}</Text> : null}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Title ── */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleTH}>ใบรับรองการตรวจรักษา</Text>
          <Text style={styles.titleEN}>MEDICAL CERTIFICATION</Text>
        </View>

        {/* ── Cert ref + date ── */}
        <View style={styles.refBlock}>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>เลขที่</Text>
            <Text style={styles.refValue}>{certRef}</Text>
          </View>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>Ref.</Text>
            <Text style={[styles.refValue, { fontFamily: "Inter" }]}>{certRef}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>วันที่ (Date)</Text>
            <Text style={styles.dateValue}>
              {toBuddhistDate(visitDate)}{"  /  "}{toEnglishDate(visitDate)}
            </Text>
          </View>
        </View>

        {/* ── Doctor statement ── */}
        <Text style={styles.bodyTH}>
          {"ข้าพเจ้า"}
          {doctorNameTH ? `${doctorNameTH}  ` : ""}
          {license ? `ใบอนุญาตประกอบโรคศิลปะ เลขที่  ${license}` : ""}
        </Text>
        <Text style={styles.bodyEN}>
          {doctorNameEN ? `I am  TCM Dr.${doctorNameEN}  ` : ""}
          {"Chinese traditional medical doctor"}
          {license ? `  with license  ${license}` : ""}
        </Text>

        {/* ── Patient examination statement ── */}
        <Text style={styles.bodyTH}>
          {"ได้ตรวจร่างกายทำการวินิจฉัยและรักษาอาการป่วยของ  คุณ "}
          {patientName}
        </Text>
        <Text style={styles.bodyEN}>
          {"I have performed physical checking on  "}
          {patientName}
        </Text>

        {/* ── Patient details row ── */}
        <Text style={styles.bodyTH}>
          {`เพศ ${genderTH}  อายุ ${age ?? "-"} ปี  เลขที่ประจำตัวผู้ป่วย ${patientNumber}  วันที่ ${toBuddhistDate(visitDate)}`}
        </Text>
        <Text style={styles.bodyEN}>
          {`sex ${genderEN}  .who is ${age ?? "-"} year old,  with patient number ${patientNumber}  on ${toEnglishDate(visitDate)}`}
        </Text>

        {/* ── National ID ── */}
        {patient.id_card_number ? (
          <Text style={[styles.bodyTH, { marginBottom: 12 }]}>
            {`เลขบัตรประจำตัวประชาชน  ${patient.id_card_number}`}
          </Text>
        ) : (
          <Text style={[styles.bodyTH, { marginBottom: 12 }]}>
            {"เลขบัตรประจำตัวประชาชน  ..............................."}
          </Text>
        )}

        {/* ── Diagnosis ── */}
        <Text style={styles.sectionLabel}>{"วินิจฉัยว่า (ตามศาสตร์การแพทย์แผนจีน)"}</Text>
        <Text style={styles.sectionEN}>{"Diagnosis (TCM)"}</Text>
        <Text style={styles.diagnosisLine}>
          {diagnosis || "..................................................................................................."}
        </Text>

        {/* ── Recommendation ── */}
        <Text style={styles.sectionLabel}>{"คำแนะนำ"}</Text>
        <Text style={styles.sectionEN}>{"And recommend to"}</Text>
        <Text style={styles.dottedLine}>
          {"..................................................................................................."}
        </Text>
        <Text style={styles.dottedLine}>
          {"..................................................................................................."}
        </Text>

        {/* ── Signature block ── */}
        <View style={styles.signatureBlock}>
          <View style={styles.sigCol}>
            <Text style={styles.sigLabel}>{"ลงชื่อ"}</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{"(patient)"}</Text>
          </View>
          <View style={styles.sigCol}>
            <Text style={styles.sigLabel}>{"ลงชื่อ"}</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>
              {doctorNameEN ? `( TCM. Dr.${doctorNameEN} )` : "(TCM Doctor's signature)"}
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
