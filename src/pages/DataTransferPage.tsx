import {
  CheckCircle2,
  Cloud,
  DatabaseBackup,
  FileJson,
  HardDrive,
  LoaderCircle,
  Share2,
  ShieldCheck,
  Smartphone,
  Upload,
} from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { ErrorBanner, PageHeader } from "../components/Ui";
import { useApp } from "../context/AppContext";
import {
  createBackup,
  parseBackup,
  propertyFingerprint,
} from "../lib/transfer";

export function DataTransferPage() {
  const {
    properties,
    createProperty,
    localMode,
    session,
    setNotice,
  } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  function backupFile() {
    const date = new Date().toISOString().slice(0, 10);
    return new File(
      [createBackup(properties)],
      `rental-scout-backup-${date}.json`,
      { type: "application/json" },
    );
  }

  function download(file: File) {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function exportData(preferShare: boolean) {
    setError("");
    setResult("");
    if (!properties.length) {
      setError("Add at least one property before creating a backup.");
      return;
    }
    const file = backupFile();
    try {
      if (
        preferShare &&
        navigator.share &&
        (!navigator.canShare || navigator.canShare({ files: [file] }))
      ) {
        await navigator.share({
          title: "Rental Scout backup",
          text: `${properties.length} Rental Scout properties`,
          files: [file],
        });
        setResult(`Shared ${properties.length} properties.`);
      } else {
        download(file);
        setResult(`Downloaded ${properties.length} properties.`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not export your data.");
    }
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    setResult("");
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("The backup file must be smaller than 10 MB.");
      }
      const drafts = parseBackup(await file.text());
      const seen = new Set(properties.map(propertyFingerprint));
      const unique = drafts.filter((draft) => {
        const fingerprint = propertyFingerprint(draft);
        if (seen.has(fingerprint)) return false;
        seen.add(fingerprint);
        return true;
      });
      for (const draft of unique) {
        await createProperty(draft);
      }
      const skipped = drafts.length - unique.length;
      const summary = `Imported ${unique.length} ${unique.length === 1 ? "property" : "properties"}${skipped ? ` · skipped ${skipped} duplicate${skipped === 1 ? "" : "s"}` : ""}.`;
      setResult(summary);
      setNotice("Import complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import this file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-in">
      <PageHeader
        eyebrow="Portable records"
        title="Data transfer"
        description="Move your full property database between devices or keep an offline backup."
      />
      <ErrorBanner message={error} />
      {result && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          <CheckCircle2 size={18} /> {result}
        </div>
      )}

      <section className="card mb-6 overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-pine">
                {localMode ? <HardDrive size={21} /> : <Cloud size={21} />}
              </span>
              <div>
                <p className="eyebrow">Current storage</p>
                <h2 className="font-display text-xl font-bold text-forest">
                  {localMode ? "This browser only" : "Supabase cloud sync"}
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              {localMode
                ? "Your properties currently live only on this device. Export a backup to move them to your phone or another computer."
                : `Signed in as ${session?.user.email}. Sign into this same account on your phone or desktop and your properties will appear automatically.`}
            </p>
          </div>
          <div className="flex items-center border-t border-black/5 bg-canvas/60 px-6 py-4 text-sm font-bold text-pine lg:border-l lg:border-t-0">
            <DatabaseBackup className="mr-2" size={18} />
            {properties.length} saved {properties.length === 1 ? "property" : "properties"}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <TransferCard
          icon={FileJson}
          eyebrow="Create a backup"
          title="Export everything"
          description="Creates one JSON file containing every property, note, score, checklist, calculation, and trip-planning field."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void exportData(false)}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <DatabaseBackup size={17} /> Download backup
            </button>
            <button
              type="button"
              onClick={() => void exportData(true)}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <Share2 size={17} /> Share to phone
            </button>
          </div>
        </TransferCard>

        <TransferCard
          icon={Upload}
          eyebrow="Restore or move"
          title="Import a backup"
          description="Choose a Rental Scout JSON backup. Existing addresses are skipped so importing the same file twice will not create duplicates."
        >
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept=".json,application/json"
            onChange={(event) => void importData(event)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="btn-primary inline-flex w-full items-center justify-center gap-2"
          >
            {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Upload size={17} />}
            {busy ? "Importing…" : "Choose backup file"}
          </button>
        </TransferCard>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Tip icon={Smartphone} title="Phone friendly" text="Use Share to send the backup through AirDrop, Messages, email, Drive, or your phone’s share sheet." />
        <Tip icon={ShieldCheck} title="Full fidelity" text="JSON preserves details that spreadsheets lose, including checklists and decision history." />
        <Tip icon={Cloud} title="Automatic with Supabase" text="With cloud sync enabled, simply use the same login on every device—no file transfer needed." />
      </section>
    </div>
  );
}

function TransferCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: typeof Upload;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card flex flex-col p-5 sm:p-6">
      <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-mint text-pine">
        <Icon size={21} />
      </span>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl font-bold text-forest">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Tip({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Upload;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/50 p-4">
      <Icon size={18} className="text-pine" />
      <h3 className="mt-3 text-sm font-extrabold text-forest">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}
