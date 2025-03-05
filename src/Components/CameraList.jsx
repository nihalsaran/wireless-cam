import { useState, useEffect } from 'react';

function CameraList({ onCameraSelect }) {
    const [cameras, setCameras] = useState([]);
    const [manualCameraIP, setManualCameraIP] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [savedCameras, setSavedCameras] = useState([]);
    const [error, setError] = useState(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [ipRange, setIpRange] = useState({
        baseIP: '192.168.4',
        startRange: 1,
        endRange: 20
    });

    // Load saved cameras on component mount
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('savedCameras') || '[]');
        setSavedCameras(saved);
    }, []);

    const saveCameraToStorage = (camera) => {
        const updated = [...savedCameras];
        // Don't add duplicates
        if (!updated.some(cam => cam.ip === camera.ip)) {
            updated.push(camera);
            setSavedCameras(updated);
            localStorage.setItem('savedCameras', JSON.stringify(updated));
        }
    };

    const removeSavedCamera = (ip) => {
        const updated = savedCameras.filter(camera => camera.ip !== ip);
        setSavedCameras(updated);
        localStorage.setItem('savedCameras', JSON.stringify(updated));
    };

    const checkCameraIP = async (ip) => {
        try {
            // Try to fetch the camera's stream URL with a short timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);

            const response = await fetch(`http://${ip}/status`, {
                signal: controller.signal,
                mode: 'no-cors' // Many ESP32 cameras don't support CORS
            });

            clearTimeout(timeoutId);

            // If we get here, the camera responded
            return { name: `ESP32-CAM (${ip})`, ip };
        } catch (error) {
            // Request failed or timed out - not a camera
            return null;
        }
    };

    const scanForCameras = async () => {
        setIsScanning(true);
        setError(null);
        setCameras([]);
        setScanProgress(0);

        try {
            const { baseIP, startRange, endRange } = ipRange;
            const foundCameras = [];
            const totalIPs = endRange - startRange + 1;

            for (let i = startRange; i <= endRange; i++) {
                const ip = `${baseIP}.${i}`;
                const camera = await checkCameraIP(ip);

                if (camera) {
                    foundCameras.push(camera);
                    setCameras([...foundCameras]);
                }

                // Update progress
                setScanProgress(Math.round(((i - startRange + 1) / totalIPs) * 100));
            }

            if (foundCameras.length === 0) {
                setError('No cameras found in the specified IP range');
            }
        } catch (err) {
            setError('Failed to scan for cameras: ' + err.message);
        } finally {
            setIsScanning(false);
            setScanProgress(100);
        }
    };

    const handleManualConnect = () => {
        if (!manualCameraIP) return;

        const camera = {
            name: `ESP32-CAM (${manualCameraIP})`,
            ip: manualCameraIP
        };

        saveCameraToStorage(camera);
        onCameraSelect(camera);
    };

    const handleCameraSelect = (camera) => {
        saveCameraToStorage(camera);
        onCameraSelect(camera);
    };

    return (
        // In src/Components/CameraList.jsx
        <div className="w-full px-2">
            <h2 className="text-lg font-bold mb-3">Available Cameras</h2>

            {/* Manual entry */}
            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h3 className="text-sm font-medium mb-2">Manual Connection</h3>
                <div className="flex gap-1">
                    <input
                        type="text"
                        value={manualCameraIP}
                        onChange={(e) => setManualCameraIP(e.target.value)}
                        placeholder="192.168.4.1"
                        className="flex-1 px-2 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button
                        onClick={handleManualConnect}
                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                    >
                        Connect
                    </button>
                </div>
            </div>

            {/* Scan section */}
            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h3 className="text-sm font-medium mb-2">IP Range Scanner</h3>
                <div className="grid grid-cols-3 gap-1 mb-2">
                    <input
                        type="text"
                        value={ipRange.baseIP}
                        onChange={(e) => setIpRange({ ...ipRange, baseIP: e.target.value })}
                        placeholder="192.168.1"
                        className="px-2 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            value={ipRange.startRange}
                            onChange={(e) => setIpRange({ ...ipRange, startRange: parseInt(e.target.value) })}
                            min="1"
                            max="254"
                            className="w-full px-2 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-xs">to</span>
                    </div>
                    <input
                        type="number"
                        value={ipRange.endRange}
                        onChange={(e) => setIpRange({ ...ipRange, endRange: parseInt(e.target.value) })}
                        min="1"
                        max="254"
                        className="w-full px-2 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>

                <button
                    onClick={scanForCameras}
                    disabled={isScanning}
                    className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 text-sm font-medium"
                >
                    {isScanning ? `Scanning... ${scanProgress}%` : "Scan for Cameras"}
                </button>

                {isScanning && (
                    <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500"
                            style={{ width: `${scanProgress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Scanned cameras list */}
            {cameras.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Discovered Cameras</h3>
                    <ul className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y dark:divide-gray-700">
                        {cameras.map((camera) => (
                            <li key={camera.ip} className="p-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-sm">{camera.name}</div>
                                        <div className="text-xs text-gray-500">{camera.ip}</div>
                                    </div>
                                    <button
                                        onClick={() => handleCameraSelect(camera)}
                                        className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                                    >
                                        Connect
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Saved cameras list */}
            {savedCameras.length > 0 && (
                <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Saved Cameras</h3>
                    <ul className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y dark:divide-gray-700">
                        {savedCameras.map((camera) => (
                            <li key={camera.ip} className="p-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-sm">{camera.name}</div>
                                        <div className="text-xs text-gray-500">{camera.ip}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleCameraSelect(camera)}
                                            className="px-2 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                                        >
                                            Connect
                                        </button>
                                        <button
                                            onClick={() => removeSavedCamera(camera.ip)}
                                            className="px-2 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {error && (
                <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}

export default CameraList;