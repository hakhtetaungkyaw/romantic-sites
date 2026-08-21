"use server";

import { redirect } from "next/navigation";

import { checkAdminSecret, createAdminSession } from "@/lib/adminAuth";

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const secret = String(formData.get("secret") ?? "");
  const next = String(formData.get("next") ?? "/admin/new-order/birthday-v1");

  if (!secret.trim()) {
    return { error: "Enter the admin secret." };
  }
  if (!checkAdminSecret(secret)) {
    return { error: "Incorrect secret." };
  }

  await createAdminSession();
  // Only ever redirect back into /admin/* — `next` comes from a query
  // param an attacker could otherwise set to an arbitrary external URL.
  redirect(next.startsWith("/admin") ? next : "/admin/new-order/birthday-v1");
}
