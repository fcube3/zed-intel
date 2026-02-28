type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

function safeNextPath(value?: string) {
  if (!value) return '/costs';
  if (!value.startsWith('/costs')) return '/costs';
  return value;
}

export default function OpsCostLoginPage({ searchParams }: LoginPageProps) {
  const hasError = searchParams?.error === '1';
  const nextPath = safeNextPath(searchParams?.next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/70 p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Private · Ops</p>
        <h1 className="mt-2 text-2xl font-semibold">Sign in to Cost Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-400">Enter the dashboard password to continue.</p>

        <form action="/costs/auth" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-zinc-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-white/15 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-cyan-500/60 placeholder:text-zinc-500 focus:ring"
            />
          </div>

          {hasError ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              Incorrect password. Please try again.
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-500 px-3 py-2 font-medium text-zinc-950 transition hover:bg-cyan-400"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
