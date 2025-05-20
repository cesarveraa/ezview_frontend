"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  share_camera: z.boolean().default(false),
  exercise_variants: z.string().min(2, {
    message: "Debe ingresar al menos una variante de ejercicio.",
  }),
  location: z.string().default("app"),
})

interface AppDeviceFormProps {
  memberId: string
  onSubmit: () => void
  onCancel: () => void
}

export function AppDeviceForm({ memberId, onSubmit, onCancel }: AppDeviceFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      share_camera: false,
      exercise_variants: "bicep_curl,hammer_curl,concentration_curl",
      location: "app",
    },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const timestamp = Date.now()

      // Crear documento en la colección "lecturas app"
      const response = await fetch("https://ezview-server.vercel.app/app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: `${timestamp}`,
          device_id: "app",
          created_at: timestamp,
          location: values.location,
          share_camera: values.share_camera,
          exercise_variants: values.exercise_variants.split(",").map((v) => v.trim()),
          member_id: memberId,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al activar la app")
      }

      toast({
        title: "Éxito",
        description: "App activada correctamente",
      })

      onSubmit()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo activar la app",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="share_camera"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Compartir cámara</FormLabel>
                <FormDescription>
                  Permite que la aplicación comparta la cámara para el análisis de ejercicios.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="exercise_variants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variantes de ejercicio</FormLabel>
              <FormControl>
                <Input placeholder="bicep_curl,hammer_curl,concentration_curl" {...field} />
              </FormControl>
              <FormDescription>Ingresa las variantes de ejercicio separadas por comas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
            {loading ? "Activando..." : "Activar App"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
