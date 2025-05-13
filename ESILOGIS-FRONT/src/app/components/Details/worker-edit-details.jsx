"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PopupScheduleModal from "../popups/SchedulePopup"; 
import { ChevronDown } from "lucide-react"; 
import { useRef, useEffect, useState } from "react"; 
import Link from "next/link";


// Default data if no props are passed
const DEFAULT_WORKER_DATA = {
  id: "",
  lastName: "",
  firstName: "",
  department: "",
  phoneNumber: "",
  email: "",
  profileImage: "/Images/account_circle2.svg",
  availability: []
};

function WorkerDetails({
  workerId = "",                          // ID of the worker being edited
  workerData = null,                      // Pre-loaded worker data
  isLoading = false,                      // Loading state
  onSave = (data) => console.log("Save not implemented", data), // Save callback
  onCancel = () => {},                    // Cancel callback
  returnPath = "/admin/technical-staff" ,
  departments// Path to return to on cancel
}) {
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(isLoading);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  // Use passed data or default
  const initialWorkerData = workerData || DEFAULT_WORKER_DATA;
  
  // Initialize form with worker data
  const [formData, setFormData] = useState({
    lastName: initialWorkerData.lastName || "",
    firstName: initialWorkerData.firstName || "",
    department: initialWorkerData.department || "",
    phoneNumber: initialWorkerData.phoneNumber || "",
    email: initialWorkerData.email || "",
  });

  // Initialize availability
  const [availability, setAvailability] = useState(initialWorkerData.availability || []);
  const [showModal, setShowModal] = useState(false);

  // Update state when worker data prop changes
  useEffect(() => {
    if (workerData && !initialDataLoaded) {
      setFormData({
        lastName: workerData.lastName || "",
        firstName: workerData.firstName || "",
        department: workerData.department || "",
        phoneNumber: workerData.phoneNumber || "",
        email: workerData.email || "",
      });
      setAvailability(workerData.availability || []);
      setInitialDataLoaded(true);
    }
  }, [workerData, initialDataLoaded]);

  // Update loading state when isLoading prop changes
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // Handle outside click for department dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDepartmentDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add new department handler
  const handleAddNewDepartment = (newDepartment) => {
    if (newDepartment.trim()) {
      departments = [
        ...departments,
        { value: newDepartment, label: newDepartment }
      ];
      setFormData({...formData, department: newDepartment});
      setShowAddDepartment(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare the complete worker data object
    const updatedWorkerData = {
      id: workerId || initialWorkerData.id,
      ...formData,
      availability: availability,
      profileImage: initialWorkerData.profileImage,
    };
    
    // Call the onSave callback with the updated data
    onSave(updatedWorkerData);
  };

  const handleCancel = () => {
    onCancel();
    // Only navigate if no custom onCancel behavior is provided
    if (onCancel === (() => {})) {
      router.push(returnPath);
    }
  };

  const handleAddSchedule = (item) => {
    setAvailability((prev) => [...prev, item]);
  };

  const handleRemoveSchedule = (index) => {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex w-full justify-center items-center bg-white py-4 md:py-10 mb-10 px-2 sm:px-4 rounded-3xl shadow-md">
        <div className="text-lg font-medium text-gray-700 p-8">Loading worker data...</div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center items-center bg-white py-4 md:py-10 mb-10 px-2 sm:px-4 rounded-3xl shadow-md">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-4xl px-2 sm:px-4 md:px-10 py-4 md:py-10 bg-white"
      >
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-4 md:mb-6">
          Edit Worker's Details
        </h1>

        {/* Profile Picture Section - Top on mobile, right side on desktop */}
        <div className="flex justify-center w-full md:hidden mb-6">
          <div className="flex flex-col items-center justify-start gap-2">
            <Image
              src={initialWorkerData.profileImage}
              alt="Profile Placeholder"
              width={100}
              height={100}
              className="rounded-full"
            />
            <button
              type="button"
              className="bg-orange-500 text-white px-4 py-1 rounded-md text-sm font-medium"
            >
              Add Profile Display
            </button>
            <p className="text-xs text-gray-500 text-center">
              Note: a profile display will be added automatically in the case no picture is available
            </p>
          </div>
        </div>

        {/* Name and Profile Section - Different arrangement based on screen size */}
        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
          {/* Name Input Fields - Full width on mobile */}
          <div className="grid grid-cols-1 gap-4 w-full md:w-2/3">
            <FormField label="Last Name" required>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full bg-gray-100 p-2 border-2 border-black rounded-lg"
                required
              />
            </FormField>

            <FormField label="First Name" required>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full bg-gray-100 p-2 rounded-lg border-2 border-black"
                required
              />
            </FormField>
          </div>

          {/* Profile Picture - Hidden on mobile (shown at top instead), visible on desktop */}
          <div className="hidden md:flex flex-col items-center justify-start gap-2 w-1/3">
            <Image
              src={initialWorkerData.profileImage}
              alt="Profile Placeholder"
              width={100}
              height={100}
              className="rounded-full"
            />
            <button
              type="button"
              className="bg-orange-500 text-white px-4 py-1 rounded-md text-sm font-medium"
            >
              Add Profile Display
            </button>
            <p className="text-xs text-gray-500 text-center">
              Note: a profile display will be added automatically in the case no picture is available
            </p>
          </div>
        </div>

        {/* Department */}
        <div className="mt-4">
          <FormField label="Departement" required> 
            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex items-center justify-between w-full h-10 p-2 border-2 border-black rounded-lg bg-gray-100 cursor-pointer"
                onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
              >
                <span>{formData.department || "Select department"}</span>
                <ChevronDown />
              </div>
              
              {showDepartmentDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-200 overflow-auto">
                  {departments.map((option) => (
                    <div
                      key={option.value}
                      className="cursor-pointer hover:bg-gray-100 py-2 px-3"
                      onClick={() => {
                        setFormData({...formData, department: option.value});
                        setShowDepartmentDropdown(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                  <div className="py-4 pl-3 sm:pl-6 border-gray-200">
                    <button
                      type="button"
                      className="cursor-pointer w-auto px-3 sm:px-5 py-1 bg-[#757575] text-white rounded-lg font-medium text-sm"
                      onClick={() => {
                        setShowAddDepartment(true);
                        setShowDepartmentDropdown(false);
                      }}
                    >
                      Add New Department
                    </button>
                  </div>
                </div>
              )}
            </div>
          </FormField>
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField label="Phone Number" required>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full bg-gray-100 p-2 rounded-lg border-2 border-black"
              required
            />
          </FormField>

          <FormField label="Email">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-gray-100 p-2 rounded-lg border-2 border-black"
            />
          </FormField>
        </div>

        {/* Availability Section */}
        <div className="mt-6 md:mt-10">
          <h2 className="text-lg font-semibold mb-2">Availability</h2>
          <div className="mb-4 space-y-1">
            {availability.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm w-full max-w-md rounded"
              >
                <span className="text-sm sm:text-base">{item.day}</span> 
                <div className="flex gap-2 sm:gap-4 items-center justify-center">
                  <span className="text-sm sm:text-base">{item.startTime} - {item.endTime}</span>
                  <button
                    type="button"
                    className="text-black font-normal text-lg cursor-pointer"
                    onClick={() => handleRemoveSchedule(index)}
                  >
                   x
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto bg-[#757575] text-white px-4 sm:px-8 md:px-40 py-1 rounded-md font-medium text-sm sm:text-base"
          >
            Add Schedule
          </button>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6"> 
            <Link href="../../admin/technical-staff">     
            <button
            type="button"
            
            className="w-full sm:w-auto px-6 sm:px-10 py-1 border-2 border-black rounded-xl text-center font-outfit"
          >
            Cancel
          </button>

            </Link>
        
 
        <button
            type="submit"
            className="w-full sm:w-auto px-6 sm:px-16 md:px-24 py-1 bg-[#0060B4] text-white rounded-xl text-center font-outfit mt-2 sm:mt-0"
          >
            Update
          </button>


      
        </div>
      </form>

      {showModal && (
        <PopupScheduleModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddSchedule}
        />
      )}
      
      {/* Add this section to render the Department Popup */}
      {showAddDepartment && (
        <div className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-50 px-4">
          <AddDepartmentPopup
            onClose={() => setShowAddDepartment(false)}
            onAdd={handleAddNewDepartment}
          />
        </div>
      )}
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <div className="w-full">
      <label className="text-sm md:text-base font-medium text-black">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function AddDepartmentPopup({ onClose, onAdd }) { 
  const [newDepartment, setNewDepartment] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAddNewDepartment = async () => {
    if (!newDepartment.trim()) return;
    setAdding(true);
    const success = await onAdd(newDepartment);
    setAdding(false);
    if (success) {
      setNewDepartment("");
      onClose();
    }
  };

  return (
    <div className="z-50 bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-200 flex flex-col w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-4">  
      <div className="flex"> 
        <h1 className="text-xl sm:text-2xl pl-0 sm:pl-2 pt-2 sm:pt-3 pb-6 sm:pb-10 font-oxanium font-semibold">Add New Departement's Information</h1>
      </div> 

      <div className="w-full pb-8 sm:pb-14">
        <label htmlFor="departmentName" className="py-2 px-1 block">Departement's name <span className="text-orange-600">*</span></label>
        <input
          id="departmentName"
          type="text"
          className="w-full h-10 bg-white p-2 rounded-lg border-2 border-black focus:outline-none mb-2"
          value={newDepartment}
          onChange={(e) => setNewDepartment(e.target.value)}
          placeholder="New department name"
          autoFocus
          disabled={adding}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row justify-end gap-2 w-full"> 
        <button
          type="button"
          className="w-full sm:w-auto px-6 sm:px-14 py-1 rounded-xl border-2 border-black bg-white text-black mb-2 sm:mb-0"
          onClick={onClose}
          disabled={adding}
        >
          Cancel
        </button>
        <button
          type="button"
          className="w-full sm:w-auto px-6 sm:px-16 md:px-24 py-1 rounded-xl bg-[#0060B4] text-white"
          onClick={handleAddNewDepartment}
          disabled={adding || !newDepartment.trim()}
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
} 

export default WorkerDetails;