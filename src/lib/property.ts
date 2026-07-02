import type { Property, PropertyDraft } from "../types";

export function toDraft(property: Property): PropertyDraft {
  const calculatedKeys = new Set([
    "id", "user_id", "created_at", "updated_at", "down_payment_amount",
    "investment_loan_amount", "monthly_mortgage_payment", "heloc_balance",
    "heloc_required_payment", "heloc_interest_portion", "heloc_principal_portion",
    "heloc_remaining_balance", "property_management_fee", "total_monthly_outflow",
    "monthly_cash_flow", "rent_to_price_ratio", "total_project_cost",
    "after_rehab_cash_flow", "deal_rating", "deal_score",
  ]);
  return Object.fromEntries(
    Object.entries(property).filter(([key]) => !calculatedKeys.has(key)),
  ) as unknown as PropertyDraft;
}
