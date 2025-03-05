import { useState, useEffect, useRef } from 'react';

function Camera() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ESP32 camera stream URL
  const streamUrl = 'http://192.168.4.1:81/stream';
  const photoUrl = 'http://192.168.4.1/capture';

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
  }, []);

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
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <div className="mb-4 text-xl font-bold">ESP32-CAM Stream</div>
      
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
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
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
            <p className="text-white">
              {error || "Connecting to camera..."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={takePhoto}
          disabled={!isConnected || isTakingPhoto}
          className={`px-4 py-2 rounded-full ${
            isConnected && !isTakingPhoto
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-400'
          } text-white font-medium transition-colors`}
        >
          {isTakingPhoto ? "Capturing..." : "Take Photo"}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-red-500">{error}</div>
      )}
    </div>
  );
}

export default Camera;