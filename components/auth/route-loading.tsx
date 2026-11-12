export function RouteLoading({ label = "Loading your secure workspace..." }: { label?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f8] px-5">
      <p className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        {label}
      </p>
    </main>
  );
}
