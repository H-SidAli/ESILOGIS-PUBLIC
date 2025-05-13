"use client";

import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import arrows from "../../../../../../../public/Images/arrows.svg";
import { useEffect, useState, useRef } from "react"; 
import { ChevronDown, X, Search, UserPlus, Camera, Upload } from "lucide-react";
import Image from "next/image";  
import Link from "next/link"; 
import ReportForm from "@/app/components/Forms/edit-report-form";
import { useParams } from "next/navigation";

export default function AdminReportDetailsEdit() {
  const params = useParams();
  const { id } = params; // Get the id from URL params
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        
        // Set location - using the nested object structure
        setLocation(data.location?.name || "");
        
        // Set description
        setDescription(data.description || "");
        
        // Set equipment - it might be null or an object
        if (data.equipment) {
          setEquipment(data.equipment.name || data.equipment.type || "");
        } else {
          setEquipment("");
        }
        
        // Map priority from API format (uppercase)
        setPriority(mapPriorityFromApi(data.priority));
        
        // Map status from API format (uppercase)
        setStatus(mapStatusFromApi(data.status));
        
        // Handle images/attachments if they exist
        const attachments = data.attachments || data.pictures || [];
        setPictures(Array.isArray(attachments) ? attachments : []);
        
        // Map assignees - they have a nested person object
        if (data.assignees && Array.isArray(data.assignees)) {
          const formattedAssignees = data.assignees.map(assignee => {
            const person = assignee.person || {};
            return {
              id: assignee.personId || person.id,
              name: `${person.firstName || ""} ${person.lastName || ""}`.trim(),
              department: person.departmentId || "",
              email: person.email || "",
              phone: person.phoneNumber || "",
              avatar: person.profile || person.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"
            };
          });
          setAssignees(formattedAssignees);
        }
      } catch (error) {
        console.error("Error fetching intervention details:", error);
        setError(error.message || "Failed to load intervention data");
        setDescription("Failed to load intervention data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReportDetails();
    }
  }, [id]); // Re-fetch when the ID changes
  
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
      "CANCELLED": "pending" // Map cancelled to pending for editing purposes
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
    { label: `Edit Intervention`, href:"#" }
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
              CancelUrl="preventive-interventions"
              interventionId={id} // Pass the ID to the form for saving
            />
          )}
        </div>
      </div>
    </section>
  );
}