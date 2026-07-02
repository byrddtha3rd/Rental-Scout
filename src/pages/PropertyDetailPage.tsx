import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  BedDouble,
  Building,
  CalendarDays,
  Check,
  CircleDollarSign,
  ExternalLink,
  Gauge,
  Heart,
  MapPin,
  Pencil,
  Ruler,
  ShieldCheck,
  Sparkles,
  SquareCheckBig,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState, LoadingScreen, RatingBadge } from "../components/Ui";
import { useApp } from "../context/AppContext";
import { dateLabel, money, number, percent } from "../lib/format";
import { toDraft } from "../lib/property";

export function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, loading, updateProperty } = useApp();
  const property = properties.find((item) => item.id === id);
  if (loading) return <LoadingScreen />;
  if (!property) return <EmptyState icon={Building} title="Property not found" description="This record may have been deleted or is no longer available." action={<Link to="/properties" className="btn-primary inline-flex">Back to properties</Link>} />;
  const selectedProperty = property;
  const shortfall = property.heloc_interest_portion > property.heloc_required_payment;

  async function toggleVisit() {
    await updateProperty(selectedProperty.id, { ...toDraft(selectedProperty), add_to_visit_list: !selectedProperty.add_to_visit_list });
  }

  return (
    <div className="animate-in">
      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-bold text-pine"><ArrowLeft size={17} /> Back</button>
        <div className="flex gap-2">
          <button onClick={() => void toggleVisit()} className="btn-secondary !min-h-10 !px-3 text-xs">{property.add_to_visit_list ? "On visit list" : "+ Visit list"}</button>
          <Link to={`/properties/${property.id}/edit`} className="btn-primary inline-flex !min-h-10 items-center gap-2 !px-3 text-xs"><Pencil size={15} /> Edit</Link>
        </div>
      </div>

      <header className="card overflow-hidden">
        <div className="bg-forest p-5 text-white sm:p-7">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2"><RatingBadge rating={property.deal_rating} /><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">{property.deal_status}</span></div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{property.nickname}</h1>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-white/55"><MapPin size={16} className="mt-0.5 shrink-0" /> {property.full_address}, {property.city}, {property.state} {property.zip_code}</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/60">
                <span className="flex items-center gap-1.5"><BedDouble size={15} /> {property.bedrooms} bd · {property.bathrooms} ba</span>
                <span className="flex items-center gap-1.5"><Ruler size={15} /> {number(property.square_footage)} sq ft</span>
                <span className="flex items-center gap-1.5"><CalendarDays size={15} /> Built {property.year_built || "—"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-72">
              <HeroMetric label="Cash flow" value={money(property.monthly_cash_flow)} detail="/ month" positive={property.monthly_cash_flow >= 100} />
              <HeroMetric label="Deal score" value={String(property.deal_score)} detail="/ 100" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-black/5 sm:grid-cols-4 sm:divide-y-0">
          <HeaderStat label="Asking price" value={money(property.asking_price)} />
          <HeaderStat label="Expected rent" value={`${money(property.estimated_monthly_rent)}/mo`} />
          <HeaderStat label="Rent ratio" value={percent(property.rent_to_price_ratio)} />
          <HeaderStat label="Project cost" value={money(property.total_project_cost)} />
        </div>
      </header>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.45fr_.9fr]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <SectionTitle icon={CircleDollarSign} eyebrow="Monthly economics" title="Deal breakdown" />
            <div className="mt-5 grid gap-x-8 sm:grid-cols-2">
              <DetailRow label="Investment loan" value={money(property.investment_loan_amount)} />
              <DetailRow label="Down payment" value={money(property.down_payment_amount)} />
              <DetailRow label="Mortgage payment" value={money(property.monthly_mortgage_payment)} />
              <DetailRow label="HELOC payment" value={money(property.heloc_required_payment)} />
              <DetailRow label="Property management" value={money(property.property_management_fee)} />
              <DetailRow label="Monthly taxes" value={money(property.monthly_taxes)} />
              <DetailRow label="Monthly insurance" value={money(property.monthly_insurance)} />
              <DetailRow label="Monthly HOA" value={money(property.monthly_hoa)} />
            </div>
            <div className="mt-3 rounded-2xl bg-canvas p-4">
              <DetailRow label="Total monthly outflow" value={money(property.total_monthly_outflow)} strong />
              <DetailRow label="Monthly cash flow" value={money(property.monthly_cash_flow)} strong tone={property.monthly_cash_flow >= 100 ? "text-emerald-700" : "text-rose-700"} />
              <DetailRow label="After-rehab cash flow" value={money(property.after_rehab_cash_flow)} strong tone="text-pine" />
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <SectionTitle icon={Banknote} eyebrow="Leverage" title="HELOC payment breakdown" />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniMetric label="Balance" value={money(property.heloc_balance)} />
              <MiniMetric label="Required payment" value={money(property.heloc_required_payment)} />
              <MiniMetric label="Interest portion" value={money(property.heloc_interest_portion, 2)} />
              <MiniMetric label="Principal portion" value={money(property.heloc_principal_portion, 2)} />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-black/5 p-4"><span className="text-sm font-bold text-slate-500">Remaining balance after payment</span><span className="font-display text-xl font-bold text-forest">{money(property.heloc_remaining_balance, 2)}</span></div>
            {shortfall && <div className="mt-3 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800"><AlertTriangle size={18} className="shrink-0" />The required payment does not fully cover this month’s interest.</div>}
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <Narrative icon={ThumbsUp} title="Pros" text={property.pros} />
            <Narrative icon={ThumbsDown} title="Cons" text={property.cons} />
            <Narrative icon={Sparkles} title="Why I liked this deal" text={property.why_liked} />
            <Narrative icon={ClipboardIcon} title="Notes" text={property.notes} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <SectionTitle icon={Gauge} eyebrow="Balanced score" title={`${property.deal_score} out of 100`} />
            <div className="mt-5 space-y-4">
              <ScoreBar label="Personal interest" value={property.personal_interest_score} icon={Heart} />
              <ScoreBar label="Neighborhood" value={property.neighborhood_score} icon={MapPin} />
              <ScoreBar label="School & safety" value={property.school_safety_score} icon={ShieldCheck} />
              <ScoreBar label="Rehab risk" value={property.rehab_risk_score} icon={AlertTriangle} reverse />
            </div>
          </section>

          <section className="card p-5">
            <SectionTitle icon={SquareCheckBig} eyebrow="Due diligence" title="Things to verify" />
            <div className="mt-4 space-y-2">
              {property.verification_checklist.length ? property.verification_checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl bg-canvas p-3">
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${item.completed ? "border-pine bg-pine text-white" : "border-slate-300"}`}>{item.completed && <Check size={13} />}</span>
                  <span className={`text-sm leading-5 ${item.completed ? "text-slate-400 line-through" : ""}`}>{item.text}</span>
                </div>
              )) : <p className="rounded-xl bg-canvas p-4 text-sm text-slate-500">No checklist items yet.</p>}
            </div>
          </section>

          <section className="card p-5">
            <SectionTitle icon={CalendarDays} eyebrow="Trip planning" title={property.add_to_visit_list ? "On your visit list" : "Not on visit list"} />
            <div className="mt-4 space-y-3 text-sm">
              <DetailRow label="Visit date" value={dateLabel(property.visit_date)} />
              <div><div className="mb-1 text-xs font-bold text-slate-400">Realtor notes</div><p className="whitespace-pre-wrap leading-6">{property.realtor_notes || "No notes yet."}</p></div>
              <div><div className="mb-1 text-xs font-bold text-slate-400">Post-visit decision</div><p className="font-semibold">{property.post_visit_decision || "No decision yet."}</p></div>
            </div>
          </section>

          {property.status_history.length > 0 && <section className="card p-5"><SectionTitle icon={HistoryIcon} eyebrow="Decision history" title="Timeline" /><div className="mt-5 space-y-4">{[...property.status_history].reverse().map((item) => <div key={item.id} className="relative border-l-2 border-mint pl-4"><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-pine" /><div className="text-sm font-bold">{item.type === "status" ? `${item.from} → ${item.to}` : `Decision: ${item.to}`}</div><div className="mt-1 text-[11px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</div></div>)}</div></section>}

          {property.listing_url && <a href={property.listing_url} target="_blank" rel="noreferrer" className="btn-secondary flex w-full items-center justify-center gap-2"><ExternalLink size={16} /> Open original listing</a>}
        </aside>
      </div>
    </div>
  );
}

const ClipboardIcon = Building;
const HistoryIcon = CalendarDays;
function HeroMetric({ label, value, detail, positive }: { label: string; value: string; detail: string; positive?: boolean }) { return <div className="rounded-2xl bg-white/8 p-4"><div className="text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</div><div className={`mt-1 font-display text-2xl font-bold ${positive ? "text-mint" : ""}`}>{value}</div><div className="text-[10px] text-white/40">{detail}</div></div>; }
function HeaderStat({ label, value }: { label: string; value: string }) { return <div className="p-4 text-center"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 font-display text-lg font-bold text-forest">{value}</div></div>; }
function SectionTitle({ icon: Icon, eyebrow, title }: { icon: typeof Gauge; eyebrow: string; title: string }) { return <div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mint text-pine"><Icon size={19} /></span><div><div className="eyebrow">{eyebrow}</div><h2 className="font-display text-xl font-bold text-forest">{title}</h2></div></div>; }
function DetailRow({ label, value, strong, tone = "text-forest" }: { label: string; value: string; strong?: boolean; tone?: string }) { return <div className={`flex items-center justify-between gap-3 border-b border-black/5 py-3 last:border-0 ${strong ? "font-extrabold" : "text-sm"}`}><span className="text-slate-500">{label}</span><span className={`text-right font-bold ${tone}`}>{value}</span></div>; }
function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-canvas p-3"><div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 font-display text-lg font-bold text-forest">{value}</div></div>; }
function Narrative({ icon: Icon, title, text }: { icon: typeof Gauge; title: string; text: string }) { return <section className="card p-5"><div className="flex items-center gap-2 text-pine"><Icon size={18} /><h2 className="font-display text-lg font-bold">{title}</h2></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{text || "Nothing added yet."}</p></section>; }
function ScoreBar({ label, value, icon: Icon, reverse }: { label: string; value: number; icon: typeof Gauge; reverse?: boolean }) { const display = reverse ? 11 - value : value; return <div><div className="mb-1.5 flex items-center justify-between text-xs font-bold"><span className="flex items-center gap-1.5 text-slate-500"><Icon size={14} />{label}</span><span>{value}/10</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-pine" style={{ width: `${display * 10}%` }} /></div></div>; }
