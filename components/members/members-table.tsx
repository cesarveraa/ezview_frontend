"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { Member } from "@/types/member"
import { Edit, MoreHorizontal, Trash, Cpu, Smartphone } from "lucide-react"
import Link from "next/link"

interface MembersTableProps {
  members: Member[]
  loading: boolean
  onEdit: (member: Member) => void
  onDelete: (id: string) => void
}

export function MembersTable({ members, loading, onEdit, onDelete }: MembersTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="mb-4 flex items-center space-x-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        ))}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center p-4">
        <p className="mb-2 text-lg font-medium">No hay miembros registrados</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Agrega un nuevo miembro para comenzar</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Dispositivos</TableHead>
            <TableHead className="w-[100px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                {member.first_name} {member.last_name}
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {member.nodes?.map((node) =>
                    node === "app" ? (
                      <Link key={`${member.id}-${node}`} href={`/members/${member.id}/app`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1 text-orange-500 hover:text-orange-600">
                          <Smartphone className="h-4 w-4" />
                          App
                        </Button>
                      </Link>
                    ) : (
                      <Link key={`${member.id}-${node}`} href={`/members/${member.id}/iot`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1 text-blue-500 hover:text-blue-600">
                          <Cpu className="h-4 w-4" />
                          {node}
                        </Button>
                      </Link>
                    ),
                  )}
                  {(!member.nodes || member.nodes.length === 0) && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Sin dispositivos</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(member)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteId(member.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este miembro y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
