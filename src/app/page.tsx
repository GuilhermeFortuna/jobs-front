export default function Home() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col justify-center overflow-hidden px-6 py-16 sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#dbe7f0_0%,_transparent_55%),linear-gradient(160deg,_#f4f7fa_0%,_#e8eef3_45%,_#dfe8ee_100%)]"
      />
      <div className="mx-auto w-full max-w-2xl">
        <p className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-[#1a2b3a] sm:text-6xl">
          Job Engine
        </p>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-[#3d5263]">
          Search and browse openings from many sources in one place. Discovery
          UI coming next.
        </p>
      </div>
    </main>
  );
}
