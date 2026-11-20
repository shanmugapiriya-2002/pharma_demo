// Server-side proxy for the Supabase `smart-api` edge function.
// Keys stay on the server, so a secret key is never sent to the browser.
const SMART_API_URL =
  "https://xererutljqhdmqqsdsxz.supabase.co/functions/v1/smart-api";

export async function POST(request: Request) {
  // smart-api lives in a different Supabase project than app_users,
  // so it has its own key (SMART_API_KEY); falls back to the old variable.
  const key =
    process.env.SMART_API_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  let inn = "";
  try {
    const body = await request.json();
    inn = typeof body?.inn === "string" ? body.inn.trim() : "";
  } catch {
    // invalid JSON body
  }
  if (!inn) {
    return Response.json({ error: "`inn` is required" }, { status: 400 });
  }

  try {
    const res = await fetch(SMART_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify({ inn }),
      cache: "no-store",
    });
    const text = await res.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      // not JSON — keep raw text
    }
    console.log("[smart-api]", inn, res.status, data);
    return Response.json(data, { status: res.status });
  } catch (err) {
    console.error("[smart-api] request failed:", err);
    return Response.json({ error: "smart-api unreachable" }, { status: 502 });
  }
}
