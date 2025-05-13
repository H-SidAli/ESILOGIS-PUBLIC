"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import arrows from "../../../../../../public/Images/arrows.svg";
import { useEffect, useState } from "react"; 
import { ChevronRight, AlertCircle, Loader } from "lucide-react";
import Image from "next/image";  
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import WorkOrderDetails from "@/app/components/Details/work-order-details";  
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav.jsx";

export default function WorkOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  console.log("URL params:", params);
  console.log("Work order ID from URL:", id);

  const [isMobile, setIsMobile] = useState(false);
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });
  const [currentWorker, setCurrentWorker] = useState({
    id: "",
    name: "Loading...",
    avatar: "?",
    role: "Technician"
  });
  
  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: '' }), 3000);
  };
  
  // Check for responsive layout
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

  // Get token function
  const getToken = () => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast('Authentication required. Please login again.', 'error');
        setTimeout(() => router.push('/login'), 1500);
        return null;
      }
      return token;
    }
    return null;
  };
  
  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = getToken();
        if (!token) return;
        
        const response = await fetch("http://localhost:3001/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => router.push('/login'), 1500);
            return;
          }
          throw new Error("Failed to fetch user profile");
        }
        
        const data = await response.json();
        if (data && data.success) {
          const profile = data.data || {};
          // Get first letter of first and last name for avatar
          const initials = `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`;
          
          setCurrentWorker({
            id: profile.id || "",
            name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || "Unknown",
            avatar: initials || "?",
            role: profile.role || "Technician"
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, [router]);
  
  // Handle initial route with no ID
  useEffect(() => {
    if (!id) {
      console.error("No work order ID provided in URL parameters");
      setError("Missing work order ID. Please select a valid work order.");
      setLoading(false);
    }
  }, [id]);
  
  // Map API status to UI status
  const mapStatusFromAPI = (apiStatus) => {
    if (!apiStatus) return "Pending";
    const statusMap = {
      "IN_PROGRESS": "In Progress",
      "COMPLETED": "Complete",
      "PENDING": "Pending", 
      "CANCELLED": "Cancelled",
      "DENIED": "Denied",
      "PAUSED": "Paused"
    };
    return statusMap[apiStatus] || apiStatus;
  };

  // Map API priority to UI priority
  const mapPriorityFromAPI = (apiPriority) => {
    if (!apiPriority) return "Low";
    const priorityMap = {
      "HIGH": "High",
      "MEDIUM": "Medium",
      "MED": "Medium",
      "LOW": "Low"
    };
    return priorityMap[apiPriority] || apiPriority;
  };
  
  // Format assignees from API response
  const formatAssignees = (assignees) => {
    if (!Array.isArray(assignees)) return [];
    
    return assignees.map(assignment => {
      const person = assignment.person || {};
      const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email || 'Unknown';
      // Get first letter for avatar
      const initials = name.charAt(0).toUpperCase();
      
      return {
        id: person.id,
        name,
        avatar: initials,
        email: person.email
      };
    });
  };
  
  // Format intervention timeline from API data
  const formatInterventionTimeline = (intervention) => {
    const timeline = [];
    
    if (intervention.createdAt) {
      const date = new Date(intervention.createdAt);
      timeline.push({
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "Work Order Created"
      });
    }
    
    // Add status changes if available
    if (intervention.statusLogs && Array.isArray(intervention.statusLogs)) {
      intervention.statusLogs.forEach(log => {
        if (log.createdAt) {
          const date = new Date(log.createdAt);
          timeline.push({
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: `Status changed to ${mapStatusFromAPI(log.newStatus)}`
          });
        }
      });
    }
    
    // Add assignment events
    if (intervention.assignees && Array.isArray(intervention.assignees)) {
      intervention.assignees.forEach(assignment => {
        if (assignment.createdAt) {
          const date = new Date(assignment.createdAt);
          const personName = assignment.person ? 
            `${assignment.person.firstName || ''} ${assignment.person.lastName || ''}`.trim() : 
            'Unknown';
            
          timeline.push({
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: `Assigned to ${personName}`
          });
        }
      });
    }
    
    // Sort by date (newest first)
    return timeline.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB - dateA;
    });
  };
  
  // Fetch intervention details by ID
  useEffect(() => {
    if (!id) return;
    
    console.log("Fetching intervention details for ID:", id);
    
    const fetchInterventionDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = getToken();
        if (!token) return;

        console.log("Making API request to fetch intervention details");
        
        const response = await fetch(
          `http://localhost:3001/api/intervention/${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) {
          if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => router.push('/login'), 1500);
            return;
          }
          throw new Error(`Failed to fetch details: ${response.status}`);
        }
        
        const result = await response.json();
        const intervention = result.data || result;

        console.log("Processing intervention data:", intervention);
        
        if (!intervention) {
          throw new Error(`Intervention with ID ${id} not found`);
        }
        
        // Format the data for the WorkOrderDetails component
        setWorkOrder({
          id: intervention.id,
          location: intervention.location?.name || "Not specified",
          description: intervention.description || "No description provided",
          equipment: intervention.equipment ? 
            `${intervention.equipment.inventoryCode} - ${intervention.equipment.type?.name || 'Unknown Type'}` : 
            "Not specified",
          priority: mapPriorityFromAPI(intervention.priority) || "Low",
          pictures: intervention.pictures || [], // Assuming pictures is an array of image paths or objects
          status: mapStatusFromAPI(intervention.status) || "Pending",
          assignees: formatAssignees(intervention.assignees || []),
          technicianActions: intervention.technicianActions || "",
          partsUsed: intervention.partsUsed || "",
          notes: intervention.notes || "",
          interventionTimeline: formatInterventionTimeline(intervention)
        });
      } catch (error) {
        console.error("Error fetching intervention details:", error);
        setError(error.message);
      } finally {
        console.log("Fetch completed, setting loading to false");
        setLoading(false);
      }
    };

    fetchInterventionDetails();
  }, [id, router]);


   const breadcrumbItems = [
      { label: 'Work orders', href:"/admin/workOrders" },
      { label: `Details #${id}`, href:"#" }
    ];
 
  return (


     <section className="w-full min-h-screen flex flex-col sm:flex-row items-start justify-center bg-gray-100 relative overflow-x-hidden"> 
          <div className="hidden sm:block absolute top-0 right-0 z-10"> 
            <Image src={arrows} alt="" width={212}/>
          </div>
         
          <div className={`w-full z-30 ${isMobile ? 'pt-28' : 'sm:pl-[140px]'}`}>
            <div className="mb-2">
              <h1 className="font-oxanium p-3 sm:p-6 font-semibold text-base sm:text-[26.07px] border-2 overflow-x-auto">
                <Breadcrumb items={breadcrumbItems}/>
              </h1>
            </div>
     
            <div className="p-2 sm:p-4 flex justify-center">
            
    
              {loading ? (
                <div className="flex items-center justify-center w-full h-64">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Loading report details...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="w-full max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    <h2 className="text-lg font-semibold text-red-800">Error Loading Report</h2>
                  </div>
                  <p className="text-red-700 mb-4">{error}</p>
                  <Link href="../../admin/reported-issues" 
                        className="flex items-center mt-2 text-blue-600 hover:text-blue-800 transition-colors">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Reported Issues
                  </Link>
                </div>
              ) : (
                 <WorkOrderDetails 
              location={workOrder.location}
              description={workOrder.description}
              equipment={workOrder.equipment}
              priority={workOrder.priority}
              pictures={workOrder.pictures}
              status={workOrder.status}
              assignees={workOrder.assignees}
              technicianActions={workOrder.technicianActions}
              partsUsed={workOrder.partsUsed}
              notes={workOrder.notes}
              interventionTimeline={workOrder.interventionTimeline}
              id={id}
              role="technician"

            />
              )}
            </div>
          </div>
        </section>
  );
}

