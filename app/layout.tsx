import type { Metadata } from "next";
// v8.3 P1: Plus Jakarta Sans (Taste Skill pick, not Inter) self-hosted — 0 runtime Google Fonts requests
// v12.321: switched to next/font/local — `next/font/google` does not hit Google at runtime, but it
// **downloads fonts at build**. CI Build went red twice (v12.316, v12.319) with
// `internal/font/google … Module not found`, which looks exactly like a module-resolve regression
// and is easy to misread as an app bug. With the files in-repo, the build no longer needs the network.
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
// v2.13: cinema theme — opt-in via .cinema-page className, does not affect other pages
import "./cinema-theme.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { IconProvider } from "@/components/icon-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/components/auth-provider";
import { MotionProvider } from "@/components/motion-provider";
import { SkipLink } from "@/components/skip-link";
import { getTranslations, normalizeLocale } from "@/lib/i18n";

// One variable-font file each (latin subset), covering every weight we used to download separately:
// Jakarta 400–800 and Mono 400–600 sit on the wght axis — 67KB combined.
const jakarta = localFont({
  src: "./fonts/plus-jakarta-sans.woff2",
  weight: "200 800",
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  weight: "100 800",
  variable: "--font-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const jar = await cookies();
  const tRaw = getTranslations(normalizeLocale(jar.get("qfmj-locale")?.value));
  const t = tRaw as typeof tRaw & { publicUi: Record<string, string> };
  return {
    title: `${t.auth.brand} · AI Animation Agent Studio`,
    description: t.publicUi.metaDesc,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        {/* v10.3.5 a11y: skip to main — first keyboard focus target; sr-only until focused */}
        <SkipLink />
        {/* v8.3 P1: global film-grain overlay (fixed, pointer-events none, print texture on warm ink black) */}
        <div aria-hidden className="film-grain" />
        <ErrorBoundary>
          <IconProvider>
            <AuthProvider>
              <ToastProvider>
                <MotionProvider>
                  {children}
                </MotionProvider>
              </ToastProvider>
            </AuthProvider>
          </IconProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
