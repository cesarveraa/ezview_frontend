// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app"
import { getDatabase, connectDatabaseEmulator } from "firebase/database"

// Configuración de Firebase usando variables de entorno expuestas al cliente
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBvAMVHOdMhQnWfMsM2JA2P3fyyqNJPPHA",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://ezview-a058b-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ezview-a058b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ezview-a058b.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:123456789",
}

// Inicializar Firebase solo una vez
function initializeFirebase() {
  const apps = getApps()
  if (apps.length === 0) {
    const app = initializeApp(firebaseConfig)
    const db = getDatabase(app)

    // Conectar al emulador solo en desarrollo y si las variables de entorno están definidas
    if (process.env.NODE_ENV === "development") {
      const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST
      const emulatorPort = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_PORT

      if (emulatorHost && emulatorPort) {
        connectDatabaseEmulator(db, emulatorHost, Number.parseInt(emulatorPort, 10))
        console.log(`Connected to Firebase emulator at ${emulatorHost}:${emulatorPort}`)
      }
    }

    return { app, db }
  } else {
    const app = apps[0]
    const db = getDatabase(app)
    return { app, db }
  }
}

// Exportar la instancia de Firebase
export const { app, db } = initializeFirebase()
