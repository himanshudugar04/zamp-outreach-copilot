"use client";
import { useCallback, useState } from "react";
import type { StageMap } from "@/components/StageLog";
import { newId, saveRun, type RunRecord } from "./store";
import type { RunInput, RunResult, StreamEvent } from "./types";

export function useRunner() {
  const [stages, setStages] = useState<StageMap>({});
  const [record, setRecord] = useState<RunRecord | undefined>();
  const [live, setLive] = useState(false);

  const start = useCallback(async (input: RunInput) => {
    setLive(true);
    setRecord(undefined);
    const st: StageMap = {};
    setStages({});
    const id = newId();
    const createdAt = new Date().toISOString();
    let result: RunResult | undefined;
    try {
      const res = await fetch("/api/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as StreamEvent;
          if (ev.type === "stage") {
            st[ev.id] = ev;
            setStages({ ...st });
          } else if (ev.type === "result") result = ev.result;
        }
      }
    } catch (e: any) {
      result = {
        status: "error",
        purpose: input.purpose,
        flags: {},
        signals: [],
        sources: {},
        usage: { credits: 0, tokens: 0, llmCalls: 0 },
        durationMs: 0,
        error: e?.message || "Network error",
      };
    }
    if (result) {
      const rec: RunRecord = { id, createdAt, input, result, approval: "pending", regenerations: 0, reply: "unknown", stages: st };
      saveRun(rec);
      setRecord(rec);
    }
    setLive(false);
  }, []);

  return { stages, record, setRecord, live, start };
}
