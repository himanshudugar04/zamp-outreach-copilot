import { writeDraft, type WriteInput } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as WriteInput;
  if (!body?.hook || !body?.prospect || !body?.purpose) return Response.json({ error: "Missing input" }, { status: 400 });
  if ((body.attempt ?? 1) > 4) return Response.json({ error: "Regenerate limit reached for this run" }, { status: 429 });
  try {
    const out = await writeDraft(body);
    return Response.json(out);
  } catch (e: any) {
    return Response.json({ error: e?.message || "Draft failed" }, { status: 500 });
  }
}
