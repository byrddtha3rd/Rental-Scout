import {
  AlertTriangle,
  Calculator,
  CheckSquare,
  ChevronLeft,
  CircleDollarSign,
  ClipboardList,
  ExternalLink,
  Home,
  LoaderCircle,
  MapPin,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { calculateProperty } from "../calculations";
import { EmptyState, ErrorBanner, LoadingScreen, RatingBadge } from "../components/Ui";
import { useApp } from "../context/AppContext";
import { money, percent } from "../lib/format";
import {
  CONDITIONS,
  DEAL_STATUSES,
  emptyDraft,
  type HistoryItem,
  type Property,
  type PropertyDraft,
} from "../types";

const numericKeys = new Set<keyof PropertyDraft>([
  "asking_price", "bedrooms", "bathrooms", "square_footage", "year_built",
  "estimated_rehab_cost", "estimated_monthly_rent", "after_rehab_rent",
  "average_area_rent", "monthly_taxes", "monthly_insurance", "monthly_hoa",
  "property_management_pct", "down_payment_pct", "heloc_interest_rate",
  "investment_interest_rate", "loan_term_years", "personal_interest_score",
  "neighborhood_score", "school_safety_score", "rehab_risk_score",
]);

function propertyToDraft(property: Property): PropertyDraft {
  const {
    id: _id, user_id: _userId, created_at: _createdAt, updated_at: _updatedAt,
    down_payment_amount: _down, investment_loan_amount: _loan,
    monthly_mortgage_payment: _mortgage, heloc_balance: _heloc,
    heloc_required_payment: _helocPayment, heloc_interest_portion: _helocInterest,
    heloc_principal_portion: _helocPrincipal, heloc_remaining_balance: _helocRemaining,
    property_management_fee: _management, total_monthly_outflow: _outflow,
    monthly_cash_flow: _cashFlow, rent_to_price_ratio: _ratio,
    total_project_cost: _project, after_rehab_cash_flow: _afterRehab,
    deal_rating: _rating, deal_score: _score, ...draft
  } = property;
  return draft;
}

export function PropertyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, loading, createProperty, updateProperty, deleteProperty } = useApp();
  const existing = id ? properties.find((property) => property.id === id) : undefined;
  const [draft, setDraft] = useState<PropertyDraft>(() => existing ? propertyToDraft(existing) : emptyDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checklistText, setChecklistText] = useState("");
  const calculation = useMemo(() => calculateProperty(draft), [draft]);
  const interestShortfall = calculation.heloc_interest_portion > calculation.heloc_required_payment;

  useEffect(() => {
    if (existing) setDraft(propertyToDraft(existing));
  }, [existing?.id]);

  function set<K extends keyof PropertyDraft>(key: K, value: PropertyDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleInput(key: keyof PropertyDraft, raw: string) {
    if (key === "heloc_balance_override") {
      set("heloc_balance_override", raw === "" ? null : Math.max(0, Number(raw)));
    } else if (numericKeys.has(key)) {
      setDraft((current) => ({ ...current, [key]: Number(raw) || 0 }));
    } else {
      setDraft((current) => ({ ...current, [key]: raw }));
    }
  }

  function validate() {
    if (!draft.nickname.trim()) return "Give this property a nickname.";
    if (!draft.full_address.trim() || !draft.city.trim() || !draft.state.trim() || !draft.zip_code.trim()) return "Complete the property address.";
    if (draft.asking_price <= 0) return "Asking price must be greater than zero.";
    if (draft.estimated_monthly_rent < 0) return "Rent cannot be negative.";
    if (draft.listing_url) {
      try { new URL(draft.listing_url); } catch { return "Listing URL must be a complete web address."; }
    }
    const scores = [draft.personal_interest_score, draft.neighborhood_score, draft.school_safety_score, draft.rehab_risk_score];
    if (scores.some((score) => score < 1 || score > 10)) return "All scores must be between 1 and 10.";
    const percentages = [draft.property_management_pct, draft.down_payment_pct, draft.heloc_interest_rate, draft.investment_interest_rate];
    if (percentages.some((value) => value < 0 || value > 100)) return "Percentages must be between 0 and 100.";
    return "";
  }

  function withHistory(): PropertyDraft {
    if (!existing) return draft;
    const additions: HistoryItem[] = [];
    if (existing.deal_status !== draft.deal_status) {
      additions.push({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), type: "status", from: existing.deal_status, to: draft.deal_status });
    }
    if (existing.post_visit_decision !== draft.post_visit_decision && draft.post_visit_decision.trim()) {
      additions.push({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), type: "decision", from: existing.post_visit_decision || undefined, to: draft.post_visit_decision });
    }
    return { ...draft, status_history: [...draft.status_history, ...additions] };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = validate();
    if (validation) { setError(validation); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setBusy(true);
    setError("");
    try {
      const saved = existing
        ? await updateProperty(existing.id, withHistory())
        : await createProperty(draft);
      navigate(`/properties/${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this property.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing || !window.confirm(`Delete ${existing.nickname}? This cannot be undone.`)) return;
    setBusy(true);
    try { await deleteProperty(existing.id); navigate("/properties"); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete property."); setBusy(false); }
  }

  function addChecklistItem() {
    const text = checklistText.trim();
    if (!text) return;
    set("verification_checklist", [...draft.verification_checklist, { id: crypto.randomUUID(), text, completed: false }]);
    setChecklistText("");
  }

  if (loading && id) return <LoadingScreen />;
  if (id && !existing) {
    return (
      <EmptyState
        icon={Home}
        title="Property not found"
        description="This record may have been deleted or is no longer available."
        action={<Link to="/properties" className="btn-primary inline-flex">Back to properties</Link>}
      />
    );
  }

  return (
    <div className="animate-in">
      <Link to={existing ? `/properties/${existing.id}` : "/properties"} className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-pine">
        <ChevronLeft size={17} /> {existing ? "Back to property" : "Back to properties"}
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{existing ? "Update your analysis" : "Scout a new opportunity"}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-forest sm:text-4xl">{existing ? `Edit ${existing.nickname}` : "Add a property"}</h1>
        </div>
        <div className="flex items-center gap-2"><RatingBadge rating={calculation.deal_rating} /><span className="rounded-full bg-forest px-3 py-1.5 text-xs font-extrabold text-white">{calculation.deal_score}/100</span></div>
      </div>
      <ErrorBanner message={error} />

      <form onSubmit={submit} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <FormSection icon={Home} title="Property basics" description="The listing details you will use to find and compare this home.">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Property nickname *" value={draft.nickname} onChange={(v) => set("nickname", v)} placeholder="The blue duplex" />
              <TextField label="Property type" value={draft.property_type} onChange={(v) => set("property_type", v)} placeholder="Single family" />
              <div className="sm:col-span-2"><TextField label="Full address *" value={draft.full_address} onChange={(v) => set("full_address", v)} placeholder="123 Main Street" /></div>
              <TextField label="City *" value={draft.city} onChange={(v) => set("city", v)} />
              <div className="grid grid-cols-2 gap-3"><TextField label="State *" value={draft.state} onChange={(v) => set("state", v.toUpperCase().slice(0, 2))} placeholder="PA" /><TextField label="ZIP code *" value={draft.zip_code} onChange={(v) => set("zip_code", v)} /></div>
              <div className="sm:col-span-2"><TextField label="Listing URL" value={draft.listing_url} onChange={(v) => set("listing_url", v)} placeholder="https://www.zillow.com/…" type="url" /></div>
              <NumberField label="Bedrooms" value={draft.bedrooms} onChange={(v) => handleInput("bedrooms", v)} step="1" />
              <NumberField label="Bathrooms" value={draft.bathrooms} onChange={(v) => handleInput("bathrooms", v)} step="0.5" />
              <NumberField label="Square footage" value={draft.square_footage} onChange={(v) => handleInput("square_footage", v)} />
              <NumberField label="Year built" value={draft.year_built} onChange={(v) => handleInput("year_built", v)} />
              <SelectField label="Condition" value={draft.condition_category} onChange={(v) => set("condition_category", v as PropertyDraft["condition_category"])} options={[...CONDITIONS]} />
              <SelectField label="Deal status" value={draft.deal_status} onChange={(v) => set("deal_status", v as PropertyDraft["deal_status"])} options={[...DEAL_STATUSES]} />
            </div>
          </FormSection>

          <FormSection icon={CircleDollarSign} title="Purchase & rent" description="Use monthly values for taxes, insurance, HOA, and rent.">
            <div className="grid gap-4 sm:grid-cols-2">
              <MoneyField label="Asking price *" value={draft.asking_price} onChange={(v) => handleInput("asking_price", v)} />
              <MoneyField label="Estimated rehab cost" value={draft.estimated_rehab_cost} onChange={(v) => handleInput("estimated_rehab_cost", v)} />
              <MoneyField label="Estimated monthly rent" value={draft.estimated_monthly_rent} onChange={(v) => handleInput("estimated_monthly_rent", v)} />
              <MoneyField label="After-rehab monthly rent" value={draft.after_rehab_rent} onChange={(v) => handleInput("after_rehab_rent", v)} />
              <MoneyField label="Average rent in area" value={draft.average_area_rent} onChange={(v) => handleInput("average_area_rent", v)} />
              <MoneyField label="Monthly taxes" value={draft.monthly_taxes} onChange={(v) => handleInput("monthly_taxes", v)} />
              <MoneyField label="Monthly insurance" value={draft.monthly_insurance} onChange={(v) => handleInput("monthly_insurance", v)} />
              <MoneyField label="Monthly HOA" value={draft.monthly_hoa} onChange={(v) => handleInput("monthly_hoa", v)} />
              <div className="sm:col-span-2"><TextArea label="Rent source / notes" value={draft.rent_source_notes} onChange={(v) => set("rent_source_notes", v)} placeholder="Rentometer, comparable Zillow listings, property manager estimate…" /></div>
            </div>
          </FormSection>

          <FormSection icon={Calculator} title="Financing strategy" description="The HELOC defaults to funding the full down payment unless you override it.">
            <div className="grid gap-4 sm:grid-cols-2">
              <PercentField label="Down payment" value={draft.down_payment_pct} onChange={(v) => handleInput("down_payment_pct", v)} />
              <PercentField label="Property management" value={draft.property_management_pct} onChange={(v) => handleInput("property_management_pct", v)} />
              <PercentField label="HELOC annual rate" value={draft.heloc_interest_rate} onChange={(v) => handleInput("heloc_interest_rate", v)} />
              <PercentField label="Mortgage annual rate" value={draft.investment_interest_rate} onChange={(v) => handleInput("investment_interest_rate", v)} />
              <NumberField label="Loan term (years)" value={draft.loan_term_years} onChange={(v) => handleInput("loan_term_years", v)} />
              <label className="block"><span className="mb-1.5 block text-sm font-bold">HELOC balance override</span><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input className="field !pl-7" type="number" min="0" step="1" value={draft.heloc_balance_override ?? ""} onChange={(e) => handleInput("heloc_balance_override", e.target.value)} placeholder={String(Math.round(calculation.down_payment_amount))} /></div><span className="mt-1 block text-[11px] text-slate-500">Leave blank to use the down payment.</span></label>
            </div>
          </FormSection>

          <FormSection icon={ClipboardList} title="Your take" description="Capture the judgment calls that do not fit neatly into a spreadsheet.">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextArea label="Why I liked this deal" value={draft.why_liked} onChange={(v) => set("why_liked", v)} />
              <TextArea label="Notes" value={draft.notes} onChange={(v) => set("notes", v)} />
              <TextArea label="Pros" value={draft.pros} onChange={(v) => set("pros", v)} />
              <TextArea label="Cons" value={draft.cons} onChange={(v) => set("cons", v)} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <ScoreField label="Personal interest" value={draft.personal_interest_score} onChange={(v) => handleInput("personal_interest_score", v)} />
              <ScoreField label="Neighborhood" value={draft.neighborhood_score} onChange={(v) => handleInput("neighborhood_score", v)} />
              <ScoreField label="School / safety" value={draft.school_safety_score} onChange={(v) => handleInput("school_safety_score", v)} />
              <ScoreField label="Rehab risk" value={draft.rehab_risk_score} onChange={(v) => handleInput("rehab_risk_score", v)} />
            </div>
          </FormSection>

          <FormSection icon={CheckSquare} title="Things to verify" description="Build a checklist for due diligence and the property visit.">
            <div className="flex gap-2"><input className="field" value={checklistText} onChange={(e) => setChecklistText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChecklistItem(); } }} placeholder="Roof age, rental license, flood zone…" /><button type="button" onClick={addChecklistItem} className="btn-secondary grid shrink-0 place-items-center !px-3" aria-label="Add checklist item"><Plus size={18} /></button></div>
            <div className="mt-3 space-y-2">
              {draft.verification_checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-canvas p-3">
                  <input type="checkbox" checked={item.completed} onChange={(e) => set("verification_checklist", draft.verification_checklist.map((current) => current.id === item.id ? { ...current, completed: e.target.checked } : current))} className="h-5 w-5 accent-pine" />
                  <span className={`flex-1 text-sm ${item.completed ? "text-slate-400 line-through" : ""}`}>{item.text}</span>
                  <button type="button" aria-label="Remove item" onClick={() => set("verification_checklist", draft.verification_checklist.filter((current) => current.id !== item.id))} className="text-slate-400 hover:text-rose-600"><X size={17} /></button>
                </div>
              ))}
            </div>
          </FormSection>

          <FormSection icon={MapPin} title="East Coast trip" description="Add the property to your route and keep visit follow-up together.">
            <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-xl border border-pine/15 bg-mint/40 p-4">
              <input type="checkbox" checked={draft.add_to_visit_list} onChange={(e) => set("add_to_visit_list", e.target.checked)} className="h-5 w-5 accent-pine" />
              <span><span className="block text-sm font-extrabold text-forest">Add to visit list</span><span className="text-xs text-slate-500">Show this home in the Trip Planner.</span></span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Visit date" value={draft.visit_date} onChange={(v) => set("visit_date", v)} type="date" />
              <TextField label="Post-visit decision" value={draft.post_visit_decision} onChange={(v) => set("post_visit_decision", v)} placeholder="Advance, revisit, pass…" />
              <div className="sm:col-span-2"><TextArea label="Realtor notes" value={draft.realtor_notes} onChange={(v) => set("realtor_notes", v)} /></div>
            </div>
          </FormSection>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {existing ? <button type="button" onClick={() => void remove()} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 font-bold text-rose-700 hover:bg-rose-50"><Trash2 size={17} /> Delete property</button> : <span />}
            <button disabled={busy} className="btn-primary inline-flex items-center justify-center gap-2 sm:min-w-44">{busy ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}{existing ? "Update property" : "Save property"}</button>
          </div>
        </div>

        <aside className="card overflow-hidden xl:sticky xl:top-6">
          <div className="bg-forest p-5 text-white">
            <div className="flex items-center justify-between"><span className="eyebrow !text-white/50">Live deal preview</span><RatingBadge rating={calculation.deal_rating} /></div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div><div className="text-xs font-bold text-white/50">Monthly cash flow</div><div className={`mt-1 font-display text-3xl font-bold ${calculation.monthly_cash_flow >= 100 ? "text-mint" : "text-rose-300"}`}>{money(calculation.monthly_cash_flow)}</div></div>
              <div><div className="text-xs font-bold text-white/50">Deal score</div><div className="mt-1 font-display text-3xl font-bold">{calculation.deal_score}<span className="text-sm text-white/40">/100</span></div></div>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <BreakdownRow label="Down payment" value={money(calculation.down_payment_amount)} />
            <BreakdownRow label="Mortgage payment" value={money(calculation.monthly_mortgage_payment)} />
            <BreakdownRow label="HELOC balance" value={money(calculation.heloc_balance)} />
            <BreakdownRow label="HELOC payment" value={money(calculation.heloc_required_payment)} />
            <BreakdownRow label="Management" value={money(calculation.property_management_fee)} />
            <BreakdownRow label="Total outflow" value={money(calculation.total_monthly_outflow)} strong />
            <BreakdownRow label="Rent-to-price" value={percent(calculation.rent_to_price_ratio)} />
            <BreakdownRow label="After-rehab cash flow" value={money(calculation.after_rehab_cash_flow)} />
            {interestShortfall && <div className="flex gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-800"><AlertTriangle size={16} className="mt-0.5 shrink-0" />Required HELOC payment does not cover monthly interest.</div>}
            {draft.listing_url && <a href={draft.listing_url} target="_blank" rel="noreferrer" className="btn-secondary mt-3 flex w-full items-center justify-center gap-2"><ExternalLink size={16} /> Open listing</a>}
          </div>
        </aside>
      </form>
    </div>
  );
}

function FormSection({ icon: Icon, title, description, children }: { icon: typeof Home; title: string; description: string; children: ReactNode }) {
  return <section className="card p-5 sm:p-6"><div className="mb-5 flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint text-pine"><Icon size={19} /></span><div><h2 className="font-display text-xl font-bold text-forest">{title}</h2><p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p></div></div>{children}</section>;
}
function TextField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{label}</span><input className="field" type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
}
function NumberField({ label, value, onChange, step = "1" }: { label: string; value: number; onChange: (v: string) => void; step?: string }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{label}</span><input className="field" type="number" min="0" step={step} value={value || ""} onChange={(e) => onChange(e.target.value)} /></label>;
}
function MoneyField(props: { label: string; value: number; onChange: (v: string) => void }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{props.label}</span><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input className="field !pl-7" type="number" min="0" step="1" value={props.value || ""} onChange={(e) => props.onChange(e.target.value)} /></div></label>;
}
function PercentField(props: { label: string; value: number; onChange: (v: string) => void }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{props.label}</span><div className="relative"><input className="field !pr-8" type="number" min="0" max="100" step="0.1" value={props.value} onChange={(e) => props.onChange(e.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span></div></label>;
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{label}</span><select className="field" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold">{label}</span><textarea className="field" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
}
function ScoreField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return <label className="block"><span className="mb-1.5 block min-h-8 text-xs font-bold leading-4">{label}</span><input className="field text-center font-extrabold" type="number" min="1" max="10" value={value} onChange={(e) => onChange(e.target.value)} /><span className="mt-1 block text-center text-[10px] text-slate-400">1–10</span></label>;
}
function BreakdownRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-3 text-sm ${strong ? "border-y border-black/5 py-3 font-extrabold" : ""}`}><span className="text-slate-500">{label}</span><span className="font-bold text-forest">{value}</span></div>;
}
