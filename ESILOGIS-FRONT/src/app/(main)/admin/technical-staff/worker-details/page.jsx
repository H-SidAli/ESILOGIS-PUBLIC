'use client';
import Nav from '@/app/components/NavBar/Nav';
import Side from '@/app/components/sidebar/Sidebar';
import WorkerDetails from '@/app/components/Details/WorkerDetails';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/app/components/bread-crumb-nav/Bread-crumb-nav';
import arrows from "../../../../../../public/Images/arrows.svg";

export default function EditWorkerDetailPage() {
    const [isMobile, setIsMobile] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const workerId = searchParams.get('id'); // Get ID from query parameters
    const [worker, setWorker] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
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
    
    // Fetch worker data from API
    useEffect(() => {
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
            departmentId: data.departmentId,
            email: data.email || '',
            phoneNumber: data.phoneNumber || 'Not provided',
            isRetired: data.isRetired || false,
            // Format work schedules into the availability array with hours format
            availability: Array.isArray(data.workSchedules) 
              ? data.workSchedules.map(schedule => ({
                  day: formatDay(schedule.day),
                  hours: `${formatTimeToHours(schedule.startTime)} - ${formatTimeToHours(schedule.endTime)}`
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
      
      if (workerId) {
        fetchWorkerData();
      } else {
        setError("No worker ID provided");
        setLoading(false);
      }
    }, [workerId]);
    
    // Handle editing worker details
    const handleEdit = () => {
      router.push(`/admin/technical-staff/edit-worker-details?id=${workerId}`);
    };
    
    // Handle back button click
    const handleBack = () => {
      router.push("/admin/technical-staff");
    };
   
    const breadcrumbItems = [
      { label: 'Technical Staff', href: "/admin/technical-staff" },
      { label: 'Worker Details', href: "#" }
    ];
    
    return (
      <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
        <div className="hidden sm:block absolute top-0 right-0 z-10">
          <Image src={arrows} alt="" width={212}/>
        </div>
         
        {!isMobile && (
          <div className="fixed z-50 h-[749px] left-0 w-[140px] p-1">
            <Side className="z-50" firstName='ADI' lastName='ADLAN' role='admin' />
          </div>
        )}
         
        {isMobile && (
          <div className="fixed z-50 w-full p-1 h-28">
            <Nav className="z-50" firstName='ADI' lastName='ADLAN' role='admin' />
          </div>
        )}
         
        <div className={`w-full z-30 ${isMobile ? 'mt-10' : 'ml-[129px]'}`}>
          <div className="">
            <h1 className="font-oxanium p-6 font-semibold text-[26.07px] h-[89px] border">
              <Breadcrumb items={breadcrumbItems}/>
            </h1>
          </div>
   
          {error && (
            <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
   
          <div className="w-full flex flex-col items-center justify-center mt-2 px-3 py-2 sm:px-5">
            <WorkerDetails 
              workerId={workerId} 
              workerData={worker} 
              isEditing={false}
              isLoading={loading}
              onBack={handleBack}
              onEdit={handleEdit}
            />
          </div>
        </div>
      </section>
    );
}