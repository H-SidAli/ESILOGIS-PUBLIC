'use client';

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

function AddEquipmentForm({ onScanClick, onSubmit, isSubmitting, error, success }) {
  // Form data state
  const [formData, setFormData] = useState({
    typeId: null,
    typeName: "",
    category: "",
    locationId: null,
    locationName: "",
    inventoryCode: "",
    acquisitionDate: "",
    commissionDate: "",
    attachedFiles: []
  });

  // API data
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState({
    types: true,
    locations: true
  });
  const [fetchError, setFetchError] = useState({
    types: null,
    locations: null
  });

  // UI state
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const formRef = useRef(null);

  // Auto-scroll to top on success or error
  useEffect(() => {
    if ((success || error) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [success, error]);

  // Refs for handling outside clicks
  const typeRef = useRef(null);
  const locationRef = useRef(null);
  const router = useRouter();

  // Fetch equipment types and locations on component mount
  useEffect(() => {
    fetchEquipmentTypes();
    fetchLocations();
  }, []);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch equipment types from API
  const fetchEquipmentTypes = async () => {
    setLoading(prev => ({ ...prev, types: true }));
    setFetchError(prev => ({ ...prev, types: null }));
    
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
      setFetchError(prev => ({ ...prev, types: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, types: false }));
    }
  };

  // Fetch locations from API
  const fetchLocations = async () => {
    setLoading(prev => ({ ...prev, locations: true }));
    setFetchError(prev => ({ ...prev, locations: null }));
    
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
      console.log('Fetched locations:', data);
      // Check if the data is directly an array or has a data property
      setLocations(Array.isArray(data) ? data : 
                   (data && Array.isArray(data.data)) ? data.data : []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setFetchError(prev => ({ ...prev, locations: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, locations: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileDetails = files.map(file => ({
      name: file.name,
      size: `${Math.round(file.size / 1024)}ko`,
      date: new Date().toLocaleDateString('en-GB')
    }));

    setFormData(prev => ({
      ...prev,
      attachedFiles: [...prev.attachedFiles, ...fileDetails]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter((_, i) => i !== index)
    }));
  };

  // Handle selecting an equipment type
  const handleSelectType = (type) => {
    setFormData(prev => ({
      ...prev,
      typeId: type.id,
      typeName: type.name,
      category: type.category
    }));
    setShowTypeDropdown(false);
  };

  // Handle selecting a location
  const handleSelectLocation = (location) => {
    setFormData(prev => ({
      ...prev,
      locationId: location.id,
      locationName: location.name
    }));
    setShowLocationDropdown(false);
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
        name: newType.name,
        category: newType.category
      }));
      
    } catch (error) {
      console.error("Error adding new equipment type:", error);
      // You could add UI feedback here for the error
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
      // You could add UI feedback here for the error
    }
    
    setShowLocationModal(false);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.typeId || !formData.locationId || !formData.inventoryCode || 
        !formData.acquisitionDate || !formData.commissionDate) {
      // You could add UI feedback for validation errors
      return;
    }
    
    // Format data for the backend API
    const formattedData = {
      typeId: formData.typeId,
      locationId: formData.locationId,
      inventoryCode: formData.inventoryCode,
      acquisitionDate: formData.acquisitionDate ? new Date(formData.acquisitionDate).toISOString() : null,
      commissionDate: formData.commissionDate ? new Date(formData.commissionDate).toISOString() : null,
      status: "IN_SERVICE", // Default status for new equipment
    };
    
    // Call the parent's onSubmit method with the formatted data
    onSubmit(formattedData);
  };

  // Reset form after successful submission
  const handleReset = () => {
    setFormData({
      typeId: null,
      typeName: "",
      category: "",
      locationId: null,
      locationName: "",
      inventoryCode: "",
      acquisitionDate: "",
      commissionDate: "",
      attachedFiles: []
    });
  };

  return (
    <div className="flex w-full justify-center items-center bg-white py-4 md:py-10 mb-10 px-2 sm:px-4 rounded-3xl shadow-md">
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col w-full max-w-4xl px-2 sm:px-4 md:px-10 py-4 md:py-10 bg-white">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-4 md:mb-6">
          Add an Equipment
        </h1>

        {/* Success message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 mb-6 rounded relative">
            <div className="flex">
              <div className="py-1 mr-2">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold">Success!</p>
                <p className="text-sm">Equipment has been added successfully.</p>
              </div>
            </div>
            <div className="mt-2 flex justify-end space-x-2">
              <button 
                type="button" 
                className="text-sm text-blue-700 underline"
                onClick={handleReset}
              >
                Add Another Equipment
              </button>
              <Link href="/admin/equipments" className="text-sm text-blue-700 underline">
                View All Equipment
              </Link>
            </div>
          </div>
        )}

        {/* Error messages */}
        {(error || fetchError.types || fetchError.locations) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 rounded relative">
            <div className="flex">
              <div className="py-1 mr-2">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold">Error</p>
                {error && <p className="text-sm">{error}</p>}
                {fetchError.types && <p className="text-sm">Error loading equipment types: {fetchError.types}</p>}
                {fetchError.locations && <p className="text-sm">Error loading locations: {fetchError.locations}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Equipment Type Dropdown */}
          <FormField label="Equipment Type" required>
            <div className="relative w-full" ref={typeRef}>
              <div
                className={`flex items-center justify-between w-full h-10 p-2 border-2 border-black rounded-lg ${
                  isSubmitting || loading.types ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => {
                  if (!isSubmitting && !loading.types) {
                    setShowTypeDropdown(!showTypeDropdown);
                  }
                }}
              >
                <span>{loading.types ? "Loading..." : formData.typeName || ""}</span>
                <ChevronDown />
              </div>
              {showTypeDropdown && !isSubmitting && !loading.types && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-200 overflow-auto">
                  {equipmentTypes.length > 0 ? (
                    equipmentTypes.map((type) => (
                      <div
                        key={type.id}
                        className="cursor-pointer hover:bg-gray-100 py-2 px-3"
                        onClick={() => handleSelectType(type)}
                      >
                        {type.name}
                      </div>
                    ))
                  ) : (
                    <div className="py-2 px-3 text-gray-500">No equipment types available</div>
                  )}
                  <div className="py-4 pl-3 sm:pl-6 border-t border-gray-200">
                    <button
                      type="button"
                      className="cursor-pointer w-auto px-3 sm:px-5 py-1 bg-[#757575] text-white rounded-lg font-medium text-sm"
                      onClick={() => {
                        setShowTypeModal(true);
                        setShowTypeDropdown(false);
                      }}
                      disabled={isSubmitting}
                    >
                      Add New Type
                    </button>
                  </div>
                </div>
              )}
            </div>
          </FormField>

          {/* Category Field (Read-only, populated from selected type) */}
          <FormField label="Category" required>
            <input
              type="text"
              name="category"
              value={formData.category}
              className="w-full p-2 border-2 border-black rounded-lg bg-gray-100 cursor-not-allowed"
              disabled
              readOnly
            />
          </FormField>
        </div>

        {/* Location Dropdown */}
        <div className="mt-4">
          <FormField label="Location" required>
            <div className="relative w-full" ref={locationRef}>
              <div
                className={`flex items-center justify-between w-full h-10 p-2 border-2 border-black rounded-lg ${
                  isSubmitting || loading.locations ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={() => {
                  if (!isSubmitting && !loading.locations) {
                    setShowLocationDropdown(!showLocationDropdown);
                  }
                }}
              >
                <span>{loading.locations ? "Loading..." : formData.locationName || ""}</span>
                <ChevronDown />
              </div>
              {showLocationDropdown && !isSubmitting && !loading.locations && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-200 overflow-auto">
                  {locations.length > 0 ? (
                    locations.map((location) => (
                      <div
                        key={location.id}
                        className="cursor-pointer hover:bg-gray-100 py-2 px-3"
                        onClick={() => handleSelectLocation(location)}
                      >
                        {location.name}
                      </div>
                    ))
                  ) : (
                    <div className="py-2 px-3 text-gray-500">No locations available</div>
                  )}
                  <div className="py-4 pl-3 sm:pl-6 border-t border-gray-200">
                    <button
                      type="button"
                      className="cursor-pointer w-auto px-3 sm:px-5 py-1 bg-[#757575] text-white rounded-lg font-medium text-sm"
                      onClick={() => {
                        setShowLocationModal(true);
                        setShowLocationDropdown(false);
                      }}
                      disabled={isSubmitting}
                    >
                      Add New Location
                    </button>
                  </div>
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* Inventory Code */}
        <div className="mt-4">
          <FormField label="Inventory Code" required>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                name="inventoryCode"
                value={formData.inventoryCode}
                onChange={handleInputChange}
                className={`flex-1 p-2 border-2 border-black rounded-lg ${isSubmitting ? 'bg-gray-100' : ''}`}
                required
                disabled={isSubmitting || success}
              />
              <button
                type="button"
                onClick={onScanClick}
                className={`w-full sm:w-auto px-6 py-2 bg-orange-500 text-white rounded-lg font-medium ${isSubmitting || success ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmitting || success}
              >
                Scan Barcode
              </button>
            </div>
          </FormField>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField label="Acquisition Date" required>
            <input
              type="date"
              name="acquisitionDate"
              value={formData.acquisitionDate}
              onChange={handleInputChange}
              className={`w-full p-2 border-2 border-black rounded-lg ${isSubmitting || success ? 'bg-gray-100' : ''}`}
              required
              disabled={isSubmitting || success}
            />
          </FormField>

          <FormField label="Commission Date" required>
            <input
              type="date"
              name="commissionDate"
              value={formData.commissionDate}
              onChange={handleInputChange}
              className={`w-full p-2 border-2 border-black rounded-lg ${isSubmitting || success ? 'bg-gray-100' : ''}`}
              required
              disabled={isSubmitting || success}
            />
          </FormField>
        </div>

        {/* File Upload Section */}
        <div className="mt-4">
          <FormField label="Attached Files (Optional)">
            <div className="space-y-4">
              <label className={`block w-full bg-[#757575] text-white text-center py-2 rounded-lg ${isSubmitting || success ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                Add Files
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={isSubmitting || success}
                />
              </label>
              {formData.attachedFiles.length > 0 && (
                <div className="text-gray-600 text-sm mt-2">
                  Attached Files : {formData.attachedFiles.map(file => file.name).join(', ')}
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <Link href="/admin/equipments" className={`w-full sm:w-auto ${isSubmitting ? 'pointer-events-none' : ''}`}>
            <button
              type="button"
              className={`w-full px-6 sm:px-10 py-1 border-2 border-black rounded-xl text-center font-outfit ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </Link>
          {!success && (
            <button
              type="submit"
              className={`w-full sm:w-auto px-6 sm:px-16 md:px-24 py-1 ${
                isSubmitting ? 'bg-blue-400' : 'bg-[#0060B4]'
              } text-white rounded-xl text-center font-outfit relative`}
              disabled={isSubmitting || loading.types || loading.locations}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                  Adding...
                </span>
              ) : (
                'Add Equipment'
              )}
            </button>
          )}
          {success && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-6 sm:px-16 md:px-24 py-1 bg-[#0060B4] text-white rounded-xl text-center font-outfit"
            >
              Add Another
            </button>
          )}
        </div>
      </form>

      {/* Add Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50 px-4">
          <AddModal
            title="Add New Location"
            label="Location's name"
            onClose={() => setShowLocationModal(false)}
            onAdd={handleAddLocation}
          />
        </div>
      )}

      {/* Add Equipment Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50 px-4">
          <AddTypeModal
            title="Add New Equipment Type"
            onClose={() => setShowTypeModal(false)}
            onAdd={handleAddType}
          />
        </div>
      )}
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <div className="w-full">
      <label className="text-sm md:text-base font-medium text-black block mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

// Modal for adding a single value (like location)
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

// Special modal for equipment types with name and category fields
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
export default AddEquipmentForm;