import { createAdminClient } from "@/lib/supabase/admin";

export type ParentMasterRecord = {
  id: string;
  username: string;
};

export async function findParentMasterByEmail(
  email: string,
): Promise<ParentMasterRecord | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const userId = await findAuthUserIdByEmail(normalized);
  if (!userId) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, username, account_role")
    .eq("id", userId)
    .maybeSingle();

  if (!data || data.account_role !== "parent_master") {
    return null;
  }

  return { id: data.id, username: data.username };
}

/** GoTrue admin list filtered by email (no getUserByEmail in this SDK). */
export async function findAuthUserIdByEmail(
  email: string,
): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;

  try {
    const response = await fetch(
      `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${key}`,
          apikey: key,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!response.ok) return null;

    const json = (await response.json()) as {
      users?: Array<{ id?: string; email?: string }>;
      id?: string;
      email?: string;
    };

    if (Array.isArray(json.users)) {
      const match = json.users.find(
        (user) => user.email?.trim().toLowerCase() === email,
      );
      return match?.id ?? null;
    }

    if (json.email?.trim().toLowerCase() === email && json.id) {
      return json.id;
    }
  } catch {
    return null;
  }

  return null;
}
