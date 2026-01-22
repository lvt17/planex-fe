import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Nanum_Brush_Script, Bad_Script, Dancing_Script } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
// import { RealtimeProvider } from "@/contexts/RealtimeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const nanumBrush = Nanum_Brush_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handwriting",
});

const badScript = Bad_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-elegant",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "Planex",
  description: "Task management platform built for engineering teams with API-first design and deep integrations.",
  icons: {
    icon: [
      { url: '/icon.svg?v=1', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg?v=1',
    apple: '/icon.svg?v=1',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${nanumBrush.variable} ${badScript.variable} ${dancingScript.variable} font-sans antialiased`}>
        {/* Temporarily disabled Supabase Realtime due to connection issues */}
        {/* <RealtimeProvider> */}
        {children}
        {/* </RealtimeProvider> */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#161B22',
              color: '#E6EDF3',
              border: '1px solid #30363D',
            },
            success: {
              iconTheme: {
                primary: '#7EE787',
                secondary: '#0D1117',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF7B72',
                secondary: '#0D1117',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
