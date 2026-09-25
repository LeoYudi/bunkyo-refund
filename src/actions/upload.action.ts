"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadReceipt(formData: FormData): Promise<string> {
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new Error("No file provided");
  }

  const supabase = await createClient();

  const fileExt = file.name.split(".").pop();
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const formattedDate = `${yyyy}${mm}${dd}`;
  const fileName = `${formattedDate}-${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("receipts")
    .upload(fileName, file);

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("receipts").getPublicUrl(fileName);

  return data.publicUrl;
}
