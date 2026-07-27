"use client";

import { signIn } from "next-auth/react";

export function GoogleSignIn() {
  return <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="w-full rounded-xl bg-stone-900 py-3.5 text-sm font-bold text-white hover:bg-stone-700">Continuar con Google</button>;
}
