import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create — GleamShot",
  description: "Style and export your screenshots with GleamShot. Free. No login. No uploads to any server.",
  openGraph: {
    title: "Create — GleamShot",
    description: "Style and export your screenshots with GleamShot. Free, no login required.",
    url: "https://gleamshot.io/create",
  },
}

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
