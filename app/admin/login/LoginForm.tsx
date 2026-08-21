"use client";

import { useActionState } from "react";

import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-2xl border border-[#c9a68a]/40 bg-white p-8 shadow-lg shadow-[#6b4332]/10"
    >
      <h1 className="font-display text-2xl text-[#4a2f26]">Admin access</h1>
      <p className="mt-1 text-sm text-[#6b4332]/70">Enter the shared admin secret to continue.</p>

      <input type="hidden" name="next" value={next} />

      <label htmlFor="secret" className="mt-6 block text-sm font-medium text-[#4a2f26]">
        Secret
      </label>
      <input
        id="secret"
        name="secret"
        type="password"
        autoFocus
        autoComplete="off"
        className="mt-1.5 w-full rounded-lg border border-[#c9a68a]/50 bg-[#fffbf2] px-3 py-2.5 text-[#4a2f26] focus:outline-none focus:ring-2 focus:ring-[#d97a5f]"
      />

      {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-gradient-to-b from-[#e8916f] to-[#c05e3d] py-3 font-medium text-white shadow-md shadow-[#6b4332]/20 transition-opacity disabled:opacity-60"
      >
        {pending ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}
