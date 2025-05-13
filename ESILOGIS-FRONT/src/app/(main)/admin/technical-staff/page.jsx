"use client";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import StaffTable from "@/app/components/staff-table/Stafftable"; 
import arrows from "../../../../../public/Images/arrows.svg";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminTechnicalStaff() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch staff data when component mounts
    fetchStaffData();
  }, []);

  // Function to determine if a technician is available based on work schedule
  const calculateAvailability = (workSchedules) => {
    if (!workSchedules || workSchedules.length === 0) {
      return "Not available";
    }

    const now = new Date();
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = days[now.getDay()];
    
    // Find today's schedule if it exists
    const todaySchedule = workSchedules.find(schedule => schedule.day === currentDay);
    
    if (!todaySchedule) {
      return "Not available"; // No schedule for today
    }
    
    // Get current time in the same format as the schedule times
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;
    
    // Extract hours and minutes from schedule times
    const startTime = new Date(todaySchedule.startTime);
    const endTime = new Date(todaySchedule.endTime);
    
    const startTimeInMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endTimeInMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    
    // Check if current time is within work schedule
    if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
      return "Available";
    } else {
      return "Not available";
    }
  };

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      // Real API call to the backend
      const response = await fetch('http://localhost:3001/api/technicians', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("API response:", result);
      
      if (result.success && Array.isArray(result.data)) {
        // Transform the API data to match our component's expected format
        const formattedTechnicians = result.data.map(tech => ({
          id: tech.id.toString(),
          firstName: tech.firstName,
          lastName: tech.lastName,
          email: tech.email,
          phoneNumber: tech.phoneNumber || "Not provided",
          department: tech.department?.name || "Unknown Department",
          departmentId: tech.departmentId,
          // Calculate availability based on work schedule
          availability: tech.isRetired ? "Desactivated" : calculateAvailability(tech.workSchedules),
          profile: null, // API doesn't appear to provide profile images
          // Store the original data for reference
          originalData: tech
        }));
        
        setTechnicians(formattedTechnicians);
      } else {
        throw new Error("Invalid data format received from API");
      }
    } catch (err) {
      console.error("Failed to fetch staff data:", err);
      setError(err.message);
      // You can either show an error or fallback to sample data
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

// Handler for changing staff status
const handleStatusChange = async (ids, status) => {
  try {
    // Convert UI status to backend status
    const backendStatus = status === "Desactivated" ? "retired" : "active";
    
    // Process each technician individually
    const updatePromises = ids.map(id => 
      fetch(`http://localhost:3001/api/technicians/${id}`, {
        method: 'PUT', // or PUT depending on your API
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({ isRetired: backendStatus === "retired" })
      })
    );
    
    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    
    // Check if any request failed
    if (results.some(res => !res.ok)) {
      throw new Error("One or more technician updates failed");
    }
    
    // Refresh data after update
    await fetchStaffData();
    return true;
  } catch (err) {
    console.error("Failed to update staff status:", err);
    
    // Fallback UI update
    setTechnicians(prev => 
      prev.map(tech => 
        ids.includes(tech.id) ? {...tech, availability: status} : tech
      )
    );
    return false;
  }
};

  // Handler for viewing staff details
  const handleViewStaff = (id) => {
    router.push(`/admin/technical-staff/worker-details?id=${id}`);
  };

  // Handler for editing staff
  const handleEditStaff = (id) => {
    router.push(`/admin/technical-staff/edit-worker-details?id=${id}`);
  };

  // Department options from API
  const [departmentOptions, setDepartmentOptions] = useState([
    "IT", 
    "Engineering", 
    "Maintenance", 
    "Administration", 
    "Logistics"
  ]);

  // Fetch departments for the dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/departments', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            setDepartmentOptions(result.data.map(dept => dept.name));
          }
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };
    
    fetchDepartments();
  }, []);

  // Mobile detection
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

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden"> 
      <div className="hidden sm:block absolute top-0 right-0 z-10"> 
        <Image src={arrows} alt="" width={212}/>
      </div>
      
     
      
      <div className={`w-full z-30 ${isMobile ? 'mt-28' : 'ml-[140px]'}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px]">
            Technical Staff
          </h1>
        </div>

        <div className="h-[calc(100vh-150px)]">
          <StaffTable
            technicians={technicians}
            loading={loading}
            error={error}
            onStatusChange={handleStatusChange}
            onView={handleViewStaff}
            onEdit={handleEditStaff}
            addStaffLink="/admin/technical-staff/add-worker"
            departmentOptions={departmentOptions}
            availabilityOptions={["Available", "Not available", "Desactivated"]}
            onRefresh={fetchStaffData}
          />
        </div>
      </div>
    </section>
  );
}