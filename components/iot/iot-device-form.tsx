"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  device_id: z.string().min(2, {
    message: "El ID del dispositivo debe tener al menos 2 caracteres.",
  }),
  location: z.string().min(2, {
    message: "La ubicación debe tener al menos 2 caracteres.",
  }),
})

interface IoTDeviceFormProps {
  memberId: string
  onSubmit: () => void
  onCancel: () => void
}

export function IoTDeviceForm({ memberId, onSubmit, onCancel }: IoTDeviceFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      device_id: "",
      location: "",
    },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const timestamp = new Date().toISOString()
      const deviceId = `${timestamp}_${values.device_id}`

      // Crear documento en la colección "lecturas iot"
      const response = await fetch("https://ezview-server.vercel.app/iot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: deviceId,
          device_id: deviceId,
          created_at: timestamp,
          location: values.location,
          member_id: memberId,
          lecturas: {
            accelerometer: {
              x: 0,
              y: 0,
              z: 0,
            },
            gyroscope: {
              x: 0,
              y: 0,
              z: 0,
            },
            free_heap: 0,
            led_color: "ninguno",
            led_operational: true,
            led_state: {
              r: false,
              g: false,
              b: false,
            },
            mpu_connected: true,
            mpu_temp: 0,
            wifi_rssi: 0,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Error al registrar dispositivo IoT")
      }

      toast({
        title: "Éxito",
        description: "Dispositivo IoT registrado correctamente",
      })

      onSubmit()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el dispositivo IoT",
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
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="device_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID del Dispositivo</FormLabel>
                <FormControl>
                  <Input placeholder="esp32_001" {...field} />
                </FormControl>
                <FormDescription>Identificador único para el dispositivo (ej: esp32-pulsera-01)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación</FormLabel>
                <FormControl>
                  <Input placeholder="Pulsera mano derecha" {...field} />
                </FormControl>
                <FormDescription>Ubicación física del dispositivo (ej: pulsera mano derecha)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600">
            {loading ? "Registrando..." : "Registrar Dispositivo"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
