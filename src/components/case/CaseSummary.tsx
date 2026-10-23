import type { SummaryView } from "@/lib/caseView";
import type { DemoCopy } from "@/lib/types";

/** The clinician-facing case card. Used by the kiosk preview and the real doctor console. */
export function CaseSummary({ view, copy }: { view: SummaryView; copy: DemoCopy }) {
  const quick: [string, string | undefined][] = [
    [copy.allergies, view.quick.allergies],
    [copy.medications, view.quick.medicines],
    [copy.pastHistory, view.quick.past],
  ];

  return (
    <article className="space-y-4 rounded-[1.4rem] bg-cream p-5 text-ink shadow-xl">
      <section>
        {view.patientLine && <p className="mb-2 inline-block rounded-full bg-paper px-3 py-1 text-sm text-ink/70">{view.patientLine}</p>}
        <h2 className="text-xs uppercase tracking-widest text-ink/40">{copy.chiefComplaint}</h2>
        <p className="mt-1 font-display text-2xl">{view.complaint ?? "—"}</p>
        {view.complaintOriginal && <p className="text-sm text-ink/45">{view.complaintOriginal}</p>}
      </section>

      {view.flags.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-widest text-clay">{copy.flags}</h2>
          <ul className="mt-2 space-y-1">
            {view.flags.map((f) => (
              <li key={f} className="rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay-deep">
                {copy.flagLabel}: {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-widest text-ink/40">{copy.history}</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {view.history.map((h) => (
            <li key={h.q} className="border-b border-ink/10 pb-2">
              <p className="text-ink/45">{h.q}</p>
              <p>{h.a}</p>
              {h.original && <p className="text-xs text-ink/45">{h.original}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {quick.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-paper px-3 py-3">
            <p className="text-[11px] uppercase tracking-widest text-ink/40">{label}</p>
            <p className="mt-1 text-sm">{value ?? "—"}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-ink/40">{copy.documents}</h2>
        {view.documents.length === 0 ? (
          <p className="mt-1 text-sm text-ink/50">{copy.noDocuments}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {view.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2 text-sm">
                {d.imageUrl && (
                  <a href={d.imageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0" title={d.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.imageUrl} alt={d.name} className="h-14 w-14 rounded-md border border-ink/10 bg-white object-cover" />
                  </a>
                )}
                <div className="min-w-0">
                  <p className="font-medium">{d.title}</p>
                  <p>{d.detail}</p>
                  {d.flag && <p className="text-clay">{d.flag}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
