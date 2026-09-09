import { ArrowUpRight, Sprout } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl space-y-6">
        <Sprout className="size-12 text-emerald-700" aria-hidden="true" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          PlotFarm
        </h1>
        <p className="text-lg leading-8 text-slate-600">
          Nền tảng quản lý nông trại thông minh và cho thuê đất trồng.
        </p>
        <a
          href="https://nextjs.org/docs/app"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white transition-colors hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
        >
          Tài liệu Next.js
          <ArrowUpRight className="size-5" aria-hidden="true" />
        </a>
      </section>
    </main>
  );
}
