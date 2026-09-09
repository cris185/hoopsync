import type { Metadata } from "next";
import { Big_Shoulders, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

// Google ships "Big Shoulders Display" as an optical-size (opsz) preset
// of this same variable family, not a separate importable font — at
// the large sizes we use it for (headlines, scores), the browser's
// default font-optical-sizing: auto already renders toward that
// condensed/display end of the axis.
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HoopSync",
  description: "Free, open-source basketball tournament management platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bigShoulders.variable} ${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
