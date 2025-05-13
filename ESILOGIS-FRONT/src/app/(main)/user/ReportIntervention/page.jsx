"use client"

import Nav from '@/app/components/Navbar2/Nav';
import Footer from '@/app/components/footer/Footer';
import { useState, useEffect, useRef } from 'react';
import Image from "next/image";
import ReportIssueFormUser from '@/app/components/Forms/ReportIssueFormuser';
import MobileNav from '@/app/components/NavBar/Nav';
import arrows from "../../../../../public/Images/arrows.svg";
import ScanPopup from "@/app/components/popups/ScanPopup";
import { Camera } from 'lucide-react';

export default function ReportIssueUserPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showScanPopup, setShowScanPopup] = useState(false);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [scannedResult, setScannedResult] = useState('');
  const [scanFormat, setScanFormat] = useState('');

  const handlePhotoTaken = () => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 14);
    const newFileName = `photo_${timestamp}.jpg`;
    setAttachedFiles(prev => [...prev, newFileName]);
    handleClosePhotoPopup();
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleShowScanPopup = () => setShowScanPopup(true);
  
  const handleCloseScanPopup = () => setShowScanPopup(false);
  
  const handleShowPhotoPopup = () => setShowPhotoPopup(true);
  
  const handleClosePhotoPopup = () => setShowPhotoPopup(false);
  
  // Handle scan result - critical function to pass the scanned barcode to the form
  const handleScanResult = (result, format) => {
    console.log("Scan result in main page:", result, format);
    setScannedResult(result);
    setScanFormat(format || "Unknown");
  };

  return (
    <section className="w-full min-h-screen bg-[#F4F4F4] relative">
      {/* Sidebar for desktop / Nav for mobile */}
      {!isMobile ? (
        <div className="">
          <Nav />
        </div>
      ) : (
        <div className="m-1">
          <MobileNav firstName='USER' lastName='NAME' role='user' />
        </div>
      )}

      {/* Main content */}
      <div className={`w-full ${isMobile ? '' : ''} min-h-screen flex flex-col`}>
        <div className={`flex-1 p-4 ${isMobile ? 'mt-10' : ''}`}>
        <ReportIssueFormUser 
  onScanClick={handleShowScanPopup}
  onPhotoClick={handleShowPhotoPopup}  // This correctly passes the handler
  attachedFiles={attachedFiles}
  isMobile={isMobile}
  scannedBarcode={scannedResult}
  scanFormat={scanFormat}
/>
        </div>
        <Footer />
      </div>

      {/* Popups */}
      {showScanPopup && (
        <ScanPopup 
          onClose={handleCloseScanPopup} 
          onScanSuccess={handleScanResult}
          onPhotoClick={handleShowPhotoPopup}
        />
      )}
      
      {showPhotoPopup && (
        <PhotoPopup 
          onClose={handleClosePhotoPopup} 
          onPhotoTaken={handlePhotoTaken}
        />
      )}
    </section>
  );
}

// PhotoPopup component with initial selection screen
function PhotoPopup({ onClose, onPhotoTaken }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('select'); // 'select', 'camera', 'preview'
  
  // Start the camera only when requested
  const startCamera = async () => {
    try {
      setMode('camera');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(`Camera access error: ${err.message}. Please ensure your browser has camera permissions.`);
      setMode('select'); // Go back to selection on error
    }
  };
  
  // Stop camera when not in use
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      setMode('preview');
      
      // Stop the camera after capturing
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        setMode('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const usePhoto = () => {
    if (capturedImage) {
      onPhotoTaken(capturedImage);
    }
    onClose();
  };
  
  const resetToSelection = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCapturedImage(null);
    setError(null);
    setMode('select');
  };
  const handleScanResult = (result, format) => {
    console.log("Scan result in main page:", result, format);
    // Ensure format is a simple string 
    const formatString = typeof format === 'object' 
      ? (format.formatName || JSON.stringify(format)) 
      : String(format);
      
    setScannedResult(result);
    setScanFormat(formatString);
  };
  return (
    <div className="fixed inset-0 flex justify-center items-center backdrop-blur-sm bg-black/30 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-[450px] h-auto text-center relative">
        <button 
          className="absolute top-4 right-4 text-black text-xl flex items-center" 
          onClick={onClose}
        >
          &#8592; Cancel
        </button>

        <h2 className="text-xl font-semibold mt-2 mb-4">Add Pictures</h2>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 text-left">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {mode === 'select' && (
          <div className="flex flex-col gap-4 py-6">
            <div className="mb-4 p-6 bg-gray-50 rounded-lg">
              <div className="mx-auto w-28 h-28 flex items-center justify-center">
                <Camera size={96} className="text-gray-400" />
              </div>
            </div>
            <button 
              onClick={startCamera}
              className="w-full max-w-[300px] bg-orange-500 text-white font-semibold py-3 rounded-full mx-auto hover:bg-orange-600"
            >
              Take Photo
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-[300px] bg-blue-600 text-white font-semibold py-3 rounded-full mx-auto hover:bg-blue-700"
            >
              Upload Image
            </button>
          </div>
        )}

        {mode === 'camera' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg flex justify-center items-center w-full h-[300px] mx-auto bg-gray-100 overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            </div>
            <button 
              onClick={capturePhoto}
              className="w-full max-w-[300px] bg-orange-500 text-white font-semibold py-3 rounded-full mt-4 mx-auto hover:bg-orange-600"
            >
              Capture Now
            </button>
            <button 
              onClick={resetToSelection}
              className="w-full max-w-[300px] bg-gray-500 text-white font-semibold py-3 rounded-full mt-2 mx-auto hover:bg-gray-600"
            >
              Back
            </button>
          </div>
        )}

        {mode === 'preview' && capturedImage && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg flex justify-center items-center w-full h-[300px] mx-auto bg-gray-100 overflow-hidden">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              <button 
                onClick={resetToSelection}
                className="flex-1 max-w-[140px] bg-gray-600 text-white font-semibold py-3 rounded-full hover:bg-gray-700"
              >
                Retake
              </button>
              <button 
                onClick={usePhoto}
                className="flex-1 max-w-[140px] bg-blue-600 text-white font-semibold py-3 rounded-full hover:bg-blue-700"
              >
                Use Photo
              </button>
            </div>
          </div>
        )}

        <p className="text-gray-500 text-sm mt-6">
          Make sure to take clear pictures of the issue
        </p>
      </div>
    </div>
  );
}