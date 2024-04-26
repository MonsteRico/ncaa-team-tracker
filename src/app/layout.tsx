import "@/styles/globals.css";

import { cn } from "@/lib/utils";
import { Chivo } from "next/font/google";
import { Archivo } from "next/font/google";
import "@/styles/globals.css";

const chivo = Chivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-chivo",
});
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata = {
  title: "NCAA Team Tracker",
  description: "Track rosters of all NCAA CBB teams",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "bg-background min-h-screen font-sans antialiased",
          chivo.variable,
          archivo.variable,
        )}
      >
        {children}
      </body>
    </html>
  );
}
