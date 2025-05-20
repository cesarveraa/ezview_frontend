"use client"

import { createContext, useContext, type ReactNode } from "react"
import {
  ref,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  onChildAdded,
  onChildChanged,
  onValue,
  off,
  type DataSnapshot
} from "firebase/database"
import { db } from "@/lib/firebase"

interface FirebaseContextType {
  /**
   * Suscribe a lecturas de un dispositivo en tiempo real (child_added y child_changed)
   * @param deviceId ID del dispositivo a filtrar
   * @param onAdd callback para nueva lectura
   * @param onUpdate callback para lectura actualizada
   * @param onError callback en caso de error
   */
  subscribeToDeviceReadings: (
    deviceId: string,
    onAdd: (data: any) => void,
    onUpdate: (data: any) => void,
    onError: (error: Error) => void
  ) => () => void

  subscribeToCollection: (
    path: string,
    onData: (data: any[]) => void,
    onError: (error: Error) => void
  ) => () => void
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
}

interface FirebaseProviderProps {
  children: ReactNode
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  /**
   * Construye una query para obtener las últimas 20 lecturas de un dispositivo
   */
  const buildReadingsQuery = (deviceId: string) =>
    query(
      ref(db, "lecturas_iot"),
      orderByChild("device_id"),
      equalTo(deviceId),
      limitToLast(20)
    )

  /**
   * Suscribe a child_added y child_changed de lecturas de un dispositivo
   */
  const subscribeToDeviceReadings = (
    deviceId: string,
    onAdd: (data: any) => void,
    onUpdate: (data: any) => void,
    onError: (error: Error) => void
  ) => {
    const q = buildReadingsQuery(deviceId)
    // Arreglo temporal para mantener orden y límite
    let buffer: any[] = []

    const unsubAdd = onChildAdded(
      q,
      (snapshot: DataSnapshot) => {
        try {
          const reading = { id: snapshot.key!, ...(snapshot.val() as object) }
          buffer.push(reading)
          // ordenar y limitar
          buffer = buffer
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(-20)
          onAdd([...buffer])
        } catch (e) {
          onError(e as Error)
        }
      },
      (error) => onError(error)
    )

    const unsubChange = onChildChanged(
      q,
      (snapshot: DataSnapshot) => {
        try {
          const updated = { id: snapshot.key!, ...(snapshot.val() as object) }
          buffer = buffer.map((r) => (r.id === updated.id ? updated : r))
          onUpdate([...buffer])
        } catch (e) {
          onError(e as Error)
        }
      }
    )

    return () => {
      unsubAdd()
      unsubChange()
      off(ref(db, "lecturas_iot"))
    }
  }

  /**
   * Suscribe a una colección y la convierte en array con id
   */
  const subscribeToCollection = (
    path: string,
    onData: (data: any[]) => void,
    onError: (error: Error) => void
  ) => {
    // reutilizamos onValue para lecturas simples de snapshot completo
    const dataRef = ref(db, path)
    const callback = onValue(
      dataRef,
      (snapshot: DataSnapshot) => {
        const raw = snapshot.val()
        if (!raw) {
          onData([])
        } else {
          const arr = Object.entries(raw).map(([id, val]) => ({ id, ...(val as object) }))
          onData(arr)
        }
      },
      (error) => onError(error)
    )
    return () => off(dataRef)
  }

  return (
    <FirebaseContext.Provider
      value={{
        subscribeToDeviceReadings,
        subscribeToCollection
      }}
    >
      {children}
    </FirebaseContext.Provider>
  )
}
