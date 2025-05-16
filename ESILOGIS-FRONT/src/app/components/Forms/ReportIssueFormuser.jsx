"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, Plus, Camera } from "lucide-react";
import ConfirmReportPopup from "../popups/ConfirmReportPopup";

export default function ReportIssueFormUser({ 
  onScanClick, 
  onPhotoClick, 
  isMobile,
  scannedBarcode = '',
  scanFormat = '',
  attachedFiles = []
}) {
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
  const searchInputRef = useRef(null);
  const [fileList, setFileList] = useState([...attachedFiles]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  // Priority state and fetching priorities from API
  const [priority, setPriority] = useState(""); // selected priority
  const [priorities, setPriorities] = useState(["LOW", "MEDIUM", "HIGH"]); // default fallback

  // Update when a barcode is scanned
  useEffect(() => {
    if (scannedBarcode && typeof scannedBarcode === "string") {
      console.log("Handling scanned barcode in form:", scannedBarcode);
      
      // Check if the scanned barcode matches any equipment in the list
      const matchingEquipment = equipmentList.find(
        eq => 
          eq.inventoryCode === scannedBarcode ||
          (typeof eq.inventoryCode === "string" && eq.inventoryCode.toLowerCase().includes(scannedBarcode.toLowerCase())) ||
          (typeof eq.inventoryCode === "string" && scannedBarcode.toLowerCase().includes(eq.inventoryCode.toLowerCase()))
      );
      
      if (matchingEquipment) {
        // If there's a match, select that equipment
        setEquipment(`${matchingEquipment.inventoryCode} - ${matchingEquipment.type?.name || "No name"}`);
        setEquipmentId(matchingEquipment.id);
        setEquipmentSearch("");
        // Show success message
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
        notification.textContent = `Found equipment: ${matchingEquipment.inventoryCode}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      } else {
        // If no match, just set the code as search term
        setEquipmentSearch(scannedBarcode);
        
        // Show message that no equipment was found
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50';
        notification.textContent = `No equipment found with code: ${scannedBarcode}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      }
    }
  }, [scannedBarcode, equipmentList]);

  // Update attachedFiles when prop changes
  useEffect(() => {
    setFileList([...attachedFiles]);
  }, [attachedFiles]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        setIsLoading(true);
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
        setLocations([]);
        console.error("Error fetching locations:", err);
        
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
  }, []);

  useEffect(() => {
    async function fetchEquipmentByLocation() {
      setEquipment("");
      setEquipmentId("");
      setEquipmentSearch("");

      if (!locationId) {
        setEquipmentList([]);
        return;
      }

      try {
        setIsLoadingEquipment(true);
        const response = await fetch(
          `http://localhost:3001/api/equipment/location/${locationId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const equipmentArray = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
          ? result.data
          : [];

        setEquipmentList(equipmentArray);
      } catch (err) {
        console.error("Error fetching equipment:", err);
        setEquipmentList([]);
        
        // For development, provide mock data
        if (process.env.NODE_ENV === 'development') {
          setEquipmentList([
            { id: 1, inventoryCode: 'EQ001', type: { id: 1, name: 'Projector' } },
            { id: 2, inventoryCode: 'EQ002', type: { id: 2, name: 'Computer' } },
            { id: 3, inventoryCode: 'EQ003', type: { id: 3, name: 'Printer' } },
            { id: 4, inventoryCode: '4901234567894', type: { id: 4, name: 'Scanner' } },
          ]);
        }
      } finally {
        setIsLoadingEquipment(false);
      }
    }

    fetchEquipmentByLocation();
  }, [locationId]);

  // Fetch priorities from intervention API
  useEffect(() => {
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
        
        // data should be an array of interventions, extract unique priorities
        const interventions = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : [];
          
        // Create a set with default priorities first, then add any from the API
        const defaultPriorities = ["LOW", "MEDIUM", "HIGH"];
        const uniquePriorities = [
          ...new Set([
            ...defaultPriorities,
            ...interventions
              .map((item) => item.priority)
              .filter((p) => typeof p === "string" && p.length > 0)
          ])
        ];
        
        setPriorities(uniquePriorities);
      } catch (err) {
        // fallback to default priorities
        setPriorities(["LOW", "MEDIUM", "HIGH"]);
      }
    }
    fetchPriorities();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showEquipmentDropdown &&
        !event.target.closest(".equipment-dropdown-container")
      ) {
        setShowEquipmentDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEquipmentDropdown]);

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

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      const issueData = {
        locationId: parseInt(locationId),
        description,
        equipmentId: equipmentId ? parseInt(equipmentId) : undefined,
        priority,
      };

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

      // Reset form
      setDescription("");
      setLocationId("");
      setEquipment("");
      setEquipmentId("");
      setEquipmentSearch("");
      setPriority("");
      setFileList([]);
      setShowConfirmPopup(false);
      alert("Issue reported successfully!");
    } catch (error) {
      console.error("Error submitting issue:", error);
      
      // For development, simulate success
      if (process.env.NODE_ENV === 'development') {
        setDescription("");
        setLocationId("");
        setEquipment("");
        setEquipmentId("");
        setEquipmentSearch("");
        setPriority("");
        setFileList([]);
        setShowConfirmPopup(false);
        alert("Issue reported successfully! (Development mode)");
      } else {
        alert("Failed to report issue: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (index) => {
    setFileList(files => files.filter((_, i) => i !== index));
  };

  const filteredEquipment = equipmentList.filter((equip) => {
    if (!equipmentSearch) return true;
    return (
      equip?.inventoryCode?.toLowerCase()?.includes(equipmentSearch.toLowerCase()) ||
      equip?.type?.name?.toLowerCase()?.includes(equipmentSearch.toLowerCase())
    );
  });

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-6xl mx-auto bg-white shadow-lg ${
          isMobile ? 'p-5 rounded-lg' : 'rounded-[20px] p-10'
        } font-outfit mt-5`}
      >
        <h1 className={`${isMobile ? 'text-[20px]' : 'text-[26px]'} font-semibold mb-6`}>
          Report an Issue
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Location */}
        <div className="mb-6">
          <label className="block text-[14px] font-medium mb-2">
            Location<span className="text-red-500">*</span>
          </label>
          {isLoading ? (
            <p>Loading locations...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full h-[48px] pl-4 pr-10 border border-[#E5E7EB] rounded-[10px] appearance-none bg-white"
              required
            >
              <option value="">Select a location</option>
              {Array.isArray(locations) &&
                locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-[14px] font-medium mb-2">
            Description<span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-[100px] p-4 border border-[#E5E7EB] rounded-[10px] resize-none"
            placeholder="Describe the issue..."
            required
          />
        </div>

        {/* Equipment */}
        <div className="mb-4">
          <label className="block text-[14px] font-medium mb-2">
            Assign Equipment
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative equipment-dropdown-container">
              <input
                type="text"
                value={equipment}
                onClick={() => locationId ? setShowEquipmentDropdown(true) : alert("Please select a location first")}
                readOnly
                placeholder="Select equipment..."
                className="w-full h-[48px] pl-4 pr-10 border border-[#E5E7EB] rounded-[10px]"
              />
              {equipment && (
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEquipment("");
                    setEquipmentId("");
                  }}
                >
                  <X size={16} />
                </button>
              )}

              {showEquipmentDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-2 border-b border-[#E5E7EB]">
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search equipment..."
                        value={equipmentSearch}
                        onChange={(e) => setEquipmentSearch(e.target.value)}
                        className="w-full h-[40px] pl-8 pr-4 border border-[#E5E7EB] rounded-[8px]"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Search
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#98A2B3]"
                        size={20}
                      />
                    </div>
                  </div>

                  {isLoadingEquipment ? (
                    <div className="p-4 text-center text-[#475467]">Loading equipment...</div>
                  ) : filteredEquipment.length > 0 ? (
                    filteredEquipment.map((equip) => (
                      <div
                        key={equip.id}
                        className="p-3 hover:bg-[#F9FAFB] cursor-pointer text-[14px]"
                        onClick={() => {
                          setEquipment(`${equip.inventoryCode} - ${equip.type?.name || "No name"}`);
                          setEquipmentId(equip.id);
                          setShowEquipmentDropdown(false);
                          setEquipmentSearch("");
                        }}
                      >
                        <strong>{equip.inventoryCode}</strong> - {equip.type?.name || "No name"}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[#475467]">
                      No equipment found
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!locationId) {
                  alert("Please select a location first before scanning equipment");
                  return;
                }
                onScanClick();
              }}
              className="h-[48px] px-4 bg-[#EA8B00] text-white rounded-[10px] hover:bg-[#d97f00] whitespace-nowrap"
            >
              Scan Barcode
            </button>
          </div>
          {scannedBarcode && scanFormat && typeof scannedBarcode === "string" && (
            <div className="mt-2 text-xs bg-blue-50 p-2 rounded text-blue-700">
              Last scanned: {scannedBarcode} (Format: {scanFormat})
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="mb-6">
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

        {/* Pictures - MODIFIED HERE */}
        <div className="mb-6">
          <label className="block text-[14px] font-medium mb-2">
            Add Pictures <span className="text-[#475467]">(Optional)</span>
          </label>
          
          <button
            onClick={onPhotoClick}
            type="button"
            className="w-full h-[48px] flex items-center justify-center gap-2 bg-[#757575] text-white rounded-[10px] hover:bg-[#b8b6b5]"
          >
            <Camera size={20} />
            Add Pictures
          </button>
          
          {fileList.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700">Attached Files:</p>
              <ul className="text-xs text-gray-600 mt-1">
                {fileList.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-1.5 hover:bg-gray-50 rounded">
                    <span>{file}</span>
                    <button 
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex justify-end gap-3'} pt-6`}>
          <Link href="../../user/home" className={isMobile ? 'order-2' : ''}>
            <button
              type="button"
              className="w-full sm:w-auto h-[48px] px-6 border border-[#D0D5DD] text-[#344054] rounded-[10px] hover:bg-gray-50"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !locationId || !description}
            className={`w-full sm:w-auto h-[48px] px-6 bg-[#0060B4] text-white rounded-[10px] hover:bg-[#004d91] ${
              isMobile ? 'order-1' : ''
            } ${isSubmitting || !locationId || !description ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Done'}
          </button>
        </div>
      </form>

      {showConfirmPopup && (
        <ConfirmReportPopup
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowConfirmPopup(false)}
        />
      )}
    </>
  );
}