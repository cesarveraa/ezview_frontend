"use client"

// hooks/use-firebase-data.ts
import { useState, useEffect } from "react"
import { ref, onValue, off, type DataSnapshot } from "firebase/database"
import { db } from "@/lib/firebase"

/**
 * Hook personalizado para leer datos de Firebase Realtime Database en tiempo real
 * @param path Ruta en la base de datos
 * @param defaultValue Valor por defecto si no hay datos
 * @returns [data, loading, error]
 */
export function useFirebaseData<T>(path: string, defaultValue: T): [T, boolean, Error | null] {
  const [data, setData] = useState<T>(defaultValue)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    const dbRef = ref(db, path)

    const handleData = (snapshot: DataSnapshot) => {
      const value = snapshot.val()
      setData(value || defaultValue)
      setLoading(false)
    }

    const handleError = (err: Error) => {
      console.error(`Error fetching data from ${path}:`, err)
      setError(err)
      setLoading(false)
    }

    // Suscribirse a cambios
    const unsubscribe = onValue(dbRef, handleData, handleError)

    // Limpiar suscripción al desmontar
    return () => {
      off(dbRef)
    }
  }, [path, defaultValue])

  return [data, loading, error]
}

/**
 * Hook para convertir datos de Firebase (objeto de objetos) a un array
 * @param path Ruta en la base de datos
 * @returns [data, loading, error]
 */
export function useFirebaseArray<T>(path: string): [T[], boolean, Error | null] {
  const [rawData, loading, error] = useFirebaseData<Record<string, T> | null>(path, null)

  // Convertir objeto a array con id incluido
  const data: T[] = rawData ? (Object.entries(rawData).map(([id, value]) => ({ id, ...value })) as T[]) : []

  return [data, loading, error]
}
