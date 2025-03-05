import { useState } from 'react';
import Camera from './Components/Camera.jsx';
import CameraList from './Components/CameraList.jsx';
import './App.css';

function App() {
  const [selectedCamera, setSelectedCamera] = useState(null);

  const handleCameraSelect = (camera) => {
    setSelectedCamera(camera);
  };

  const handleBack = () => {
    setSelectedCamera(null);
  };

  return (
    // In src/App.jsx
    <div className="min-h-screen p-2 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="mb-4 text-center">
        <h1 className="text-xl font-bold">ESP32-CAM App</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedCamera
            ? `Connected to ${selectedCamera.name}`
            : 'Connect to your ESP32 camera'}
        </p>
      </header>
      <main>
        {selectedCamera ? (
          <Camera camera={selectedCamera} onBack={handleBack} />
        ) : (
          <CameraList onCameraSelect={handleCameraSelect} />
        )}
      </main>
    </div>
  );
}

export default App;