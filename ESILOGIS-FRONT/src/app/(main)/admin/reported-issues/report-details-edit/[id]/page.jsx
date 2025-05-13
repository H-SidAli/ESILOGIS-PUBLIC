"use client";

import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import arrows from "../../../../../../../public/Images/arrows.svg";
import { useEffect, useState } from "react"; 
import { ChevronDown, X, AlertCircle } from "lucide-react";
import Image from "next/image";  
import Link from "next/link"; 
import ReportForm from "@/app/components/Forms/edit-report-form";
import { useParams, useRouter } from "next/navigation";

export default function AdminReportDetailsEdit() {
  const params = useParams();
  const { id } = params; // Get the id from URL params
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawApiData, setRawApiData] = useState(null);
  const [equipmentData, setEquipmentData] = useState(null);
  
  // Add all the state variables needed for the form
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [equipment, setEquipment] = useState("");
  const [priority, setPriority] = useState("Low");
  const [pictures, setPictures] = useState([]);
  const [status, setStatus] = useState("pending");
  const [activeAssignee, setActiveAssignee] = useState(null);
  const [hoveredAssignee, setHoveredAssignee] = useState(null);
  const [assignees, setAssignees] = useState([]);
  
  // API integration to fetch intervention details
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
        
        // Set equipment data directly from the nested equipment object
        if (data.equipment) {
          setEquipmentData(data.equipment);
          setEquipment(data.equipment.inventoryCode || `Equipment ID: ${data.equipmentId}`);
        } else if (data.equipmentId) {
          // Only fetch equipment separately if we have an ID but no nested data
          await fetchEquipmentDetails(data.equipmentId, token);
        }
        
        // Create assignees from the API data
        let mappedAssignees = [];
        
        // Add reported by user to assignees if available
        if (data.reportedBy) {
          mappedAssignees.push({
            id: data.reportedBy.id,
            name: `${data.reportedBy.firstName || ''} ${data.reportedBy.lastName || ''}`.trim() || 
                  data.reportedBy.email || `User #${data.reportedBy.id}`,
            department: "Reporting User",
            email: data.reportedBy.email || "No email provided",
            phone: "N/A",
            role: data.reportedBy.role || "USER",
            avatar: "https://randomuser.me/api/portraits/men/1.jpg"
          });
        }
        
        // Add any assigned users if they exist
        if (data.assignees && data.assignees.length > 0) {
          data.assignees.forEach(assignee => {
            mappedAssignees.push({
              id: assignee.id,
              name: `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || 
                    assignee.email || `User #${assignee.id}`,
              department: "Assigned Technician",
              email: assignee.email || "No email provided",
              phone: "N/A",
              role: assignee.role || "TECHNICIAN",
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
        } else if (data.status === "APPROVED" || data.status === "approved") {
          formattedStatus = "approved";
        } else {
          formattedStatus = data.status.toLowerCase();
        }
        
        // Extract pictures from API if available, or use empty array
        const formattedPictures = data.pictures || [];
        
        // Update state with the fetched data
        setLocation(data.location?.name || "");
        setDescription(data.description || "");
        setPriority(formattedPriority);
        setStatus(formattedStatus);
        setPictures(formattedPictures);
        setAssignees(mappedAssignees);
        
      } catch (error) {
        console.error("Error fetching report details:", error);
        setError(error.message || "Failed to load report details");
        setDescription("Failed to load report data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]); // Re-fetch when the ID changes

  // Helper function to fetch equipment details if needed
  const fetchEquipmentDetails = async (equipmentId, token) => {
    try {
      console.log(`Fetching equipment details for ID: ${equipmentId}`);
      
      const response = await fetch(`http://localhost:3001/api/equipment/${equipmentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching equipment: ${response.status} ${response.statusText}`);
      }
      
      const equipmentResponse = await response.json();
      console.log("Equipment data:", equipmentResponse);
      
      // Check if response is wrapped in a data property or direct
      const equipData = equipmentResponse.data || equipmentResponse;
      setEquipmentData(equipData);
      
      // Get the most detailed equipment name possible
      const equipmentName = equipData.name || 
                          equipData.inventoryCode || 
                          `Equipment #${equipmentId}`;
      
      setEquipment(equipmentName);
      return equipData;
      
    } catch (err) {
      console.error("Failed to fetch equipment details:", err);
      // Don't fail the whole form loading if just equipment details fail
      return null;
    }
  };

  // Function to handle form submission
  const handleSubmitReport = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // Format the data for the API
      const updateData = {
        description: description,
        priority: priority.toUpperCase(),
        status: status.toUpperCase().replace(/-/g, '_')
      };
      
      // If we have location ID from the original data
      if (rawApiData?.location?.id) {
        updateData.locationId = rawApiData.location.id;
      }
      
      // If we have equipment ID from the original data
      if (rawApiData?.equipmentId) {
        updateData.equipmentId = rawApiData.equipmentId;
      }
      
      console.log("Updating intervention with data:", updateData);
      
      const response = await fetch(`http://localhost:3001/api/intervention/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("Update successful:", result);
      
      // Redirect back to the report details page
      router.push(`/admin/reported-issues/report-details/${id}`);
    } catch (error) {
      console.error("Error updating report:", error);
      setError(`Failed to update report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
 
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
    { label: `Edit Report #${id}`, href:"#" }
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
          {/* Debug panel for development */}
         
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
                <h2 className="text-lg font-semibold text-red-800">Error</h2>
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <Link href="../../admin/reported-issues" 
                    className="flex items-center mt-2 text-blue-600 hover:text-blue-800 transition-colors">
                <X className="h-4 w-4 mr-1" />
                Back to Reported Issues
              </Link>
            </div>
          ) : (
            <ReportForm 
              location={location}
              setLocation={setLocation}
              description={description}
              setDescription={setDescription}
              equipment={equipment}
              setEquipment={setEquipment}
              priority={priority}
              setPriority={setPriority}
              pictures={pictures}
              setPictures={setPictures}
              status={status}
              setStatus={setStatus}
              assignees={assignees}
              setAssignees={setAssignees}
              activeAssignee={activeAssignee}
              setActiveAssignee={setActiveAssignee}
              hoveredAssignee={hoveredAssignee}
              setHoveredAssignee={setHoveredAssignee}
              CancelUrl="reported-issues"
              onSubmit={handleSubmitReport}
              equipmentDetails={equipmentData}
            />
          )}
        </div>
      </div>
    </section>
  );
}