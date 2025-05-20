"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppDeviceForm } from "@/components/app/app-device-form"
import { AppDashboard } from "@/components/app/app-dashboard"
import { useToast } from "@/components/ui/use-toast"
import type { Member } from "@/types/member"
import { Plus } from "lucide-react"

export default function AppPage() {
  const params = useParams()
  const memberId = params.id as string
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  const fetchMember = async () => {
    setLoading(true)
    try {
      const response = await fetch(`https://ezview-server.vercel.app/members/${memberId}`)
      if (!response.ok) {
        throw new Error("Error al cargar miembro")
      }
      const data = await response.json()
      setMember(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información del miembro",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (memberId) {
      fetchMember()
    }
  }, [memberId])

  const handleFormSubmit = () => {
    setShowForm(false)
    fetchMember()
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center">Cargando...</div>
  }

  if (!member) {
    return <div className="flex h-full items-center justify-center">Miembro no encontrado</div>
  }

  const hasAppDevice = member.nodes?.includes("app") || false

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard App</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {member.first_name} {member.last_name}
          </p>
        </div>
        {!hasAppDevice && (
          <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-1 h-4 w-4" /> Activar App
          </Button>
        )}
      </div>

      {showForm ? (
        <Card className="mb-6 border-2 border-orange-500">
          <CardHeader>
            <CardTitle>Activar App</CardTitle>
          </CardHeader>
          <CardContent>
            <AppDeviceForm memberId={memberId} onSubmit={handleFormSubmit} onCancel={() => setShowForm(false)} />
          </CardContent>
        </Card>
      ) : null}

      {hasAppDevice ? (
        <AppDashboard memberId={memberId} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <h3 className="mb-2 text-xl font-semibold">No hay dispositivo App registrado</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Este miembro aún no tiene la aplicación activada. Haz clic en "Activar App" para comenzar.
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-1 h-4 w-4" /> Activar App
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
