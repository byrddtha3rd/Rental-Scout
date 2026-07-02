import { ArrowUpDown, Building2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, LoadingScreen, PageHeader, RatingBadge } from "../components/Ui";
import { useApp } from "../context/AppContext";
import { money, percent } from "../lib/format";
import { CONDITIONS, DEAL_STATUSES, type Property } from "../types";

type SortKey = "deal_score" | "monthly_cash_flow" | "asking_price" | "estimated_monthly_rent" | "zip_code" | "personal_interest_score";

export function PropertyListPage() {
  const { properties, loading } = useApp();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState("");
  const [condition, setCondition] = useState("");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState<SortKey>("deal_score");

  const cities = [...new Set(properties.map((p) => p.city).filter(Boolean))].sort();
  const zips = [...new Set(properties.map((p) => p.zip_code).filter(Boolean))].sort();
  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return properties
      .filter((p) => !needle || `${p.nickname} ${p.full_address} ${p.city} ${p.zip_code}`.toLowerCase().includes(needle))
      .filter((p) => !city || p.city === city)
      .filter((p) => !zip || p.zip_code === zip)
      .filter((p) => !status || p.deal_status === status)
      .filter((p) => !condition || p.condition_category === condition)
      .filter((p) => !rating || p.deal_rating === rating)
      .sort((a, b) => {
        if (sort === "zip_code") return a.zip_code.localeCompare(b.zip_code);
        return (b[sort] as number) - (a[sort] as number);
      });
  }, [city, condition, properties, rating, search, sort, status, zip]);

  if (loading) return <LoadingScreen />;
  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Deal library"
        title="Every property, one view."
        description={`${properties.length} saved ${properties.length === 1 ? "property" : "properties"} · compare the shortlist without losing the details.`}
        action={<Link to="/properties/new" className="btn-primary inline-flex items-center justify-center gap-2">+ Add property</Link>}
      />

      <section className="card mb-5 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="field !pl-10" placeholder="Search nickname, address, city, or ZIP…" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          <Filter value={city} onChange={setCity} label="All cities" values={cities} />
          <Filter value={zip} onChange={setZip} label="All ZIPs" values={zips} />
          <Filter value={status} onChange={setStatus} label="All statuses" values={[...DEAL_STATUSES]} />
          <Filter value={condition} onChange={setCondition} label="Any condition" values={[...CONDITIONS]} />
          <Filter value={rating} onChange={setRating} label="Any rating" values={["green", "yellow", "red"]} />
          <label className="relative col-span-2 sm:col-span-1 lg:col-span-2">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="field !pl-9 text-sm">
              <option value="deal_score">Sort: Deal score</option>
              <option value="monthly_cash_flow">Sort: Cash flow</option>
              <option value="asking_price">Sort: Price</option>
              <option value="estimated_monthly_rent">Sort: Rent</option>
              <option value="zip_code">Sort: ZIP code</option>
              <option value="personal_interest_score">Sort: Personal interest</option>
            </select>
          </label>
        </div>
      </section>

      {!filtered.length ? (
        <EmptyState icon={properties.length ? SlidersHorizontal : Building2} title={properties.length ? "No matches" : "No properties yet"} description={properties.length ? "Try clearing a filter or using a broader search." : "Add your first listing and Rental Scout will calculate the deal."} action={!properties.length && <Link to="/properties/new" className="btn-primary inline-flex">Add property</Link>} />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {filtered.map((property) => <PropertyCard key={property.id} property={property} />)}
        </section>
      )}
    </div>
  );
}

function Filter({ value, onChange, label, values }: { value: string; onChange: (value: string) => void; label: string; values: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="field text-sm">
      <option value="">{label}</option>
      {values.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  );
}

function PropertyCard({ property }: { property: Property }) {
  return (
    <Link to={`/properties/${property.id}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2"><RatingBadge rating={property.deal_rating} /><span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-bold text-slate-600">{property.deal_status}</span></div>
          <h2 className="truncate font-display text-xl font-bold text-forest group-hover:text-pine">{property.nickname || property.full_address}</h2>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={13} />{property.full_address}, {property.city}, {property.state} {property.zip_code}</p>
        </div>
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-forest text-white">
          <div className="text-center"><div className="font-display text-xl font-bold leading-none">{property.deal_score}</div><div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-white/60">score</div></div>
        </div>
      </div>
      <div className="grid grid-cols-4 border-t border-black/5 bg-white/40">
        <CardStat label="Cash flow" value={`${money(property.monthly_cash_flow)}/mo`} tone={property.monthly_cash_flow >= 100 ? "text-emerald-700" : "text-rose-700"} />
        <CardStat label="Price" value={money(property.asking_price)} />
        <CardStat label="Rent" value={money(property.estimated_monthly_rent)} />
        <CardStat label="Rent ratio" value={percent(property.rent_to_price_ratio)} />
      </div>
    </Link>
  );
}

function CardStat({ label, value, tone = "text-forest" }: { label: string; value: string; tone?: string }) {
  return <div className="min-w-0 border-r border-black/5 p-3 last:border-0"><div className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</div><div className={`mt-1 truncate text-xs font-extrabold ${tone}`}>{value}</div></div>;
}
