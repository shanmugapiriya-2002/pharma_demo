// Saves (or updates) a signed-in user in the Supabase `app_users` table.
// Uses the Supabase REST API with the server-only secret key — no extra package.
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://xererutljqhdmqqsdsxz.supabase.co";

export type AppUser = {
  email: string;
  name?: string | null;
  image?: string | null;
};

export async function saveUser(user: AppUser) {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    console.error("[saveUser] SUPABASE_SECRET_KEY is not set");
    return;
  }

  // on_conflict=email + merge-duplicates = insert new user, or update existing one
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_users?on_conflict=email`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      email: user.email.toLowerCase(),
      name: user.name ?? null,
      image: user.image ?? null,
      last_login_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("[saveUser] Supabase error:", res.status, await res.text());
  }
}
