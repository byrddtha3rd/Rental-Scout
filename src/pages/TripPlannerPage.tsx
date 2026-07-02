import { CalendarDays, MapPin, MapPinned, Navigation, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, PageHeader, RatingBadge } from "../components/Ui";
import { useApp } from "../context/AppContext";
import { dateLabel, money } from "../lib/format";

export function TripPlannerPage() {
  const { properties } = useApp();
  const selected = properties.filter((property) => property.add_to_visit_list);
  const groups = Object.entries(
    selected.reduce<Record<string, typeof selected>>((result, property) => {
      const key = `${property.city}, ${property.state} · ${property.zip_code}`;
      (result[key] ??= []).push(property);
      return result;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="East Coast fieldwork"
        title="Trip planner"
        description={`${selected.length} ${selected.length === 1 ? "home" : "homes"} on your visit list, grouped into a route-ready shortlist.`}
        action={<Link to="/properties" className="btn-secondary inline-flex items-center justify-center gap-2"><Navigation size={16} /> Find properties</Link>}
      />
      {!selected.length ? (
        <EmptyState icon={MapPinned} title="Your route is wide open" description="Add promising homes to the visit list from a property page. They will be grouped here by city and ZIP code." action={<Link to="/properties" className="btn-primary inline-flex">Browse properties</Link>} />
      ) : (
        <div className="space-y-7">
          {groups.map(([location, properties]) => (
            <section key={location}>
              <div className="mb-3 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-pine"><MapPin size={16} /></span><h2 className="font-display text-xl font-bold text-forest">{location}</h2><span className="text-xs font-bold text-slate-400">{properties.length} {properties.length === 1 ? "stop" : "stops"}</span></div>
              <div className="grid gap-4 lg:grid-cols-2">
                {[...properties].sort((a, b) => b.deal_score - a.deal_score).map((property, index) => (
                  <Link key={property.id} to={`/properties/${property.id}`} className="card group overflow-hidden transition hover:-translate-y-0.5">
                    <div className="flex items-start gap-4 p-5">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest font-display text-lg font-bold text-white">{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2"><div><h3 className="truncate font-display text-xl font-bold text-forest">{property.nickname}</h3><p className="mt-1 truncate text-xs text-slate-500">{property.full_address}</p></div><RatingBadge rating={property.deal_rating} /></div>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-600">
                          <span className="flex items-center gap-1"><Star size={14} className="text-gold" /> {property.deal_score}/100</span>
                          <span className="text-emerald-700">{money(property.monthly_cash_flow)}/mo</span>
                          <span className="flex items-center gap-1"><CalendarDays size={14} /> {dateLabel(property.visit_date)}</span>
                        </div>
                      </div>
                    </div>
                    {(property.realtor_notes || property.post_visit_decision) && <div className="border-t border-black/5 bg-canvas/60 p-4 text-xs leading-5 text-slate-600">{property.realtor_notes && <p><b>Realtor:</b> {property.realtor_notes}</p>}{property.post_visit_decision && <p className="mt-1"><b>Decision:</b> {property.post_visit_decision}</p>}</div>}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
