"use client"

import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useSidebar } from "@/hooks/use-sidebar"

export function Navbar() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-white px-4 dark:bg-gray-950 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-green-500">EzView</span>
          <span className="hidden text-xl font-bold text-gray-900 dark:text-white sm:inline-block">Dashboard</span>
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ModeToggle />
      </div>
    </header>
  )
}
