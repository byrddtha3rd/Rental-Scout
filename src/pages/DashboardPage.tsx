import { ArrowRight, Building2, CircleDollarSign, Gauge, Home, KeyRound, MapPinned } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { money } from "../lib/format";
import { EmptyState, ErrorBanner, LoadingScreen, MetricCard, PageHeader, RatingBadge } from "../components/Ui";

export function DashboardPage() {
  const { properties, loading, error } = useApp();
  if (loading) return <LoadingScreen />;

  const ratingCount = (rating: string) =>
    properties.filter((property) => property.deal_rating === rating).length;
  const average = (key: "asking_price" | "estimated_monthly_rent") =>
    properties.length
      ? properties.reduce((sum, property) => sum + property[key], 0) / properties.length
      : 0;
  const bestCash = [...properties].sort((a, b) => b.monthly_cash_flow - a.monthly_cash_flow)[0];
  const bestScore = [...properties].sort((a, b) => b.deal_score - a.deal_score)[0];
  const leaders = [...properties].sort((a, b) => b.deal_score - a.deal_score).slice(0, 4);

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Portfolio command center"
        title="Good evening, scout."
        description="Keep the numbers honest and the short list sharp."
        action={
          <Link to="/properties/new" className="btn-primary inline-flex items-center justify-center gap-2">
            <span className="text-xl leading-none">+</span> Add property
          </Link>
        }
      />
      <ErrorBanner message={error} />
      {!properties.length ? (
        <EmptyState
          icon={Home}
          title="Your scouting board is ready"
          description="Save your first listing to see cash flow, HELOC impact, deal score, and portfolio comparisons."
          action={<Link to="/properties/new" className="btn-primary inline-flex">Add first property</Link>}
        />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard icon={Building2} label="Saved" value={String(properties.length)} detail={`${ratingCount("green")} green · ${ratingCount("yellow")} yellow · ${ratingCount("red")} red`} />
            <MetricCard icon={CircleDollarSign} label="Best cash flow" value={money(bestCash.monthly_cash_flow)} detail={bestCash.nickname || bestCash.full_address} />
            <MetricCard icon={Gauge} label="Top score" value={`${bestScore.deal_score}/100`} detail={bestScore.nickname || bestScore.full_address} />
            <MetricCard icon={KeyRound} label="Avg. price" value={money(average("asking_price"))} />
            <MetricCard icon={Home} label="Avg. rent" value={money(average("estimated_monthly_rent"))} detail="per month" />
            <MetricCard icon={MapPinned} label="Trip list" value={String(properties.filter((p) => p.add_to_visit_list).length)} detail="homes selected" />
          </section>

          <section className="mt-7 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/5 p-5">
                <div>
                  <p className="eyebrow">Leaderboard</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-forest">Top opportunities</h2>
                </div>
                <Link to="/properties" className="flex items-center gap-1 text-xs font-bold text-pine">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="divide-y divide-black/5">
                {leaders.map((property, index) => (
                  <Link key={property.id} to={`/properties/${property.id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 transition hover:bg-mint/25">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-canvas font-display font-bold text-pine">{index + 1}</span>
                    <div className="min-w-0">
                      <div className="truncate font-bold">{property.nickname || property.full_address}</div>
                      <div className="truncate text-xs text-slate-500">{property.city}, {property.state} {property.zip_code}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-bold text-forest">{property.deal_score}</div>
                      <div className="text-xs font-bold text-emerald-700">{money(property.monthly_cash_flow)}/mo</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <p className="eyebrow">Deal health</p>
              <h2 className="mt-1 font-display text-xl font-bold text-forest">At a glance</h2>
              <div className="mt-6 space-y-4">
                {(["green", "yellow", "red"] as const).map((rating) => {
                  const count = ratingCount(rating);
                  return (
                    <div key={rating}>
                      <div className="mb-2 flex items-center justify-between">
                        <RatingBadge rating={rating} />
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${rating === "green" ? "bg-emerald-500" : rating === "yellow" ? "bg-amber-400" : "bg-rose-500"}`} style={{ width: `${properties.length ? (count / properties.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
