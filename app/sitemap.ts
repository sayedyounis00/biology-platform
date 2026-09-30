import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://biomrahmedsaad.com";

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
      images: [`${baseUrl}/website-logo.png`],
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    if (!supabase) return staticEntries;

    const { data: courses } = await supabase.from("courses").select("id, updated_at");

    if (courses && courses.length > 0) {
      const courseEntries: MetadataRoute.Sitemap = courses.map((course) => ({
        url: `${baseUrl}/courses/${course.id}`,
        lastModified: course.updated_at ? new Date(course.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

      return [...staticEntries, ...courseEntries];
    }
  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  return staticEntries;
}

