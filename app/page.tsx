import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="text-blue-400">⇌</span>
          <span>DiffShot</span>
        </div>
        <Link
          href="/create"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Create Visual
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
          <span>✨</span>
          <span>Free forever · No login · Images never leave your browser</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight max-w-3xl mb-6">
          Turn two screenshots into a{" "}
          <span className="text-blue-400">shareable Before/After</span>{" "}
          visual in 30 seconds
        </h1>

        <p className="text-xl text-gray-400 max-w-xl mb-10">
          Built for SaaS founders and indie makers. No Canva. No Figma. Just upload, style, and download.
        </p>

        <Link
          href="/create"
          className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
        >
          Create Visual — It&apos;s Free →
        </Link>

        <p className="text-gray-500 text-sm mt-4">No sign up required. Works in your browser.</p>
      </section>

      {/* Example outputs */}
      <section className="px-8 pb-20 max-w-5xl mx-auto w-full">
        <p className="text-center text-gray-500 text-sm mb-8 uppercase tracking-wider font-medium">Example outputs</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Side by Side", desc: "Classic before/after comparison" },
            { title: "Spotlight", desc: "Highlight the new version" },
            { title: "Stacked", desc: "Perfect for mobile screenshots" },
          ].map((ex) => (
            <div key={ex.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="h-36 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl mb-4 flex items-center justify-center">
                <span className="text-4xl">⇌</span>
              </div>
              <p className="font-semibold text-white">{ex.title}</p>
              <p className="text-sm text-gray-400 mt-1">{ex.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/10 px-8 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: "🚀", title: "30 seconds", desc: "Upload, style, export" },
            { icon: "🔒", title: "100% private", desc: "Images stay in your browser" },
            { icon: "📐", title: "5 layouts", desc: "Side by side, stacked & more" },
            { icon: "📤", title: "4 export sizes", desc: "LinkedIn, X, Square, Tall" },
          ].map((f) => (
            <div key={f.title}>
              <div className="text-3xl mb-2">{f.icon}</div>
              <p className="font-semibold text-white text-sm">{f.title}</p>
              <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-6 text-center text-gray-500 text-sm">
        Made for founders. Free forever. ·{" "}
        <Link href="/create" className="text-blue-400 hover:underline">
          Create your visual
        </Link>
      </footer>
    </main>
  )
}
