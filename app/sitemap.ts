import type { MetadataRoute } from "next"

const baseUrl = "https://gleamshot.io"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ]
}
