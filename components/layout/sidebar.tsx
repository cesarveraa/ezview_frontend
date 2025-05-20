"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"
import { Users, Cpu, Smartphone, Home } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen } = useSidebar()

  const routes = [
    {
      label: "Inicio",
      icon: Home,
      href: "/",
      variant: "default",
    },
    {
      label: "Miembros",
      icon: Users,
      href: "/members",
      variant: "green",
    },
    {
      label: "Dispositivos IoT",
      icon: Cpu,
      href: "/members",
      variant: "blue",
      disabled: true,
    },
    {
      label: "App Móvil",
      icon: Smartphone,
      href: "/members",
      variant: "orange",
      disabled: true,
    },
  ]

  if (!isOpen) {
    return null
  }

  return (
    <div className="hidden h-full w-64 flex-col border-r bg-white dark:bg-gray-950 dark:border-gray-800 md:flex">
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="flex flex-col gap-1">
          {routes.map((route) => (
            <Button
              key={route.href + route.label}
              variant={pathname === route.href ? "secondary" : "ghost"}
              className={cn(
                "justify-start",
                pathname === route.href && "font-bold",
                route.variant === "green" && "text-green-500 hover:text-green-600",
                route.variant === "blue" && "text-blue-500 hover:text-blue-600",
                route.variant === "orange" && "text-orange-500 hover:text-orange-600",
              )}
              asChild
              disabled={route.disabled}
            >
              <Link href={route.href}>
                <route.icon className="mr-2 h-5 w-5" />
                {route.label}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
