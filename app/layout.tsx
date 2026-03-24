import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const icons = {
  icon: "/favicon.svg",
}

export const metadata: Metadata = {
  title: "GleamShot — Beautiful Screenshot Tool for Makers",
  description:
    "Turn any screenshot into a polished, shareable visual in seconds. Free. No login. No uploads to any server. Built for founders, designers, and makers.",
  metadataBase: new URL("https://gleamshot.io"),
  openGraph: {
    title: "GleamShot — Beautiful Screenshots in Seconds",
    description: "Turn any screenshot into a polished, shareable visual in seconds. Free. No login required.",
    url: "https://gleamshot.io",
    siteName: "GleamShot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GleamShot — Beautiful Screenshots in Seconds",
    description: "Turn any screenshot into a polished, shareable visual in seconds. Free. No login required.",
    creator: "@umarkhan",
  },
  keywords: ["screenshot tool", "before after screenshot", "screenshot beautifier", "screenshot framing", "makers tool"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
