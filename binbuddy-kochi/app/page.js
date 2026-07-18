const wasteTypes = [
  {
    name: "Plastic",
    description: "Bottles, packets and clean containers",
    icon: "♻",
    accent: "bg-sky-50 text-sky-700",
  },
  {
    name: "Food waste",
    description: "Leftovers, peels and other organic waste",
    icon: "✦",
    accent: "bg-amber-50 text-amber-700",
  },
  {
    name: "Paper",
    description: "Newspapers, cartons and dry paper",
    icon: "▤",
    accent: "bg-violet-50 text-violet-700",
  },
];

const steps = [
  "Tell us what waste you have",
  "Find the right bin on your route",
  "Keep Kochi cleaner",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8faf8] text-slate-800">
      <section className="relative overflow-hidden bg-emerald-700 px-6 pb-20 pt-6 text-white sm:px-10 sm:pb-24 lg:px-16">
        <div className="absolute -right-20 top-12 h-72 w-72 rounded-full bg-emerald-500/40 blur-3xl" />
        <div className="absolute -left-24 bottom-[-10rem] h-80 w-80 rounded-full bg-lime-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <nav className="flex items-center justify-between" aria-label="Main navigation">
            <a href="#top" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-lg text-emerald-700 shadow-sm">
                ♻
              </span>
              BinBuddy Kochi
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-emerald-50 hover:text-white">
              How it works
            </a>
          </nav>

          <div id="top" className="grid items-center gap-12 pt-16 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-2xl">
              <p className="mb-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-emerald-50 ring-1 ring-white/20">
                A cleaner city starts with one small choice
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Find the right bin, before waste reaches the street.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-emerald-50 sm:text-xl">
                BinBuddy makes it simple to dispose of everyday waste the right way, wherever your day takes you in Kochi.
              </p>
              <a
                href="#waste-types"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-emerald-800 shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-50"
              >
                Find a bin <span aria-hidden="true">→</span>
              </a>
            </div>

            <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-white/25 bg-white/10 p-5 shadow-2xl shadow-emerald-950/20 backdrop-blur-sm">
              <div className="rounded-[1.5rem] bg-white p-6 text-slate-800">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Ready to sort?</p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Kochi</span>
                </div>
                <div className="mt-7 flex justify-center">
                  <div className="relative grid h-40 w-36 place-items-center rounded-t-[2.5rem] rounded-b-2xl bg-emerald-600 shadow-inner">
                    <div className="absolute -top-3 h-6 w-44 rounded-full bg-emerald-800" />
                    <span className="text-5xl">♻</span>
                  </div>
                </div>
                <p className="mt-7 text-center text-sm leading-6 text-slate-500">Choose your waste type and we&apos;ll point you in the right direction.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">Less confusion, less litter</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Small disposal decisions make a visible difference.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">When the right bin feels hard to find, recyclable and compostable waste often ends up mixed together—or on the street. BinBuddy helps make the better choice feel easy.</p>
          </div>

          <div id="waste-types" className="mt-10 grid gap-5 md:grid-cols-3">
            {wasteTypes.map((waste) => (
              <article key={waste.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <span className={`grid h-12 w-12 place-items-center rounded-xl text-2xl ${waste.accent}`} aria-hidden="true">{waste.icon}</span>
                <h3 className="mt-5 text-xl font-bold text-slate-900">{waste.name}</h3>
                <p className="mt-2 leading-6 text-slate-600">{waste.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-emerald-50 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">A better bin choice in three steps.</h2>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step} className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-emerald-700 font-bold text-white">{index + 1}</span>
                <p className="mt-4 text-lg font-semibold text-slate-800">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="bg-slate-900 px-6 py-8 text-sm text-slate-300 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-white">BinBuddy Kochi</p>
          <p>Made for cleaner streets and a greener Kochi.</p>
        </div>
      </footer>
    </main>
  );
}
