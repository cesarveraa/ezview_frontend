import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { FirebaseProvider } from "@/context/firebase-context"
import { SidebarProvider } from "@/hooks/use-sidebar" // Import our custom SidebarProvider

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <FirebaseProvider>
            <SidebarProvider>
              {" "}
              {/* Use our custom SidebarProvider */}
              <div className="flex h-screen flex-col">
                <Navbar />
                <div className="flex flex-1 overflow-hidden">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">{children}</main>
                </div>
                <Toaster />
              </div>
            </SidebarProvider>
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
