"use client";

import { useEffect, useState, useRef } from "react"; 
import { ChevronDown, X, Search, UserPlus, Camera, Upload, ZoomIn } from "lucide-react";
import Image from "next/image";  
import Link from "next/link";

export default function ReportForm({
  location, setLocation,
  description, setDescription,
  equipment, setEquipment,
  priority, setPriority,
  pictures, setPictures,
  status, setStatus,
  assignees, setAssignees,
  activeAssignee, setActiveAssignee,
  hoveredAssignee, setHoveredAssignee, 
  CancelUrl,
  onSubmit, // Add onSubmit prop to handle form submission
  equipmentDetails // Add equipment details prop
}) {
  // Add state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Add state for image popup
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const locationDropdownRef = useRef(null);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const fileInputRef = useRef(null);
  
  // Assignees dropdown states
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const assigneeDropdownRef = useRef(null);
  
  // API data states
  const [locationOptions, setLocationOptions] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState({
    locations: false,
    technicians: false
  });
  const [error, setError] = useState({
    locations: null,
    technicians: null
  });
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Validate required fields
      if (!description.trim()) {
        throw new Error('Description is required');
      }
      
      if (!location.trim()) {
        throw new Error('Location is required');
      }
      
      // Call the onSubmit function from parent component
      if (typeof onSubmit === 'function') {
        await onSubmit({
          location,
          description,
          equipment,
          priority,
          pictures,
          status,
          assignees
        });
      } else {
        console.warn('No onSubmit handler provided to ReportForm');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setSubmitError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Rest of your existing functions and hooks...
  
  // Open the image popup
  const openImagePopup = (pic) => {
    setCurrentImage(pic);
    setShowImagePopup(true);
  };
  
  // Get image URL (for both URLs and filenames)
  const getImageUrl = (pic) => {
    if (pic.startsWith('http')) {
      return pic;
    } else {
      // Create a placeholder image URL for filenames
      return `https://source.unsplash.com/random/800x600?maintenance,${pic.replace(/\.[^/.]+$/, "")}`;
    }
  };

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      if (typeof window === 'undefined') return; // Skip on server-side
      
      setLoading(prev => ({ ...prev, locations: true }));
      setError(prev => ({ ...prev, locations: null }));
      
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required. Please log in.');
        }
        
        const response = await fetch('http://localhost:3001/api/location', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Locations fetched:', data);
        
        // Map API data to the format our component expects
        const mappedLocations = Array.isArray(data) 
          ? data.map(loc => ({ value: loc.name, label: loc.name, id: loc.id }))
          : data.data && Array.isArray(data.data)
            ? data.data.map(loc => ({ value: loc.name, label: loc.name, id: loc.id }))
            : [];
        
        setLocationOptions(mappedLocations);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError(prev => ({ ...prev, locations: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, locations: false }));
      }
    };
    
    fetchLocations();
  }, []);
  
  // Fetch technicians from API
  useEffect(() => {
    const fetchTechnicians = async () => {
      if (typeof window === 'undefined') return; // Skip on server-side
      
      setLoading(prev => ({ ...prev, technicians: true }));
      setError(prev => ({ ...prev, technicians: null }));
      
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required. Please log in.');
        }
        
        const response = await fetch('http://localhost:3001/api/technicians', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Technicians fetched:', data);
        
        // Map API data to the format our component expects
        const mappedTechnicians = Array.isArray(data)
          ? data.map(tech => ({
              id: tech.id,
              name: `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.email || `User #${tech.id}`,
              department: tech.department || "Maintenance",
              email: tech.email || "No email available",
              phone: tech.phone || "No phone available",
              avatar: tech.avatar || "https://randomuser.me/api/portraits/men/1.jpg" // Default avatar
            }))
          : data.data && Array.isArray(data.data)
            ? data.data.map(tech => ({
                id: tech.id,
                name: `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.email || `User #${tech.id}`,
                department: tech.department || "Maintenance",
                email: tech.email || "No email available",
                phone: tech.phone || "No phone available",
                avatar: tech.avatar || "https://randomuser.me/api/portraits/men/1.jpg" // Default avatar
              }))
            : [];
        
        setTechnicians(mappedTechnicians);
      } catch (err) {
        console.error('Error fetching technicians:', err);
        setError(prev => ({ ...prev, technicians: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, technicians: false }));
      }
    };
    
    fetchTechnicians();
  }, []);
  
  // Filter locations based on search
  const filteredLocations = locationSearch 
    ? locationOptions.filter(location => 
        location.label.toLowerCase().includes(locationSearch.toLowerCase()))
    : locationOptions;
    
  // Filter assignees based on search
  const filteredAssignees = assigneeSearch
    ? technicians.filter(person => 
        person.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
        (person.department && person.department.toLowerCase().includes(assigneeSearch.toLowerCase())))
    : technicians;
    
  // Check if assignee is already selected
  const isAssigneeSelected = (id) => {
    return assignees.some(assignee => assignee.id === id);
  };
  
  // Add assignee to the list
  const addAssignee = (assignee) => {
    if (!isAssigneeSelected(assignee.id)) {
      setAssignees([...assignees, assignee]);
    }
  };
  
  // Remove assignee from the list
  const removeAssignee = (id) => {
    setAssignees(assignees.filter(assignee => assignee.id !== id));
  };
  
  // Handle file upload with real image previews
  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPictures = [...pictures];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Use URL.createObjectURL for immediate preview if available
        if (window.URL) {
          const imageUrl = URL.createObjectURL(file);
          newPictures.push(imageUrl);
        } else {
          // Fallback to filename
          newPictures.push(file.name);
        }
      }
      
      setPictures(newPictures);
      setShowImageUploadModal(false);
    }
  };
  
  // Handle adding new location to API
  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      const response = await fetch('http://localhost:3001/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newLocationName })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const newLocation = await response.json();
      console.log('New location added:', newLocation);
      
      // Add to locations list
      const locationToAdd = { 
        value: newLocationName, 
        label: newLocationName, 
        id: newLocation.id || Date.now() // Use returned ID or fallback
      };
      
      setLocationOptions(prev => [...prev, locationToAdd]);
      setLocation(newLocationName);
      setShowAddLocationModal(false);
      setNewLocationName("");
      
    } catch (err) {
      console.error('Error adding location:', err);
      alert(`Failed to add location: ${err.message}`);
    }
  };
  
  // Handle camera capture with realistic image
  const handleTakePhoto = () => {
    // In a real app, this would access the device camera
    // For this demo, we'll add a placeholder
    const mockPhotoUrl = "https://via.placeholder.com/800x600?text=Camera+Capture";
    setPictures([...pictures, mockPhotoUrl]);
    setShowImageUploadModal(false);
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setShowAssigneeDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Remove picture
  const removePicture = (index) => {
    const newPictures = [...pictures];
    newPictures.splice(index, 1);
    setPictures(newPictures);
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full mx-auto bg-white font-oxanium p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg mt-4 sm:mt-10 border max-w-7xl">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Reported Issue Details</h2>
      
      {/* Show submission error if any */}
      {submitError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error: {submitError}</p>
        </div>
      )}
      
      <div className="space-y-4 sm:space-y-6 w-full">
        {/* Location with dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
          <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Location <span className="text-red-500">*</span></label>
          <div className="relative w-full sm:col-span-10" ref={locationDropdownRef}>
            <div 
              className="flex items-center justify-between w-full p-2 border-2 border-black rounded-xl text-gray-700 cursor-pointer"
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            >
              <span>{location || "Select Location"}</span>
              <ChevronDown/>
            </div>
            
            {showLocationDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border overflow-auto">
                {/* Search bar for locations */}
                <div className="sticky top-0 bg-white p-2 border-b">
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Search locations..."
                      className="w-full py-1.5 pl-10 pr-2 border rounded text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                
                {/* Loading state */}
                {loading.locations && (
                  <div className="py-4 px-3 text-center">
                    <div className="inline-block h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2"></div>
                    <span className="text-sm text-gray-500">Loading locations...</span>
                  </div>
                )}
                
                {/* Error state */}
                {error.locations && (
                  <div className="py-2 px-3 text-sm text-red-500">
                    Error loading locations: {error.locations}
                  </div>
                )}
                
                {/* Filtered location options */}
                {!loading.locations && !error.locations && filteredLocations.length > 0 ? (
                  filteredLocations.map((option) => (
                    <div
                      key={option.id}
                      className="cursor-pointer hover:bg-gray-100 py-2 px-3 text-sm"
                      onClick={() => {
                        setLocation(option.value);
                        setShowLocationDropdown(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))
                ) : (
                  !loading.locations && !error.locations && (
                    <div className="py-2 px-3 text-sm text-gray-500">No locations found</div>
                  )
                )}
                
                {/* Add New Location button */}
                <div className="py-2 border-t border-gray-200">
                  <button 
                    className="mx-3 w-auto px-4 py-2 bg-gray-500 text-white rounded-md text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddLocationModal(true);
                      setShowLocationDropdown(false);
                    }}
                    type="button"
                  >
                    Add New Location
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Description */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-2">
          <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Description <span className="text-red-500">*</span></label>
          <textarea 
            className="border-2 px-1 py-2 border-black rounded-xl w-full h-24 sm:h-32 focus:outline-none text-gray-900 sm:col-span-10" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter issue description"
            required
          />
        </div>
        
        {/* Equipment */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
          <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Equipment</label>
          <div className="sm:col-span-10">
            <input 
              type="text" 
              className="p-2 border-2 border-black rounded-xl w-full text-gray-900 focus:outline-none" 
              value={equipment} 
              onChange={(e) => setEquipment(e.target.value)} 
              placeholder="Equipment ID or Name"
              readOnly={!!equipmentDetails} // Make it readonly if we have equipment details
            />
            {equipmentDetails && (
              <div className="mt-2 text-xs text-gray-500">
                <p>Equipment from database: {equipmentDetails.inventoryCode}</p>
                {equipmentDetails.status && (
                  <p className="mt-1">Status: {equipmentDetails.status.replace(/_/g, ' ').toLowerCase()}</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
          <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Priority</label>
          <div className="flex flex-wrap gap-2 sm:col-span-10">
            {[
              { label: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
              { label: "High", color: "bg-red-100 text-red-600 border-red-300" },
              { label: "Low", color: "bg-blue-100 text-blue-600 border-blue-300" },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                className={`px-3 sm:px-4 py-1 rounded-full text-white text-xs sm:text-sm ${
                  priority === p.label 
                    ? `${p.color} border`
                    : "bg-gray-300 text-gray-500"
                }`}
                onClick={() => setPriority(p.label)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Pictures - Modified to show thumbnails and make clickable */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
          <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Pictures</label>
          <div className="flex flex-col gap-2 items-start sm:col-span-10 w-full">
            <button 
              type="button"
              className="bg-gray-500 text-white px-4 sm:px-16 py-1 rounded text-sm w-full sm:w-auto mb-2"
              onClick={() => setShowImageUploadModal(true)}
            >
              Add Pictures
            </button>
            
            {pictures.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full mt-2">
                {pictures.map((pic, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className="aspect-square bg-gray-100 rounded-md overflow-hidden border border-gray-200 cursor-pointer"
                      onClick={() => openImagePopup(pic)}
                    >
                      {/* Thumbnail image */}
                      <img 
                        src={getImageUrl(pic)}
                        alt={`Report image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/200x200?text=Image";
                        }}
                      />
                      
                      {/* Overlay with icon on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30">
                        <ZoomIn className="text-white" size={24} />
                      </div>
                    </div>
                    
                    {/* Delete button overlay */}
                    <button 
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePicture(index);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Hidden file input for image upload */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleFileUpload} 
            />
          </div>
        </div>
        
        {/* Assignees */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
          <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Assignees</label>
          <div className="flex flex-col sm:flex-row flex-wrap items-start gap-3 sm:col-span-10 w-full">
            <div className="relative w-full sm:w-auto" ref={assigneeDropdownRef}>
              <button 
                type="button"
                className="bg-gray-500 text-white px-4 sm:px-15 py-1.5 rounded text-sm w-full sm:w-auto flex items-center justify-center gap-2"
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              >
                <UserPlus size={18} />
                <span>Add Assignees</span>
              </button>
              
              {showAssigneeDropdown && (
                <div className="absolute z-10 mt-1 w-full sm:w-80 bg-white shadow-lg max-h-60 rounded-md py-1 border overflow-auto left-0">
                  {/* Search bar for assignees */}
                  <div className="sticky top-0 bg-white p-2 border-b">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        placeholder="Search assignees..."
                        className="w-full py-1.5 pl-10 pr-2 border rounded text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  {/* Loading state */}
                  {loading.technicians && (
                    <div className="py-4 px-3 text-center">
                      <div className="inline-block h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2"></div>
                      <span className="text-sm text-gray-500">Loading technicians...</span>
                    </div>
                  )}
                  
                  {/* Error state */}
                  {error.technicians && (
                    <div className="py-2 px-3 text-sm text-red-500">
                      Error loading technicians: {error.technicians}
                    </div>
                  )}
                  
                  {/* Filtered assignee options */}
                  <div className="max-h-40 overflow-y-auto">
                    {!loading.technicians && !error.technicians && filteredAssignees.length > 0 ? (
                      filteredAssignees.map((person) => (
                        <div
                          key={person.id}
                          className={`cursor-pointer hover:bg-gray-100 py-2 px-3 text-sm flex items-center justify-between ${
                            isAssigneeSelected(person.id) ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => addAssignee(person)}
                        >
                          <div className="flex items-center gap-2">
                            <img 
                              src={person.avatar} 
                              alt={person.name} 
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/24?text=U";
                              }}
                            />
                            <div>
                              <p className="font-medium">{person.name}</p>
                              <p className="text-xs text-gray-500">{person.department}</p>
                            </div>
                          </div>
                          {isAssigneeSelected(person.id) && (
                            <span className="text-blue-500 text-xs font-medium">Added</span>
                          )}
                        </div>
                      ))
                    ) : (
                      !loading.technicians && !error.technicians && (
                        <div className="py-2 px-3 text-sm text-gray-500">No assignees found</div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
              {assignees.map((assignee) => (
                <div key={assignee.id} className="flex items-center bg-gray-100 rounded-full pr-2">
                  <img
                    src={assignee.avatar}
                    alt={assignee.name}
                    className="w-8 h-8 rounded-full border-2 border-white cursor-pointer"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/32?text=User";
                    }}
                    onMouseEnter={() => setHoveredAssignee(assignee.id)}
                    onMouseLeave={() => setHoveredAssignee(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAssignee(activeAssignee === assignee.id ? null : assignee.id);
                    }}
                  />
                  <span className="ml-1 mr-1 text-xs">{assignee.name}</span>
                  <button 
                    type="button"
                    className="text-gray-500 hover:text-red-500"
                    onClick={() => removeAssignee(assignee.id)}
                  >
                    <X size={16} />
                  </button>
                  
                  {(hoveredAssignee === assignee.id || activeAssignee === assignee.id) && (
                    <div className="absolute left-0 mt-16 w-40 bg-white p-2 text-xs sm:text-sm shadow-lg rounded z-10 text-gray-900 border">
                      <p className="font-bold">{assignee.name}</p>
                      <p>{assignee.department}</p>
                      <p>{assignee.email}</p>
                      <p>{assignee.phone}</p>
                      {assignee.role && <p className="mt-1 font-medium">Role: {assignee.role}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Status */}
        <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
          <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Status</label>
          <div className="relative w-full sm:col-span-4 lg:col-span-3">
            <div className="relative">
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full p-2 pl-8 border-2 border-black rounded-xl appearance-none bg-white text-gray-900 pr-10"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
                <option value="cancelled">Cancelled</option> 
                <option value="denied">Denied</option>
                <option value="postponed">Postponed</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <div className={`h-3 w-3 rounded-full ${
                  status === "pending" ? "bg-yellow-400" :
                  status === "in-progress" ? "bg-green-500" :
                  status === "completed" ? "bg-blue-500" :
                  status === "approved" ? "bg-green-600" :
                  status === "cancelled" ? "bg-red-500" :
                  status === "denied" ? "bg-red-500" :
                  status === "postponed" ? "bg-orange-400" : "bg-gray-400"
                }`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Technician Section */}
        <div className="flex flex-col space-y-4 pt-4 border-t mt-6">
          <h3 className="text-md sm:text-lg font-bold">Technician Section</h3>
          
          {/* Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-2">
            <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Actions</label>
            <textarea 
              className="p-2 border-2 rounded-xl border-black focus:outline-none w-full h-20 sm:h-24 text-gray-900 sm:col-span-10"
              placeholder="Describe technician actions here"
              readOnly
            />
          </div>
          
          {/* Parts Used */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-2">
            <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Parts Used</label>
            <textarea 
              className="p-2 border-2 rounded-xl border-black w-full h-20 sm:h-24 text-gray-900 sm:col-span-10"
              placeholder="List parts used here"
              readOnly
            />
          </div>
          
          {/* Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-2">
            <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Notes</label>
            <textarea 
              className="p-2 border-2 border-black rounded-xl w-full h-20 sm:h-24 text-gray-900 sm:col-span-10"
              placeholder="Add any additional notes here"
              readOnly
            />
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6">
        <Link href={`../../${CancelUrl}`} className="w-full sm:w-auto"> 
          <button
            type="button"
            className="w-full sm:w-auto px-6 sm:px-10 lg:px-14 py-2 sm:py-1 rounded-xl border-2 border-black bg-white text-black mb-3 sm:mb-0"
          >
            Cancel
          </button>
        </Link>
        <button
          type="submit"
          className={`w-full sm:w-auto px-6 sm:px-10 lg:px-24 py-2 sm:py-1 rounded-xl bg-[#0060B4] text-white ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Done'
          )}
        </button>
      </div>

      {/* Location Modal */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-md">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 max-w-md w-full mx-4">
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Add New Location</h3>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Enter new location name"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                className="px-6 py-2 border rounded-lg text-gray-700 order-1 sm:order-none"
                onClick={() => {
                  setShowAddLocationModal(false);
                  setNewLocationName("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-blue-400 text-white rounded-lg"
                onClick={handleAddLocation}
                disabled={!newLocationName.trim()}
              >
                Add Location
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Upload Modal */}
      {showImageUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4  bg-opacity-50 backdrop-blur-md">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 max-w-md w-full mx-4">
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setShowImageUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6">
              <div className="border-2 border-dashed border-black rounded-lg w-3/5 p-8 mb-6 flex items-center justify-center">
                <Camera size={120} className="text-black" />
              </div>
              
              <div className="flex flex-col items-center w-full space-y-3">
                <button
                  type="button"
                  className="py-2 bg-[#EA8B00] px-15 text-white font-medium rounded-xl flex items-center justify-center w-40"
                  onClick={handleTakePhoto}
                >
                  Take Photo
                </button>
                
                <button
                  type="button"
                  className="py-2 px-13 bg-[#0060B4] text-white font-medium rounded-xl flex items-center justify-center w-40"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload Image
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4 text-center">
                Make sure to take clear picture of the issue 
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Popup Modal - New */}
      {showImagePopup && currentImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-75"
          onClick={() => setShowImagePopup(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white p-2 rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              className="absolute top-2 right-2 text-gray-700 hover:text-red-500 z-10 bg-white rounded-full p-1"
              onClick={() => setShowImagePopup(false)}
            >
              <X size={24} />
            </button>
            <img 
              src={getImageUrl(currentImage)} 
              alt="Full size image" 
              className="max-h-[80vh] max-w-full object-contain"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/800x600?text=Image+Not+Found";
              }}
            />
          </div>
        </div>
      )}
    </form>
  );
}