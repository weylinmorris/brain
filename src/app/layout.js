import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    minimumScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export const metadata = {
    title: "Brain",
    description: "A smarter way to note",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Brain",
    },
};

// app/layout.tsx
export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning className="h-full">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-neutral-50 dark:bg-neutral-800 text-black dark:text-white`}>
                <div 
                    className="min-h-full"
                    style={{
                        paddingTop: 'env(safe-area-inset-top)',
                        minHeight: '100vh'
                    }}
                >
                    {children}
                </div>
            </body>
        </html>
    );
}
