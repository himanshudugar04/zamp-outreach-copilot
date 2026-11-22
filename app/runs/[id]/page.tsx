"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RunView } from "@/components/RunView";
import { getRun, type RunRecord } from "@/lib/store";
import { useRunner } from "@/lib/useRunner";
import { PLAYBOOKS } from "@/lib/playbooks";

export default function RunPage({ params }: { params: { id: string } }) {
  const [rec, setRec] = useState<RunRecord | undefined>();
  const [missing, setMissing] = useState(false);
  const runner = useRunner();
  const router = useRouter();

  useEffect(() => {
    const r = getRun(params.id);
    if (r) setRec(r);
    else setMissing(true);
  }, [params.id]);

  useEffect(() => {
    if (runner.record) router.push(`/runs/${runner.record.id}`);
  }, [runner.record, router]);

  if (missing)
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16 text-center">
        <p className="text-[18px] font-semibold">This run is not in this browser</p>
        <p className="mt-1 text-[13px] text-ink-2">Runs are saved locally. Open it from the browser that created it, or start a new one.</p>
        <Link href="/" className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-white">Research a prospect</Link>
      </div>
    );
  if (!rec) return null;

  const showing = runner.live ? undefined : rec;
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-6 md:px-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-[12px] text-ink-2 hover:text-ink">
        <ArrowLeft size={13} /> All runs
      </Link>
      <h1 className="mt-2 text-[22px] font-semibold tracking-tight">
        {rec.result.prospect?.name || rec.input.name || "Run"}
        <span className="ml-2 align-middle font-sans text-[13px] font-normal text-ink-3">
          {PLAYBOOKS[rec.input.purpose].name}, {new Date(rec.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </h1>
      <div className="mt-5">
        <RunView
          record={showing}
          stages={runner.live ? runner.stages : rec.stages || {}}
          live={runner.live}
          onRecordChange={setRec}
          onRerun={(i) => runner.start(i)}
        />
      </div>
    </div>
  );
}
