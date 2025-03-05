import { useState } from 'react'
import Camera from './Components/Camera.jsx'
import './App.css'

function App() {
  return (
    <div className="min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold">ESP32-CAM App</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Connect to your ESP32 camera
        </p>
      </header>
      <main>
        <Camera />
      </main>
    </div>
  )
}

export default App