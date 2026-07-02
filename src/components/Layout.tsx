import {
  BarChart3,
  Building2,
  Cloud,
  DatabaseBackup,
  HardDrive,
  LogOut,
  MapPinned,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { SyncNotice } from "./Ui";

const links = [
  { to: "/", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/properties/new", label: "Add property", icon: Plus, desktopOnly: true },
  { to: "/trip", label: "Trip planner", icon: MapPinned },
  { to: "/data", label: "Data transfer", icon: DatabaseBackup, desktopOnly: true },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
    isActive ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/7 hover:text-white"
  }`;

export function Layout() {
  const [menu, setMenu] = useState(false);
  const { localMode, session, signOut } = useApp();
  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-forest p-5 text-white md:flex">
        <div className="mb-10 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-coral text-white">
            <Building2 size={21} />
          </span>
          <div>
            <div className="font-display text-xl font-bold">Rental Scout</div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-white/45">
              Deal intelligence
            </div>
          </div>
        </div>
        <nav className="space-y-1.5">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-xs font-bold">
              {localMode ? <HardDrive size={14} /> : <Cloud size={14} />}
              {localMode ? "Local mode" : "Cloud sync active"}
            </div>
            <p className="mt-1 truncate text-[11px] text-white/45">
              {localMode ? "Saved on this device" : session?.user.email}
            </p>
          </div>
          {!localMode && (
            <button onClick={() => void signOut()} className={`${navClass({ isActive: false })} w-full`}>
              <LogOut size={18} /> Sign out
            </button>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/5 bg-paper/95 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-white">
            <Building2 size={19} />
          </span>
          <span className="font-display text-lg font-bold text-forest">Rental Scout</span>
        </div>
        <button
          aria-label="Open menu"
          onClick={() => setMenu(true)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-black/10"
        >
          <Menu size={20} />
        </button>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 bg-forest p-5 text-white md:hidden">
          <div className="mb-9 flex items-center justify-between">
            <span className="font-display text-2xl font-bold">Rental Scout</span>
            <button aria-label="Close menu" onClick={() => setMenu(false)} className="p-2">
              <X />
            </button>
          </div>
          <nav className="space-y-2">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setMenu(false)} className={navClass}>
                <Icon size={19} /> {label}
              </NavLink>
            ))}
          </nav>
          {!localMode && (
            <button onClick={() => void signOut()} className="mt-6 flex items-center gap-2 text-sm font-bold">
              <LogOut size={18} /> Sign out
            </button>
          )}
        </div>
      )}

      <main className="pb-24 md:ml-64 md:pb-0">
        {localMode && (
          <div className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs font-bold text-amber-900">
            <HardDrive size={14} /> Local mode · data is saved only on this browser
          </div>
        )}
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-9">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-black/10 bg-paper px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        {links.filter((link) => !link.desktopOnly).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-bold ${
                isActive ? "text-pine" : "text-slate-400"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/properties/new"
          className="flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-bold text-slate-400"
        >
          <Plus size={20} /> Add
        </NavLink>
      </nav>
      <SyncNotice />
    </div>
  );
}
