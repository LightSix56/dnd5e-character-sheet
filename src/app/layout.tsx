import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dnd5e-character-sheet.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Лист персонажа D&D 5e — интерактивный бланк онлайн",
  description: "Интерактивный лист персонажа D&D 5e на русском языке: броски кубиков, расчёт характеристик, управление заклинаниями, сохранение в облаке и экспорт в DOCX.",
  keywords: [
    "D&D 5e", "днд 5е", "лист персонажа", "чарник", "character sheet",
    "бланк персонажа", "генератор персонажа dnd", "экспорт docx",
    "калькулятор характеристик", "бросок кубиков"
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Лист персонажа D&D 5e — интерактивный бланк онлайн",
    description: "Интерактивный лист персонажа D&D 5e: авторасчёт параметров, броски d20, заклинания и экспорт в DOCX.",
    url: siteUrl,
    siteName: "D&D 5e Character Sheet",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: '/book-bg.webp',
        width: 1200,
        height: 630,
        alt: "Лист персонажа D&D 5e",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Лист персонажа D&D 5e — интерактивный бланк онлайн",
    description: "Интерактивный лист персонажа D&D 5e с бросками кубиков и экспортом в DOCX.",
    images: ['/book-bg.webp'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  verification: {
    yandex: 'adeb09801b32f22c',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      "name": "Лист персонажа D&D 5e",
      "url": `${siteUrl}/`,
      "image": `${siteUrl}/android-chrome-512x512.png`,
      "description": "Интерактивный лист персонажа D&D 5e: авторасчёт параметров, броски d20, заклинания и экспорт в DOCX."
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      "name": "Лист персонажа D&D 5e",
      "url": `${siteUrl}/`,
      "description": "Интерактивный веб-бланк персонажа Dungeons & Dragons 5e: авторасчёт характеристик, броски кубиков, библиотека заклинаний и экспорт в Word.",
      "image": `${siteUrl}/android-chrome-512x512.png`,
      "applicationCategory": "GameApplication",
      "operatingSystem": "All",
      "inLanguage": "ru",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "RUB"
      }
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Как работает расчёт модификаторов и характеристик в D&D 5e?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Модификатор вычисляется по формуле: (Значение - 10) / 2 с округлением вниз. Лист автоматически суммирует базовые характеристики, расовые бонусы и прибавки от уровней (ASI), рассчитывая спасброски, навыки, пассивную внимательность и класс доспеха."
          }
        },
        {
          "@type": "Question",
          "name": "Как экспортировать лист персонажа в Word (DOCX)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Нажмите кнопку «Экспорт DOCX» в верхней панели. Сервер сформирует готовый трёхстраничный документ формата Word с полной вёрсткой, портретом, таблицами характеристик, атак и заклинаний."
          }
        },
        {
          "@type": "Question",
          "name": "Можно ли повышать и откатывать уровень персонажа?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Да, система поддерживает повышение уровня от 1 до 20 с выбором прироста хитов, улучшений характеристик (ASI) и добавлением новых заклинаний. История прокачки сохраняется, позволяя при необходимости откатить уровень назад с возвратом параметров."
          }
        },
        {
          "@type": "Question",
          "name": "Сохраняются ли данные персонажа?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Все изменения автоматически сохраняются в браузере (LocalStorage). При входе в аккаунт включается облачная синхронизация для сохранения нескольких персонажей и генерации кодов для импорта в AI Dungeon Master."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="yandex-verification" content="adeb09801b32f22c" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/android-chrome-192x192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="antialiased bg-background text-foreground"
      >
        {children}
      </body>
    </html>
  );
}
