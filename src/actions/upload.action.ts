"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadReceipt(formData: FormData): Promise<string> {
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new Error("No file provided");
  }

  const supabase = await createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("receipts")
    .upload(fileName, file);

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("receipts").getPublicUrl(fileName);

  return data.publicUrl;
}
