import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Yanasporte.online - жизнь в движении",
  description:
    "Международное приложение по восстановлению тела, осанки и метаболизма. Основано на физиологии, биомеханике и практике с доказанным эффектом. Без крайностей, с заботой о теле и здоровье. Защита персональных данных по GDPR и 152-ФЗ.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
