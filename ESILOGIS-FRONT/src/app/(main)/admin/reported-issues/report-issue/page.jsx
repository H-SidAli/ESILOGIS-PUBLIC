"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import arrows from "../../../../../../public/Images/arrows.svg";
import ReportIssueForm from "@/app/components/Forms/ReportIssueFormadmin";
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav"; 
import ScanPopup from "@/app/components/popups/ScanPopup";
import { Camera } from "lucide-react"; // Added missing import

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

export default function ReportIssueAdminPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showScanPopup, setShowScanPopup] = useState(false);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [scannedBarcodeFormat, setScannedBarcodeFormat] = useState(null);

  const handleShowScanPopup = () => setShowScanPopup(true);
  const handleCloseScanPopup = () => setShowScanPopup(false);
  
  // Handle successful barcode scan
  const handleScanSuccess = (barcodeValue, barcodeFormat) => {
    console.log("Barcode scanned:", barcodeValue, "Format:", barcodeFormat);
    setScannedBarcode(barcodeValue);
    setScannedBarcodeFormat(barcodeFormat);
    setShowScanPopup(false);
  };
  
  // Handle photo click from scanner
  const handlePhotoClick = () => {
    setShowScanPopup(false);
    setShowPhotoPopup(true);
  };
  
  // Handle photo taken from PhotoPopup
  const handlePhotoTaken = (photoDataUrl) => {
    console.log("Photo taken, data URL length:", photoDataUrl.length);
    // You might want to pass this to the form or process it
    // For example, you could add it to the form's photos array
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const breadcrumbItems = [
    { label: 'Issues', href: "../../admin/reported-issues" },
    { label: 'Report Issue', href: "#" }
  ];

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
      <div className="hidden sm:block absolute top-0 right-0 z-10">
        <Image src={arrows} alt="" width={212} />
      </div>

      <div className={`w-full z-30 ${isMobile ? 'mt-10' : 'ml-[129px]'}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px] border-2">
            <Breadcrumb items={breadcrumbItems} />
          </h1>
        </div>

        <div className="px-10 py-8">
          <ReportIssueForm 
            onScanClick={handleShowScanPopup} 
            scannedBarcode={scannedBarcode}
            scannedBarcodeFormat={scannedBarcodeFormat}
          />
        </div>
      </div>

      {showScanPopup && (
        <ScanPopup 
          onClose={handleCloseScanPopup} 
          onScanSuccess={handleScanSuccess}
          onPhotoClick={handlePhotoClick}
        />
      )}
      
      {showPhotoPopup && (
        <PhotoPopup 
          onClose={() => setShowPhotoPopup(false)}
          onPhotoTaken={handlePhotoTaken}
        />
      )}
    </section>
  );
}