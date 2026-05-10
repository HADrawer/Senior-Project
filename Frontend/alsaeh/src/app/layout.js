import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Alsaeh.bh",
  description: "Tourism Recommender System for Bahrain",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem("theme") || "system";
                const lang = localStorage.getItem("site_lang") === "ar" ? "ar" : "en";
                document.documentElement.setAttribute("data-theme", theme);
                document.documentElement.lang = lang;
                document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
              } catch {}
            `,
          }}
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
