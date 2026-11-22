export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({
    crustdata: !!process.env.CRUSTDATA_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    analystModel: process.env.OPENAI_ANALYST_MODEL || "gpt-5.4-mini",
    writerModel: process.env.OPENAI_WRITER_MODEL || "gpt-5.5",
  });
}
