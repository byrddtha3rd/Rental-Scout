import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Check, Cloud, HardDrive, LoaderCircle } from "lucide-react";
import type { DealRating } from "../types";
import { useApp } from "../context/AppContext";

export function RatingBadge({ rating }: { rating: DealRating }) {
  const styles = {
    green: "bg-emerald-100 text-emerald-800 border-emerald-200",
    yellow: "bg-amber-100 text-amber-800 border-amber-200",
    red: "bg-rose-100 text-rose-800 border-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold capitalize ${styles[rating]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {rating}
    </span>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-pine">
          <Icon size={17} strokeWidth={2.3} />
        </span>
      </div>
      <div className="font-display text-2xl font-bold text-forest sm:text-3xl">{value}</div>
      {detail && <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="eyebrow mb-2">{eyebrow}</div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-forest sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card grid min-h-64 place-items-center px-6 py-12 text-center">
      <div>
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-mint text-pine">
          <Icon size={24} />
        </span>
        <h2 className="font-display text-xl font-bold text-forest">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-pine">
      <LoaderCircle className="animate-spin" size={28} />
    </div>
  );
}

export function SyncNotice() {
  const { notice, setNotice, localMode } = useApp();
  if (!notice) return null;
  return (
    <button
      type="button"
      onClick={() => setNotice("")}
      className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-xl md:bottom-6"
    >
      <Check size={16} />
      {notice}
      {localMode ? <HardDrive size={14} /> : <Cloud size={14} />}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      {message}
    </div>
  );
}
