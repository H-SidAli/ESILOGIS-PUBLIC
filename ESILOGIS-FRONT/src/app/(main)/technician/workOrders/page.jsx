"use client";
import Side from "@/app/components/sidebar/Sidebar"; 
import Nav from "@/app/components/NavBar/Nav"; 
import Workorder from "@/app/components/work-orders-table/work-orders-table";
import arrows from "../../../../../public/Images/arrows.svg";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function WorkOrders() {  
    const [isMobile, setIsMobile] = useState(false);
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: '' });
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const router = useRouter();
    
    // Current user state (will be fetched from API)
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

    // Handle responsive layout
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
    
    // Check and get auth token
    const getToken = () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        showToast('Authentication required. Please login again.', 'error');
        setTimeout(() => router.push('/login'), 1500);
        return null;
      }
      return token;
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
                
                // Last resort - use mock data in development mode
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
            
            // Last resort - use mock data in development mode
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
    
    // Fetch work orders
    const fetchWorkOrders = useCallback(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = getToken();
        if (!token) return;
        
        const response = await fetch(
          "http://localhost:3001/api/intervention/my-assigned",
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
          throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        const interventions = result.success && Array.isArray(result.data)
          ? result.data
          : Array.isArray(result) ? result : [];

        if (interventions.length === 0) {
          setWorkOrders([]);
          return;
        }

        const formattedData = interventions.map((item) => ({
          id: item.id,
          date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A",
          description: item.description || "N/A",
          status: mapStatusFromAPI(item.status),
          priority: mapPriorityFromAPI(item.priority),
          assignee: formatAssignees(item.assignees || []),
          location: item.location?.name || "N/A",
          lastUpdated: item.updatedAt
            ? new Date(item.updatedAt).toLocaleDateString()
            : "N/A",
          equipment: item.equipment?.inventoryCode || "N/A",
          equipmentType: item.equipment?.type?.name || "N/A",
          rawData: item // Keep raw data for reference
        }));
        
        setWorkOrders(formattedData);
      } catch (error) {
        console.error("Error fetching work orders:", error);
        setError(error.message || "Failed to load work orders");
        
        // Only use sample data in development
        if (process.env.NODE_ENV === 'development') {
          setWorkOrders(addSampleData());
        }
      } finally {
        setLoading(false);
      }
    }, [router]);

    // Format assignees from API response
    const formatAssignees = (assignees) => {
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
    
    // Load work orders on initial render and when refresh is triggered
    useEffect(() => {
      fetchWorkOrders();
    }, [fetchWorkOrders, refreshTrigger]);

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

    // Map UI status to API status
    const mapStatusToAPI = (uiStatus) => {
      const statusMap = {
        "In Progress": "IN_PROGRESS",
        "Complete": "COMPLETED",
        "Pending": "PENDING",
        "Cancelled": "CANCELLED",
        "Denied": "DENIED",
        "Paused": "PAUSED"
      };
      return statusMap[uiStatus] || uiStatus;
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

    // For demo purposes - add sample data
    const addSampleData = () => {
      return [
        {
          id: "1",
          date: "12/03/2025",
          description: "Replace broken light fixture in engineering lab",
          status: "Pending",
          priority: "Med",
          assignee: [{ name: "ADI ADLAN", avatar: "A", id: "1" }],
          location: "No Parking",
          lastUpdated: "Sunday, 12:45"
        },
        {
          id: "2",
          date: "Wednesday, 12:45",
          description: "Fix plumbing issue in restroom",
          status: "Pending",
          priority: "High",
          assignee: [
            { name: "Alice Smith", avatar: "A", id: "2" },
            { name: "Bob Jones", avatar: "B", id: "3" }
          ],
          location: "S33",
          lastUpdated: "Tuesday, 12:45"
        },
        {
          id: "3",
          date: "Sunday, 12:45",
          description: "Repair AC unit in server room",
          status: "In Progress",
          priority: "Low",
          assignee: [
            { name: "ADI ADLAN", avatar: "A", id: "1" },
            { name: "Charlie Brown", avatar: "C", id: "4" }
          ],
          location: "Bp",
          lastUpdated: "Tuesday, 12:45",
          timer: "00:12:12"
        },
        {
          id: "4",
          date: "Monday, 09:30",
          description: "Replace projector bulb in conference room",
          status: "Paused",
          priority: "Medium",
          assignee: [{ name: "ADI ADLAN", avatar: "A", id: "1" }],
          location: "Room 101",
          lastUpdated: "Monday, 12:45"
        }
      ];
    };

    // Begin task handler
    const handleBeginTask = async (id) => {
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
          const errorData = await response.json();
          throw new Error(errorData.message || `Server returned ${response.status}`);
        }
        
        showToast('Task started successfully');
        
        // Update local state for immediate feedback
        setWorkOrders(prevWorkOrders =>
          prevWorkOrders.map(wo =>
            wo.id === id ? { ...wo, status: "In Progress" } : wo
          )
        );
        
        // Refresh after a short delay
        setTimeout(() => setRefreshTrigger(prev => prev + 1), 500);
      } catch (error) {
        console.error("Error starting task:", error);
        showToast(`Failed to start task: ${error.message}`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    };

    // Complete task handler
    const handleCompleteTask = async (id, formData = {}) => {
      if (isSubmitting) return;
      
      try {
        setIsSubmitting(true);
        const token = getToken();
        if (!token) return;
        
        const response = await fetch(
          `http://localhost:3001/api/intervention/${id}/resolve`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: formData.actions,
              partsUsed: formData.partsUsed,
              notes: formData.notes
            }),
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Server returned ${response.status}`);
        }
        
        showToast('Task completed successfully');
        
        // Update local state for immediate feedback
        setWorkOrders(prevWorkOrders =>
          prevWorkOrders.map(wo =>
            wo.id === id ? { ...wo, status: "Complete" } : wo
          )
        );
        
        // Refresh to get updated data
        setTimeout(() => setRefreshTrigger(prev => prev + 1), 500);
      } catch (error) {
        console.error("Error completing task:", error);
        showToast(`Failed to complete task: ${error.message}`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    };

    // Pause task handler
    const handlePauseTask = async (id) => {
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
          const errorData = await response.json();
          throw new Error(errorData.message || `Server returned ${response.status}`);
        }
        
        showToast('Task paused successfully');
        
        // Update local state for immediate feedback
        setWorkOrders(prevWorkOrders =>
          prevWorkOrders.map(wo =>
            wo.id === id ? { ...wo, status: "Paused" } : wo
          )
        );
        
        // Refresh to get updated data
        setTimeout(() => setRefreshTrigger(prev => prev + 1), 500);
      } catch (error) {
        console.error("Error pausing task:", error);
        showToast(`Failed to pause task: ${error.message}`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    };

    // Resume task handler
    const handleResumeTask = async (id) => {
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
          const errorData = await response.json();
          throw new Error(errorData.message || `Server returned ${response.status}`);
        }

        console.log("Task resumed successfully:", response);
        
        showToast('Task resumed successfully');
        
        // Update local state for immediate feedback
        setWorkOrders(prevWorkOrders =>
          prevWorkOrders.map(wo =>
            wo.id === id ? { ...wo, status: "In Progress" } : wo
          )
        );
        
        // Refresh to get updated data
        setTimeout(() => setRefreshTrigger(prev => prev + 1), 500);
      } catch (error) {
        console.error("Error resuming task:", error);
        showToast(`Failed to resume task: ${error.message}`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    };

    // Deny task handler
    const handleDenyTask = async (id, reason = "") => {
      if (isSubmitting) return;
      
      try {
        setIsSubmitting(true);
        const token = getToken();
        if (!token) return;
        
        // Use the deny endpoint
        const response = await fetch(
          `http://localhost:3001/api/intervention/${id}/deny`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ reason })
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Server returned ${response.status}`);
        }
        
        showToast('Task denied successfully');
        
        // Update local state
        setWorkOrders(prevWorkOrders =>
          prevWorkOrders.map(wo =>
            wo.id === id ? { ...wo, status: "Denied" } : wo
          )
        );
        
        // Refresh to get updated data
        setTimeout(() => setRefreshTrigger(prev => prev + 1), 500);
      } catch (error) {
        console.error("Error denying task:", error);
        showToast(`Failed to deny task: ${error.message}`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    };

    // Delete work orders handler
    const handleDeleteWorkOrders = async (ids) => {
      if (!Array.isArray(ids) || ids.length === 0 || isSubmitting) return;
      
      // Confirm deletion
      if (!window.confirm(`Are you sure you want to delete ${ids.length} work order(s)?`)) {
        return;
      }
      
      try {
        setIsSubmitting(true);
        const token = getToken();
        if (!token) return;
        
        // Process each deletion request
        const results = await Promise.all(
          ids.map(id =>
            fetch(`http://localhost:3001/api/intervention/${id}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
            })
          )
        );
        
        // Check if any requests failed
        const failedRequests = results.filter(res => !res.ok).length;
        
        if (failedRequests > 0) {
          showToast(`${results.length - failedRequests} deleted, ${failedRequests} failed`, 'warning');
        } else {
          showToast(`Successfully deleted ${ids.length} work order(s)`);
        }
        
        // Update local state
        setWorkOrders(prevWorkOrders => 
          prevWorkOrders.filter(wo => !ids.includes(wo.id))
        );
        
        // Refresh to make sure we're in sync
        setTimeout(() => setRefreshTrigger(prev => prev + 1), 500);
      } catch (error) {
        console.error("Error deleting work orders:", error);
        showToast(`Failed to delete: ${error.message}`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    };

    // Show details handler
    const handleShowDetails = (id) => {
      router.push(`/technician/report-details/${id}`);
    };

    // Retry loading on error
    const handleRetry = () => {
      setError(null);
      setRefreshTrigger(prev => prev + 1);
    };

    return ( 
        <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden"> 
            <div className="hidden sm:block absolute top-0 right-0 z-10">
                <Image src={arrows} alt="" width={212}/>
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

            <div className={`w-full z-30 ${isMobile ? 'mt-12' : 'ml-[127px]'}`}>
              <div className="">
                <h1 className="font-oxanium p-6 font-semibold text-[26.07px]">
                  Work Orders
                </h1>
              </div>
                
              {/* Error message */}
              {error && (
                <div className="mx-4 my-4 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm flex flex-col">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <strong className="font-bold">Error loading data</strong>
                  </div>
                  <p className="block mb-4">{error}</p>
                  <div className="flex justify-end">
                    <button 
                      onClick={handleRetry}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center"><Loader className="h-4 w-4 mr-2 animate-spin" /> Retrying...</span>
                      ) : 'Retry'}
                    </button>
                  </div>
                </div>
              )}
                
              {/* Loading state */}
              {loading && !error && (
                <div className="flex justify-center items-center py-16">
                  <div className="flex flex-col items-center">
                    <Loader className="h-10 w-10 text-[#0060B4] animate-spin mb-4" />
                    <p className="text-gray-600">Loading work orders...</p>
                  </div>
                </div>
              )}
                
              {/* Table component */}
              {!loading && !error && (
                <div className="h-[calc(100vh-180px)] sm:h-[calc(100vh-150px)] overflow-hidden bg-white rounded-lg">
                  <Workorder 
                    workOrders={workOrders}
                    loading={loading}
                    currentWorker={currentWorker}
                    onBeginTask={handleBeginTask}
                    onCompleteTask={handleCompleteTask}
                    onPauseTask={handlePauseTask}
                    onResumeTask={handleResumeTask}
                    onDenyTask={handleDenyTask}
                    onDeleteWorkOrders={handleDeleteWorkOrders}
                    onShowDetails={handleShowDetails}
                    onEditWorkOrder={(id) => router.push(`/technician/workOrders/${id}/edit`)}
                    isSubmitting={isSubmitting}
                  />
                </div>
              )}
            </div>
        </section>
    );
}