'use client';

import WorkerDetails from '@/app/components/Details/worker-edit-details';
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import arrows from "../../../../../../public/Images/arrows.svg";
import { useEffect, useState } from "react"; 
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";
import Image from "next/image";
import { useSearchParams, useRouter } from 'next/navigation';

export default function AdminEditTechnicalStaff() {
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const workerId = searchParams.get('id');
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add states for departments
  const [departments, setDepartments] = useState([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState(null);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');

  // Format time from API timestamp to readable hours format
  const formatTimeToHours = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return "00:00";
    }
  };
  
  // Format day from API format (e.g., "MONDAY") to display format ("Monday")
  const formatDay = (day) => {
    return day.charAt(0) + day.slice(1).toLowerCase();
  };

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setDepartmentLoading(true);
      setDepartmentError(null);
      
      console.log("Fetching departments...");
      
      const response = await fetch('http://localhost:3001/api/departments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const apiData = result.data || result; // Handle different response formats
      
      // Log the raw API response
      console.log("Raw departments data:", apiData);
      
      // Transform departments to match component expectations
      // Assuming the API returns an array of { id, name } objects
      const formattedDepartments = Array.isArray(apiData) 
        ? apiData.map(dept => ({
            value: dept.id.toString(), // Important: component likely expects string values
            label: dept.name
          }))
        : [];
      
      console.log("Formatted departments for component:", formattedDepartments);
      setDepartments(formattedDepartments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartmentError(error.message || "Failed to load departments");
    } finally {
      setDepartmentLoading(false);
    }
  };
  
  // Handle adding a new department
  const handleAddDepartment = async () => {
    try {
      if (!newDepartmentName.trim()) {
        alert("Department name cannot be empty");
        return;
      }
      
      setDepartmentLoading(true);
      
      const response = await fetch('http://localhost:3001/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newDepartmentName.trim() })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Department added:", result);
      
      // Refresh departments list
      await fetchDepartments();
      
      // Close modal and reset input
      setShowAddDepartmentModal(false);
      setNewDepartmentName('');
      
      // Show success message
      alert(`Department "${newDepartmentName}" added successfully!`);
    } catch (error) {
      console.error("Error adding department:", error);
      alert(`Failed to add department: ${error.message || "Unknown error"}`);
    } finally {
      setDepartmentLoading(false);
    }
  };

  // Fetch worker data from API
  const fetchWorkerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching technician data for ID: ${workerId}`);
      
      const response = await fetch(`http://localhost:3001/api/technicians/${workerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const data = result.data || result; // Handle different response formats
      
      console.log("API response data:", data);
      
      // Transform the API data to match component expected format
      const formattedWorker = {
        id: data.id.toString(),
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        department: data.department?.name || 'Unknown Department',
        departmentId: data.departmentId?.toString() || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        isRetired: data.isRetired || false,
        // Format work schedules into the availability array
        availability: Array.isArray(data.workSchedules) 
          ? data.workSchedules.map(schedule => ({
              day: formatDay(schedule.day),
              startTime: formatTimeToHours(schedule.startTime),
              endTime: formatTimeToHours(schedule.endTime)
            }))
          : [],
        profileImage: "/Images/account_circle2.svg", // Default profile image
        originalData: data // Store original data for reference
      };
      
      console.log("Formatted worker data:", formattedWorker);
      setWorker(formattedWorker);
    } catch (error) {
      console.error("Error fetching worker data:", error);
      setError(error.message || "Failed to load technician data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch worker data and departments when component mounts
  useEffect(() => {
    fetchDepartments(); // Fetch departments
    
    if (workerId) {
      fetchWorkerData();
    } else {
      setError("No worker ID provided");
      setLoading(false);
    }
  }, [workerId]);

  // Set breadcrumb navigation items
  const breadcrumbItems = [
    { label: 'Technical Staff', href: "/admin/technical-staff" }, 
    { label: 'Details', href: `/admin/technical-staff/worker-details?id=${workerId}` },
    { label: 'Edit', href: "#" },
  ];

  // Handle mobile responsive layout
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);

      const handleResize = () => {
        setIsMobile(window.innerWidth < 640);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Handle save action with API integration
  const handleSave = async (updatedWorker) => {
    try {
      console.log("Saving worker data:", updatedWorker);
      setLoading(true);
      
      // Format availability schedules for the API
      const workSchedules = updatedWorker.availability.map(schedule => ({
        day: schedule.day.toUpperCase(), // API expects uppercase day names
        startTime: schedule.startTime ? new Date(`1970-01-01T${schedule.startTime}:00`).toISOString() : null,
        endTime: schedule.endTime ? new Date(`1970-01-01T${schedule.endTime}:00`).toISOString() : null,
      }));
      
      // Prepare the payload for the API
      const techniciansData = {
        firstName: updatedWorker.firstName,
        lastName: updatedWorker.lastName,
        email: updatedWorker.email,
        phoneNumber: updatedWorker.phoneNumber || null,
        departmentId: parseInt(updatedWorker.departmentId) || null,
        workSchedules: workSchedules
      };
      
      console.log("Sending data to API:", techniciansData);
      
      // Make API call to update technician
      const response = await fetch(`http://localhost:3001/api/technicians/${workerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(techniciansData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("API response:", result);
      
      // Show success message
      alert(`Worker ${updatedWorker.firstName} ${updatedWorker.lastName} updated successfully!`);
      
      // Navigate back to worker detail page
      router.push(`/admin/technical-staff/worker-details?id=${workerId}`);
    } catch (error) {
      console.error("Error saving worker data:", error);
      alert(`Failed to save worker data: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    // Navigate back to worker detail page
    router.push(`/admin/technical-staff/worker-details?id=${workerId}`);
  };

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden"> 
      <div className="hidden sm:block absolute top-0 right-0 z-10"> 
        <Image src={arrows} alt="" width={212}/>
      </div>
      
     
      
      {/* Add Department Modal */}
      {showAddDepartmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Department</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name
              </label>
              <input
                type="text"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter department name"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddDepartmentModal(false);
                  setNewDepartmentName('');
                }}
                className="px-4 py-2 text-sm text-black border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDepartment}
                disabled={departmentLoading}
                className="px-4 py-2 text-sm text-white bg-[#0060B4] rounded-md hover:bg-[#004d91] disabled:bg-gray-400"
              >
                {departmentLoading ? 'Adding...' : 'Add Department'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className={`w-full z-30 ${isMobile ? 'mt-10' : 'ml-[129px]'}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px] border-2">
            <Breadcrumb items={breadcrumbItems}/>
          </h1>
        </div>

        {/* Error display with retry button */}
        {error && (
          <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-lg mb-1">Error</p>
                <p className="mb-3 md:mb-0">{error}</p>
              </div>
              <button 
                onClick={fetchWorkerData}
                className="px-6 py-2 bg-[#0060B4] text-white rounded-xl font-medium hover:bg-[#004d91] transition-colors self-start md:self-center mt-2 md:mt-0"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Department error display */}
        {departmentError && (
          <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-lg mb-1">Department Error</p>
                <p className="mb-3 md:mb-0">{departmentError}</p>
              </div>
              <button 
                onClick={fetchDepartments}
                className="px-6 py-2 bg-[#0060B4] text-white rounded-xl font-medium hover:bg-[#004d91] transition-colors self-start md:self-center mt-2 md:mt-0"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="px-10 py-15">
          <WorkerDetails 
            workerId={workerId}
            workerData={worker}
            isLoading={loading}
            onSave={handleSave}
            onCancel={handleCancel}
            returnPath={`/admin/technical-staff/worker-details?id=${workerId}`}
            departments={departments}
            onAddDepartment={handleAddDepartment}
            departmentsLoading={departmentLoading}
          />
        </div>
      </div>
    </section>
  );
}