import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { GoogleSignIn } from "@/components/google-sign-in";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-200/70">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">Finanzas personales</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-stone-950">Bienvenida de vuelta.</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">Registra gastos rapido, protege tus obligaciones y conoce exactamente cuanto pedir.</p>
        <div className="mt-7"><GoogleSignIn /></div>
        <p className="mt-4 text-xs leading-5 text-stone-500">Solo el correo autorizado puede acceder a esta informacion financiera.</p>
      </section>
    </main>
  );
}
