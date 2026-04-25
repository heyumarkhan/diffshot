import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "GleamShot — Beautiful Screenshots in Seconds",
  description: "Turn any screenshot into a polished, shareable visual in seconds. Free. No login. No uploads to any server.",
  openGraph: {
    title: "GleamShot — Beautiful Screenshots in Seconds",
    description: "Turn any screenshot into a polished, shareable visual in seconds. Free. No login. No uploads to any server.",
    url: "https://gleamshot.io",
  },
}

export default function Home() {
  return (
    <main className="h-screen bg-[#0f172a] text-white flex flex-col overflow-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="text-blue-400">✦</span>
          <span>GleamShot</span>
        </div>
        <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">Free · No login</span>
      </nav>

      {/* Hero - takes remaining height */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6">

        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-6">
          Fast screenshot polish
        </p>

        <h1 className="text-5xl md:text-7xl font-black leading-[1.05] max-w-3xl mb-6 tracking-tight">
          Make screenshots<br />
          <span className="text-blue-400">ready to share.</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-lg mb-10">
          Upload one screenshot or two. Add clean framing, labels, backgrounds, and export a polished PNG in seconds.
        </p>

        <Link
          href="/create"
          className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-lg font-bold px-10 py-4 rounded-xl transition-colors shadow-xl shadow-blue-500/25"
        >
          Create Your Visual — Free →
        </Link>

        <p className="text-gray-600 text-sm mt-4">Your images never leave your browser.</p>

        {/* 3-step proof */}
        <div className="flex items-center gap-3 mt-12 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-white text-xs flex items-center justify-center font-bold">1</span>
            Upload Screenshot
          </span>
          <span className="text-gray-700">→</span>
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-white text-xs flex items-center justify-center font-bold">2</span>
            Polish
          </span>
          <span className="text-gray-700">→</span>
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">3</span>
            Download PNG
          </span>
        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-4 text-center text-gray-600 text-xs flex-shrink-0">
        <span>Made for quick product visuals. Free.</span>
        <span className="mx-2 text-gray-700">•</span>
        <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors">
          Privacy Policy
        </Link>
      </footer>
    </main>
  )
}
