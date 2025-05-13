"use client";

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat } from '@zxing/library';

// Main ScanPopup component
export default function ScanPopup({ onClose, onScanSuccess, onPhotoClick }) {
  const [scannerActive, setScannerActive] = useState(true);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [scanError, setScanError] = useState(null);
  
  // Integrated barcode scanner props
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState("pending");
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scanning, setScanning] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [secureContext, setSecureContext] = useState(true);
  const [scannerInstance, setScannerInstance] = useState(null);
  
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Detect mobile device and secure context on mount
  useEffect(() => {
    // Check if mobile
    const userAgent = navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    setIsMobile(mobileRegex.test(userAgent));
    
    // Check if secure context
    setSecureContext(window.isSecureContext);
  }, []);
  
  const handleScanResult = (result, format) => {
    console.log("Scanned barcode:", result, "Format:", format);
    if (result) {
      // Convert format to string if it's an object
      const formatString = typeof format === 'object' 
        ? (format.formatName || JSON.stringify(format)) 
        : String(format);
        
      onScanSuccess(result, formatString);
      onClose();
    }
  };

  // Enhanced format configuration for wider barcode format support
  const supportedFormats = {
    // 1D Barcodes
    CODE_128: true,
    CODE_39: true,
    CODE_93: true, 
    CODABAR: true,
    EAN_13: true,
    EAN_8: true,
    ITF: true,
    UPC_A: true,
    UPC_E: true,
    MSI: true,
    CODE_11: true,
    INDUSTRIAL_25: true,
    
    // 2D Barcodes
    QR_CODE: true,
    DATA_MATRIX: true,
    PDF_417: true,
    AZTEC: true,
    MAXICODE: true,
    
    // Other formats
    RSS_14: true,
    RSS_EXPANDED: true,
    UPC_EAN_EXTENSION: true
  };

  // Initialize format hints for ZXing
  const getZXingFormats = () => {
    const formats = [];
    
    // Map supported formats to ZXing formats
    if (supportedFormats.CODE_128) formats.push(BarcodeFormat.CODE_128);
    if (supportedFormats.CODE_39) formats.push(BarcodeFormat.CODE_39);
    if (supportedFormats.CODE_93) formats.push(BarcodeFormat.CODE_93);
    if (supportedFormats.CODABAR) formats.push(BarcodeFormat.CODABAR);
    if (supportedFormats.EAN_13) formats.push(BarcodeFormat.EAN_13);
    if (supportedFormats.EAN_8) formats.push(BarcodeFormat.EAN_8);
    if (supportedFormats.ITF) formats.push(BarcodeFormat.ITF);
    if (supportedFormats.UPC_A) formats.push(BarcodeFormat.UPC_A);
    if (supportedFormats.UPC_E) formats.push(BarcodeFormat.UPC_E);
    if (supportedFormats.QR_CODE) formats.push(BarcodeFormat.QR_CODE);
    if (supportedFormats.DATA_MATRIX) formats.push(BarcodeFormat.DATA_MATRIX);
    if (supportedFormats.PDF_417) formats.push(BarcodeFormat.PDF_417);
    if (supportedFormats.AZTEC) formats.push(BarcodeFormat.AZTEC);
    if (supportedFormats.MAXICODE) formats.push(BarcodeFormat.MAXICODE);
    
    return formats;
  };

  // Check camera permission and list cameras
  useEffect(() => {
    const checkCameraPermissions = async () => {
      try {
        // Skip camera check if we're on mobile with insecure context
        if (isMobile && !secureContext) {
          setCameraPermission("denied");
          setError("Camera access requires HTTPS on mobile devices. Please use the file upload option instead.");
          return;
        }
        
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const result = await navigator.permissions.query({ name: 'camera' });
            setCameraPermission(result.state);
            
            result.onchange = () => {
              setCameraPermission(result.state);
            };
            
            if (result.state === "granted") {
              listCameras();
            }
          } catch (permErr) {
            // Some browsers don't support permissions API for camera
            // Fall back to getUserMedia
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setCameraPermission("granted");
            listCameras();
          }
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setCameraPermission("granted");
          listCameras();
        }
      } catch (err) {
        console.error("Camera permission error:", err);
        setCameraPermission("denied");
        
        if (isMobile && !secureContext) {
          setError("Camera access requires HTTPS on mobile devices. Please use the file upload option.");
        } else {
          setError("Camera access was denied. Please enable camera access in your browser settings or use file upload.");
        }
      }
    };

    const listCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
          setSelectedCamera(devices[0].id);
        } else {
          setError("No cameras found on this device");
        }
      } catch (err) {
        console.error("Error listing cameras:", err);
        setError(`Could not list cameras: ${err.toString()}`);
      }
    };

    if (scannerActive) {
      checkCameraPermissions();
    }
    
    return () => {
      if (scannerInstance) {
        try {
          scannerInstance.stop().catch(console.error);
        } catch (e) {
          console.error("Error stopping scanner during cleanup:", e);
        }
      }
    };
  }, [scannerActive, isMobile, secureContext]);

  // Start scanning with camera
  const startScanning = async () => {
    if (!selectedCamera || scanning) return;
    
    try {
      setError(null);
      setScanning(true);
      setImagePreview(null);
      
      const html5QrCode = new Html5Qrcode("scanner");
      setScannerInstance(html5QrCode);
      
      // Use a simpler config without FORMATS to avoid errors
      const config = {
        fps: 15,
        qrbox: { width: 250, height: 150 }
        // No formatsToSupport to avoid Html5Qrcode.FORMATS error
      };
      
      await html5QrCode.start(
        { deviceId: { exact: selectedCamera } },
        config,
        (decodedText, decodedResult) => {
          console.log("Scan result:", decodedText, decodedResult);
          if (handleScanResult) {
            const format = decodedResult?.result?.format || 'unknown';
            handleScanResult(decodedText, format);
          }
        },
        (errorMessage) => {
          // Ignore common scanning messages to prevent console spam
          if (!errorMessage.includes("No MultiFormat Readers")) {
            console.log("Scan process:", errorMessage);
          }
        }
      );
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setScanning(false);
      setError(`Could not start scanner: ${err.toString()}`);
    }
  };

  // Stop scanning
  const stopScanning = async () => {
    if (scannerInstance && scanning) {
      try {
        await scannerInstance.stop();
        setScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };
  
  // Create a data URL from a file
  const createImageUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Scan barcode from file - enhanced with multiple methods and better error handling
  const scanBarcodeFromFile = async (file) => {
    console.log("Starting file scan for:", file.name, "type:", file.type);
    
    try {
      // For debugging/preview
      const imageUrl = await createImageUrl(file);
      setImagePreview(imageUrl);
      
      // Method 1: Try Html5Qrcode with extended configuration
      try {
        console.log("Trying Html5Qrcode...");
        // Make sure file-scanner div exists
        if (!document.getElementById('file-scanner')) {
          const div = document.createElement('div');
          div.id = 'file-scanner';
          div.style.display = 'none';
          document.body.appendChild(div);
        }
        
        const html5QrCode = new Html5Qrcode("file-scanner", { verbose: true });
        
        const scanResult = await html5QrCode.scanFile(file, /* showImage= */ false);
        
        if (scanResult?.decodedText) {
          console.log("Html5Qrcode success:", scanResult);
          return { 
            text: scanResult.decodedText, 
            format: scanResult.result?.format || 'unknown' 
          };
        }
      } catch (html5Error) {
        console.log("Html5Qrcode file scan failed:", html5Error);
      }

      // Method 2: ZXing with bitmap approach - often better for complex barcodes
      try {
        console.log("Trying ZXing with bitmap...");
        
        // Create a temporary image element and wait for it to load
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        // Draw the image onto a canvas to get bitmap data
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Clean up the object URL
        URL.revokeObjectURL(img.src);
        
        try {
          // Get image bitmap
          const bitmap = await createImageBitmap(canvas);
          
          // Configure reader with hints
          const codeReader = new BrowserMultiFormatReader(undefined, 3000); // 3 seconds timeout
          
          // Decode from bitmap
          const result = await codeReader.decodeFromImageBitmap(bitmap);
          
          if (result?.getText()) {
            console.log("ZXing bitmap scan success:", result.getText());
            return {
              text: result.getText(),
              format: result.getBarcodeFormat()?.toString() || 'unknown'
            };
          }
        } catch (bitmapError) {
          console.log("Bitmap creation/processing error:", bitmapError);
        }
      } catch (zxingBitmapError) {
        console.log("ZXing bitmap scan failed:", zxingBitmapError);
      }

      // Method 3: Try ZXing with URL approach (different pathways can detect different codes)
      try {
        console.log("Trying ZXing with URL...");
        const imageUrl = URL.createObjectURL(file);
        const codeReader = new BrowserMultiFormatReader();
        
        try {
          const result = await codeReader.decodeFromImageUrl(imageUrl);
          
          if (result?.getText()) {
            console.log("ZXing URL scan success:", result.getText());
            return {
              text: result.getText(),
              format: result.getBarcodeFormat()?.toString() || 'unknown'
            };
          }
        } finally {
          URL.revokeObjectURL(imageUrl); // Clean up
        }
      } catch (zxingUrlError) {
        console.log("ZXing URL scan failed:", zxingUrlError);
      }

      // Method 4: Try native BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        try {
          console.log("Trying native BarcodeDetector...");
          const barcodeDetector = new BarcodeDetector({
            formats: [
              'qr_code', 'code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 
              'upc_a', 'upc_e', 'itf', 'codabar', 'data_matrix', 'pdf417', 'aztec'
            ]
          });
          
          // Create an image bitmap for the detector
          const bitmap = await createImageBitmap(file);
          const barcodes = await barcodeDetector.detect(bitmap);
          
          if (barcodes.length > 0) {
            console.log("Native BarcodeDetector success:", barcodes[0]);
            return {
              text: barcodes[0].rawValue,
              format: barcodes[0].format
            };
          }
        } catch (nativeError) {
          console.log("Native BarcodeDetector failed:", nativeError);
        }
      }

      // Method 5: Final fallback - convert to grayscale and try ZXing again
      // This can help with certain problematic barcodes
      try {
        console.log("Trying ZXing with grayscale conversion...");
        
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        // Create canvas and convert to grayscale
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Clean up the object URL
        URL.revokeObjectURL(img.src);
        
        // Apply grayscale filter
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg; // red
          data[i + 1] = avg; // green
          data[i + 2] = avg; // blue
        }
        ctx.putImageData(imageData, 0, 0);
        
        // Convert back to a data URL and try ZXing again
        const grayscaleUrl = canvas.toDataURL('image/png');
        
        const codeReader = new BrowserMultiFormatReader();
        const result = await codeReader.decodeFromImageUrl(grayscaleUrl);
        
        if (result?.getText()) {
          console.log("ZXing grayscale scan success:", result.getText());
          return {
            text: result.getText(),
            format: result.getBarcodeFormat()?.toString() || 'unknown'
          };
        }
      } catch (grayscaleError) {
        console.log("Grayscale conversion scan failed:", grayscaleError);
      }

      // If all methods fail, throw error
      throw new Error("No barcode detected in the image after trying multiple methods");
    } catch (error) {
      console.error("All barcode scanning methods failed:", error);
      throw error;
    }
  };

  // Handle file upload from integrated component
  const handleFileUploadIntegrated = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setFileProcessing(true);
      
      if (scanning) {
        await stopScanning(); // Stop camera if it's running
      }
      
      const result = await scanBarcodeFromFile(file);
      if (result && handleScanResult) {
        handleScanResult(result.text, result.format);
      }
    } catch (err) {
      setError("Could not detect any barcode in the image. Please try with a clearer image.");
      console.error("File scanning error:", err);
    } finally {
      setFileProcessing(false);
      // Reset the input so the same file can be selected again
      if (e.target) e.target.value = "";
    }
  };

  // Handle file upload from main popup interface
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProcessingImage(true);
      setScanError(null);
      setScannerActive(false);
      setUploadedImage(URL.createObjectURL(file));

      const result = await scanBarcodeFromFile(file);
      if (result) {
        handleScanResult(result.text, result.format);
      }
    } catch (err) {
      console.error("Error processing image:", err);
      setScanError("Couldn't read barcode from image. Please try another image with clearer barcode.");
    } finally {
      setProcessingImage(false);
    }
  };

  // Switch camera
  const handleCameraChange = (e) => {
    const newCameraId = e.target.value;
    setSelectedCamera(newCameraId);
    
    if (scanning && scannerInstance) {
      scannerInstance.stop()
        .then(() => {
          setScanning(false);
          setTimeout(() => startScanning(), 500);
        })
        .catch(console.error);
    }
  };

  // Handle mobile camera capture
  const handleMobileCapture = () => {
    if (isMobile && fileInputRef.current) {
      if (!secureContext) {
        // On mobile with HTTP, set capture attribute to use device camera directly
        fileInputRef.current.setAttribute("capture", "environment");
      }
    }
  };
  
  
  // UI component that combines everything
  return (
    <div className="fixed inset-0 flex justify-center items-center backdrop-blur-sm bg-black/30 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-[450px] h-auto text-center relative">
        <button 
          className="absolute top-4 right-4 text-black text-xl flex items-center" 
          onClick={onClose}
        >
          &#8592; Cancel
        </button>

        <h2 className="text-xl font-semibold mt-2 mb-4">Scan Barcode</h2>

        {/* Mobile insecure context warning */}
        {isMobile && !secureContext && (
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
            <p className="font-medium">Camera access unavailable</p>
            <p className="text-sm mt-1">For security reasons, camera access requires HTTPS on mobile devices.</p>
            <p className="text-sm mt-1">You can take a photo of the barcode using your device camera instead.</p>
          </div>
        )}
        
        {/* Error Messages */}
        {(error || scanError) && (
          <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg mb-4">
            <p className="font-bold mb-1">Error:</p>
            <p>{error || scanError}</p>
            {cameraPermission === "denied" && !isMobile && (
              <button 
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                onClick={() => window.location.reload()}
              >
                Retry Camera Access
              </button>
            )}
          </div>
        )}
        
        {cameraPermission === "pending" && !isMobile && (
          <div className="text-blue-500 p-4 bg-blue-50 rounded-lg mb-4">
            Requesting camera access...
          </div>
        )}

        {/* Main Scanning UI */}
        {uploadedImage ? (
          <div className="rounded-lg w-full mx-auto overflow-hidden">
            <img 
              src={uploadedImage} 
              alt="Uploaded" 
              className="w-full h-[300px] object-contain" 
            />
            <p className="mt-2 text-sm text-gray-600">
              {processingImage ? "Scanning barcode from image..." : "Image uploaded"}
            </p>
            {scanError && (
              <p className="mt-1 text-sm text-red-500">{scanError}</p>
            )}
            {!processingImage && (
              <div className="mt-2">
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setScanError(null);
                    setScannerActive(true);
                  }}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Switch to camera
                </button>
              </div>
            )}
          </div>
        ) : imagePreview ? (
          <div className="space-y-4">
            <div className="relative w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={imagePreview} 
                alt="Barcode preview" 
                className="w-full h-full object-contain"
              />
              {fileProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white font-medium">Processing image...</div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setImagePreview(null);
                if (cameraPermission === "granted" && (!isMobile || secureContext)) {
                  startScanning();
                }
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {cameraPermission === "granted" && (!isMobile || secureContext) 
                ? "Back to Camera" 
                : "Upload Another Image"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cameraPermission === "granted" && (!isMobile || secureContext) && (
              <>
                {cameras.length > 1 && (
                  <div className="mb-2">
                    <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Camera
                    </label>
                    <select 
                      id="camera-select"
                      value={selectedCamera}
                      onChange={handleCameraChange}
                      disabled={scanning}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {cameras.map(camera => (
                        <option key={camera.id} value={camera.id}>
                          {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div 
                  id="scanner" 
                  ref={scannerRef}
                  className="w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden"
                ></div>
                
                <div className="flex justify-center space-x-4">
                  {!scanning ? (
                    <button
                      onClick={startScanning}
                      disabled={!selectedCamera}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Start Scanning
                    </button>
                  ) : (
                    <button
                      onClick={stopScanning}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                    >
                      Stop Scanning
                    </button>
                  )}
                </div>
                
                <p className="text-center text-gray-500 text-sm">
                  {scanning 
                    ? "Scanner active. Position a barcode or QR code in the view." 
                    : "Click Start Scanning to begin"}
                </p>
              </>
            )}
          </div>
        )}

        {/* Take Photo button */}
        <button 
          onClick={() => {
            onClose();
            onPhotoClick();
          }}
          className="w-full max-w-[300px] bg-orange-500 text-white font-semibold py-3 rounded-full mt-4 mx-auto hover:bg-orange-600"
        >
          Take Photo
        </button>
        
        {/* Upload Image button */}
        <label className="block w-full max-w-[300px] mx-auto">
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={processingImage}
            onClick={handleMobileCapture}
          />
          <span className={`w-full bg-blue-600 text-white font-semibold py-3 rounded-full mt-4 mx-auto hover:bg-blue-700 block cursor-pointer ${processingImage ? 'opacity-50' : ''}`}>
            {processingImage ? "Scanning..." : "Upload Image"}
          </span>
        </label>

        <p className="text-gray-500 text-sm mt-6">
          Make sure the barcode is clear and well-lit
        </p>
        
        {/* Mobile tips */}
        {isMobile && (
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>Tips for better barcode scanning:</p>
            <ul className="list-disc pl-5">
              <li>Ensure good lighting</li>
              <li>Hold the camera steady</li>
              <li>Make sure the barcode is clearly visible and not blurry</li>
            </ul>
          </div>
        )}
        
        {/* Hidden divs for scanning */}
        <div id="file-scanner" style={{ display: 'none' }}></div>
      </div>
    </div>
  );
}