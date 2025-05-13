"use client";

import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import arrows from "../../../../../../../public/Images/arrows.svg";
import { useEffect, useState } from "react"; 
import { ChevronLeft, X } from "lucide-react";
import Image from "next/image";  
import Link from "next/link";
import { useParams } from "next/navigation";
import ReportDetailsView from "@/app/components/intervention-details/intervention-details"; 

export default function AdminReportDetailsView() {
  const params = useParams();
  const { id } = params; // Get the id from URL params
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for displaying data (will come from API)
  const [reportData, setReportData] = useState({
    location: "",
    description: "",
    equipment: "",
    priority: "",
    pictures: [],
    status: "",
    assignees: [],
    technicianActions: "",
    partsUsed: "",
    notes: ""
  });
  
  // Fetch real data from the API endpoint
  useEffect(() => {
    const fetchReportDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get token from session storage
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error("Authentication required. Please log in.");
        }
        
        // Call the API endpoint with the intervention ID
        const response = await fetch(`http://localhost:3001/api/intervention/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch intervention: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log("API Response:", responseData); // For debugging
        
        // Extract the data from nested structure
        const data = responseData.data || responseData;
        
        // Map technician actions from history if available
        let technicianActions = "No actions recorded";
        let historyNotes = "";
        
        if (data.history && data.history.length > 0) {
          // Sort history by date (newest first)
          const sortedHistory = [...data.history].sort((a, b) => 
            new Date(b.loggedAt) - new Date(a.loggedAt)
          );
          
          // Combine history entries into a readable format
          technicianActions = sortedHistory.map(entry => {
            const date = new Date(entry.loggedAt).toLocaleString();
            const action = formatActionType(entry.action);
            const person = entry.loggedBy ? 
              `${entry.loggedBy.firstName || ''} ${entry.loggedBy.lastName || ''}`.trim() : 
              'Unknown';
            
            return `${date}: ${action} by ${person}`;
          }).join('\n');
          
          // Gather notes from history
          historyNotes = sortedHistory
            .filter(entry => entry.notes)
            .map(entry => entry.notes)
            .join('\n');
        }
        
        // Build formatted report data object for the component
        const formattedData = {
          location: data.location?.name || "",
          description: data.description || "No description provided",
          equipment: data.equipment?.name || data.equipment?.type || "Not specified",
          priority: mapPriorityFromApi(data.priority),
          status: mapStatusFromApi(data.status),
          pictures: [], // API doesn't seem to include pictures yet
          technicianActions: technicianActions || "No actions recorded",
          partsUsed: data.partsUsed || "None recorded",
          notes: historyNotes || data.resolutionSummary || "No notes available",
          assignees: []
        };
        
        // Format assignees
        if (data.assignees && Array.isArray(data.assignees)) {
          formattedData.assignees = data.assignees.map(assignee => {
            const person = assignee.person || {};
            return {
              id: assignee.personId || person.id,
              name: `${person.firstName || ""} ${person.lastName || ""}`.trim() || "Unnamed Assignee",
              department: person.departmentId ? `Dept #${person.departmentId}` : "No department",
              email: person.email || "No email provided",
              phone: person.phoneNumber || "No phone provided",
              avatar: person.profile || person.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"
            };
          });
        }
        
        setReportData(formattedData);
      } catch (error) {
        console.error("Error fetching intervention details:", error);
        setError(error.message || "Failed to load intervention data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReportDetails();
    }
  }, [id]); // Re-fetch when the ID changes
  
  // Helper function to format action type
  const formatActionType = (action) => {
    if (!action) return "Unknown action";
    
    // Replace underscores with spaces and convert to Title Case
    return action.toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };
  
  // Helper functions to map API values to UI values
  const mapPriorityFromApi = (apiPriority) => {
    if (!apiPriority) return "Low";
    
    // Direct mapping from uppercase API values to UI values
    const priorityMap = {
      "HIGH": "High",
      "MEDIUM": "Medium",
      "LOW": "Low"
    };
    
    return priorityMap[apiPriority] || "Low";
  };
  
  const mapStatusFromApi = (apiStatus) => {
    if (!apiStatus) return "pending";
    
    // Direct mapping from uppercase API values to UI values
    const statusMap = {
      "PENDING": "pending",
      "IN_PROGRESS": "in-progress",
      "COMPLETED": "completed",
      "CANCELLED": "cancelled"
    };
    
    return statusMap[apiStatus] || "pending";
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
 
  const breadcrumbItems = [
    { label: 'Preventive Interventions', href:"../../admin/preventive-interventions" },
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
                <p className="mt-4 text-gray-600">Loading intervention details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center w-full h-64">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                  <X size={24} />
                </div>
                <p className="mt-4 text-gray-600">{error}</p>
                <button 
                  onClick={() => window.location.href = "../../admin/preventive-interventions"}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Return to Interventions
                </button>
              </div>
            </div>
          ) : (
            <ReportDetailsView 
              location={reportData.location}
              description={reportData.description}
              equipment={reportData.equipment}
              priority={reportData.priority}
              pictures={reportData.pictures}
              status={reportData.status}
              assignees={reportData.assignees}
              technicianActions={reportData.technicianActions}
              partsUsed={reportData.partsUsed}
              notes={reportData.notes}
              type="Preventive Intervention Details"
              id={id}
              CancelUrl="preventive-interventions"
            />
          )}
        </div>
      </div>
    </section>
  );
}