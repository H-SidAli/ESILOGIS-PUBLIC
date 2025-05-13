'use client';

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Loader, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
 

//Cancel
export default function EditEquipmentForm({ onAddFile }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const equipmentId = searchParams.get("id");

  // API data states
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState({
    initial: true,
    submit: false,
    types: true,
    locations: true
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    inventoryCode: "",
    typeId: null,
    typeName: "",
    category: "",
    locationId: null,
    locationName: "",
    status: "",
    acquisitionDate: "",
    commissionDate: "",
    attachedFiles: []
  });

  // Dropdown states
  const [showDropdowns, setShowDropdowns] = useState({
    type: false,
    location: false,
    status: false
  });

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const dropdownRefs = {
    type: useRef(null),
    location: useRef(null),
    status: useRef(null)
  };
  const formRef = useRef(null);

  // Status mapping functions
  const mapBackendToFrontendStatus = (backendStatus) => {
    const statusMap = {
      "IN_SERVICE": "In Service",
      "OUT_OF_SERVICE": "Out of Service",
      "UNDER_MAINTENANCE": "Under Maintenance",
      "RETIRED": "Retired"
    };
    return statusMap[backendStatus] || backendStatus;
  };

  const mapFrontendToBackendStatus = (frontendStatus) => {
    const statusMap = {
      "In Service": "IN_SERVICE",
      "Out of Service": "OUT_OF_SERVICE",
      "Under Maintenance": "UNDER_MAINTENANCE",
      "Retired": "RETIRED"
    };
    return statusMap[frontendStatus] || frontendStatus;
  };

  // Get status options
  const statusOptions = ["In Service", "Out of Service", "Under Maintenance", "Retired"];

  // Handle click outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      Object.entries(dropdownRefs).forEach(([key, ref]) => {
        if (ref.current && !ref.current.contains(event.target)) {
          setShowDropdowns(prev => ({ ...prev, [key]: false }));
        }
      });
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll to top on success or error
  useEffect(() => {
    if ((success || error) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [success, error]);

  // Fetch equipment data
  useEffect(() => {
    const fetchEquipmentData = async () => {
      if (!equipmentId) {
        setError("No equipment ID provided");
        setLoading(prev => ({ ...prev, initial: false }));
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/equipment/${equipmentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('Fetched equipment details:', responseData);
        
        // Check if response contains data property, otherwise use the whole response
        const equipmentData = responseData.data || responseData;
        
        if (!equipmentData) {
          throw new Error('No equipment data received from server');
        }
        
        // Format dates from ISO to YYYY-MM-DD for form inputs
        const acquisitionDate = equipmentData.acquisitionDate 
          ? new Date(equipmentData.acquisitionDate).toISOString().split('T')[0]
          : '';
        
        const commissionDate = equipmentData.commissionDate
          ? new Date(equipmentData.commissionDate).toISOString().split('T')[0]
          : '';
        
        setFormData({
          inventoryCode: equipmentData.inventoryCode || '',
          typeId: equipmentData.typeId || null,
          typeName: equipmentData.type?.name || '',
          category: equipmentData.type?.category || '',
          locationId: equipmentData.locationId || null,
          locationName: equipmentData.location?.name || '',
          status: mapBackendToFrontendStatus(equipmentData.status) || 'In Service',
          acquisitionDate: acquisitionDate,
          commissionDate: commissionDate,
          attachedFiles: equipmentData.attachedFiles || []
        });
      } catch (err) {
        console.error('Error fetching equipment data:', err);
        setError(err.message || 'Failed to load equipment data');
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    fetchEquipmentData();
  }, [equipmentId]);

  // Fetch equipment types
  useEffect(() => {
    const fetchEquipmentTypes = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/equipment-type', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fetched equipment types:', data);
        setEquipmentTypes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching equipment types:", error);
      } finally {
        setLoading(prev => ({ ...prev, types: false }));
      }
    };

    fetchEquipmentTypes();
  }, []);

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/location', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setLocations(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        console.error("Error fetching locations:", error);
        setError(error.message || 'Failed to load locations data');
      } finally {
        setLoading(prev => ({ ...prev, locations: false }));
      }
    };

    fetchLocations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle selecting a type from dropdown
  const handleSelectType = (type) => {
    setFormData(prev => ({
      ...prev,
      typeId: type.id,
      typeName: type.name,
      category: type.category
    }));
    setShowDropdowns(prev => ({ ...prev, type: false }));
  };

  // Handle selecting a location from dropdown
  const handleSelectLocation = (location) => {
    setFormData(prev => ({
      ...prev,
      locationId: location.id,
      locationName: location.name
    }));
    setShowDropdowns(prev => ({ ...prev, location: false }));
  };

  // Handle selecting a status from dropdown
  const handleSelectStatus = (status) => {
    setFormData(prev => ({ ...prev, status }));
    setShowDropdowns(prev => ({ ...prev, status: false }));
  };

  const toggleDropdown = (field) => {
    setShowDropdowns(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter((_, i) => i !== index)
    }));
  };

  const handleFileAdd = () => {
    onAddFile((file) => {
      setFormData(prev => ({
        ...prev,
        attachedFiles: [
          ...prev.attachedFiles,
          {
            name: file.name,
            date: new Date().toLocaleDateString('en-GB'),
            size: `${Math.round(file.size / 1024)}ko`
          }
        ]
      }));
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Service":
        return "bg-green-500";
      case "Out of Service":
        return "bg-red-500";
      case "Under Maintenance":
        return "bg-orange-500";
      case "Retired":
        return "bg-gray-500";
      default:
        return "bg-green-500";
    }
  };

  // Add a new equipment type
  const handleAddType = async (typeData) => {
    if (!typeData.name.trim() || !typeData.category.trim()) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/equipment-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: typeData.name,
          category: typeData.category
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const newType = await response.json();
      
      // Update equipment types list
      setEquipmentTypes(prev => [...prev, newType]);
      
      // Set as selected type
      setFormData(prev => ({
        ...prev,
        typeId: newType.id,
        typeName: newType.name,
        category: newType.category
      }));
    } catch (error) {
      console.error("Error adding new equipment type:", error);
    }
    
    setShowTypeModal(false);
  };

  // Add a new location
  const handleAddLocation = async (newLocationName) => {
    if (!newLocationName.trim()) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newLocationName })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const newLocation = await response.json();
      
      // Update locations list
      setLocations(prev => [...prev, newLocation]);
      
      // Set as selected location
      setFormData(prev => ({
        ...prev,
        locationId: newLocation.id,
        locationName: newLocation.name
      }));
      
    } catch (error) {
      console.error("Error adding new location:", error);
    }
    
    setShowLocationModal(false);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.typeId || !formData.locationId || !formData.inventoryCode || 
        !formData.acquisitionDate || !formData.commissionDate || !formData.status) {
      setError("Please fill out all required fields");
      return;
    }
    
    setLoading(prev => ({ ...prev, submit: true }));
    setError(null);
    setSuccess(false);
    
    try {
      // Format data for the backend API
      const formattedData = {
        typeId: formData.typeId,
        locationId: formData.locationId,
        inventoryCode: formData.inventoryCode,
        acquisitionDate: formData.acquisitionDate ? new Date(formData.acquisitionDate).toISOString() : null,
        commissionDate: formData.commissionDate ? new Date(formData.commissionDate).toISOString() : null,
        status: mapFrontendToBackendStatus(formData.status)
      };
      
      console.log('Updating equipment with data:', formattedData);
      
      const response = await fetch(`http://localhost:3001/api/equipment/${equipmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(formattedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Update successful:', responseData);
      
      setSuccess(true);
    } catch (err) {
      console.error('Error updating equipment:', err);
      setError(err.message || 'Failed to update equipment. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  if (loading.initial) {
    return (
      <div className="flex w-full justify-center items-center bg-white py-4 md:py-10 mb-10 px-3 sm:px-4 rounded-3xl shadow-md">
        <div className="w-full max-w-4xl sm:px-4 md:px-10 py-8 md:py-14 bg-white flex flex-col items-center justify-center">
          <Loader className="h-8 w-8 text-[#0060B4] animate-spin mb-4" />
          <p className="text-gray-600">Loading equipment data...</p>
        </div>
      </div>
    );
  }

  // Render type dropdown
  const renderTypeDropdown = () => (
    <div className="relative" ref={dropdownRefs.type}>
      <div 
        className="flex items-center justify-between w-full h-10 p-2 border-2 border-black rounded-lg cursor-pointer"
        onClick={() => toggleDropdown('type')}
      >
        <span>{formData.typeName || "Select type"}</span>
        <ChevronDown />
      </div>
      
      {showDropdowns.type && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-200 overflow-auto">
          {equipmentTypes.map((type) => (
            <div
              key={type.id}
              className="cursor-pointer hover:bg-gray-100 py-2 px-3"
              onClick={() => handleSelectType(type)}
            >
              {type.name}
            </div>
          ))}
          <div className="py-2 px-3 border-t border-gray-200">
            <button
              type="button"
              className="cursor-pointer w-auto px-3 sm:px-5 py-1 bg-[#757575] text-white rounded-lg font-medium text-sm"
              onClick={() => {
                setShowDropdowns(prev => ({ ...prev, type: false }));
                setShowTypeModal(true);
              }}
            >
              Add New Type
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render location dropdown
  const renderLocationDropdown = () => (
    <div className="relative" ref={dropdownRefs.location}>
      <div 
        className="flex items-center justify-between w-full h-10 p-2 border-2 border-black rounded-lg cursor-pointer"
        onClick={() => toggleDropdown('location')}
      >
        <span>{formData.locationName || "Select location"}</span>
        <ChevronDown />
      </div>
      
      {showDropdowns.location && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-200 overflow-auto">
          {locations.map((location) => (
            <div
              key={location.id}
              className="cursor-pointer hover:bg-gray-100 py-2 px-3"
              onClick={() => handleSelectLocation(location)}
            >
              {location.name}
            </div>
          ))}
          <div className="py-2 px-3 border-t border-gray-200">
            <button
              type="button"
              className="cursor-pointer w-auto px-3 sm:px-5 py-1 bg-[#757575] text-white rounded-lg font-medium text-sm"
              onClick={() => {
                setShowDropdowns(prev => ({ ...prev, location: false }));
                setShowLocationModal(true);
              }}
            >
              Add New Location
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render status dropdown
  const renderStatusDropdown = () => (
    <div className="relative" ref={dropdownRefs.status}>
      <div 
        className="flex items-center justify-between w-full h-10 p-2 border-2 border-black rounded-lg cursor-pointer"
        onClick={() => toggleDropdown('status')}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(formData.status)}`} />
          <span>{formData.status}</span>
        </div>
        <ChevronDown />
      </div>
      
      {showDropdowns.status && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-200 overflow-auto">
          {statusOptions.map((status) => (
            <div
              key={status}
              className="cursor-pointer hover:bg-gray-100 py-2 px-3"
              onClick={() => handleSelectStatus(status)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                <span>{status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex w-full justify-center items-center bg-white py-4 md:py-10 mb-10 px-3 sm:px-4 rounded-3xl shadow-md">
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col w-full max-w-4xl sm:px-4 md:px-10 py-4 md:py-10 bg-white">
        <h1 className="text-2xl font-semibold mb-8">Edit Equipment Details</h1>
        
        {/* Success message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-6">
            <div className="flex items-center mb-1">
              <CheckCircle className="h-5 w-5 mr-2" />
              <p className="font-bold">Equipment Updated Successfully</p>
            </div>
            <p className="ml-7">The equipment details have been updated.</p>
            <div className="mt-3 flex justify-end">
              <Link href="/admin/equipements" className="text-blue-600 underline">
                Back to Equipment List
              </Link>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
            <div className="flex items-center mb-1">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="font-bold">Error</p>
            </div>
            <p className="ml-7">{error}</p>
          </div>
        )}

        <FormField label="Inventory Code" required>
          <input
            type="text"
            value={formData.inventoryCode}
            onChange={handleInputChange}
            name="inventoryCode"
            className="w-full p-2 border-2 border-black rounded-lg"
            disabled={loading.submit}
          />
        </FormField>

        <FormField label="Type" required>
          {renderTypeDropdown()}
        </FormField>

        <FormField label="Category" required>
          <input
            type="text"
            value={formData.category}
            className="w-full p-2 border-2 border-black rounded-lg bg-gray-100 cursor-not-allowed"
            disabled
            readOnly
          />
        </FormField>

        <FormField label="Location" required>
          {renderLocationDropdown()}
        </FormField>

        <FormField label="Status" required>
          {renderStatusDropdown()}
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-1">
          <FormField label="Acquisition Date" required>
            <input
              type="date"
              value={formData.acquisitionDate}
              onChange={handleInputChange}
              name="acquisitionDate"
              className="w-full p-2 border-2 border-black rounded-lg"
              disabled={loading.submit}
            />
          </FormField>

          <FormField label="Commission Date" required>
            <input
              type="date"
              value={formData.commissionDate}
              onChange={handleInputChange}
              name="commissionDate"
              className="w-full p-2 border-2 border-black rounded-lg"
              disabled={loading.submit}
            />
          </FormField>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Attached Files</h2>
          <div className="space-y-2">
            {formData.attachedFiles && formData.attachedFiles.length > 0 ? (
              formData.attachedFiles.map((file, index) => (
                <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 hover:bg-gray-50">
                  <span className="break-words max-w-full sm:max-w-[200px] text-sm sm:text-base mb-1 sm:mb-0">
                    {file.name}
                  </span>
                  <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-gray-500 text-sm">{file.date}</span>
                    <span className="text-gray-500 text-sm">{file.size}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-red-500 font-bold"
                      disabled={loading.submit}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No files attached</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleFileAdd}
            className="w-full bg-[#757575] text-white py-2 rounded-lg"
            disabled={loading.submit}
          >
            Add File
          </button>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Link href="/admin/equipments">
            <button 
              type="button" 
              className="px-8 py-2 border-2 border-black rounded-xl"
              disabled={loading.submit}
            >
              Cancel
            </button>
          </Link>
          <button 
            type="submit" 
            className="px-8 py-2 bg-[#0060B4] text-white rounded-xl relative"
            disabled={loading.submit}
          >
            {loading.submit ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                Updating...
              </span>
            ) : (
              'Update'
            )}
          </button>
        </div>
      </form>

      {/* Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 px-4 backdrop-blur-sm">
          <AddTypeModal
            title="Add New Equipment Type"
            onClose={() => setShowTypeModal(false)}
            onAdd={handleAddType}
          />
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 px-4 backdrop-blur-sm">
          <AddModal
            title="Add New Location"
            label="Location's name"
            onClose={() => setShowLocationModal(false)}
            onAdd={handleAddLocation}
          />
        </div>
      )}
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <div className="w-full flex flex-col md:flex-row md:items-center md:gap-10 mb-4">
      <label className="text-md font-bold text-black min-w-[150px] mb-2 md:mb-0">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function AddModal({ title, label, onClose, onAdd }) {
  const [value, setValue] = useState("");
  return (
    <div className="z-50 bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-200 flex flex-col w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-4">
      <div className="flex">
        <h1 className="text-xl sm:text-2xl pl-0 sm:pl-2 pt-2 sm:pt-3 pb-6 sm:pb-10 font-oxanium font-semibold">
          {title}
        </h1>
      </div>

      <div className="w-full pb-8 sm:pb-14">
        <label htmlFor="modalInput" className="py-2 px-1 block">
          {label} <span className="text-orange-600">*</span>
        </label>
        <input
          id="modalInput"
          type="text"
          className="w-full h-10 bg-white p-2 rounded-lg border-2 border-black focus:outline-none mb-2"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={`New ${label.toLowerCase()}`}
          autoFocus
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
        <button
          type="button"
          className="w-full sm:w-auto px-6 sm:px-14 py-1 rounded-xl border-2 border-black bg-white text-black mb-2 sm:mb-0"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="w-full sm:w-auto px-6 sm:px-16 md:px-24 py-1 rounded-xl bg-[#0060B4] text-white"
          onClick={() => { onAdd(value); setValue(""); }}
          disabled={!value.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function AddTypeModal({ title, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: "",
    category: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="z-50 bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-200 flex flex-col w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-4">
      <div className="flex">
        <h1 className="text-xl sm:text-2xl pl-0 sm:pl-2 pt-2 sm:pt-3 pb-6 sm:pb-10 font-oxanium font-semibold">
          {title}
        </h1>
      </div>
      <div className="w-full pb-8 sm:pb-14">
        <div className="mb-4">
          <label htmlFor="typeName" className="py-2 px-1 block">
            Type Name <span className="text-orange-600">*</span>
          </label>
          <input
            id="typeName"
            name="name"
            type="text"
            className="w-full h-10 bg-white p-2 rounded-lg border-2 border-black focus:outline-none"
            value={formData.name}
            onChange={handleChange}
            placeholder="New equipment type name"
            autoFocus
          />
        </div>
        
        <div>
          <label htmlFor="typeCategory" className="py-2 px-1 block">
            Category <span className="text-orange-600">*</span>
          </label>
          <input
            id="typeCategory"
            name="category"
            type="text"
            className="w-full h-10 bg-white p-2 rounded-lg border-2 border-black focus:outline-none"
            value={formData.category}
            onChange={handleChange}
            placeholder="Category (e.g., IT, Electronics, Furniture)"
          />
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
        <button
          type="button"
          className="w-full sm:w-auto px-6 sm:px-14 py-1 rounded-xl border-2 border-black bg-white text-black mb-2 sm:mb-0"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="w-full sm:w-auto px-6 sm:px-16 md:px-24 py-1 rounded-xl bg-[#0060B4] text-white"
          onClick={() => { onAdd(formData); setFormData({ name: "", category: "" }); }}
          disabled={!formData.name.trim() || !formData.category.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
}