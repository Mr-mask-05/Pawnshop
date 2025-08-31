import "./globals.css";
import { prisma } from "@/lib/prisma";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "Pawnshop" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.settings.findFirst();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        {settings?.bgUrl && (
          <div
            className="fixed inset-0 -z-10 bg-cover bg-center animate-pulse"
            style={{ backgroundImage: `url(${settings.bgUrl})` }}
          />
        )}
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
