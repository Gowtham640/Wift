import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://wift-tracker.vercel.app",
      lastModified: new Date(),
    },
  ];
}