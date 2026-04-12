import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { GoogleAnalytics } from "@/components/GoogleAnalytics"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const icons = {
  icon: "/favicon.svg",
}

export const metadata: Metadata = {
  title: "GleamShot — Fast Screenshot Polish Tool",
  description:
    "Turn one screenshot or a pair of screenshots into a polished, shareable visual in seconds. Free. No login. No uploads to any server.",
  metadataBase: new URL("https://gleamshot.io"),
  openGraph: {
    title: "GleamShot — Fast Screenshot Polish Tool",
    description: "Turn one screenshot or a pair of screenshots into a polished, shareable visual in seconds. Free. No login required.",
    url: "https://gleamshot.io",
    siteName: "GleamShot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GleamShot — Fast Screenshot Polish Tool",
    description: "Turn one screenshot or a pair of screenshots into a polished, shareable visual in seconds. Free. No login required.",
    creator: "@umarkhan",
  },
  keywords: ["screenshot tool", "screenshot editor", "screenshot beautifier", "screenshot framing", "before after screenshot"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  )
}
