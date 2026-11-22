import { PLAYBOOKS, SUPPRESSION_LIST } from "@/lib/playbooks";

export default function Playbooks() {
  return (
    <div className="mx-auto max-w-[1100px] px-5 py-6 md:px-8">
      <h1 className="text-[22px] font-semibold tracking-tight">Playbooks</h1>
      <p className="max-w-[70ch] text-[13px] text-ink-2">
        A playbook tells the desk what this outreach is for: who counts as a good fit, which signals matter, which claims it may make, and how the email should sound. The writer can only use the proof points listed here.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {Object.values(PLAYBOOKS).map((p) => (
          <article key={p.id} className="rounded-xl border border-rule bg-sheet p-5">
            <h2 className="text-[16px] font-semibold">{p.name}</h2>
            <p className="text-2xs text-ink-3">Used by {p.persona}</p>
            <p className="mt-2 text-[13px] text-ink-2">{p.goal}</p>

            <Block title="Offer">{p.offer}</Block>
            <Block title="Good-fit roles">{p.targetRoles.join(", ")}</Block>
            <Block title="Strong signals">
              <ul className="list-disc space-y-0.5 pl-4">{p.strongSignals.map((s) => <li key={s}>{s}</li>)}</ul>
            </Block>
            {p.proofPoints.length > 0 && (
              <Block title="Allowed proof points">
                <ul className="space-y-1">
                  {p.proofPoints.map((x) => (
                    <li key={x.id}>
                      <span className="num mr-1.5 text-sky">{x.id}</span>
                      {x.text}{" "}
                      <a href={x.sourceUrl} target="_blank" rel="noreferrer" className="text-2xs text-ink-3 hover:text-sky">({x.source})</a>
                    </li>
                  ))}
                </ul>
              </Block>
            )}
            {p.event && (
              <Block title="Event (sample for this demo)">
                <p className="font-medium text-ink">{p.event.name}</p>
                <p>{p.event.format}. {p.event.date}, {p.event.city}.</p>
                <p className="mt-1">{p.event.topic}.</p>
              </Block>
            )}
            <Block title="Message rules">
              {p.length.min} to {p.length.max} words, 70 for executives. Ends with a one-word question such as “{p.ctaExamples[0]}” Never says: {p.neverSay.join(", ")}.
            </Block>
            <Block title="Job titles it watches for">{p.jobKeywords.join(", ")}</Block>
          </article>
        ))}
      </div>

      <article className="mt-6 rounded-xl border border-rule bg-sheet p-5">
        <h2 className="text-[16px] font-semibold">Do-not-contact list</h2>
        <p className="mt-1 text-[13px] text-ink-2">
          Companies Zamp names publicly as customers. Runs stop before research so existing accounts are never cold-pitched.
        </p>
        <p className="mt-2 text-[13px] capitalize text-ink">{SUPPRESSION_LIST.join(", ")}</p>
      </article>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 border-t border-rule pt-3 text-[13px] text-ink-2">
      <h3 className="mb-1 text-2xs text-ink-3">{title}</h3>
      {children}
    </section>
  );
}
