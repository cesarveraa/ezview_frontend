"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useFirebase } from "@/context/firebase-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { ImageIcon, Activity } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface AppDashboardProps {
  memberId: string
}

interface AppReading {
  id: string
  created_at: number
  frames: {
    url: string
    timestamp: number
  }[]
  exercises: {
    type: string
    score: number
    keypoints: number[][]
  }[]
  exercise_counts: {
    [key: string]: number
  }
}

export function AppDashboard({ memberId }: AppDashboardProps) {
  const [readings, setReadings] = useState<AppReading | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { subscribeToCollection } = useFirebase()

  useEffect(() => {
    setLoading(true)

    // Suscribirse a las lecturas en tiempo real
    const unsubscribe = subscribeToCollection(
      "lecturas_app",
      (data) => {
        // Filtrar por member_id y obtener la lectura más reciente
        const filteredData = data
          .filter((item: any) => item.member_id === memberId)
          .sort((a: any, b: any) => b.created_at - a.created_at)

        if (filteredData.length > 0) {
          setReadings(filteredData[0])
        }
        setLoading(false)
      },
      (error) => {
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de la app",
          variant: "destructive",
        })
        console.error(error)
        setLoading(false)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [memberId, subscribeToCollection, toast])

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p>Cargando datos de la app...</p>
      </div>
    )
  }

  if (!readings) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <h3 className="mb-2 text-xl font-semibold">No hay datos disponibles</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">Aún no hay datos de la aplicación para este miembro.</p>
        </CardContent>
      </Card>
    )
  }

  // Preparar datos para el gráfico de barras
  const chartData = Object.entries(readings.exercise_counts || {}).map(([name, count]) => ({
    name,
    count,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-orange-500" />
            Últimos Frames Procesados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {readings.frames && readings.frames.length > 0 ? (
              readings.frames.slice(0, 5).map((frame, index) => (
                <div key={index} className="overflow-hidden rounded-lg border">
                  <img
                    src={frame.url || "/placeholder.svg?height=200&width=200"}
                    alt={`Frame ${index + 1}`}
                    className="aspect-square h-full w-full object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="col-span-5 py-4 text-center text-gray-500">No hay frames disponibles</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            Ejercicios Detectados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Keypoints</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.exercises && readings.exercises.length > 0 ? (
                readings.exercises.map((exercise, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{exercise.type}</TableCell>
                    <TableCell>{(exercise.score * 100).toFixed(2)}%</TableCell>
                    <TableCell>{exercise.keypoints ? `${exercise.keypoints.length} puntos` : "N/A"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No hay ejercicios detectados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Conteo de Variantes de Curl
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Repeticiones" fill="#22C55E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
