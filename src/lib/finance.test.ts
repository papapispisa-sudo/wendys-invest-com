import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FINANCE, financeSchema } from "./finance";
import { withdrawalWindowOpen } from "./wendys";

describe("Financial settings", () => {
  it("accepts changed minimum deposit", () => assert.equal(financeSchema.parse({ ...DEFAULT_FINANCE, min_deposit: 3500 }).min_deposit, 3500));
  it("accepts changed minimum withdrawal", () => assert.equal(financeSchema.parse({ ...DEFAULT_FINANCE, min_withdrawal: 1500 }).min_withdrawal, 1500));
  it("applies configured hours with exclusive closing time", () => {
    assert.equal(withdrawalWindowOpen(new Date("2026-11-01T09:59:59Z"), 10, 17), false);
    assert.equal(withdrawalWindowOpen(new Date("2026-11-01T10:00:00Z"), 10, 17), true);
    assert.equal(withdrawalWindowOpen(new Date("2026-11-01T17:00:00Z"), 10, 17), false);
    assert.equal(withdrawalWindowOpen(new Date("2026-11-01T18:00:00Z"), 8, 20), true);
  });
  it("accepts changed signup bonus", () => assert.equal(financeSchema.parse({ ...DEFAULT_FINANCE, signup_bonus: 500 }).signup_bonus, 500));
  it("accepts changed daily bonus", () => assert.equal(financeSchema.parse({ ...DEFAULT_FINANCE, daily_bonus: 200 }).daily_bonus, 200));
  it("accepts separate commission rates", () => {
    const s = financeSchema.parse({ ...DEFAULT_FINANCE, referral_rate_1: 20, referral_rate_2: 5, referral_rate_3: 1 });
    assert.deepEqual([s.referral_rate_1,s.referral_rate_2,s.referral_rate_3], [20,5,1]);
  });
  it("rejects reversed hours", () => assert.equal(financeSchema.safeParse({ ...DEFAULT_FINANCE, withdrawal_start_hour: 17, withdrawal_end_hour: 10 }).success, false));
  it("rejects commissions above 100 percent", () => assert.equal(financeSchema.safeParse({ ...DEFAULT_FINANCE, referral_rate_1: 99 }).success, false));
  it("rejects negative bonuses", () => assert.equal(financeSchema.safeParse({ ...DEFAULT_FINANCE, daily_bonus: -1 }).success, false));
});