import { describe, expect, it } from "vitest";
import { calculateProperty, dealScore, helocBreakdown, mortgagePayment, ratingForCashFlow } from "./calculations";
import { emptyDraft } from "./types";

describe("mortgagePayment", () => {
  it("uses the standard amortization formula", () => {
    expect(mortgagePayment(240000, 7.5, 30)).toBeCloseTo(1678.11, 1);
  });

  it("handles zero interest and zero principal", () => {
    expect(mortgagePayment(120000, 0, 30)).toBeCloseTo(333.33, 2);
    expect(mortgagePayment(0, 7.5, 30)).toBe(0);
  });
});

describe("helocBreakdown", () => {
  it("uses 1% of balance when above the minimum", () => {
    const result = helocBreakdown(50000, 10.5);
    expect(result.requiredPayment).toBe(500);
    expect(result.interestPortion).toBeCloseTo(437.5);
    expect(result.principalPortion).toBeCloseTo(62.5);
    expect(result.remainingBalance).toBeCloseTo(49937.5);
  });

  it("uses the $100 minimum and handles a zero balance", () => {
    expect(helocBreakdown(5000, 10.5).requiredPayment).toBe(100);
    expect(helocBreakdown(0, 10.5)).toEqual({
      requiredPayment: 0,
      interestPortion: 0,
      principalPortion: 0,
      remainingBalance: 0,
      interestShortfall: false,
    });
  });

  it("flags payments that do not cover interest", () => {
    expect(helocBreakdown(10000, 15).interestShortfall).toBe(true);
  });
});

describe("deal rating and score", () => {
  it("honors rating boundaries", () => {
    expect(ratingForCashFlow(300)).toBe("green");
    expect(ratingForCashFlow(100)).toBe("yellow");
    expect(ratingForCashFlow(99.99)).toBe("red");
  });

  it("scores all ideal balanced factors at 100", () => {
    expect(dealScore(500, 0.015, 10, 10, 1, 10)).toBe(100);
  });
});

describe("calculateProperty", () => {
  it("defaults HELOC to down payment and calculates stabilized rent", () => {
    const draft = {
      ...emptyDraft(),
      asking_price: 300000,
      estimated_monthly_rent: 3000,
      after_rehab_rent: 3400,
      monthly_taxes: 250,
      monthly_insurance: 120,
    };
    const result = calculateProperty(draft);
    expect(result.down_payment_amount).toBe(60000);
    expect(result.heloc_balance).toBe(60000);
    expect(result.after_rehab_cash_flow - result.monthly_cash_flow).toBeCloseTo(360);
  });

  it("respects a manual HELOC override", () => {
    const result = calculateProperty({
      ...emptyDraft(),
      asking_price: 200000,
      heloc_balance_override: 10000,
    });
    expect(result.heloc_balance).toBe(10000);
  });
});
