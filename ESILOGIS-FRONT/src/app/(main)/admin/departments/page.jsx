"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import DepartmentsTable from "@/app/components/Tables/DepartmentsTable";
import arrows from "../../../../../public/Images/arrows.svg";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Loader, AlertCircle, CheckCircle, XCircle, InfoIcon } from "lucide-react";

export default function DepartmentsPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showAddDepartmentPopup, setShowAddDepartmentPopup] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Add toast state
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  // Toast notification helper
  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: "", type: "success" });
    }, 3000);
  };

  // Fetch departments from API - converted to useCallback to allow reuse
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/departments', {
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
      console.log('Fetched departments:', data);
      
      // Handle different response formats
      const departmentData = Array.isArray(data) ? data : 
                          (data && Array.isArray(data.data)) ? data.data : [];
      
      setDepartments(departmentData);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError(err.message || 'Failed to load departments');
      showToast('Failed to load departments', 'error'); // Add toast
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initial fetch
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments, refreshTrigger]); // Add refreshTrigger dependency

  // Check for mobile view
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Handler for adding a new department
  const handleAddDepartment = async (departmentName) => {
    try {
      showToast('Adding department...', 'info'); // Loading toast
      
      const response = await fetch('http://localhost:3001/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: departmentName })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const newDepartment = await response.json();
      console.log('Added new department:', newDepartment);
      
      // Option 1: Update state directly AND refresh
      setDepartments(prev => [...prev, newDepartment]);
      
      // Option 2: Trigger a refresh to ensure data consistency
      setRefreshTrigger(prev => prev + 1);
      
      setShowAddDepartmentPopup(false);
      showToast('Department added successfully', 'success'); // Success toast
      return true;
    } catch (err) {
      console.error('Error adding department:', err);
      showToast(`Failed to add department: ${err.message}`, 'error'); // Error toast
      return false;
    }
  };

  // Handle deleting a department
  const handleDeleteDepartment = async (id) => {
    try {
      showToast('Deleting department...', 'info'); // Loading toast
      
      const response = await fetch(`http://localhost:3001/api/departments/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Option 1: Update local state after successful deletion (optimistic update)
      setDepartments(prev => prev.filter(department => department.id !== id));
      
      // Option 2: Trigger a refresh to ensure data consistency with server
      setRefreshTrigger(prev => prev + 1);
      
      showToast('Department deleted successfully', 'success'); // Success toast
      return true;
    } catch (err) {
      console.error('Error deleting department:', err);
      showToast(`Failed to delete department: ${err.message}`, 'error'); // Error toast
      return false;
    }
  };

  // Handle editing a department
  const handleEditDepartment = async (id, newName) => {
    try {
      showToast('Updating department...', 'info'); // Loading toast
      
      const response = await fetch(`http://localhost:3001/api/departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newName })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const updatedDepartment = await response.json();
      
      // Option 1: Update local state after successful update (optimistic update)
      setDepartments(prev => prev.map(department => 
        department.id === id ? { ...department, ...updatedDepartment } : department
      ));
      
      // Option 2: Trigger a refresh to ensure data consistency with server
      setRefreshTrigger(prev => prev + 1);
      
      showToast('Department updated successfully', 'success'); // Success toast
      return true;
    } catch (err) {
      console.error('Error updating department:', err);
      showToast(`Failed to update department: ${err.message}`, 'error'); // Error toast
      return false;
    }
  };

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
      <div className="hidden sm:block absolute top-0 right-0 z-10">
        <Image src={arrows} alt="" width={212} />
      </div>

      {/* Toast Component */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center ${
          toast.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : toast.type === 'error'
            ? 'bg-red-50 text-red-800 border border-red-200'
            : toast.type === 'info'
            ? 'bg-blue-50 text-blue-800 border border-blue-200'
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {toast.type === 'error' && <XCircle className="h-5 w-5 mr-2" />}
          {toast.type === 'info' && <InfoIcon className="h-5 w-5 mr-2" />}
          {toast.type === 'warning' && <AlertCircle className="h-5 w-5 mr-2" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className={`w-full ${isMobile ? "mt-10" : "ml-[129px]"}`}>
        <div className="">
          <h1 className="p-6 font-semibold text-[26.07px]">
            Departments
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 text-[#0060B4] animate-spin" />
          </div>
        ) : error ? (
          <div className="mx-4 sm:mx-8 my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              <p className="font-bold">Error loading departments</p>
            </div>
            <p>{error}</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <DepartmentsTable 
              departments={departments}
              onAddDepartment={() => setShowAddDepartmentPopup(true)}
              onDeleteDepartment={handleDeleteDepartment}
              onEditDepartment={handleEditDepartment}
            />
          </div>
        )}
      </div>

      {showAddDepartmentPopup && (
        <AddDepartmentPopup 
          onClose={() => setShowAddDepartmentPopup(false)}
          onSave={handleAddDepartment}
        />
      )}
    </section>
  );
}

function AddDepartmentPopup({ onClose, onSave }) {
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!departmentName.trim()) return;
    
    setLoading(true);
    try {
      const success = await onSave(departmentName);
      if (success) {
        setDepartmentName(''); // Reset input field
      }
    } catch (err) {
      console.error('Error in save operation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-[20px] p-6 w-full max-w-[450px] mx-4 shadow-xl border-2 border-gray-200">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-[#1E1E1E]">Add New Department Information</h2>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1E1E1E]">
              Department Name<span className="text-[#FF0000]">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-[#E5E7EB] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0060B4] text-sm"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="Enter department name"
              required
              disabled={loading}
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E7EB] rounded-[10px] hover:bg-gray-50 text-sm font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#0060B4] text-white rounded-[10px] hover:bg-[#0056A4] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!departmentName.trim() || loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}