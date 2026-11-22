import { runPipeline } from "@/lib/pipeline";
import type { RunInput, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const input = (await req.json()) as RunInput;
  if (!input?.purpose || (!input.name && !input.linkedinUrl && !input.findSuccessor)) {
    return Response.json({ error: "Enter a name and company, or a LinkedIn URL." }, { status: 400 });
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      const result = await runPipeline(input, (e) => send(e));
      send({ type: "result", result });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
