import { useState, useEffect, useRef } from 'react';

function Camera({ camera, onBack }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Build URLs from the camera information
  const streamUrl = `http://${camera.ip}:81/stream`;
  const photoUrl = `http://${camera.ip}/capture`;

  useEffect(() => {
    // Load the image stream
    const image = new Image();
    image.onload = () => setIsConnected(true);
    image.onerror = () => {
      setError('Failed to connect to camera stream');
      setIsConnected(false);
    };
    image.src = streamUrl;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [streamUrl]);

  const takePhoto = async () => {
    setIsTakingPhoto(true);
    try {
      const response = await fetch(photoUrl);
      if (!response.ok) {
        throw new Error('Failed to capture image');
      }
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage(imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const closeImage = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
  };

  return (
    // In src/Components/Camera.jsx
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between items-center w-full mb-3">
        <button
          onClick={onBack}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
        >
          &larr; Back
        </button>
        <div className="text-base font-bold truncate">{camera.name}</div>
      </div>

      <div className="relative w-full overflow-hidden bg-black aspect-video rounded-lg shadow-lg">
        {isConnected ? (
          <>
            {capturedImage ? (
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-auto"
                />
                <button
                  onClick={closeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <img
                src={streamUrl}
                alt="ESP32-CAM Stream"
                className="w-full h-auto"
              />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white text-sm">
              {error || `Connecting to camera at ${camera.ip}...`}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex w-full justify-center">
        <button
          onClick={takePhoto}
          disabled={!isConnected || isTakingPhoto}
          className={`px-6 py-3 rounded-full ${isConnected && !isTakingPhoto
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-400'
            } text-white font-medium transition-colors text-sm`}
        >
          {isTakingPhoto ? "Capturing..." : "Take Photo"}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-red-500 text-sm w-full text-center">
          {error}
        </div>
      )}
    </div>
  );
}

export default Camera;