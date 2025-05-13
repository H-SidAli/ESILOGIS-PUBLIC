"use client";
import Link from "next/link";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import InterventionsTablePhone from "@/app/components/intervention-table-phone/intervention-table-phone";
import InterventionTable from "@/app/components/intervention-table/interventionTable";
import arrows from "../../../../../public/Images/arrows.svg";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, AlertTriangle, Loader } from "lucide-react";

export default function InterventionsPage() {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const [interventions, setInterventions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({
        visible: false,
        message: "",
        type: "",
    });

    // Toast notification helper
    const showToast = (message, type = "success") => {
        setToast({ visible: true, message, type });
        setTimeout(
            () => setToast({ visible: false, message: "", type: "" }),
            3000
        );
    };

    // Format priority from API format ("HIGH") to display format ("High")
    const formatPriority = (priority) => {
        if (!priority) return "Medium";
        
        // Convert to title case (first letter uppercase, rest lowercase)
        return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
    };

    // Format date from ISO to readable format
    const formatDateTime = (dateString) => {
        if (!dateString) return "";
        
        const date = new Date(dateString);
        const options = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('en-US', options).replace(',', ', ');
    };

    // Fetch interventions from API
    const fetchInterventions = async () => {
        try {
            setLoading(true);
            
            const response = await fetch("http://localhost:3001/api/intervention/planned", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    showToast('Session expired. Please login again.', 'error');
                    setTimeout(() => router.push('/login'), 2000);
                    return;
                }
                throw new Error(`Failed to fetch interventions: ${response.status}`);
            }

            const result = await response.json();
            console.log("Raw interventions data:", result);

            if (result.success && Array.isArray(result.data)) {
                // Transform API data to match component's expected format
                const transformedData = result.data.map(intervention => ({
                    id: intervention.id,
                    dateTime: formatDateTime(intervention.createdAt),
                    location: intervention.location?.name || "Unknown",
                    description: intervention.description || "",
                    status: intervention.status || "PENDING",
                    priority: formatPriority(intervention.priority),
                    plannedAt: intervention.plannedAt,
                    type: intervention.type,
                    equipmentId: intervention.equipmentId,
                    equipmentName: intervention.equipment?.inventoryCode || "Unknown equipment",
                    // Transform assignees
                    assignees: Array.isArray(intervention.assignees) ? 
                        intervention.assignees.map(assignee => ({
                            id: assignee.personId,
                            name: `${assignee.person?.firstName || ""} ${assignee.person?.lastName || ""}`.trim() || "Unknown",
                            // Use a default avatar if none provided
                            avatar: assignee.person?.avatarUrl || "https://randomuser.me/api/portraits/men/1.jpg"
                        })) : []
                }));
                
                setInterventions(transformedData);
                console.log("Transformed interventions:", transformedData);
            } else {
                console.error("Invalid API response format:", result);
                showToast('Failed to load interventions data', 'error');
            }
        } catch (error) {
            console.error("Error fetching interventions:", error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch technicians from API
    const [technicians, setTechnicians] = useState([]);
    
    const fetchTechnicians = async () => {
        try {
            const response = await fetch("http://localhost:3001/api/technicians", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Auth error handled by fetchInterventions
                    return;
                }
                throw new Error(`Failed to fetch technicians: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && Array.isArray(result.data)) {
                const formattedTechnicians = result.data.map(tech => ({
                    id: tech.id,
                    name: `${tech.firstName || ""} ${tech.lastName || ""}`.trim(),
                    avatar: tech.avatarUrl || "https://randomuser.me/api/portraits/men/1.jpg",
                }));
                setTechnicians(formattedTechnicians);
            } else {
                // Fallback to example data if API response is invalid
                setTechnicians([
                    {
                        id: 1,
                        name: "John Doe",
                        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
                    },
                    {
                        id: 2,
                        name: "Jane Smith",
                        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
                    },
                ]);
            }
        } catch (error) {
            console.error("Error fetching technicians:", error);
            // Fallback to example data on error
            setTechnicians([
                {
                    id: 1,
                    name: "John Doe",
                    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
                },
                {
                    id: 2,
                    name: "Jane Smith",
                    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
                },
            ]);
        }
    };

    // Fetch data when component mounts
    useEffect(() => {
        fetchInterventions();
        fetchTechnicians();
    }, []);

    // API integration for handlers
    const handleStatusChange = async (ids, status) => {
        try {
            // Show loading toast
            showToast('Updating status...', 'info');
            
            // Perform updates one by one
            for (const id of ids) {
                const response = await fetch(`http://localhost:3001/api/intervention/${id}/status`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ status: status.toUpperCase() }),
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to update status for intervention ${id}: ${response.status}`);
                }
            }
            
            // Update local state to reflect changes immediately
            setInterventions(prev => 
                prev.map(intervention => 
                    ids.includes(intervention.id) 
                        ? { ...intervention, status: status.toUpperCase() } 
                        : intervention
                )
            );
            
            showToast(`Status updated to ${status}`, 'success');
            return true;
        } catch (error) {
            console.error("Error updating status:", error);
            showToast(`Failed to update status: ${error.message}`, 'error');
            return false;
        }
    };

    const handlePriorityChange = async (ids, priority) => {
        try {
            showToast('Updating priority...', 'info');
            
            for (const id of ids) {
                const response = await fetch(`http://localhost:3001/api/intervention/${id}/priority`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ priority: priority.toUpperCase() }),
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to update priority for intervention ${id}: ${response.status}`);
                }
            }
            
            // Update local state
            setInterventions(prev => 
                prev.map(intervention => 
                    ids.includes(intervention.id) 
                        ? { ...intervention, priority: formatPriority(priority.toUpperCase()) } 
                        : intervention
                )
            );
            
            showToast(`Priority updated to ${priority}`, 'success');
            return true;
        } catch (error) {
            console.error("Error updating priority:", error);
            showToast(`Failed to update priority: ${error.message}`, 'error');
            return false;
        }
    };

    const handleAssignWorkers = async (interventionIds, technicianIds) => {
        try {
            showToast('Assigning technicians...', 'info');
            
            for (const interventionId of interventionIds) {
                const response = await fetch(`http://localhost:3001/api/intervention/${interventionId}/assignees`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({ personIds: technicianIds }),
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to assign technicians to intervention ${interventionId}: ${response.status}`);
                }
            }
            
            // Update local state with the newly assigned technicians
            const assignedTechs = technicians.filter(tech => technicianIds.includes(tech.id));
            
            setInterventions(prev => 
                prev.map(intervention => {
                    if (interventionIds.includes(intervention.id)) {
                        return {
                            ...intervention,
                            assignees: [
                                ...intervention.assignees.filter(a => !technicianIds.includes(a.id)),
                                ...assignedTechs.map(tech => ({
                                    id: tech.id,
                                    name: tech.name,
                                    avatar: tech.avatar
                                }))
                            ]
                        };
                    }
                    return intervention;
                })
            );
            
            showToast('Technicians assigned successfully', 'success');
            return true;
        } catch (error) {
            console.error("Error assigning technicians:", error);
            showToast(`Failed to assign technicians: ${error.message}`, 'error');
            return false;
        }
    };

    const handleCancelIntervention = async (ids) => {
        try {
            showToast('Cancelling interventions...', 'info');
            
            for (const id of ids) {
                const response = await fetch(`http://localhost:3001/api/intervention/${id}/cancel`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to cancel intervention ${id}: ${response.status}`);
                }
            }
            
            // Update local state
            setInterventions(prev => 
                prev.map(intervention => 
                    ids.includes(intervention.id) 
                        ? { ...intervention, status: "CANCELLED" } 
                        : intervention
                )
            );
            
            showToast('Interventions cancelled successfully', 'success');
            return true;
        } catch (error) {
            console.error("Error cancelling interventions:", error);
            showToast(`Failed to cancel interventions: ${error.message}`, 'error');
            return false;
        }
    };

    const handleDeleteIntervention = async (ids) => {
        try {
            showToast('Deleting interventions...', 'info');
            
            for (const id of ids) {
                const response = await fetch(`http://localhost:3001/api/intervention/${id}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${sessionStorage.getItem("token")}`,
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to delete intervention ${id}: ${response.status}`);
                }
            }
            
            // Remove deleted interventions from local state
            setInterventions(prev => prev.filter(intervention => !ids.includes(intervention.id)));
            
            showToast('Interventions deleted successfully', 'success');
            return true;
        } catch (error) {
            console.error("Error deleting interventions:", error);
            showToast(`Failed to delete interventions: ${error.message}`, 'error');
            return false;
        }
    };

    useEffect(() => {
        // Check if we're on the client side
        if (typeof window !== "undefined") {
            // Set initial state
            setIsMobile(window.innerWidth < 640);

            // Add resize listener
            const handleResize = () => {
                setIsMobile(window.innerWidth < 640);
            };

            window.addEventListener("resize", handleResize);

            // Clean up
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);

    return (
        <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
            <div className="hidden sm:block absolute top-0 right-0 z-10">
                <Image src={arrows} alt="" width={212} />
            </div>

           
            {/* Toast notification */}
            {toast.visible && (
                <div
                    className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center ${
                        toast.type === "success"
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : toast.type === "error"
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : toast.type === "warning"
                            ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                >
                    {toast.type === "success" && (
                        <CheckCircle className="h-5 w-5 mr-2" />
                    )}
                    {toast.type === "error" && (
                        <AlertCircle className="h-5 w-5 mr-2" />
                    )}
                    {toast.type === "warning" && (
                        <AlertTriangle className="h-5 w-5 mr-2" />
                    )}
                    {toast.type === "info" && (
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}

            <div className={`w-full ${isMobile ? "mt-10" : "ml-[129px]"}`}>
                <div className="">
                    <h1 className=" p-6 font-semibold text-[26.07px]">
                        Preventive Interventions (PI)
                    </h1>
                </div>

                {/* Conditionally render the appropriate table based on screen size */}
                {!isMobile ? (
                    <div className="">
                        <InterventionTable
                            interventions={interventions}
                            technicians={technicians}
                            onStatusChange={handleStatusChange}
                            onPriorityChange={handlePriorityChange}
                            onAssignWorkers={handleAssignWorkers}
                            onCancelIntervention={handleCancelIntervention}
                            onDeleteIntervention={handleDeleteIntervention}
                            addTaskLink="/admin/new-intervention"
                            loadingData={loading}
                        />
                    </div>
                ) : (
                    <div>
                        <InterventionsTablePhone
                            interventions={interventions}
                            technicians={technicians}
                            onStatusChange={handleStatusChange}
                            onPriorityChange={handlePriorityChange}
                            onAssignWorkers={handleAssignWorkers}
                            onCancelIntervention={handleCancelIntervention}
                            onDeleteIntervention={handleDeleteIntervention}
                            addTaskLink="/admin/new-intervention"
                            loadingData={loading}
                        />
                    </div>
                )}
            </div>

            <div className="absolute bottom-0 right-0 p-5 text-white rounded-xl">
                <button className="bg-[#474747] px-24 py-1 rounded-xl">
                    Download as pdf
                </button>
            </div>
        </section>
    );
}