import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, Users, Cpu, Smartphone } from "lucide-react"

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">Bienvenido a EzView Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2 border-green-500 shadow-lg transition-all hover:shadow-green-200 dark:hover:shadow-green-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-green-500" />
              Gestión de Miembros
            </CardTitle>
            <CardDescription>Administra los usuarios del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Crea, edita, visualiza y elimina miembros del sistema.
            </p>
            <Link href="/members">
              <Button className="w-full bg-green-500 hover:bg-green-600">
                Ir a Miembros <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500 shadow-lg transition-all hover:shadow-blue-200 dark:hover:shadow-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-6 w-6 text-blue-500" />
              Dispositivos IoT
            </CardTitle>
            <CardDescription>Monitorea dispositivos en tiempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Visualiza métricas y registra nuevos dispositivos IoT.
            </p>
            <Button className="w-full bg-blue-500 hover:bg-blue-600" disabled>
              Selecciona un miembro primero
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-500 shadow-lg transition-all hover:shadow-orange-200 dark:hover:shadow-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-orange-500" />
              Aplicación Móvil
            </CardTitle>
            <CardDescription>Datos de ejercicios y análisis YOLO</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Visualiza los ejercicios detectados y configura la app.
            </p>
            <Button className="w-full bg-orange-500 hover:bg-orange-600" disabled>
              Selecciona un miembro primero
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
