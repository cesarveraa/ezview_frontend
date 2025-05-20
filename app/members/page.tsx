"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MembersTable } from "@/components/members/members-table"
import { MemberForm } from "@/components/members/member-form"
import { useToast } from "@/components/ui/use-toast"
import { Plus, RefreshCw } from "lucide-react"
import type { Member } from "@/types/member"

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const { toast } = useToast()

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch("https://ezview-server.vercel.app/members")
      if (!response.ok) {
        throw new Error("Error al cargar miembros")
      }
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`https://ezview-server.vercel.app/members/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar miembro")
      }

      toast({
        title: "Éxito",
        description: "Miembro eliminado correctamente",
      })

      fetchMembers()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el miembro",
        variant: "destructive",
      })
      console.error(error)
    }
  }

  const handleFormSubmit = () => {
    setShowForm(false)
    setEditingMember(null)
    fetchMembers()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingMember(null)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Miembros</h1>
        <div className="flex gap-2">
          <Button onClick={fetchMembers} variant="outline" className="flex items-center gap-1" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button
            onClick={() => {
              setEditingMember(null)
              setShowForm(true)
            }}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="mr-1 h-4 w-4" /> Nuevo Miembro
          </Button>
        </div>
      </div>

      {showForm ? (
        <Card className="mb-6 border-2 border-green-500">
          <CardHeader>
            <CardTitle>{editingMember ? "Editar Miembro" : "Nuevo Miembro"}</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberForm member={editingMember} onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <MembersTable members={members} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
        </CardContent>
      </Card>
    </div>
  )
}
