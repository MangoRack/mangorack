import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/layout/Providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MangoLab",
  description: "Your homelab, fully under control.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
