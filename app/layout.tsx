import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "DiffShot — Before/After Screenshot Tool for SaaS Founders",
  description:
    "Turn two screenshots into a shareable Before/After visual in 30 seconds. Free. No login. No uploads to any server. Built for SaaS founders and indie makers.",
  openGraph: {
    title: "DiffShot — Before/After Screenshot Tool",
    description: "Turn two screenshots into a shareable visual in 30 seconds. Free. No login required.",
    type: "website",
  },
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
