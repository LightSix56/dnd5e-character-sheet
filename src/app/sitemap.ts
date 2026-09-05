import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dnd5e-character-sheet.vercel.app';
  const siteUrl = rawUrl.replace(/\/+$/, '');

  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}
