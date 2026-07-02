export const DEAL_STATUSES = [
  "Watching",
  "Strong deal",
  "Maybe",
  "Pass",
  "Scheduled visit",
  "Visited",
  "Offer made",
] as const;

export const CONDITIONS = [
  "Move-in ready",
  "Light rehab",
  "Medium rehab",
  "Heavy rehab",
] as const;

export type DealStatus = (typeof DEAL_STATUSES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type DealRating = "green" | "yellow" | "red";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  type: "status" | "decision";
  from?: string;
  to: string;
}

export interface Property {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  nickname: string;
  full_address: string;
  city: string;
  state: string;
  zip_code: string;
  listing_url: string;
  asking_price: number;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  year_built: number;
  property_type: string;
  condition_category: Condition;
  estimated_rehab_cost: number;
  estimated_monthly_rent: number;
  after_rehab_rent: number;
  average_area_rent: number;
  rent_source_notes: string;
  monthly_taxes: number;
  monthly_insurance: number;
  monthly_hoa: number;
  property_management_pct: number;
  down_payment_pct: number;
  heloc_interest_rate: number;
  investment_interest_rate: number;
  loan_term_years: number;
  heloc_balance_override: number | null;
  notes: string;
  pros: string;
  cons: string;
  why_liked: string;
  deal_status: DealStatus;
  personal_interest_score: number;
  neighborhood_score: number;
  school_safety_score: number;
  rehab_risk_score: number;
  add_to_visit_list: boolean;
  visit_date: string;
  realtor_notes: string;
  post_visit_decision: string;
  verification_checklist: ChecklistItem[];
  status_history: HistoryItem[];
  down_payment_amount: number;
  investment_loan_amount: number;
  monthly_mortgage_payment: number;
  heloc_balance: number;
  heloc_required_payment: number;
  heloc_interest_portion: number;
  heloc_principal_portion: number;
  heloc_remaining_balance: number;
  property_management_fee: number;
  total_monthly_outflow: number;
  monthly_cash_flow: number;
  rent_to_price_ratio: number;
  total_project_cost: number;
  after_rehab_cash_flow: number;
  deal_rating: DealRating;
  deal_score: number;
}

export type PropertyDraft = Omit<
  Property,
  | "id"
  | "user_id"
  | "created_at"
  | "updated_at"
  | "down_payment_amount"
  | "investment_loan_amount"
  | "monthly_mortgage_payment"
  | "heloc_balance"
  | "heloc_required_payment"
  | "heloc_interest_portion"
  | "heloc_principal_portion"
  | "heloc_remaining_balance"
  | "property_management_fee"
  | "total_monthly_outflow"
  | "monthly_cash_flow"
  | "rent_to_price_ratio"
  | "total_project_cost"
  | "after_rehab_cash_flow"
  | "deal_rating"
  | "deal_score"
>;

export const emptyDraft = (): PropertyDraft => ({
  nickname: "",
  full_address: "",
  city: "",
  state: "",
  zip_code: "",
  listing_url: "",
  asking_price: 0,
  bedrooms: 0,
  bathrooms: 0,
  square_footage: 0,
  year_built: 0,
  property_type: "Single family",
  condition_category: "Move-in ready",
  estimated_rehab_cost: 0,
  estimated_monthly_rent: 0,
  after_rehab_rent: 0,
  average_area_rent: 0,
  rent_source_notes: "",
  monthly_taxes: 0,
  monthly_insurance: 0,
  monthly_hoa: 0,
  property_management_pct: 10,
  down_payment_pct: 20,
  heloc_interest_rate: 10.5,
  investment_interest_rate: 7.5,
  loan_term_years: 30,
  heloc_balance_override: null,
  notes: "",
  pros: "",
  cons: "",
  why_liked: "",
  deal_status: "Watching",
  personal_interest_score: 5,
  neighborhood_score: 5,
  school_safety_score: 5,
  rehab_risk_score: 5,
  add_to_visit_list: false,
  visit_date: "",
  realtor_notes: "",
  post_visit_decision: "",
  verification_checklist: [],
  status_history: [],
});
