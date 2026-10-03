import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily English — Мой личный ИИ-учитель",
  description: "Персональный голосовой ИИ-учитель английского языка для ежедневной практики с нуля (A0–A1).",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Daily English",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1874f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-[100dvh] flex flex-col bg-slate-50 antialiased overscroll-none">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var isProd = ${process.env.NODE_ENV === "production" ? "true" : "false"};
                if (isProd) {
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').catch(function(err) {
                        console.warn('SW registration failed: ', err);
                      });
                    });
                  }
                } else {
                  // In development mode: automatically unregister any active service worker and clear caches
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for (var i = 0; i < registrations.length; i++) {
                        registrations[i].unregister().then(function(unregistered) {
                          if (unregistered) console.log('[Dev] Unregistered stale service worker');
                        });
                      }
                    });
                  }
                  if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      for (var j = 0; j < keys.length; j++) {
                        caches.delete(keys[j]);
                      }
                    });
                  }
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
