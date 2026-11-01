import { z } from "zod";

export const financeSchema = z.object({
  min_deposit: z.number().int().positive().max(1000000000),
  min_withdrawal: z.number().int().positive().max(1000000000),
  withdrawal_start_hour: z.number().int().min(0).max(23),
  withdrawal_end_hour: z.number().int().min(1).max(24),
  signup_bonus: z.number().int().min(0).max(1000000000),
  daily_bonus: z.number().int().min(0).max(1000000000),
  referral_rate_1: z.number().min(0).max(100),
  referral_rate_2: z.number().min(0).max(100),
  referral_rate_3: z.number().min(0).max(100),
}).refine((s) => s.withdrawal_start_hour < s.withdrawal_end_hour, { message: "L'heure de fin doit suivre l'heure de début." })
  .refine((s) => s.referral_rate_1 + s.referral_rate_2 + s.referral_rate_3 <= 100, { message: "Le total des commissions ne peut pas dépasser 100 %." });

export type FinanceSettings = z.infer<typeof financeSchema>;
export const DEFAULT_FINANCE: FinanceSettings = {
  min_deposit: 2000, min_withdrawal: 1000,
  withdrawal_start_hour: 10, withdrawal_end_hour: 17,
  signup_bonus: 1000, daily_bonus: 125,
  referral_rate_1: 30, referral_rate_2: 3, referral_rate_3: 2,
};