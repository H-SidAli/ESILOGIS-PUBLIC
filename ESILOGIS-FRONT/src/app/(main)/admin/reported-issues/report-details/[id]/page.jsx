"use client";

import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import arrows from "../../../../../../../public/Images/arrows.svg";
import { useEffect, useState } from "react"; 
import { ChevronLeft, AlertCircle } from "lucide-react";
import Image from "next/image";  
import Link from "next/link";
import { useParams } from "next/navigation";
import ReportDetailsView from "@/app/components/intervention-details/intervention-details"; 

export default function AdminReportDetailsView() {
  const params = useParams();
  const { id } = params; 
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for displaying data from API
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
  
  // Debug state to see raw API data
  const [rawApiData, setRawApiData] = useState(null);
  
  // Real API integration to fetch intervention details
  useEffect(() => {
    const fetchReportDetails = async () => {
      if (typeof window === 'undefined') return; // Skip on server-side

      setLoading(true);
      setError(null);
      
      try {
        // Get the authentication token from session storage
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required. Please log in.');
        }
        
        console.log(`Fetching intervention details for ID: ${id}`);
        
        // Make the API call with proper authorization
        const response = await fetch(`http://localhost:3001/api/intervention/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        const data = responseData.data; // Access the 'data' property from the response
        
        console.log("API Response data:", data);
        setRawApiData(data); // Store raw data for debugging
        
        if (!data) {
          throw new Error("No data returned from API");
        }
        
        // Create mock assignees using the reportedBy data if available
        const assignees = [];
        if (data.reportedBy) {
          assignees.push({
            id: data.reportedBy.id,
            name: `${data.reportedBy.firstName || ''} ${data.reportedBy.lastName || ''}`.trim() || 
                  data.reportedBy.email || `User #${data.reportedBy.id}`,
            department: "Reporting User",
            email: data.reportedBy.email || "No email provided",
            phone: "N/A",
            avatar: "https://randomuser.me/api/portraits/men/1.jpg"
          });
        }
        
        // Add any assigned users if they exist
        if (data.assignees && data.assignees.length > 0) {
          data.assignees.forEach(assignee => {
            assignees.push({
              id: assignee.id,
              name: `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || 
                    assignee.email || `User #${assignee.id}`,
              department: "Assigned Technician",
              email: assignee.email || "No email provided",
              phone: "N/A",
              avatar: "https://randomuser.me/api/portraits/men/2.jpg"
            });
          });
        }
        
        // Format priority to match what the component expects
        let formattedPriority;
        if (data.priority === "HIGH" || data.priority === "high") {
          formattedPriority = "High";
        } else if (data.priority === "MEDIUM" || data.priority === "medium") {
          formattedPriority = "Medium";
        } else {
          formattedPriority = "Low";
        }
        
        // Format status to match what the component expects
        let formattedStatus;
        if (data.status === "PENDING" || data.status === "pending") {
          formattedStatus = "pending";
        } else if (data.status === "IN_PROGRESS" || data.status === "in_progress") {
          formattedStatus = "in-progress";
        } else if (data.status === "COMPLETED" || data.status === "completed") {
          formattedStatus = "completed"; 
        } else if (data.status === "CANCELLED" || data.status === "cancelled") { 
          formattedStatus = "cancelled";
        } else if (data.status === "DENIED" || data.status === "denied") {
          formattedStatus = "denied";
        } else if (data.status === "POSTPONED" || data.status === "postponed") {
          formattedStatus = "postponed";
        } else if (data.status === "APPROVED" || data.status === "approved") {
          formattedStatus = "approved";
        } else {
          formattedStatus = "pending"; // Default to pending
        }
        
        // Format dates for display
        const formatDate = (dateString) => {
          if (!dateString) return null;
          const date = new Date(dateString);
          return date.toLocaleString();
        };
        
        // Prepare history/action summary as bullet points
        const actions = [];
        if (data.createdAt) actions.push(`• Created: ${formatDate(data.createdAt)}`);
        if (data.updatedAt && data.updatedAt !== data.createdAt) actions.push(`• Updated: ${formatDate(data.updatedAt)}`);
        if (data.startedAt) actions.push(`• Work started: ${formatDate(data.startedAt)}`);
        if (data.approvedAt) actions.push(`• Approved: ${formatDate(data.approvedAt)}`);
        if (data.plannedAt) actions.push(`• Planned for: ${formatDate(data.plannedAt)}`);
        if (data.resolvedAt) actions.push(`• Resolved: ${formatDate(data.resolvedAt)}`);
        if (data.cancelledAt) actions.push(`• Cancelled: ${formatDate(data.cancelledAt)}`);
        if (data.deniedAt) actions.push(`• Denied: ${formatDate(data.deniedAt)}`);
        
        // Get equipment info from nested object
        const equipmentInfo = data.equipment ? 
          `${data.equipment.inventoryCode || 'No code'}` : 
          "No equipment information";
        
        // Map API response to the expected format with nested data
        const mappedData = {
          location: data.location?.name || "Unknown location",
          description: data.description || "No description available",
          equipment: equipmentInfo,
          priority: formattedPriority,
          status: formattedStatus,
          pictures: [], // No pictures in this API response
          technicianActions: actions.length > 0 ? actions.join('\n') : "No actions recorded",
          partsUsed: data.partsUsed || "None recorded",
          notes: data.resolutionSummary || "No additional notes",
          assignees: assignees
        };
        
        console.log("Mapped data for component:", mappedData);
        setReportData(mappedData);
      } catch (error) {
        console.error("Error fetching report details:", error);
        setError(error.message || "Failed to load report details");
        
        // Set some fallback data to ensure component renders something
        setReportData({
          location: "Error loading location",
          description: "Could not load report details. Please try again later.",
          equipment: "Unknown",
          priority: "Medium",
          status: "pending",
          pictures: [],
          assignees: [{
            id: 1,
            name: "Unknown User",
            department: "System",
            email: "system@example.com",
            avatar: "https://randomuser.me/api/portraits/men/1.jpg"
          }],
          technicianActions: "No actions available",
          partsUsed: "None",
          notes: `Error occurred: ${error.message}`
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);
 
  // Mobile detection code unchanged...
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);
 
  const breadcrumbItems = [
    { label: 'Reported Issues', href:"../../admin/reported-issues" },
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
              type="Reported Issue Details"
              id={id}
              CancelUrl="reported-issues" 
            />
          )}
        </div>
      </div>
    </section>
  );
}