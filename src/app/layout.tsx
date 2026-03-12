import type { Metadata } from "next";
import { Inter, Nunito, Pacifico } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Frescon Delivery",
  description: "Verduras y frutas frescas con delivery los jueves",
  icons: {
    icon:      [{ url: "/favicon.ico", sizes: "any" }],
    shortcut:  "/favicon.ico",
    apple:     "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${nunito.variable} ${pacifico.variable} font-inter antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
