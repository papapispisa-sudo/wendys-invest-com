export type Country = {
  code: string;
  name: string;
  dial: string;
  flag: string;
  operators: string[];
};

export const COUNTRIES: Country[] = [
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮", operators: ["MTN", "WAVE", "Orange"] },
  { code: "BJ", name: "Bénin", dial: "+229", flag: "🇧🇯", operators: ["MTN", "MOOV"] },
  { code: "BF", name: "Burkina Faso", dial: "+226", flag: "🇧🇫", operators: ["MTN", "MOOV"] },
  { code: "TG", name: "Togo", dial: "+228", flag: "🇹🇬", operators: ["TMONEY", "YAS"] },
];

export const MIN_DEPOSIT = 2000;
export const MIN_WITHDRAWAL = 1000;
export const DAILY_BONUS = 125;
export const SIGNUP_BONUS = 1000;

export function countryByCode(code: string) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function formatFcfa(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA`;
}

/** Digits only, used to build the login identifier. */
export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

/** Auth identifier derived from country + phone (no email is collected). */
export function phoneIdentity(countryCode: string, phone: string) {
  return `${countryCode.toLowerCase()}${normalizePhone(phone)}@wendys.invest`;
}

export function withdrawalWindowOpen(date = new Date(), startHour = 10, endHour = 17) {
  const h = date.getUTCHours();
  return h >= startHour && h < endHour;
}

export const TX_LABELS: Record<string, string> = {
  deposit: "Dépôt",
  withdrawal: "Retrait",
  earning: "Revenu quotidien",
  bonus: "Bonus",
  referral: "Commission parrainage",
  purchase: "Achat produit",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  completed: "Validé",
  failed: "Échoué",
};
