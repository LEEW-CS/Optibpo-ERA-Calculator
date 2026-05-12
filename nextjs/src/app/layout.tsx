import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'ERA 2025 Cost Calculator — optiBPO',
  description:
    'Free UK SME calculator for Employment Rights Act 2025 compliance cost, IR35 risk, and offshore-equivalent saving. By optiBPO.',
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        {/* HubSpot Forms embed loader.
            Only does anything once a real form GUID is configured. */}
        <Script
          src="https://js.hsforms.net/forms/embed/v2.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
