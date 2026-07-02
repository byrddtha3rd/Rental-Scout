import type { DealRating, Property, PropertyDraft } from "./types";

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

export function mortgagePayment(
  principal: number,
  annualRatePct: number,
  years: number,
): number {
  if (principal <= 0 || years <= 0) return 0;
  const months = years * 12;
  const monthlyRate = annualRatePct / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  const factor = (1 + monthlyRate) ** months;
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function helocBreakdown(balance: number, annualRatePct: number) {
  const safeBalance = Math.max(0, balance);
  if (safeBalance === 0) {
    return {
      requiredPayment: 0,
      interestPortion: 0,
      principalPortion: 0,
      remainingBalance: 0,
      interestShortfall: false,
    };
  }
  const requiredPayment = Math.max(safeBalance * 0.01, 100);
  const interestPortion = safeBalance * (annualRatePct / 100) / 12;
  const principalPortion = requiredPayment - interestPortion;
  return {
    requiredPayment,
    interestPortion,
    principalPortion,
    remainingBalance: Math.max(0, safeBalance - principalPortion),
    interestShortfall: interestPortion > requiredPayment,
  };
}

export function ratingForCashFlow(cashFlow: number): DealRating {
  if (cashFlow >= 300) return "green";
  if (cashFlow >= 100) return "yellow";
  return "red";
}

export function dealScore(
  cashFlow: number,
  rentRatio: number,
  neighborhood: number,
  schoolSafety: number,
  rehabRisk: number,
  personalInterest: number,
): number {
  const cashFlowFactor = clamp((cashFlow / 500) * 100);
  const rentRatioFactor = clamp(((rentRatio - 0.005) / 0.01) * 100);
  const factors = [
    cashFlowFactor,
    rentRatioFactor,
    clamp(neighborhood * 10),
    clamp(schoolSafety * 10),
    clamp((11 - rehabRisk) * 10),
    clamp(personalInterest * 10),
  ];
  return Math.round(factors.reduce((sum, factor) => sum + factor, 0) / factors.length);
}

export function calculateProperty(draft: PropertyDraft) {
  const downPaymentAmount = draft.asking_price * (draft.down_payment_pct / 100);
  const investmentLoanAmount = Math.max(0, draft.asking_price - downPaymentAmount);
  const monthlyMortgagePayment = mortgagePayment(
    investmentLoanAmount,
    draft.investment_interest_rate,
    draft.loan_term_years,
  );
  const helocBalance =
    draft.heloc_balance_override === null
      ? downPaymentAmount
      : Math.max(0, draft.heloc_balance_override);
  const heloc = helocBreakdown(helocBalance, draft.heloc_interest_rate);
  const propertyManagementFee =
    draft.estimated_monthly_rent * (draft.property_management_pct / 100);
  const fixedOutflow =
    monthlyMortgagePayment +
    draft.monthly_taxes +
    draft.monthly_insurance +
    draft.monthly_hoa +
    heloc.requiredPayment;
  const totalMonthlyOutflow = fixedOutflow + propertyManagementFee;
  const monthlyCashFlow = draft.estimated_monthly_rent - totalMonthlyOutflow;
  const rentToPriceRatio =
    draft.asking_price > 0 ? draft.estimated_monthly_rent / draft.asking_price : 0;
  const afterRehabRent =
    draft.after_rehab_rent > 0 ? draft.after_rehab_rent : draft.estimated_monthly_rent;
  const afterRehabManagement =
    afterRehabRent * (draft.property_management_pct / 100);
  const afterRehabCashFlow = afterRehabRent - fixedOutflow - afterRehabManagement;
  return {
    down_payment_amount: downPaymentAmount,
    investment_loan_amount: investmentLoanAmount,
    monthly_mortgage_payment: monthlyMortgagePayment,
    heloc_balance: helocBalance,
    heloc_required_payment: heloc.requiredPayment,
    heloc_interest_portion: heloc.interestPortion,
    heloc_principal_portion: heloc.principalPortion,
    heloc_remaining_balance: heloc.remainingBalance,
    property_management_fee: propertyManagementFee,
    total_monthly_outflow: totalMonthlyOutflow,
    monthly_cash_flow: monthlyCashFlow,
    rent_to_price_ratio: rentToPriceRatio,
    total_project_cost: draft.asking_price + draft.estimated_rehab_cost,
    after_rehab_cash_flow: afterRehabCashFlow,
    deal_rating: ratingForCashFlow(monthlyCashFlow),
    deal_score: dealScore(
      monthlyCashFlow,
      rentToPriceRatio,
      draft.neighborhood_score,
      draft.school_safety_score,
      draft.rehab_risk_score,
      draft.personal_interest_score,
    ),
  } satisfies Partial<Property>;
}
