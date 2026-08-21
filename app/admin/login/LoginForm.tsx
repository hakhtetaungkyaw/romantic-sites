"use client";

import { useActionState } from "react";

import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#232326] p-8 shadow-lg shadow-black/30"
    >
      <h1 className="font-display text-2xl text-white">Admin access</h1>
      <p className="mt-1 text-sm text-gray-400">Enter the shared admin secret to continue.</p>

      <input type="hidden" name="next" value={next} />

      <label htmlFor="secret" className="mt-6 block text-sm font-medium text-gray-300">
        Secret
      </label>
      <input
        id="secret"
        name="secret"
        type="password"
        autoFocus
        autoComplete="off"
        className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#1e1e21] px-3 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#d97a5f]"
      />

      {state.error && <p className="mt-3 text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-gradient-to-b from-[#e8916f] to-[#c05e3d] py-3 font-medium text-white shadow-md shadow-black/30 transition-opacity disabled:opacity-60"
      >
        {pending ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}
