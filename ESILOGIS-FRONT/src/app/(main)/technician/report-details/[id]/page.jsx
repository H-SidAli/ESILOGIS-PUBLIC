"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import ReportedIssueDetails from "@/app/components/work-orders-detail/reported-issue-details";
import arrows from "../../../../../../public/Images/arrows.svg";
import Image from "next/image";
import Link from "next/link";
import { Loader, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";

export default function ReportIssueDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [isMobile, setIsMobile] = useState(false);
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        // First try to get user from sessionStorage to avoid unnecessary API calls
        try {
          const cachedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
          if (cachedUser && cachedUser.id) {
            console.log("Using cached user data");
            setCurrentWorker({
              id: cachedUser.id,
              name: `${cachedUser.firstName || ''} ${cachedUser.lastName || ''}`.trim() || cachedUser.email || "Unknown",
              avatar: `${cachedUser.firstName?.[0] || ''}${cachedUser.lastName?.[0] || ''}` || "?",
              role: cachedUser.role?.name || cachedUser.role || "Technician"
            });
            return; // Exit early if we have cached data
          }
        } catch (e) {
          console.warn("Error reading cached user:", e);
        }
        
        const token = getToken();
        if (!token) return;
        
        console.log("Fetching user profile...");
        
        // Try with /me endpoint
        const response = await fetch("http://localhost:3001/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          // If 404, try alternative endpoint
          if (response.status === 404) {
            console.log("First endpoint not found, trying alternative...");
            
            const alternativeResponse = await fetch("http://localhost:3001/api/users/me", {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });
            
            if (!alternativeResponse.ok) {
              // Try a third option if needed
              if (alternativeResponse.status === 404) {
                console.log("Second endpoint not found, trying third option...");
                
                const thirdAttempt = await fetch("http://localhost:3001/api/profile", {
                  headers: {
                    "Authorization": `Bearer ${token}`
                  }
                });
                
                if (!thirdAttempt.ok) {
                  if (thirdAttempt.status === 401) {
                    showToast('Session expired. Please login again.', 'error');
                    setTimeout(() => router.push('/login'), 1500);
                    return;
                  }
                  
                  // Last resort - use mock data in development mode
                  if (process.env.NODE_ENV === 'development') {
                    useMockUserData();
                    return;
                  }
                  
                  throw new Error(`All profile endpoints failed: ${thirdAttempt.status}`);
                }
                
                const data = await thirdAttempt.json();
                handleUserData(data);
                return;
              }
              
              if (alternativeResponse.status === 401) {
                showToast('Session expired. Please login again.', 'error');
                setTimeout(() => router.push('/login'), 1500);
                return;
              }
              
              // Try dev mode fallback
              if (process.env.NODE_ENV === 'development') {
                useMockUserData();
                return;
              }
              
              throw new Error(`Failed to fetch user profile: ${alternativeResponse.status}`);
            }
            
            const data = await alternativeResponse.json();
            handleUserData(data);
            return;
          }
          
          if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => router.push('/login'), 1500);
            return;
          }
          
          // Try dev mode fallback
          if (process.env.NODE_ENV === 'development') {
            useMockUserData();
            return;
          }
          
          throw new Error(`Failed to fetch user profile: ${response.status}`);
        }
        
        const data = await response.json();
        handleUserData(data);
        
        // Cache the user data for future use
        if (data && data.data) {
          sessionStorage.setItem('user', JSON.stringify(data.data));
        } else if (data) {
          sessionStorage.setItem('user', JSON.stringify(data));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        
        // For development, use mock data
        if (process.env.NODE_ENV === 'development') {
          useMockUserData();
        }
      }
    };
    
    // Helper function to process user data from different API formats
    const handleUserData = (data) => {
      const userData = data.data || data;
      
      // Get first letter of first and last name for avatar
      const initials = `${userData.firstName?.charAt(0) || ''}${userData.lastName?.charAt(0) || ''}`;
      
      setCurrentWorker({
        id: userData.id || "",
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email || "Unknown",
        avatar: initials || "?",
        role: userData.role?.name || userData.role || "Technician"
      });
    };
    
    // Helper to use mock data in development
    const useMockUserData = () => {
      console.log("Using mock user data for development");
      const mockUser = {
        id: "dev-123",
        firstName: "Dev",
        lastName: "User",
        email: "dev.user@example.com",
        role: "Technician"
      };
      
      setCurrentWorker({
        id: mockUser.id,
        name: `${mockUser.firstName} ${mockUser.lastName}`,
        avatar: "DU",
        role: mockUser.role
      });
      
      // Store mock data in session for consistency
      sessionStorage.setItem('user', JSON.stringify(mockUser));
    };
    
    fetchUserProfile();
  }, [router]);

  // Fetch work order details
  useEffect(() => {
    if (!id) {
      setError("Missing work order ID. Please select a valid work order.");
      setLoading(false);
      return;
    }
    
    const fetchWorkOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = getToken();
        if (!token) return;

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
          throw new Error(`Failed to fetch details: ${response.status}`);
        }

        const result = await response.json();
        const data = result.data || result;
        
        // Format the data
        setWorkOrder({
          id: data.id,
          location: data.location?.name || "Not specified",
          description: data.description || "No description provided",
          equipment: data.equipment?.inventoryCode 
            ? `${data.equipment.inventoryCode} - ${data.equipment.type?.name || 'Unknown'} - ${data.equipment.model || 'Unknown'}`
            : "Not specified",
          priority: mapPriorityFromAPI(data.priority),
          pictures: data.attachments?.map(a => a.filename) || [],
          status: mapStatusFromAPI(data.status),
          assignees: formatAssignees(data.assignees || []),
          technicianActions: data.action || "",
          partsUsed: data.partsUsed || "",
          notes: data.notes || "",
          timer: data.timeSpent ? formatTimeSpent(data.timeSpent) : "00:00:00",
          createdAt: new Date(data.createdAt).toLocaleDateString(),
          raw: data
        });
      } catch (error) {
        console.error("Error fetching work order details:", error);
        setError(error.message);
        
        // For demo purposes in development - provide sample data
        if (process.env.NODE_ENV === 'development') {
          setWorkOrder(getSampleWorkOrder(id));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrderDetails();
  }, [id, router]);

  // Sample data for development
  const getSampleWorkOrder = (id) => {
    return {
      id: id,
      location: "S7",
      description: "test",
      equipment: "13398 - Unknown - Unknown",
      priority: "High",
      pictures: [],
      status: "In Progress",
      assignees: [
        { id: 1, name: "A", avatar: "A" },
        { id: 2, name: "B", avatar: "B" },
        { id: 3, name: "C", avatar: "T" }
      ],
      technicianActions: "",
      partsUsed: "",
      notes: "",
      timer: "00:12:12",
      createdAt: "13/05/2025"
    };
  };

  // Format assignees from API response
  const formatAssignees = (assignees) => {
    return assignees.map(assignment => {
      const person = assignment.person || {};
      const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email || 'Unknown';
      const initials = name.charAt(0).toUpperCase();
      
      return {
        id: person.id,
        name,
        avatar: initials,
        email: person.email
      };
    });
  };

  // Format time spent (seconds to HH:MM:SS)
  const formatTimeSpent = (seconds) => {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${secs}`;
  };

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

  // Handle begin work order
  const handleBeginTask = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(
        `http://localhost:3001/api/intervention/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      // Show success toast
      showToast('Task started successfully');
      
      // Update local state
      setWorkOrder(prev => ({
        ...prev,
        status: "In Progress"
      }));
      
      // Navigate back to work orders list
      router.push("/technician/workOrders");
    } catch (error) {
      console.error("Error beginning task:", error);
      
      // Show error toast
      showToast(`Failed to start task: ${error.message}`, 'error');
      
      // For demo purposes - update status locally anyway
      if (process.env.NODE_ENV === 'development') {
        setWorkOrder(prev => ({
          ...prev,
          status: "In Progress"
        }));
        setTimeout(() => router.push("/technician/workOrders"), 500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle pause work order
  const handlePauseTask = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(
        `http://localhost:3001/api/intervention/${id}/pause`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      // Show success toast
      showToast('Task paused successfully');
      
      // Update local state & navigate back
      setWorkOrder(prev => ({
        ...prev,
        status: "Paused"
      }));
      router.push("/technician/workOrders");
      
    } catch (error) {
      console.error("Error pausing task:", error);
      
      // Show error toast
      showToast(`Failed to pause task: ${error.message}`, 'error');
      
      // For demo purposes - update status locally anyway
      if (process.env.NODE_ENV === 'development') {
        setWorkOrder(prev => ({
          ...prev,
          status: "Paused"
        }));
        setTimeout(() => router.push("/technician/workOrders"), 500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resume work order
  const handleResumeTask = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(
        `http://localhost:3001/api/intervention/${id}/resume`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      // Show success toast
      showToast('Task resumed successfully');
      
      // Update local state & navigate back
      setWorkOrder(prev => ({
        ...prev,
        status: "In Progress"
      }));
      router.push("/technician/workOrders");
      
    } catch (error) {
      console.error("Error resuming task:", error);
      
      // Show error toast
      showToast(`Failed to resume task: ${error.message}`, 'error');
      
      // For development
      if (process.env.NODE_ENV === 'development') {
        setWorkOrder(prev => ({
          ...prev,
          status: "In Progress"
        }));
        setTimeout(() => router.push("/technician/workOrders"), 500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Work Orders', href: "/technician/workOrders" },
    { label: 'Details', href: "#" }
  ];

  return (
    <section className="w-full min-h-screen flex flex-col sm:flex-row items-start justify-center bg-gray-100 relative overflow-x-hidden">
      {/* Arrow decoration */}
      <div className="hidden sm:block absolute top-0 right-0 z-10">
        <Image src={arrows} alt="" width={212} />
      </div>
      
      {/* Toast notification */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          toast.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
          {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 mr-2" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className={`w-full z-30 ${isMobile ? '' : 'ml-[120px]'}`}>
        {/* Header area with breadcrumb navigation */}
        <div className="mb-3">
          <h1 className="font-oxanium p-3 sm:p-6 font-semibold text-base sm:text-[26.07px] border-b">
            <Breadcrumb items={breadcrumbItems} />
          </h1>
        </div>

        {/* Main content area */}
        <div className="p-2 sm:p-4 flex justify-center">
          {/* Error message */}
          {error && (
            <div className="my-4 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm w-full max-w-6xl mx-auto">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <strong className="font-bold">Error loading details</strong>
              </div>
              <p>{error}</p>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => router.push('/technician/workOrders')}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md"
                >
                  Back to Work Orders
                </button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && !error && (
            <div className="flex items-center justify-center w-full h-64">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading work order details...</p>
              </div>
            </div>
          )}

          {/* Details content */}
          {!loading && !error && workOrder && (
            <ReportedIssueDetails 
              workOrder={workOrder}
              onBeginTask={handleBeginTask}
              onPauseTask={handlePauseTask}
              onResumeTask={handleResumeTask}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </section>
  );
}