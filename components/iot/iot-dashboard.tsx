"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useFirebase } from "@/context/firebase-context"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from "recharts"
import {
  Activity,
  Thermometer,
  Cpu,
  Wifi,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  BarChart2,
  PieChartIcon,
  Zap,
  Dumbbell,
  Timer,
  TrendingUp,
  RotateCcw,
  Flame,
  RefreshCw,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface IoTDashboardProps {
  memberId: string
  devices: string[]
}

interface IoTReading {
  created_at: string
  device_id: string
  location: string
  lecturas: {
    accelerometer: {
      x: number
      y: number
      z: number
    }
    gyroscope: {
      x: number
      y: number
      z: number
    }
    free_heap: number
    led_color: string
    led_operational: boolean
    led_state: {
      r: boolean
      g: boolean
      b: boolean
    }
    mpu_connected: boolean
    mpu_temp: number
    wifi_rssi: number
  }
}

// Función para detectar el tipo de ejercicio basado en los datos del acelerómetro y giroscopio
const detectExerciseType = (accel: { x: number; y: number; z: number }, gyro: { x: number; y: number; z: number }) => {
  // Supinación: Rotación hacia arriba (palmas hacia arriba)
  // Martillo: Posición neutra (pulgares hacia arriba)
  // Pronación: Rotación hacia abajo (palmas hacia abajo)

  // Simplificación para demostración:
  // Usamos principalmente el valor de rotación en el eje Z del giroscopio
  // y la orientación del acelerómetro en X

  if (gyro.z < -8) {
    return "Supinación" // Curl tradicional
  } else if (gyro.z > 8) {
    return "Pronación" // Curl inverso
  } else if (Math.abs(gyro.z) < 5 && Math.abs(accel.x) > 0.5) {
    return "Martillo" // Curl de martillo
  } else {
    return "Reposo" // Sin movimiento específico
  }
}

// Función para calcular la intensidad del movimiento
const calculateMovementIntensity = (accel: { x: number; y: number; z: number }) => {
  return Math.sqrt(Math.pow(accel.x, 2) + Math.pow(accel.y, 2) + Math.pow(accel.z, 2))
}

// Función para detectar una repetición
const isRepetition = (intensity: number, prevIntensity: number, threshold = 0.3) => {
  return intensity > 1.2 && prevIntensity < 1.2 - threshold
}

// Función para formatear la hora
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`
}

// Preparar datos para gráficos con marcas de tiempo
const prepareAccelerometerData = (readings: IoTReading[]) => {
  return readings.map((reading) => ({
    time: formatTime(reading.created_at),
    x: reading.lecturas.accelerometer.x,
    y: reading.lecturas.accelerometer.y,
    z: reading.lecturas.accelerometer.z,
    intensity: calculateMovementIntensity(reading.lecturas.accelerometer),
  }))
}

const prepareGyroscopeData = (readings: IoTReading[]) => {
  return readings.map((reading) => ({
    time: formatTime(reading.created_at),
    x: reading.lecturas.gyroscope.x,
    y: reading.lecturas.gyroscope.y,
    z: reading.lecturas.gyroscope.z,
    rotationIntensity: Math.sqrt(
      Math.pow(reading.lecturas.gyroscope.x, 2) +
        Math.pow(reading.lecturas.gyroscope.y, 2) +
        Math.pow(reading.lecturas.gyroscope.z, 2),
    ),
  }))
}

const prepareExerciseData = (readings: IoTReading[]) => {
  let supinationCount = 0
  let hammerCount = 0
  let pronationCount = 0
  let prevIntensity = 0

  const data = readings.map((reading) => {
    const exerciseType = detectExerciseType(reading.lecturas.accelerometer, reading.lecturas.gyroscope)
    const intensity = calculateMovementIntensity(reading.lecturas.accelerometer)

    // Detectar repeticiones
    if (isRepetition(intensity, prevIntensity)) {
      if (exerciseType === "Supinación") supinationCount++
      else if (exerciseType === "Martillo") hammerCount++
      else if (exerciseType === "Pronación") pronationCount++
    }

    prevIntensity = intensity

    return {
      time: formatTime(reading.created_at),
      type: exerciseType,
      intensity,
      rotationX: reading.lecturas.gyroscope.x,
      rotationY: reading.lecturas.gyroscope.y,
      rotationZ: reading.lecturas.gyroscope.z,
    }
  })

  return {
    timeSeriesData: data,
    counts: {
      supinacion: supinationCount,
      martillo: hammerCount,
      pronacion: pronationCount,
    },
  }
}

const prepareExerciseCountData = (counts: { supinacion: number; martillo: number; pronacion: number }) => {
  return [
    { name: "Supinación", count: counts.supinacion, color: "#22C55E" },
    { name: "Martillo", count: counts.martillo, color: "#3B82F6" },
    { name: "Pronación", count: counts.pronacion, color: "#F97316" },
  ]
}

const prepareWifiData = (readings: IoTReading[]) => {
  return readings.map((reading) => ({
    time: formatTime(reading.created_at),
    rssi: reading.lecturas.wifi_rssi,
  }))
}

const prepareTempData = (readings: IoTReading[]) => {
  return readings.map((reading) => ({
    time: formatTime(reading.created_at),
    temp: reading.lecturas.mpu_temp,
  }))
}

const prepareHeapData = (readings: IoTReading[]) => {
  return readings.map((reading) => ({
    time: formatTime(reading.created_at),
    heap: reading.lecturas.free_heap / 1024, // Convertir a KB
  }))
}

const prepareLedStateData = (reading: IoTReading) => {
  return [
    { name: "R", value: reading.lecturas.led_state.r ? 1 : 0, color: "#DC2626" },
    { name: "G", value: reading.lecturas.led_state.g ? 1 : 0, color: "#22C55E" },
    { name: "B", value: reading.lecturas.led_state.b ? 1 : 0, color: "#3B82F6" },
  ]
}

const prepare3DData = (readings: IoTReading[]) => {
  return readings.map((reading) => ({
    x: reading.lecturas.accelerometer.x,
    y: reading.lecturas.accelerometer.y,
    z: reading.lecturas.accelerometer.z,
    time: formatTime(reading.created_at),
  }))
}

const prepareRadarData = (reading: IoTReading) => {
  return [
    { subject: "Accel X", A: Math.abs(reading.lecturas.accelerometer.x), fullMark: 1 },
    { subject: "Accel Y", A: Math.abs(reading.lecturas.accelerometer.y), fullMark: 1 },
    { subject: "Accel Z", A: Math.abs(reading.lecturas.accelerometer.z), fullMark: 1 },
    { subject: "Gyro X", A: Math.abs(reading.lecturas.gyroscope.x / 15), fullMark: 1 },
    { subject: "Gyro Y", A: Math.abs(reading.lecturas.gyroscope.y / 15), fullMark: 1 },
    { subject: "Gyro Z", A: Math.abs(reading.lecturas.gyroscope.z / 15), fullMark: 1 },
  ]
}

// Calcular calorías quemadas (estimación simplificada)
const calculateCaloriesBurned = (counts: { supinacion: number; martillo: number; pronacion: number }) => {
  // Valores aproximados de calorías por repetición
  const caloriesPerRep = {
    supinacion: 0.15,
    martillo: 0.12,
    pronacion: 0.18,
  }

  return (
    counts.supinacion * caloriesPerRep.supinacion +
    counts.martillo * caloriesPerRep.martillo +
    counts.pronacion * caloriesPerRep.pronacion
  ).toFixed(2)
}

export function IoTDashboard({ memberId, devices }: IoTDashboardProps) {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [readings, setReadings] = useState<IoTReading[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("ejercicios")
  const [exerciseStats, setExerciseStats] = useState({
    currentExercise: "Reposo",
    intensity: 0,
    counts: { supinacion: 0, martillo: 0, pronacion: 0 },
    caloriesBurned: "0.00",
    sessionDuration: 0,
  })
  const [isRealtime, setIsRealtime] = useState(true)

  // Asegurar que las actualizaciones en ti empo real estén habilitadas
  useEffect(() => {
    if (!isRealtime) {
      setIsRealtime(true)
    }
  }, [selectedDevice])

  const [updateCount, setUpdateCount] = useState(0)
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
// Ahora:
  const { subscribeToDeviceReadings } = useFirebase()

  useEffect(() => {
    if (devices.length > 0 && devices[0] !== "app") {
      setSelectedDevice(devices[0])
    } else if (devices.length > 1) {
      setSelectedDevice(devices[1])
    }
  }, [devices])

  // Función para actualizar las estadísticas de ejercicio
  const updateExerciseStats = useCallback((newReadings: IoTReading[]) => {
    if (newReadings.length === 0) return

    const latestReading = newReadings[0]
    const exerciseType = detectExerciseType(latestReading.lecturas.accelerometer, latestReading.lecturas.gyroscope)
    const intensity = calculateMovementIntensity(latestReading.lecturas.accelerometer)

    const { counts } = prepareExerciseData(newReadings)
    const caloriesBurned = calculateCaloriesBurned(counts)

    // Duración aproximada de la sesión (en minutos)
    const sessionDuration =
      newReadings.length > 1
        ? (new Date(newReadings[0].created_at).getTime() -
            new Date(newReadings[newReadings.length - 1].created_at).getTime()) /
          60000
        : 0

    setExerciseStats({
      currentExercise: exerciseType,
      intensity,
      counts,
      caloriesBurned,
      sessionDuration: Math.abs(sessionDuration),
    })
  }, [])

  // Efecto para mostrar un indicador visual de actualización
  useEffect(() => {
    if (updateCount > 0) {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
      updateTimerRef.current = setTimeout(() => {
        setUpdateCount(0)
      }, 1000)
    }
    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current)
      }
    }
  }, [updateCount])

  useEffect(() => {
    if (!selectedDevice || selectedDevice === "app") return

    setLoading(true)

    // Suscribirse a las lecturas en tiempo real
    const unsubscribe = subscribeToDeviceReadings(
      selectedDevice,
      // onAdd: nueva lectura
      (bufferedReadings: IoTReading[]) => {
        if (!isRealtime) {
          setLoading(false)
          return
        }
        setReadings(bufferedReadings)
        updateExerciseStats(bufferedReadings)
        setUpdateCount((prev) => prev + 1)
        setLoading(false)
      },
      // onUpdate: lectura modificada
      (bufferedReadings: IoTReading[]) => {
        if (!isRealtime) return
        setReadings(bufferedReadings)
        updateExerciseStats(bufferedReadings)
      },
      // onError
      (error: Error) => {
        toast({
          title: "Error al cargar lecturas",
          description: error.message,
          variant: "destructive",
        })
        console.error(error)
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [selectedDevice, subscribeToDeviceReadings, toast, updateExerciseStats, isRealtime])

  if (!selectedDevice || devices.length === 0 || (devices.length === 1 && devices[0] === "app")) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <h3 className="mb-2 text-xl font-semibold">No hay dispositivos IoT registrados</h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Este miembro aún no tiene dispositivos IoT registrados. Haz clic en "Registrar Dispositivo" para comenzar.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Filtrar "app" de la lista de dispositivos
  const iotDevices = devices.filter((device) => device !== "app")

  // Obtener la lectura más reciente
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null

  // Preparar datos para gráficos de ejercicios
  const exerciseData =
    readings.length > 0
      ? prepareExerciseData(readings)
      : { timeSeriesData: [], counts: { supinacion: 0, martillo: 0, pronacion: 0 } }
  const exerciseCountData = prepareExerciseCountData(exerciseStats.counts)

  return (
    <div className="space-y-6">
      {iotDevices.length > 1 && (
        <Tabs defaultValue={selectedDevice || ""} onValueChange={setSelectedDevice}>
          <TabsList>
            {iotDevices.map((device) => (
              <TabsTrigger key={device} value={device}>
                {device}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isRealtime ? "bg-green-500 animate-pulse" : "bg-gray-300 dark:bg-gray-700"
            }`}
          ></div>
          <span className="text-sm font-medium">
            {isRealtime ? "Actualizando en tiempo real" : "Actualización pausada"}
          </span>
          {updateCount > 0 && (
            <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Actualizado
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsRealtime(!isRealtime)}
          className={isRealtime ? "border-green-500 text-green-500" : ""}
        >
          {isRealtime ? "Pausar" : "Reanudar"} actualización
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p>Cargando datos del dispositivo...</p>
        </div>
      ) : readings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <h3 className="mb-2 text-xl font-semibold">No hay lecturas disponibles</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">No se encontraron lecturas para este dispositivo.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ejercicios">Ejercicios</TabsTrigger>
              <TabsTrigger value="dispositivo">Dispositivo</TabsTrigger>
            </TabsList>

            <TabsContent value="ejercicios" className="space-y-6 mt-6">
              {/* Panel de Ejercicio Actual */}
              <Card className="border-2 border-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Dumbbell className="h-6 w-6 text-green-500" />
                    Ejercicio Actual
                  </CardTitle>
                  <CardDescription>
                    Monitoreo en tiempo real del ejercicio detectado
                    {latestReading && (
                      <span className="ml-2 text-xs text-gray-500">
                        Última actualización: {new Date(latestReading.created_at).toLocaleTimeString()}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-4xl font-bold mb-2">{exerciseStats.currentExercise}</div>
                      <div
                        className={cn(
                          "px-4 py-2 rounded-full text-white font-medium",
                          exerciseStats.currentExercise === "Supinación" && "bg-green-500",
                          exerciseStats.currentExercise === "Martillo" && "bg-blue-500",
                          exerciseStats.currentExercise === "Pronación" && "bg-orange-500",
                          exerciseStats.currentExercise === "Reposo" && "bg-gray-500",
                        )}
                      >
                        {exerciseStats.currentExercise === "Supinación" && "Curl Tradicional"}
                        {exerciseStats.currentExercise === "Martillo" && "Curl de Martillo"}
                        {exerciseStats.currentExercise === "Pronación" && "Curl Inverso"}
                        {exerciseStats.currentExercise === "Reposo" && "En Reposo"}
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Intensidad del Movimiento</span>
                          <span className="text-sm font-medium">{exerciseStats.intensity.toFixed(2)}</span>
                        </div>
                        <Progress value={Math.min(exerciseStats.intensity * 50, 100)} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Timer className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="text-sm text-gray-500">Duración</div>
                            <div className="font-medium">{exerciseStats.sessionDuration.toFixed(1)} min</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Flame className="h-5 w-5 text-red-500" />
                          <div>
                            <div className="text-sm text-gray-500">Calorías</div>
                            <div className="font-medium">{exerciseStats.caloriesBurned} kcal</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conteo de Repeticiones */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Supinación</CardTitle>
                    <CardDescription>Curl Tradicional</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-4xl font-bold">{exerciseStats.counts.supinacion}</div>
                      <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                        <RotateCcw className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">Palmas hacia arriba</div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Martillo</CardTitle>
                    <CardDescription>Curl de Martillo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-4xl font-bold">{exerciseStats.counts.martillo}</div>
                      <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                        <Dumbbell className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">Pulgares hacia arriba</div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Pronación</CardTitle>
                    <CardDescription>Curl Inverso</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-4xl font-bold">{exerciseStats.counts.pronacion}</div>
                      <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
                        <RotateCcw className="h-6 w-6 text-orange-500 transform rotate-180" />
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">Palmas hacia abajo</div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Repeticiones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-purple-500" />
                    Repeticiones por Tipo de Ejercicio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={exerciseCountData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Repeticiones">
                          {exerciseCountData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Gráficos de Movimiento */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <Activity className="h-5 w-5 text-green-500" />
                      Intensidad del Movimiento (Tiempo Real)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={prepareAccelerometerData(readings)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="time"
                            label={{ value: "Tiempo (hh:mm:ss)", position: "insideBottomRight", offset: 0 }}
                            tick={{ fontSize: 10 }}
                            interval="preserveEnd"
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(2)}`, "Intensidad"]}
                            labelFormatter={(value) => `Tiempo: ${value}`}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="intensity"
                            name="Intensidad"
                            stroke="#22C55E"
                            fill="#22C55E"
                            fillOpacity={0.3}
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Rotación del Brazo (Tiempo Real)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={prepareGyroscopeData(readings)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="time"
                            label={{ value: "Tiempo (hh:mm:ss)", position: "insideBottomRight", offset: 0 }}
                            tick={{ fontSize: 10 }}
                            interval="preserveEnd"
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(2)}°/s`, ""]}
                            labelFormatter={(value) => `Tiempo: ${value}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="z"
                            name="Rotación Z"
                            stroke="#F97316"
                            dot={false}
                            strokeWidth={2}
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Visualización 3D y Radar */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Posición 3D del Brazo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid />
                          <XAxis
                            type="number"
                            dataKey="x"
                            name="X"
                            domain={[-1, 1]}
                            label={{ value: "X", position: "insideBottomRight", offset: 0 }}
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            name="Y"
                            domain={[-1, 1]}
                            label={{ value: "Y", angle: -90, position: "insideLeft" }}
                          />
                          <ZAxis type="number" dataKey="z" name="Z" range={[60, 400]} domain={[-1, 1]} />
                          <Tooltip
                            cursor={{ strokeDasharray: "3 3" }}
                            formatter={(value) => [typeof value === "number" ? value.toFixed(3) : value, ""]}
                            labelFormatter={(_, payload) => `Tiempo: ${payload[0]?.payload.time || ""}`}
                          />
                          <Legend />
                          <Scatter
                            name="Posición"
                            data={prepare3DData(readings)}
                            fill="#22C55E"
                            shape="circle"
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <PieChartIcon className="h-5 w-5 text-indigo-500" />
                      Análisis de Movimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {latestReading && (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart outerRadius={90} data={prepareRadarData(latestReading)}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis domain={[0, 1]} />
                            <Radar
                              name="Valores"
                              dataKey="A"
                              stroke="#22C55E"
                              fill="#22C55E"
                              fillOpacity={0.6}
                              isAnimationActive={true}
                              animationDuration={300}
                            />
                            <Tooltip />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="dispositivo" className="space-y-6 mt-6">
              {/* Panel de información general */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="col-span-3 md:col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Información del Dispositivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">ID</h4>
                        <p className="text-sm font-medium">{latestReading?.device_id}</p>
                      </div>
                      <div>
                        <h4 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Ubicación</h4>
                        <p className="text-sm font-medium">{latestReading?.location}</p>
                      </div>
                      <div>
                        <h4 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                          Última Actualización
                        </h4>
                        <p className="text-sm font-medium">
                          {latestReading?.created_at ? new Date(latestReading.created_at).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Estado del Dispositivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={latestReading?.lecturas.mpu_connected ? "default" : "destructive"}
                          className="h-6 px-2"
                        >
                          {latestReading?.lecturas.mpu_connected ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <AlertCircle className="mr-1 h-3 w-3" />
                          )}
                          MPU
                        </Badge>
                        <span className="text-sm">
                          {latestReading?.lecturas.mpu_connected ? "Conectado" : "Desconectado"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={latestReading?.lecturas.led_operational ? "default" : "destructive"}
                          className="h-6 px-2"
                        >
                          {latestReading?.lecturas.led_operational ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <AlertCircle className="mr-1 h-3 w-3" />
                          )}
                          LED
                        </Badge>
                        <span className="text-sm">
                          {latestReading?.lecturas.led_operational ? "Operativo" : "Fallo"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Memoria Libre</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Cpu className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="text-2xl font-bold">
                          {latestReading?.lecturas.free_heap
                            ? (latestReading.lecturas.free_heap / 1024).toFixed(2)
                            : "N/A"}{" "}
                          KB
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Memoria disponible</p>
                      </div>
                    </div>
                    {latestReading?.lecturas.free_heap && (
                      <Progress value={(latestReading.lecturas.free_heap / 262144) * 100} className="mt-2 h-2" />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Estado del LED */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg font-medium">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Estado del LED
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-2 text-lg font-medium">
                        Color: {latestReading?.lecturas.led_color || "N/A"}
                      </div>
                      <div className="flex gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            latestReading?.lecturas.led_state.r ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          R
                        </div>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            latestReading?.lecturas.led_state.g ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          G
                        </div>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            latestReading?.lecturas.led_state.b ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          B
                        </div>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      {latestReading && (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={prepareLedStateData(latestReading)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name }) => name}
                              isAnimationActive={true}
                              animationDuration={300}
                            >
                              {prepareLedStateData(latestReading).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sensores MPU */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <Activity className="h-5 w-5 text-green-500" />
                      Acelerómetro (Tiempo Real)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium">X</span>
                        <span className="text-xl font-bold">
                          {latestReading?.lecturas.accelerometer.x.toFixed(3) || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium">Y</span>
                        <span className="text-xl font-bold">
                          {latestReading?.lecturas.accelerometer.y.toFixed(3) || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium">Z</span>
                        <span className="text-xl font-bold">
                          {latestReading?.lecturas.accelerometer.z.toFixed(3) || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={prepareAccelerometerData(readings)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="time"
                            label={{ value: "Tiempo (hh:mm:ss)", position: "insideBottomRight", offset: 0 }}
                            tick={{ fontSize: 10 }}
                            interval="preserveEnd"
                          />
                          <YAxis domain={[-1, 1]} />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(3)}`, ""]}
                            labelFormatter={(value) => `Tiempo: ${value}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="x"
                            stroke="#22C55E"
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                          <Line
                            type="monotone"
                            dataKey="y"
                            stroke="#3B82F6"
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                          <Line
                            type="monotone"
                            dataKey="z"
                            stroke="#F97316"
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <Activity className="h-5 w-5 text-orange-500" />
                      Giroscopio (Tiempo Real)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium">X</span>
                        <span className="text-xl font-bold">
                          {latestReading?.lecturas.gyroscope.x.toFixed(2) || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium">Y</span>
                        <span className="text-xl font-bold">
                          {latestReading?.lecturas.gyroscope.y.toFixed(2) || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium">Z</span>
                        <span className="text-xl font-bold">
                          {latestReading?.lecturas.gyroscope.z.toFixed(2) || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={prepareGyroscopeData(readings)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="time"
                            label={{ value: "Tiempo (hh:mm:ss)", position: "insideBottomRight", offset: 0 }}
                            tick={{ fontSize: 10 }}
                            interval="preserveEnd"
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(2)}°/s`, ""]}
                            labelFormatter={(value) => `Tiempo: ${value}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="x"
                            stroke="#22C55E"
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                          <Line
                            type="monotone"
                            dataKey="y"
                            stroke="#3B82F6"
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                          <Line
                            type="monotone"
                            dataKey="z"
                            stroke="#F97316"
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Visualizaciones adicionales */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <Thermometer className="h-5 w-5 text-red-500" />
                      Temperatura MPU (Tiempo Real)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center mb-4">
                      <div className="text-4xl font-bold">{latestReading?.lecturas.mpu_temp.toFixed(1) || "N/A"}°C</div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareTempData(readings)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="time"
                            label={{ value: "Tiempo (hh:mm:ss)", position: "insideBottomRight", offset: 0 }}
                            tick={{ fontSize: 10 }}
                            interval="preserveEnd"
                          />
                          <YAxis domain={[0, 40]} />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(1)}°C`, "Temperatura"]}
                            labelFormatter={(value) => `Tiempo: ${value}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="temp"
                            name="Temperatura"
                            stroke="#DC2626"
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <Wifi className="h-5 w-5 text-blue-500" />
                      Intensidad de Señal WiFi (Tiempo Real)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center mb-4">
                      <div className="text-4xl font-bold">{latestReading?.lecturas.wifi_rssi || "N/A"} dBm</div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareWifiData(readings)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="time"
                            label={{ value: "Tiempo (hh:mm:ss)", position: "insideBottomRight", offset: 0 }}
                            tick={{ fontSize: 10 }}
                            interval="preserveEnd"
                          />
                          <YAxis domain={[-100, 0]} />
                          <Tooltip
                            formatter={(value) => [`${value} dBm`, "RSSI"]}
                            labelFormatter={(value) => `Tiempo: ${value}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="rssi"
                            name="RSSI"
                            stroke="#3B82F6"
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={300}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
