'use client';

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

function AddTechnicalStaffForm() {
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // API related states
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState({
    departments: true,
    submit: false
  });
  const [error, setError] = useState({
    departments: null,
    submit: null
  });
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    departmentId: "",
    departmentName: "",
    phoneNumber: "",
    email: "",
    password: "",
  });

  // Fetch departments from backend when component mounts
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(prev => ({ ...prev, departments: true }));
      setError(prev => ({ ...prev, departments: null }));

      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:3001/api/departments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats (direct array or nested in data property)
      const departmentsData = data.success && Array.isArray(data.data) 
        ? data.data 
        : Array.isArray(data) ? data : [];
      
      setDepartments(departmentsData);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError(prev => ({ ...prev, departments: err.message }));
      showToast(`Failed to load departments: ${err.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, departments: false }));
    }
  };

  // Click outside handler for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDepartmentDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show toast message
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 5000);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add new department to backend
  const handleAddNewDepartment = async (newDepartment) => {
    if (!newDepartment.trim()) return;
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:3001/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newDepartment })
      });

      if (!response.ok) {
        throw new Error(`Failed to create department: ${response.status}`);
      }

      const data = await response.json();
      
      // Get the newly created department (handle different response formats)
      const newDept = data.success && data.data ? data.data : data;
      
      // Add to departments list and select it
      setDepartments([...departments, newDept]);
      setFormData({
        ...formData, 
        departmentId: newDept.id, 
        departmentName: newDept.name
      });
      
      showToast(`Department "${newDept.name}" added successfully`, 'success');
      setShowAddDepartment(false);
    } catch (err) {
      console.error("Error creating department:", err);
      showToast(`Failed to add department: ${err.message}`, 'error');
    }
  };

  // Submit form to create technician
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(prev => ({ ...prev, submit: true }));
      setError(prev => ({ ...prev, submit: null }));
      
      // Form validation
      if (!formData.firstName || !formData.lastName || !formData.departmentId || !formData.phoneNumber) {
        throw new Error('Please fill all required fields');
      }
      
      if (createAccount && !formData.password) {
        throw new Error('Password is required when creating an account');
      }

      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Format data for API
      const technicianData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        departmentId: formData.departmentId, // Note: Backend has a typo in the field name
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        createUserAccount: createAccount
      };

      // Only include password if creating an account
      if (createAccount) {
        technicianData.password = formData.password;
      }

      const response = await fetch('http://localhost:3001/api/technicians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(technicianData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create technician: ${response.status}`);
      }

      // Success
      setSuccess(true);
      showToast('Technical staff member added successfully!', 'success');
      
      // Redirect after delay
      setTimeout(() => {
        router.push('/admin/technical-staff');
      }, 2000);
      
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(prev => ({ ...prev, submit: err.message }));
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  return (
    <div className="flex w-full justify-center items-center bg-white py-4 md:py-10 mb-10 px-2 sm:px-4 rounded-3xl shadow-md">
      {/* Toast notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 py-2 px-4 rounded-md shadow-lg flex items-center ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
          <span>{toast.message}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-4xl px-2 sm:px-4 md:px-10 py-4 md:py-10 bg-white">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-black mb-4 md:mb-6">
          Add New Technical Staff
        </h1>

        {/* Mobile Profile Picture */}
        <div className="flex justify-center w-full md:hidden mb-6">
          <div className="flex flex-col items-center justify-start gap-2">
            <Image
              src="/Images/account_circle2.svg"
              alt="Profile"
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
              Note: a profile display will be added automatically if no picture is available
            </p>
          </div>
        </div>

        {/* Name and Profile Section */}
        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
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

          {/* Desktop Profile Picture */}
          <div className="hidden md:flex flex-col items-center justify-start gap-2 w-1/3">
            <Image
              src="/Images/account_circle2.svg"
              alt="Profile"
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
              Note: a profile display will be added automatically if no picture is available
            </p>
          </div>
        </div>

        {/* Department Dropdown */}
        <div className="mt-4">
          <FormField label="Department" required>
            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex items-center justify-between w-full h-10 p-2 border-2 border-black rounded-lg bg-gray-100 cursor-pointer"
                onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
              >
                <span>{formData.departmentName || "Select department"}</span>
                {loading.departments ? <Loader className="h-4 w-4 animate-spin" /> : <ChevronDown />}
              </div>
              
              {showDepartmentDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 border border-gray-200 overflow-auto">
                  {error.departments ? (
                    <div className="py-2 px-3 text-sm text-red-500">
                      <AlertCircle className="inline-block mr-1 h-4 w-4" />
                      {error.departments}
                    </div>
                  ) : loading.departments ? (
                    <div className="py-4 px-3 text-center">
                      <Loader className="h-5 w-5 mx-auto animate-spin mb-1" />
                      <p className="text-sm text-gray-500">Loading departments...</p>
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-gray-500">No departments found</div>
                  ) : (
                    departments.map((dept) => (
                      <div
                        key={dept.id}
                        className="cursor-pointer hover:bg-gray-100 py-2 px-3"
                        onClick={() => {
                          setFormData({
                            ...formData, 
                            departmentId: dept.id, 
                            departmentName: dept.name
                          });
                          setShowDepartmentDropdown(false);
                        }}
                      >
                        {dept.name}
                      </div>
                    ))
                  )}
                  <div className="py-4 pl-3 sm:pl-6 border-t border-gray-200 mt-1">
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

        {/* Contact Information */}
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

        {/* Account Creation Section */}
        <div className="mt-6 md:mt-10">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="createAccount"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="createAccount" className="text-sm sm:text-base text-gray-700">
              Do you want to create an account for the worker?
            </label>
          </div>

          {createAccount && (
            <FormField label="Password" required>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-gray-100 p-2 rounded-lg border-2 border-black"
                required={createAccount}
                minLength="8"
              />
            </FormField>
          )}
        </div>

        {/* Error message */}
        {error.submit && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error.submit}</span>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>Technical staff member added successfully! Redirecting...</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <Link href="/admin/technical-staff" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full px-6 sm:px-10 py-1 border-2 border-black rounded-xl text-center font-outfit"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 sm:px-16 md:px-24 py-1 bg-[#0060B4] text-white rounded-xl text-center font-outfit disabled:bg-blue-300"
            disabled={loading.submit || success}
          >
            {loading.submit ? (
              <span className="flex items-center justify-center">
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </span>
            ) : "Add"}
          </button>
        </div>
      </form>

      {/* Department Modal */}
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddNewDepartment = async () => {
    if (!newDepartment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onAdd(newDepartment);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="z-50 bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-200 flex flex-col w-full max-w-lg sm:max-w-xl md:max-w-2xl mx-4">
      <div className="flex">
        <h1 className="text-xl sm:text-2xl pl-0 sm:pl-2 pt-2 sm:pt-3 pb-6 sm:pb-10 font-oxanium font-semibold">
          Add New Department
        </h1>
      </div>

      <div className="w-full pb-8 sm:pb-14">
        <label htmlFor="departmentName" className="py-2 px-1 block">
          Department's name <span className="text-orange-600">*</span>
        </label>
        <input
          id="departmentName"
          type="text"
          className="w-full h-10 bg-white p-2 rounded-lg border-2 border-black focus:outline-none mb-2"
          value={newDepartment}
          onChange={(e) => setNewDepartment(e.target.value)}
          placeholder="New department name"
          autoFocus
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
        <button
          type="button"
          className="w-full sm:w-auto px-6 sm:px-14 py-1 rounded-xl border-2 border-black bg-white text-black mb-2 sm:mb-0"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="w-full sm:w-auto px-6 sm:px-16 md:px-24 py-1 rounded-xl bg-[#0060B4] text-white disabled:bg-blue-300"
          onClick={handleAddNewDepartment}
          disabled={isSubmitting || !newDepartment.trim()}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Adding...
            </span>
          ) : "Add"}
        </button>
      </div>
    </div>
  );
}

export default AddTechnicalStaffForm;