'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  cardNumber: string;
}

export default function PatientLookupPage() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        // Start processing frames
        processVideoFrames();
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const processVideoFrames = async () => {
    if (!videoRef.current || !scanning) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Draw video frame to canvas
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    try {
      // Use BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13', 'ean_8']
        });

        const barcodes = await barcodeDetector.detect(canvas);
        if (barcodes.length > 0) {
          await handleBarcode(barcodes[0].rawValue);
          return;
        }
      }
    } catch (err) {
      console.error('Error detecting barcode:', err);
    }

    // Continue scanning if no barcode found
    if (scanning) {
      requestAnimationFrame(processVideoFrames);
    }
  };

  const handleBarcode = async (barcodeValue: string) => {
    try {
      const response = await fetch(`/api/patients/lookup?barcode=${encodeURIComponent(barcodeValue)}`);
      if (!response.ok) throw new Error('Failed to lookup patient');
      const data = await response.json();
      setPatient(data.patient);
      stopScanning();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup patient');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode) return;
    await handleBarcode(manualBarcode);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient Lookup</h1>
        <button
          onClick={() => router.push('/admin/cards/inventory')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Back to Inventory
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner section */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Scan Card</h2>
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={scanning ? stopScanning : startScanning}
            className={`w-full py-2 px-4 rounded-md ${
              scanning
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white`}
          >
            {scanning ? 'Stop Scanning' : 'Start Scanning'}
          </button>
        </div>

        {/* Manual entry section */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Manual Entry</h2>
          <form onSubmit={handleManualSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Barcode Value
              </label>
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              Look Up Patient
            </button>
          </form>
        </div>
      </div>

      {/* Patient information */}
      {patient && (
        <div className="mt-6 bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Patient Information</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{patient.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm text-gray-900">{new Date(patient.dateOfBirth).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Card Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{patient.cardNumber}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
} 