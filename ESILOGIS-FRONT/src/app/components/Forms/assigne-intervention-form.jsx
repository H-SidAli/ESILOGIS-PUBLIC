"use client";
import { useState, useRef, useEffect } from "react";
import { X, Plus, ChevronDown, User, Search, Calendar, Check } from "lucide-react"; 
import Link from 'next/link';

// Default options for locations and assignees if not provided
const DEFAULT_LOCATION_OPTIONS = [ 
  { value: "Floor 1", label: "Floor 1" },
  { value: "Floor 2", label: "Floor 2" },
  { value: "S33", label: "S33" },
  { value: "S14", label: "S14" },
  { value: "S22", label: "S22" },
  { value: "S45", label: "S45" },
];

const DEFAULT_ASSIGNEE_OPTIONS = [
  { id: 1, name: "John Doe", avatar: "https://randomuser.me/api/portraits/men/1.jpg", role: "Technician" },
  { id: 2, name: "Jane Smith", avatar: "https://randomuser.me/api/portraits/women/2.jpg", role: "Engineer" },
  { id: 3, name: "Mike Johnson", avatar: "https://randomuser.me/api/portraits/men/3.jpg", role: "Electrician" },
  { id: 4, name: "Sarah Williams", avatar: "https://randomuser.me/api/portraits/women/4.jpg", role: "Supervisor" },
  { id: 5, name: "Robert Brown", avatar: "https://randomuser.me/api/portraits/men/5.jpg", role: "Technician" }
];

export default function ReportIssueForm({
  initialFormData = {
    location: "",
    description: "",
    equipment: "",
    priority: "low",
    pictures: [],
    assignee: null,
    date: new Date().toISOString().split('T')[0], // Initialize with today's date
    isRecurring: false,
    recurringInterval: 1,
    recurringPeriod: "week"
  },
  onSubmit = (formData) => console.log("Form submitted:", formData),
  cancelLink = "../../admin/preventive-interventions",
  title = "Assign Preventive Intervention (PI)",
  locationOptions = DEFAULT_LOCATION_OPTIONS,
  assigneeOptions = DEFAULT_ASSIGNEE_OPTIONS,
  submitButtonText = "Done",
  onAddLocation = null,
  onAddAssignee = null,
  readOnly = false
}) {
  // Use state with provided initialFormData
  const [formData, setFormData] = useState(initialFormData);
  const [localLocationOptions, setLocalLocationOptions] = useState(locationOptions);
  const [localAssigneeOptions, setLocalAssigneeOptions] = useState(assigneeOptions);
  
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipment, setNewEquipment] = useState("");
  
  // Date picker state
  const [showDatePopup, setShowDatePopup] = useState(false);
  const dateInputRef = useRef(null);
  
  // Location dropdown state
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const locationDropdownRef = useRef(null);
  
  // Assignee dropdown state
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showAddAssignee, setShowAddAssignee] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const assigneeDropdownRef = useRef(null);

  // Close date popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dateInputRef.current && !dateInputRef.current.contains(event.target)) {
        setShowDatePopup(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close location dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close assignee dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setShowAssigneeDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle date change from popup
  const handleDateChange = (newDate) => {
    setFormData({ ...formData, date: newDate });
    setShowDatePopup(false);
  };

  // Filter assignees based on search
  const filteredAssignees = assigneeSearch 
    ? localAssigneeOptions.filter(assignee => 
        assignee.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
        assignee.role.toLowerCase().includes(assigneeSearch.toLowerCase()))
    : localAssigneeOptions;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      pictures: [
        ...formData.pictures,
        ...files.map((file) => ({
          name: file.name,
          url: URL.createObjectURL(file),
        })),
      ],
    });
  };

  const removePicture = (index) => {
    const updatedPictures = [...formData.pictures];
    updatedPictures.splice(index, 1);
    setFormData({ ...formData, pictures: updatedPictures });
  };

  const addNewEquipment = () => {
    if (newEquipment.trim()) {
      setFormData({ ...formData, equipment: newEquipment });
      setNewEquipment("");
      setShowAddEquipment(false);
    }
  };
  
  // Add new location handler
  const handleAddNewLocation = (newLocation) => {
    if (newLocation.trim()) {
      const updatedOptions = [
        ...localLocationOptions,
        { value: newLocation, label: newLocation }
      ];
      
      setLocalLocationOptions(updatedOptions);
      setFormData({...formData, location: newLocation});
      setShowAddLocation(false);
      
      // Call external handler if provided
      if (onAddLocation) {
        onAddLocation(newLocation, updatedOptions);
      }
    }
  };

  // Add new assignee handler
  const handleAddNewAssignee = (newAssignee) => {
    if (newAssignee.name && newAssignee.role) {
      const newId = localAssigneeOptions.length + 1;
      const newAssigneeWithId = {
        id: newId,
        name: newAssignee.name,
        role: newAssignee.role,
        avatar: `https://randomuser.me/api/portraits/men/${newId + 10}.jpg` // Random avatar for demo
      };
      
      const updatedOptions = [...localAssigneeOptions, newAssigneeWithId];
      setLocalAssigneeOptions(updatedOptions);
      setFormData({...formData, assignee: newAssigneeWithId});
      setShowAddAssignee(false);
      
      // Call external handler if provided
      if (onAddAssignee) {
        onAddAssignee(newAssigneeWithId, updatedOptions);
      }
    }
  };

  return (
    <div className="bg-white px-4 sm:px-6 md:px-8 lg:px-40 py-6 sm:py-8 md:py-10 shadow-xl rounded-lg w-full max-w-7xl mx-auto font-light font-outfit">
      {/* Add Location Popup */}
      {showAddLocation && (
        <div className="fixed inset-0 backdrop-blur-md z-40 flex items-center justify-center">
          <AddLocationPopup 
            onClose={() => setShowAddLocation(false)}
            onAdd={handleAddNewLocation}
          />
        </div>
      )}
      
      {/* Add Assignee Popup */}
      {showAddAssignee && (
        <div className="fixed inset-0 backdrop-blur-md z-40 flex items-center justify-center">
          <AddAssigneePopup 
            onClose={() => setShowAddAssignee(false)}
            onAdd={handleAddNewAssignee}
          />
        </div>
      )}

      {/* Custom Date Popup */}
      {showDatePopup && (
        <div className="fixed inset-0 backdrop-blur-sm z-40 flex items-center justify-center">
          <DatePopup 
            initialDate={formData.date}
            onClose={() => setShowDatePopup(false)}
            onSelectDate={handleDateChange}
          />
        </div>
      )}
      
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-black font-oxanium">{title}</h1>

      <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
        {/* Location Field - Updated to dropdown */}
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Location<span className="text-red-500">*</span>
          </label>
          <div className="relative" ref={locationDropdownRef}>
            <div 
              className={`flex items-center justify-between w-full p-2 border-2 border-black rounded-md text-sm ${readOnly ? 'bg-gray-100' : 'cursor-pointer'}`}
              onClick={() => !readOnly && setShowLocationDropdown(!showLocationDropdown)}
            >
              <span>{formData.location || "Select Location"}</span>
              {!readOnly && <ChevronDown size={16} />}
            </div>
            
            {showLocationDropdown && !readOnly && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-300 overflow-auto">
                {localLocationOptions.map((option) => (
                  <div
                    key={option.value}
                    className="cursor-pointer hover:bg-gray-100 py-2 px-3 text-sm"
                    onClick={() => {
                      setFormData({...formData, location: option.value});
                      setShowLocationDropdown(false);
                    }}
                  >
                    {option.label}
                  </div>
                ))}
                <div className="py-3 px-3 border-t border-gray-200">
                  <button
                    type="button"
                    className="cursor-pointer w-auto px-4 py-1 bg-[#757575] text-white rounded-md text-sm font-medium"
                    onClick={() => {
                      setShowAddLocation(true);
                      setShowLocationDropdown(false);
                    }}
                  >
                    Add New Location
                  </button>
                </div>
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
            className={`w-full border-2 border-black rounded-md p-2 h-20 sm:h-28 text-sm ${readOnly ? 'bg-gray-100' : ''}`}
            placeholder="Describe the issue..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            readOnly={readOnly}
          />
        </div>

        {/* Equipment Field */}
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Assign Equipment
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className={`flex-1 border-2 border-black rounded-md p-2 text-sm ${readOnly ? 'bg-gray-100' : ''}`}
              placeholder="Enter equipment ID"
              value={formData.equipment}
              onChange={(e) =>
                setFormData({ ...formData, equipment: e.target.value })
              }
              readOnly={readOnly}
            />
            {!readOnly && (
              <button
                type="button"
                className="bg-[#EA8B00] text-white rounded-md px-4 py-2 text-sm"
              >
                Scan Barcode
              </button>
            )}
          </div>

          {!readOnly && !showAddEquipment ? (
            <p
              className="text-xs mt-1 text-black"
              onClick={() => setShowAddEquipment(true)}
            >
              Equipment not found?{" "}
              <span className="text-[#EA8B00] cursor-pointer underline">
                Add new equipment
              </span>
            </p>
          ) : showAddEquipment && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                placeholder="Enter new equipment name"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
              />
              <button
                type="button"
                className="bg-blue-600 text-white rounded-md px-3 py-2 text-sm"
                onClick={addNewEquipment}
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
        
        {/* Assignee - New Dropdown */}
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Assignee
          </label>
          <div className="relative" ref={assigneeDropdownRef}>
            <div 
              className={`flex items-center justify-between w-full p-2 border-2 border-black rounded-md text-sm ${readOnly ? 'bg-gray-100' : 'cursor-pointer'}`}
              onClick={() => !readOnly && setShowAssigneeDropdown(!showAssigneeDropdown)}
            >
              {formData.assignee ? (
                <div className="flex items-center">
                  <img 
                    src={formData.assignee.avatar} 
                    alt={formData.assignee.name}
                    className="w-5 h-5 rounded-full mr-2"
                  />
                  <span>{formData.assignee.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({formData.assignee.role})</span>
                </div>
              ) : (
                <span>Select Assignee</span>
              )}
              {!readOnly && <ChevronDown size={16} />}
            </div>
            
            {showAssigneeDropdown && !readOnly && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-300 overflow-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      placeholder="Search assignees..."
                      className="w-full py-1.5 pl-8 pr-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                
                {filteredAssignees.length > 0 ? (
                  filteredAssignees.map((assignee) => (
                    <div
                      key={assignee.id}
                      className="cursor-pointer hover:bg-gray-100 py-2 px-3 text-sm flex items-center"
                      onClick={() => {
                        setFormData({...formData, assignee});
                        setShowAssigneeDropdown(false);
                      }}
                    >
                      <img 
                        src={assignee.avatar} 
                        alt={assignee.name}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <div>
                        <p className="font-medium">{assignee.name}</p>
                        <p className="text-xs text-gray-500">{assignee.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 px-3 text-sm text-gray-500">No assignees found</div>
                )}
                
                <div className="py-3 px-3 border-t border-gray-200">
                  <button
                    type="button"
                    className="cursor-pointer w-auto px-4 py-1 bg-[#757575] text-white rounded-md text-sm font-medium"
                    onClick={() => {
                      setShowAddAssignee(true);
                      setShowAssigneeDropdown(false);
                    }}
                  >
                    Add New Assignee
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Priority
          </label>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {["low", "medium", "high"].map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => !readOnly && setFormData({ ...formData, priority })}
                className={`px-3 sm:px-4 py-1.5 text-sm rounded-full font-medium border ${
                  formData.priority === priority
                    ? priority === "low"
                      ? "bg-blue-100 text-blue-600 border-blue-300"
                      : priority === "medium"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                      : "bg-red-100 text-red-600 border-red-300"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                disabled={readOnly}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Date Field - Modified to use custom popup */}
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Date
          </label>
          <div className="relative" ref={dateInputRef}>
            <div 
              className={`flex items-center justify-between w-1/2 p-2 border-2 border-black rounded-md text-sm ${readOnly ? 'bg-gray-100' : 'cursor-pointer'}`}
              onClick={() => !readOnly && setShowDatePopup(true)}
            >
              <span>{formatDate(formData.date)}</span>
              {!readOnly && <Calendar size={16} />}
            </div>
          </div>
        </div>

        {/* Recurring Option - Improved styling */}
        <div className="mt-2">
          <div className="flex items-center">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                id="isRecurring" 
                checked={formData.isRecurring || false}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-gray-400 text-[#0060B4] focus:ring-[#0060B4] focus:ring-2 cursor-pointer peer opacity-0 absolute"
                disabled={readOnly}
              />
              <div className={`w-5 h-5 border-2 flex items-center justify-center rounded ${formData.isRecurring ? 'bg-[#0060B4] border-[#0060B4]' : 'border-gray-400'} peer-focus:ring-2 peer-focus:ring-offset-1 peer-focus:ring-[#0060B4]`}>
                {formData.isRecurring && <Check size={14} color="white" strokeWidth={3} />}
              </div>
            </div>
            <label 
              htmlFor="isRecurring" 
              className="ml-2 block text-sm font-medium text-black cursor-pointer select-none"
            >
              Make this a recurring task
            </label>
          </div>
          
          {formData.isRecurring && (
            <div className="mt-3 ml-7 pb-1">
              <div className="flex flex-wrap gap-3 items-center">
                <p className="text-sm text-gray-700">Repeat every</p>
                <div className="flex items-center">
                  <select 
                    className="bg-white text-sm border-2 border-black rounded-md py-1 px-3 focus:outline-none focus:ring-1 focus:ring-[#0060B4]" 
                    value={formData.recurringInterval || 1}
                    onChange={(e) => setFormData({ ...formData, recurringInterval: parseInt(e.target.value) })}
                    disabled={readOnly}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <select 
                    className="bg-white text-sm border-2 border-black rounded-md py-1 px-3 focus:outline-none focus:ring-1 focus:ring-[#0060B4]"
                    value={formData.recurringPeriod || 'week'}
                    onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value })}
                    disabled={readOnly}
                  >
                    <option value="day">Day(s)</option>
                    <option value="week">Week(s)</option>
                    <option value="month">Month(s)</option>
                    <option value="year">Year(s)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons - Stacked on mobile, side-by-side on larger screens */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
          <Link href={cancelLink} className="w-full sm:w-auto"> 
            <button
              type="button"
              className="w-full sm:w-auto px-10 sm:px-14 py-2.5 sm:py-1 rounded-xl border-2 border-black bg-white text-black mb-3 sm:mb-0"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            className="w-full sm:w-auto px-10 sm:px-24 py-2.5 sm:py-1 rounded-xl bg-[#0060B4] text-white"
            disabled={readOnly}
          >
            {submitButtonText}
          </button>
        </div>
      </form>
    </div>
  );
}

// Date Popup Component with single input field
function DatePopup({ initialDate, onClose, onSelectDate }) {
  const [inputDate, setInputDate] = useState(formatForDisplay(initialDate || new Date().toISOString().split('T')[0]));
  const [error, setError] = useState("");
  
  // Format date string (YYYY-MM-DD) to display format (MM/DD/YYYY)
  function formatForDisplay(dateString) {
    try {
      const [year, month, day] = dateString.split('-');
      return `${month}/${day}/${year}`;
    } catch (err) {
      return "";
    }
  }
  
  // Format display format (MM/DD/YYYY) to date string (YYYY-MM-DD)
  function parseInputDate(input) {
    // Accept formats like MM/DD/YYYY, M/D/YYYY, or YYYY-MM-DD
    let match;
    
    // Try MM/DD/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
      const [month, day, year] = input.split('/');
      return {
        valid: isValidDate(year, month, day),
        dateString: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      };
    } 
    // Try YYYY-MM-DD format
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(input)) {
      const [year, month, day] = input.split('-');
      return {
        valid: isValidDate(year, month, day),
        dateString: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      };
    }
    
    return { valid: false, dateString: "" };
  }
  
  function isValidDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === parseInt(year) && 
      date.getMonth() === parseInt(month) - 1 && 
      date.getDate() === parseInt(day)
    );
  }
  
  const handleSaveDate = () => {
    const result = parseInputDate(inputDate);
    
    if (result.valid) {
      setError("");
      onSelectDate(result.dateString);
    } else {
      setError("Please enter a valid date (MM/DD/YYYY)");
    }
  };

  return (
    <div className="z-50 bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-200 w-[90%] sm:w-[400px] max-w-full mx-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-oxanium font-semibold">Enter Date</h2>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="text"
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
            placeholder="MM/DD/YYYY"
            className={`w-full p-2 border-2 ${error ? 'border-red-300' : 'border-black'} rounded-md text-sm`}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <p className="text-gray-500 text-xs mt-1">Format: MM/DD/YYYY (Example: 05/02/2025)</p>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-md border border-gray-300 bg-white text-black text-sm mr-2"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveDate}
          className="px-5 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-sm"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// Add Location Popup component
function AddLocationPopup({ onClose, onAdd }) { 
  const [newLocation, setNewLocation] = useState("");
  
  const handleAddNewLocation = () => {
    onAdd(newLocation);
    setNewLocation("");
  };

  return (
    <div className="z-50 bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-200 flex flex-col w-[90%] sm:w-[500px] max-w-full mx-4">  
      <div className="flex"> 
        <h1 className="text-xl sm:text-2xl pl-2 pt-3 pb-6 sm:pb-8 font-oxanium font-semibold">Add New Location</h1>
      </div> 

      <div className="w-full pb-6 sm:pb-10">
        <label htmlFor="locationName" className="py-2 px-1 block text-sm font-medium">
          Location Name <span className="text-red-500">*</span>
        </label>
        <input
          id="locationName"
          type="text"
          className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          placeholder="Enter new location name"
          autoFocus
        />
      </div>
      
      <div className="flex flex-col sm:flex-row justify-end gap-3 w-full"> 
        <button
          type="button"
          className="w-full sm:w-auto px-5 py-2 rounded-md border border-gray-300 bg-white text-black text-sm mb-2 sm:mb-0"
          onClick={onClose}
        >
          Cancel
        </button>
        
        <button
          type="button"
          onClick={handleAddNewLocation}
          disabled={!newLocation.trim()}
          className={`w-full sm:w-auto px-5 py-2 rounded-md text-white text-sm ${
            newLocation.trim() ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-300 cursor-not-allowed"
          }`}
        >
          Add Location
        </button>
      </div>
    </div>
  );
}

// Add Assignee Popup component
function AddAssigneePopup({ onClose, onAdd }) { 
  const [newAssignee, setNewAssignee] = useState({
    name: "",
    role: ""
  });
  
  const handleAddNewAssignee = () => {
    onAdd(newAssignee);
    setNewAssignee({ name: "", role: "" });
  };

  const isValidAssignee = newAssignee.name.trim() && newAssignee.role.trim();

  return (
    <div className="z-50 bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-200 flex flex-col w-[90%] sm:w-[500px] max-w-full mx-4">  
      <div className="flex"> 
        <h1 className="text-xl sm:text-2xl pl-2 pt-3 pb-6 sm:pb-8 font-oxanium font-semibold">Add New Assignee</h1>
      </div> 

      <div className="w-full space-y-4">
        <div>
          <label htmlFor="assigneeName" className="px-1 block text-sm font-medium">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="assigneeName"
            type="text"
            className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={newAssignee.name}
            onChange={(e) => setNewAssignee({...newAssignee, name: e.target.value})}
            placeholder="Enter assignee name"
            autoFocus
          />
        </div>
        
        <div>
          <label htmlFor="assigneeRole" className="px-1 block text-sm font-medium">
            Role <span className="text-red-500">*</span>
          </label>
          <input
            id="assigneeRole"
            type="text"
            className="w-full p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={newAssignee.role}
            onChange={(e) => setNewAssignee({...newAssignee, role: e.target.value})}
            placeholder="Enter assignee role (e.g., Technician)"
          />
        </div>
      </div>
      
      <div className="flex sm:flex-row justify-end gap-3 w-full mt-6 sm:mt-10"> 
        <button
          type="button"
          className="w-full sm:w-auto px-5 py-2 rounded-md border border-gray-300 bg-white text-black text-sm mb-2 sm:mb-0"
          onClick={onClose}
        >
          Cancel
        </button>
        
        <button
          type="button"
          onClick={handleAddNewAssignee}
          disabled={!isValidAssignee}
          className={`w-full sm:w-auto px-5 py-2 rounded-md text-white text-sm ${
            isValidAssignee ? "bg-blue-700 hover:bg-blue-800" : "bg-blue-300 cursor-not-allowed"
          }`}
        >
          Add Assignee
        </button>
      </div>
    </div>
  );
}