"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, Camera, RefreshCw, AlertTriangle, Loader, AlertCircle, CheckCircle, ChevronDown, Info } from "lucide-react";
import ConfirmReportPopup from "../popups/ConfirmReportPopup";
import { useRouter } from "next/navigation";

export default function ReportIssueFormTechnician({ 
  onScanClick, 
  onPhotoClick, 
  isMobile,
  scannedBarcode = '',
  scanFormat = '',
  attachedFiles = [],
  onResetBarcode
}) {
  const router = useRouter();
  const [locationId, setLocationId] = useState("");
  const [description, setDescription] = useState("");
  const [equipment, setEquipment] = useState("");
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [equipmentList, setEquipmentList] = useState([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [fileList, setFileList] = useState([...attachedFiles]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [scanDebugInfo, setScanDebugInfo] = useState(null);
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // New state for barcode not found alert
  const [barcodeNotFound, setBarcodeNotFound] = useState({
    show: false,
    barcode: '',
    format: ''
  });
  
  // Priority state and fetching priorities from API
  const [priority, setPriority] = useState("MEDIUM"); 
  const [priorities, setPriorities] = useState(["LOW", "MEDIUM", "HIGH"]);
  
  // Refs for clickaway handling
  const locationDropdownRef = useRef(null);
  const equipmentDropdownRef = useRef(null);
  // Add a ref to track processed barcodes - IMPORTANT FIX
  const processedBarcodeRef = useRef('');
  
  // Update fileList when attachedFiles prop changes - FIXED
  useEffect(() => {
    if (JSON.stringify(attachedFiles) !== JSON.stringify(fileList)) {
      setFileList([...attachedFiles]);
    }
  }, [attachedFiles, fileList]);
  
  // Debug logging for scanned barcode - FIXED to prevent infinite loop
  useEffect(() => {
    // Only process if the barcode is new
    if (scannedBarcode && scannedBarcode !== processedBarcodeRef.current) {
      console.log("Received scanned barcode:", scannedBarcode);
      console.log("Scan format:", scanFormat);
      setScanDebugInfo({
        barcode: scannedBarcode,
        format: scanFormat,
        time: new Date().toISOString()
      });
    }
  }, [scannedBarcode, scanFormat]);
  
  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };
  
  // Handle barcode scanning - FIXED INFINITE LOOP ISSUE
  useEffect(() => {
    // Skip empty barcodes or already processed barcodes
    if (!scannedBarcode || typeof scannedBarcode !== "string" || 
        scannedBarcode === processedBarcodeRef.current) {
      return;
    }
    
    // Update our reference to prevent reprocessing the same barcode
    processedBarcodeRef.current = scannedBarcode;
    
    console.log("Processing barcode:", scannedBarcode);
    
    // First ensure we have a location
    if (!locationId) {
      showToast("Please select a location before scanning equipment", "warning");
      return;
    }
    
    if (!equipmentList || equipmentList.length === 0) {
      showToast("No equipment found for this location", "warning");
      return;
    }
    
    // Normalize the barcode for better matching
    const normalizedBarcode = scannedBarcode.toLowerCase().trim();
    console.log("Normalized barcode:", normalizedBarcode);
    
    // Try more flexible matching approaches
    let matchingEquipment = null;
    let matchMethod = '';
    
    // 1. First try exact match
    matchingEquipment = equipmentList.find(eq => 
      eq.inventoryCode && eq.inventoryCode.toLowerCase() === normalizedBarcode
    );
    if (matchingEquipment) matchMethod = 'exact match';
    
    // 2. Then try contains
    if (!matchingEquipment) {
      matchingEquipment = equipmentList.find(eq => 
        eq.inventoryCode && 
        (eq.inventoryCode.toLowerCase().includes(normalizedBarcode) || 
         normalizedBarcode.includes(eq.inventoryCode.toLowerCase()))
      );
      if (matchingEquipment) matchMethod = 'partial match';
    }
    
    // 3. Try removing common prefixes/suffixes that might be in database but not scanned
    if (!matchingEquipment) {
      // Try matching without common prefixes like "EQ-", "INV-", etc.
      const simplifiedBarcode = normalizedBarcode.replace(/^(eq|inv|item|asset|code|id)[-_]?/i, '');
      matchingEquipment = equipmentList.find(eq => {
        if (!eq.inventoryCode) return false;
        const simplifiedEquipCode = eq.inventoryCode.toLowerCase().replace(/^(eq|inv|item|asset|code|id)[-_]?/i, '');
        return simplifiedEquipCode === simplifiedBarcode;
      });
      if (matchingEquipment) matchMethod = 'simplified match';
    }
    
    // 4. Try numerical part only (sometimes only numbers are scanned)
    if (!matchingEquipment) {
      // Extract numbers only from barcode
      const numbersOnly = normalizedBarcode.replace(/\D/g, '');
      if (numbersOnly.length > 0) {
        matchingEquipment = equipmentList.find(eq => {
          if (!eq.inventoryCode) return false;
          const equipCodeNumbers = eq.inventoryCode.replace(/\D/g, '');
          return equipCodeNumbers === numbersOnly;
        });
        if (matchingEquipment) matchMethod = 'numbers only match';
      }
    }
    
    if (matchingEquipment) {
      // Found a match - batch state updates to reduce renders
      console.log(`Found matching equipment by ${matchMethod}:`, matchingEquipment);
      
      setEquipment(`${matchingEquipment.inventoryCode} - ${matchingEquipment.type?.name || "No name"}`);
      setEquipmentId(matchingEquipment.id);
      setEquipmentSearch("");
      setBarcodeNotFound({ show: false, barcode: '', format: '' });
      
      // Show toast in next tick to prevent render loop
      setTimeout(() => {
        showToast(`Found equipment: ${matchingEquipment.inventoryCode}`, "success");
      }, 0);
      
    } else {
      // No match found - batch state updates to reduce renders
      console.log("No matching equipment found");
      
      setEquipmentSearch(scannedBarcode);
      setBarcodeNotFound({
        show: true,
        barcode: scannedBarcode,
        format: scanFormat
      });
      setShowEquipmentDropdown(true);
    }
    
  // Only add stable dependencies to prevent loops
  }, [scannedBarcode, equipmentList, locationId]);

  // Fetch locations - FIXED to prevent duplicate calls
  useEffect(() => {
    async function fetchLocations() {
      // Skip if locations are already loaded or loading is in progress
      if (!isLoading || locations.length > 0) return;
      
      try {
        const response = await fetch("http://localhost:3001/api/location", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const locationsArray = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : [];
        setLocations(locationsArray);
      } catch (err) {
        setError("Failed to load locations");
        
        // For development, provide mock data
        if (process.env.NODE_ENV === 'development') {
          setLocations([
            { id: 1, name: 'Building A' },
            { id: 2, name: 'Building B' },
            { id: 3, name: 'Cafeteria' },
            { id: 4, name: 'Library' },
            { id: 5, name: 'Classroom 101' },
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchLocations();
  }, [isLoading, locations.length]); // Minimal dependencies

  // Fetch equipment by location - FIXED to prevent duplicate calls
  useEffect(() => {
    // Skip if no location selected
    if (!locationId) {
      setEquipmentList([]);
      setEquipment("");
      setEquipmentId("");
      setEquipmentSearch("");
      setBarcodeNotFound({ show: false, barcode: '', format: '' });
      return;
    }
    
    // Skip if already loading to prevent duplicate calls
    if (isLoadingEquipment) return;
    
    async function fetchEquipmentByLocation() {
      try {
        setIsLoadingEquipment(true);
        
        // Reset equipment-related state
        setEquipment("");
        setEquipmentId("");
        setEquipmentSearch("");
        setBarcodeNotFound({ show: false, barcode: '', format: '' });
        
        // Reset the barcode processing tracker when location changes
        processedBarcodeRef.current = '';
        
        if (!locationId) {
          console.log("No location ID provided");
          setEquipmentList([]);
          return;
        }
        
        console.log(`Fetching equipment for location ID: ${locationId}`);
        
        // Use query parameter approach first
        const response = await fetch(
          `http://localhost:3001/api/equipment?locationId=${locationId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
    
        // If first attempt fails, try a different endpoint pattern
        if (!response.ok) {
          console.log(`First endpoint attempt failed with status: ${response.status}, trying alternative...`);
          
          // Try the location endpoint directly
          const locationResponse = await fetch(
            `http://localhost:3001/api/location/${locationId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
            }
          );
          
          if (!locationResponse.ok) {
            throw new Error(`HTTP error! status: ${locationResponse.status}`);
          }
          
          const locationData = await locationResponse.json();
          
          // Extract equipment if it's nested in the location data
          let equipmentArray = [];
          
          if (locationData && locationData.equipment) {
            equipmentArray = Array.isArray(locationData.equipment) 
              ? locationData.equipment 
              : [];
          } else if (locationData && locationData.data && locationData.data.equipment) {
            equipmentArray = Array.isArray(locationData.data.equipment) 
              ? locationData.data.equipment 
              : [];
          }
          
          console.log("Fetched equipment from location endpoint:", equipmentArray);
          setEquipmentList(equipmentArray);
          return;
        }
    
        const result = await response.json();
        
        // Handle the API response correctly - get the data property if it exists
        const equipmentArray = result.data || result;
        
        console.log("Fetched equipment:", equipmentArray);
        setEquipmentList(Array.isArray(equipmentArray) ? equipmentArray : []);
        
      } catch (err) {
        console.error("Error fetching equipment:", err);
        setEquipmentList([]);
        
        // For development, provide mock data
        if (process.env.NODE_ENV === 'development') {
          console.log("Using mock equipment data for development");
          const mockEquipment = [
            { id: 1, inventoryCode: 'EQ001', type: { id: 1, name: 'Projector' } },
            { id: 2, inventoryCode: 'EQ002', type: { id: 2, name: 'Computer' } },
            { id: 3, inventoryCode: 'EQ003', type: { id: 3, name: 'Printer' } },
          ];
          
          setEquipmentList(mockEquipment);
        }
      } finally {
        setIsLoadingEquipment(false);
      }
    }

    fetchEquipmentByLocation();
  }, [locationId]); // Only depend on locationId

  // Fetch priorities from intervention API - FIXED to prevent duplicate calls
  useEffect(() => {
    // Skip if we already have priorities beyond the defaults
    if (priorities.length > 3) return;
    
    async function fetchPriorities() {
      try {
        const response = await fetch("http://localhost:3001/api/intervention", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch priorities");
        const data = await response.json();
        // Extract unique priorities
        const interventions = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : [];
          
        const defaultPriorities = ["LOW", "MEDIUM", "HIGH"];
        const uniquePriorities = [
          ...new Set([
            ...defaultPriorities,
            ...interventions
              .map((item) => item.priority)
              .filter((p) => typeof p === "string" && p.length > 0)
          ])
        ];
        
        if (uniquePriorities.length > 0) setPriorities(uniquePriorities);
      } catch (err) {
        // Keep default priorities if fetch fails
      }
    }
    fetchPriorities();
  }, [priorities.length]); // Only depend on priorities.length

  // Handle clicking outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showEquipmentDropdown &&
        !event.target.closest(".equipment-dropdown-container")
      ) {
        setShowEquipmentDropdown(false);
      }
      
      if (
        showLocationDropdown &&
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setShowLocationDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEquipmentDropdown, showLocationDropdown]);

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Form validation
    if (!locationId) {
      setError("Please select a location");
      return;
    }
    
    if (!description) {
      setError("Please provide a description");
      return;
    }
    
    setError(null);
    setShowConfirmPopup(true);
  };

  // Complete form reset function - FIXED to avoid reload
  const resetForm = () => {
    // Reset all form state
    setDescription("");
    setPriority("MEDIUM");
    setEquipment("");
    setEquipmentId("");
    setEquipmentSearch("");
    setFileList([]);
    setScanDebugInfo(null);
    setBarcodeNotFound({ show: false, barcode: '', format: '' });
    processedBarcodeRef.current = ''; // Reset processed barcode ref
    
    // Reset parent component barcode state
    if (onResetBarcode) {
      onResetBarcode();
    }
    
    // Reset location last to avoid equipment fetch issues
    setLocationId("");
    setSelectedLocationName("");
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setLocationId(location.id);
    setSelectedLocationName(location.name);
    setShowLocationDropdown(false);
    
    // Reset barcode processing when location changes
    processedBarcodeRef.current = '';
  };

  // API submission
  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      console.log("Submitting with equipment ID:", equipmentId);
      
      const issueData = {
        locationId: parseInt(locationId),
        description,
        equipmentId: equipmentId ? parseInt(equipmentId) : null,
        priority: priority || "LOW",
      };
      
      console.log("Sending payload:", issueData);

      const response = await fetch("http://localhost:3001/api/intervention", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Close popup
      setShowConfirmPopup(false);
      
      // Show success notification
      showToast("Issue reported successfully!", "success");
      
      // Reset the form with a slight delay
      setTimeout(() => {
        resetForm();
      }, 1500);
      
    } catch (error) {
      // Handle errors
      setShowConfirmPopup(false);
      
      // For development, simulate success
      if (process.env.NODE_ENV === 'development') {
        // Show success notification
        showToast("Issue reported successfully! (Development mode)", "success");
        
        // Reset the form
        setTimeout(() => {
          resetForm();
        }, 1500);
      } else {
        showToast("Failed to report issue: " + error.message, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (index) => {
    setFileList(files => files.filter((_, i) => i !== index));
  };

  // Modified clear scanned barcode function to force a complete page reload
const clearScannedBarcode = () => {
  // Show a loading toast
  showToast('Reloading page...', "info");
  
  // Clear equipment selection
  setEquipment('');
  setEquipmentId('');
  setEquipmentSearch('');
  setScanDebugInfo(null);
  setBarcodeNotFound({ show: false, barcode: '', format: '' });
  processedBarcodeRef.current = ''; // Reset the processed barcode ref
  
  // Reset barcode in parent component
  if (onResetBarcode && typeof onResetBarcode === 'function') {
    onResetBarcode();
  }
  
  // Force a complete page reload after a short delay to allow toast to be visible
  setTimeout(() => {
    window.location.reload(true); // true parameter forces reload from server, not cache
  }, 500);
};
  // Handle when user wants to proceed without equipment
  const handleProceedWithoutEquipment = () => {
    setEquipment('');
    setEquipmentId('');
    setBarcodeNotFound({ show: false, barcode: '', format: '' });
    showToast('Proceeding without equipment assignment', 'info');
  };

  // Filter equipment for search
  const filteredEquipment = equipmentList.filter((equip) => {
    if (!equipmentSearch) return true;
    return (
      equip?.inventoryCode?.toLowerCase()?.includes(equipmentSearch.toLowerCase()) ||
      equip?.type?.name?.toLowerCase()?.includes(equipmentSearch.toLowerCase())
    );
  });

  return (
    <div className="bg-white px-4 sm:px-6 md:px-8 lg:px-40 py-6 sm:py-8 md:py-10 shadow-xl rounded-lg w-full max-w-7xl mx-auto font-light font-outfit">
      {/* Toast notification with improved mobile positioning */}
      {toast.show && (
        <div className={`fixed top-16 sm:top-4 right-4 left-4 sm:left-auto z-[9999] py-2 px-4 rounded-md shadow-lg flex items-center ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
          toast.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
          {toast.type === 'warning' && <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />}
          {toast.type === 'info' && <Info className="h-5 w-5 mr-2 flex-shrink-0" />}
          <span className="text-sm">{toast.message}</span>
          <button 
            onClick={() => setToast({...toast, show: false})} 
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-black font-oxanium">Report an Issue</h1>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Location Field */}
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Location<span className="text-red-500">*</span>
          </label>
          <div className="relative" ref={locationDropdownRef}>
            <div 
              className="flex items-center justify-between w-full p-2 border-2 border-black rounded-md text-sm cursor-pointer"
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            >
              <span>{selectedLocationName || "Select Location"}</span>
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
            
            {showLocationDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-300 overflow-auto">
                {isLoading ? (
                  <div className="py-4 px-3 text-center">
                    <Loader className="h-5 w-5 mx-auto animate-spin mb-1" />
                    <p className="text-sm text-gray-500">Loading locations...</p>
                  </div>
                ) : locations.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-gray-500">No locations found</div>
                ) : (
                  locations.map((location) => (
                    <div
                      key={location.id}
                      className="cursor-pointer hover:bg-gray-100 py-2 px-3 text-sm"
                      onClick={() => handleLocationSelect(location)}
                    >
                      {location.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Description<span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full border-2 border-black rounded-md p-2 h-20 sm:h-28 text-sm"
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Equipment Field */}
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Assign Equipment
          </label>
          <div className="relative equipment-dropdown-container" ref={equipmentDropdownRef}>
            <div className="flex flex-col sm:flex-row gap-2">
              <div 
                className="flex-1 flex items-center justify-between border-2 border-black rounded-md p-2 text-sm cursor-pointer"
                onClick={() => {
                  if (locationId) {
                    setShowEquipmentDropdown(!showEquipmentDropdown);
                  } else {
                    showToast("Please select a location first", "warning");
                  }
                }}
              >
                <span>{equipment || "Select Equipment"}</span>
                {isLoadingEquipment ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
              
              <div className="flex gap-2">
                {/* Reset button shown when there's a scanned barcode */}
                {scannedBarcode && onResetBarcode && (
                  <button
                    type="button"
                    onClick={clearScannedBarcode}
                    title="Reset scanned barcode and refresh page"
                    className="bg-gray-200 text-gray-700 rounded-md px-3 py-2 hover:bg-gray-300"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    if (!locationId) {
                      showToast("Please select a location first", "warning");
                      return;
                    }
                    
                    // If there's already a barcode, reset it first
                    if (scannedBarcode && onResetBarcode) {
                      onResetBarcode();
                      setScanDebugInfo(null);
                      setBarcodeNotFound({ show: false, barcode: '', format: '' });
                      processedBarcodeRef.current = ''; // Reset the ref
                    }
                    
                    // Then trigger scan
                    onScanClick();
                  }}
                  className="bg-[#EA8B00] text-white rounded-md px-4 py-2 text-sm"
                >
                  Scan Barcode
                </button>
              </div>
            </div>
            
            {showEquipmentDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-300 overflow-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={equipmentSearch}
                      onChange={(e) => setEquipmentSearch(e.target.value)}
                      placeholder="Search equipment..."
                      className="w-full py-1.5 pl-8 pr-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                
                {isLoadingEquipment ? (
                  <div className="py-4 px-3 text-center">
                    <Loader className="h-5 w-5 mx-auto animate-spin mb-1" />
                    <p className="text-sm text-gray-500">Loading equipment...</p>
                  </div>
                ) : !locationId ? (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    Please select a location first
                  </div>
                ) : filteredEquipment.length === 0 ? (
                  <div className="py-2 px-3 text-sm text-gray-500">
                    No equipment found in this location
                  </div>
                ) : (
                  filteredEquipment.map((equip) => (
                    <div
                      key={equip.id}
                      className="cursor-pointer hover:bg-gray-100 py-2 px-3 text-sm"
                      onClick={() => {
                        setEquipment(`${equip.inventoryCode} - ${equip.type?.name || "No name"}`);
                        setEquipmentId(equip.id);
                        setShowEquipmentDropdown(false);
                        setEquipmentSearch("");
                        setBarcodeNotFound({ show: false, barcode: '', format: '' });
                        
                        // Clear the scanned barcode if manually selecting
                        if (scannedBarcode && onResetBarcode) {
                          onResetBarcode();
                          processedBarcodeRef.current = ''; // Reset the ref
                        }
                      }}
                    >
                      <div className="font-medium">{equip.inventoryCode || `Equipment #${equip.id}`}</div>
                      <div className="text-xs text-gray-500">
                        {equip.type?.name || 'Unknown'} • ID: {equip.inventoryCode || equip.id}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Equipment Not Found Alert - NEW */}
          {barcodeNotFound.show && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-md p-3 shadow-sm">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-800 text-sm">Equipment Not Found</h3>
                  <p className="text-amber-700 text-xs mt-1">
                    The scanned barcode <span className="font-mono bg-amber-100 px-1 rounded">{barcodeNotFound.barcode}</span> ({barcodeNotFound.format || 'Unknown format'}) 
                    doesn't match any equipment in this location.
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEquipmentDropdown(true)}
                      className="text-xs px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded border border-amber-200 transition-colors"
                    >
                      Select from List
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedWithoutEquipment}
                      className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-300 transition-colors"
                    >
                      Continue Without Equipment
                    </button>
                    <button
                      type="button"
                      onClick={clearScannedBarcode}
                      className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 text-blue-600 rounded border border-blue-200 transition-colors"
                    >
                      Reset & Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Show barcode info when available (but not when not found alert is showing) */}
          {scannedBarcode && scanFormat && typeof scannedBarcode === "string" && !barcodeNotFound.show && (
            <div className="mt-2 text-xs bg-blue-50 p-2 rounded flex items-center justify-between">
              <span className="text-blue-700">
                Last scanned: {scannedBarcode} (Format: {scanFormat})
              </span>
              {onResetBarcode && (
                <button 
                  onClick={clearScannedBarcode} 
                  className="text-blue-700 hover:text-blue-900 ml-2 font-medium flex items-center"
                >
                  <RefreshCw size={12} className="mr-1" /> Reset & Refresh
                </button>
              )}
            </div>
          )}

          {/* Equipment ID warning - only show this when we have a barcode but no equipment ID 
              and the not found alert is not already showing */}
          {scannedBarcode && !equipmentId && !barcodeNotFound.show && (
            <div className="mt-2 text-xs bg-yellow-50 p-2 rounded flex items-center">
              <AlertTriangle size={14} className="text-yellow-600 mr-1" />
              <span className="text-yellow-800">
                Warning: No equipment ID was assigned for this barcode. The issue will be reported without equipment.
              </span>
            </div>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Priority
          </label>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {priorities.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-3 sm:px-4 py-1.5 text-sm rounded-full font-medium border ${
                  priority === p
                    ? p === "LOW"
                      ? "bg-blue-100 text-blue-600 border-blue-300"
                      : p === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                      : "bg-red-100 text-red-600 border-red-300"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Pictures */}
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Add Pictures <span className="text-gray-500">(Optional)</span>
          </label>
          
          <button
            onClick={onPhotoClick}
            type="button"
            className="flex items-center justify-center gap-2 bg-[#757575] text-white rounded-md px-4 py-2 text-sm w-full"
          >
            <Camera size={20} />
            Add Pictures
          </button>
          
          {fileList.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-700 mb-1">Attached Files:</div>
              <div className="border border-gray-200 rounded-md overflow-hidden">
                {fileList.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-200 last:border-b-0">
                    <span className="text-sm text-gray-600">{file}</span>
                    <button 
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && scanDebugInfo && (
          <div className="mb-4 p-2 bg-gray-50 rounded-md text-xs text-gray-600">
            <details>
              <summary className="cursor-pointer">Scan Debug Info</summary>
              <pre className="mt-1 whitespace-pre-wrap">
                Barcode: {scanDebugInfo.barcode}
                Format: {scanDebugInfo.format}
                Time: {scanDebugInfo.time}
                Equipment ID: {equipmentId || 'not set'}
                Processed Ref: {processedBarcodeRef.current}
              </pre>
            </details>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
          <Link href="../../technician/workOrders" className="w-full sm:w-auto"> 
            <button
              type="button"
              className="w-full sm:w-auto px-10 sm:px-14 py-2.5 sm:py-1 rounded-xl border-2 border-black bg-white text-black mb-3 sm:mb-0"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            className="w-full sm:w-auto px-10 sm:px-24 py-2.5 sm:py-1 rounded-xl bg-[#0060B4] text-white disabled:bg-blue-300"
            disabled={isSubmitting || !locationId || !description}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </span>
            ) : "Done"}
          </button>
        </div>
      </form>

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <ConfirmReportPopup
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowConfirmPopup(false)}
        />
      )}
    </div>
  );
}