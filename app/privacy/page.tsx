import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — GleamShot",
  description: "Privacy policy for GleamShot and the GleamShot Capture browser extension.",
  openGraph: {
    title: "Privacy Policy — GleamShot",
    description: "Privacy policy for GleamShot and the GleamShot Capture browser extension.",
    url: "https://gleamshot.io/privacy",
  },
}

const lastUpdated = "April 25, 2026"

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 md:px-10 md:py-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:text-blue-300">
            <span className="text-blue-400">✦</span>
            <span>GleamShot</span>
          </Link>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
            Privacy Policy
          </span>
        </header>

        <section className="grid gap-10 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:py-14">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-blue-400">
              GleamShot Privacy Policy
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Privacy for the editor and the Chrome extension.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              This policy explains what data GleamShot collects, how the Chrome extension handles screenshots, and how
              we use analytics on the public website.
            </p>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="text-sm font-semibold text-blue-300">Effective date</p>
            <p className="mt-2 text-2xl font-bold">{lastUpdated}</p>
            <p className="mt-4 text-sm leading-6 text-gray-300">
              GleamShot Capture is designed for user-initiated screenshot workflows. It does not intentionally collect
              sensitive categories like passwords, payment data, or browsing history.
            </p>
          </aside>
        </section>

        <div className="grid gap-6 pb-12 lg:grid-cols-[1fr_300px]">
          <article className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-bold">Summary</h2>
              <p className="mt-4 text-gray-300 leading-8">
                GleamShot is built to let you capture, annotate, copy, download, and open screenshots with as little
                friction as possible. The browser extension only works when you click it. Captured screenshots are
                stored locally in Chrome extension storage long enough to complete the action you requested.
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-bold">Information we collect</h2>
              <div className="mt-5 space-y-4 text-gray-300 leading-8">
                <p>
                  <strong className="text-white">Screenshots and image files:</strong> when you use the extension or
                  upload an image in the editor, the image you provide is processed so you can edit, copy, download, or
                  export it.
                </p>
                <p>
                  <strong className="text-white">Extension storage data:</strong> the Chrome extension temporarily
                  stores the captured screenshot locally in Chrome extension storage before it is copied, downloaded,
                  or opened in the GleamShot editor.
                </p>
                <p>
                  <strong className="text-white">Website analytics data:</strong> the public website may use Google
                  Analytics, which can collect usage information such as page views, approximate location derived from
                  IP address, device information, and browser interactions according to Google’s own policies.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-bold">How we use data</h2>
              <ul className="mt-5 space-y-3 text-gray-300 leading-8">
                <li>To let you capture a selected area or the visible portion of your current tab.</li>
                <li>To let you annotate, copy, download, or export screenshots.</li>
                <li>To move a capture into the GleamShot editor when you choose to open it there.</li>
                <li>To understand basic website usage and improve the product experience.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-bold">How we share data</h2>
              <div className="mt-5 space-y-4 text-gray-300 leading-8">
                <p>
                  We do not sell user data. We do not transfer user data to third parties except for approved use cases
                  that are necessary to provide the service, such as analytics for the public website and the user-initiated
                  handoff of a capture to the GleamShot editor.
                </p>
                <p>
                  If you choose to open a capture in the editor, the image is passed from the extension to the web app so
                  you can continue editing it there.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-bold">Retention and storage</h2>
              <p className="mt-4 text-gray-300 leading-8">
                Captures are stored locally only for as long as needed to complete the action you requested. When you
                copy, download, open in the editor, or discard a capture, the extension removes the temporary local copy
                as part of that flow. The website may keep standard analytics logs according to the analytics provider’s
                retention settings.
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-bold">Your choices</h2>
              <ul className="mt-5 space-y-3 text-gray-300 leading-8">
                <li>You can use the extension only when you want to capture a screenshot.</li>
                <li>You can choose whether to open the capture in the GleamShot editor.</li>
                <li>You can clear stored captures by discarding them in the extension workflow.</li>
                <li>You can control cookies and analytics through your browser and consent settings where applicable.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-bold">Children’s privacy</h2>
              <p className="mt-4 text-gray-300 leading-8">
                GleamShot is not intended for children under 13, and we do not knowingly collect personal data from
                children under 13.
              </p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <h2 className="text-2xl font-bold">Changes to this policy</h2>
              <p className="mt-4 text-gray-300 leading-8">
                We may update this policy from time to time. If we make material changes, we will update the effective
                date on this page.
              </p>
            </section>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-8">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold">Data categories for the extension</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-300">
                <li>Website content: screenshots and images you capture or upload.</li>
                <li>Device and usage data from website analytics.</li>
                <li>No intentional collection of sensitive personal data.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold">Chrome Web Store disclosures</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-300">
                <li>Only check the data categories that apply to screenshots and analytics.</li>
                <li>Do not mark sensitive categories unless you intentionally collect them.</li>
                <li>Certify that data is not sold and is only used for the item’s single purpose.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}