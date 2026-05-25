import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

export const SUPABASE_URL = "https://embyeagjkwitblxyjbsr.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtYnllYWdqa3dpdGJseHlqYnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NDI0MjQsImV4cCI6MjA5NTIxODQyNH0.gwCJ-IhpTd-9Qy5bk1Rfp3rqq6msfKpuPRfcU6w1D2U";
export const HOST_EMAIL = "stampacecharming@gmail.com";
export const TEMPLATE_TABLE = "app_templates";
export const TEMPLATE_ROW_ID = "live";
export const IMAGE_BUCKET = "images";
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

let guestClient = null;
let hostClient = null;

function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function getGuestSupabase() {
  if (!guestClient) {
    guestClient = createSupabaseClient();
  }
  return guestClient;
}

export function getHostSupabase() {
  if (!hostClient) {
    hostClient = createSupabaseClient();
  }
  return hostClient;
}

export async function fetchRemoteTemplateRow(client = getGuestSupabase()) {
  const { data, error } = await client
    .from(TEMPLATE_TABLE)
    .select("content, updated_at")
    .eq("id", TEMPLATE_ROW_ID)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function subscribeToRemoteTemplate(onChange, client = getGuestSupabase()) {
  const channel = client
    .channel("live-template")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TEMPLATE_TABLE,
        filter: `id=eq.${TEMPLATE_ROW_ID}`,
      },
      (payload) => {
        if (payload.new?.content) {
          onChange(payload.new);
        }
      },
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export async function publishRemoteTemplate(content, client = getHostSupabase()) {
  const { data, error } = await client
    .from(TEMPLATE_TABLE)
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", TEMPLATE_ROW_ID)
    .select("content, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function slugifyFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadSectionImage(file, sectionId, client = getHostSupabase()) {
  if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato immagine non consentito.");
  }

  if (file.size > IMAGE_MAX_BYTES) {
    throw new Error("Immagine oltre il limite di 5 MB.");
  }

  const safeName = slugifyFileName(file.name || "image");
  const path = `${sectionId}/${Date.now()}-${safeName}`;
  const { error } = await client.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    throw error;
  }

  const { data } = client.storage.from(IMAGE_BUCKET).getPublicUrl(path);

  return {
    path,
    src: data.publicUrl,
  };
}

export async function deleteSectionImage(path, client = getHostSupabase()) {
  if (!path) return;

  const { error } = await client.storage.from(IMAGE_BUCKET).remove([path]);

  if (error) {
    throw error;
  }
}
