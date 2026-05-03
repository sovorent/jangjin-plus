import type { TreatmentTag } from "@/types/supabase";

export const TREATMENT_TAGS: TreatmentTag[] = [
  "acupuncture",
  "cupping",
  "tui_na",
  "moxibustion",
  "herbal_compress",
  "gua_sha",
  "herbal_medicine",
  "electro_acupuncture",
  "auricular_therapy",
  "other",
];

export const TREATMENT_TAG_LABELS_TH: Record<string, string> = {
  acupuncture:         "ฝังเข็ม",
  cupping:             "ครอบแก้ว",
  tui_na:              "ทุยหนา",
  moxibustion:         "รมยา",
  herbal_compress:     "ประคบสมุนไพร",
  gua_sha:             "ขูดซา",
  herbal_medicine:     "ยาสมุนไพร",
  electro_acupuncture: "ฝังเข็มไฟฟ้า",
  auricular_therapy:   "หูฝัง",
  other:               "อื่นๆ",
};

export const TREATMENT_TAG_LABELS_EN: Record<string, string> = {
  acupuncture:         "Acupuncture",
  cupping:             "Cupping",
  tui_na:              "Tui Na",
  moxibustion:         "Moxibustion",
  herbal_compress:     "Herbal Compress",
  gua_sha:             "Gua Sha",
  herbal_medicine:     "Herbal Medicine",
  electro_acupuncture: "Electro-Acupuncture",
  auricular_therapy:   "Auricular Therapy",
  other:               "Other",
};
