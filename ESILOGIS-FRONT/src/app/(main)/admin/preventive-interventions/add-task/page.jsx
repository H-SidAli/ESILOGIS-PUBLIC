"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import arrows from "../../../../../../public/Images/arrows.svg";
import AssignePiInterv from "@/app/components/Forms/assigne-intervention-form";
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";
import { AlertCircle, Loader } from "lucide-react";
import ScanPopup from "@/app/components/popups/ScanPopup";
export default function ReportIssueAdminPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showScanPopup, setShowScanPopup] = useState(false);
  
  // API data state
  const [locations, setLocations] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState({ 
    locations: false, 
    technicians: false,
    submit: false 
  });
  const [error, setError] = useState({ locations: null, technicians: null });
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });
  
  // Initial form data setup
  const initialFormData = {
    location: "",
    description: "",
    equipment: "",
    equipmentId: null,
    priority: "low",
    pictures: [],
    assignee: null,
    date: new Date().toISOString().split('T')[0], // Today's date
    isRecurring: false, // Default to non-recurring
    recurrenceInterval: "30" // Default interval in days if recurring
  };
  
  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: '' }), 3000);
  };

  // Fetch locations from API
  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(prev => ({ ...prev, locations: true }));
        setError(prev => ({ ...prev, locations: null }));
        
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required. Please log in.');
        }
        
        const response = await fetch('http://localhost:3001/api/location', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Locations fetched:', data);
        
        // Map API data to the format our component expects
        const locationData = data.data && Array.isArray(data.data) 
          ? data.data 
          : Array.isArray(data) 
            ? data 
            : [];
            
        const mappedLocations = locationData.map(loc => ({
          value: loc.name,
          label: loc.name,
          id: loc.id
        }));
        
        setLocations(mappedLocations);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError(prev => ({ ...prev, locations: err.message }));
        showToast(`Failed to load locations: ${err.message}`, 'error');
      } finally {
        setLoading(prev => ({ ...prev, locations: false }));
      }
    }
    
    if (typeof window !== 'undefined') {
      fetchLocations();
    }
  }, []);
  
  // Fetch technicians from API
  useEffect(() => {
    async function fetchTechnicians() {
      try {
        setLoading(prev => ({ ...prev, technicians: true }));
        setError(prev => ({ ...prev, technicians: null }));
        
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required. Please log in.');
        }
        
        const response = await fetch('http://localhost:3001/api/technicians', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Technicians fetched:', data);
        
        // Format technicians for our component
        let formattedTechnicians = [];
        if (data.success && Array.isArray(data.data)) {
          formattedTechnicians = data.data.map(tech => ({
            id: tech.id,
            name: `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.email,
            role: tech.role || 'Technician',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${tech.firstName || ''} ${tech.lastName || ''}`)}`,
            email: tech.email
          }));
        } else if (Array.isArray(data)) {
          formattedTechnicians = data.map(tech => ({
            id: tech.id,
            name: `${tech.firstName || ''} ${tech.lastName || ''}`.trim() || tech.email,
            role: tech.role || 'Technician',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${tech.firstName || ''} ${tech.lastName || ''}`)}`,
            email: tech.email
          }));
        }
        
        setTechnicians(formattedTechnicians);
      } catch (err) {
        console.error('Error fetching technicians:', err);
        setError(prev => ({ ...prev, technicians: err.message }));
        showToast(`Failed to load technicians: ${err.message}`, 'error');
      } finally {
        setLoading(prev => ({ ...prev, technicians: false }));
      }
    }
    
    if (typeof window !== 'undefined') {
      fetchTechnicians();
    }
  }, []);

  // Handle form submission
  const handleFormSubmit = async (formData) => {
    try {
      console.log("Submitting form data:", formData);
      setLoading(prev => ({ ...prev, submit: true }));
      
      // Get the authentication token
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      // Find the location ID based on the selected location name
      const selectedLocation = locations.find(loc => loc.value === formData.location);
      const locationId = selectedLocation?.id;
      
      if (!locationId) {
        throw new Error('Invalid location selected');
      }
      
      // Format the data according to the API requirements
      const apiData = {
        description: formData.description,
        locationId: locationId,
        priority: formData.priority.toUpperCase(),
        type: "PREVENTIVE", // This is a preventive intervention
        plannedAt: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        isRecurring: formData.isRecurring === true, // Add recurrence flag - true when checked, false when not
        // If recurrence is enabled, include interval
        ...(formData.isRecurring && formData.recurrenceInterval && { 
          recurrenceInterval: parseInt(formData.recurrenceInterval, 10) || 30 
        }),
        // Include equipment ID if it exists
        ...(formData.equipmentId && { equipmentId: formData.equipmentId }),
      };

      // Add assignee if selected
      if (formData.assignee) {
        apiData.assigneeIds = [formData.assignee.id];
      }

      console.log("API Request Data:", apiData);
      
      // Make the API call to save the intervention
      const response = await fetch('http://localhost:3001/api/intervention/planify-intervention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `Server error: ${response.status} ${response.statusText}`
        );
      }
      
      const result = await response.json();
      console.log("API Response:", result);
      
      // Show success notification
      showToast("Preventive Intervention successfully created!", "success");
      
      // Redirect to list page after a short delay to show the toast
      setTimeout(() => {
        window.location.href = "../../admin/preventive-interventions";
      }, 1500);
      
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast(`Failed to create intervention: ${error.message}`, "error");
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  // Handle adding new location
  const handleAddLocation = async (newLocation) => {
    if (!newLocation.trim()) return;
    
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch('http://localhost:3001/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newLocation })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Format location based on API response structure
      const newLocationData = data.data || data;
      
      // Add to locations list
      const updatedLocations = [
        ...locations,
        {
          id: newLocationData.id,
          value: newLocationData.name,
          label: newLocationData.name
        }
      ];
      
      setLocations(updatedLocations);
      showToast(`Location "${newLocationData.name}" added successfully`, 'success');
      
      return updatedLocations;
    } catch (err) {
      console.error("Error adding new location:", err);
      showToast(`Failed to add location: ${err.message}`, 'error');
      return locations; // Return original list on error
    }
  };

  // Handle adding new assignee - this would need to be implemented in a real API
  const handleAddAssignee = (newAssignee, allAssignees) => {
    // In a real application, you would make an API call here
    showToast("Adding new technicians is not supported in this demo", 'info');
    return allAssignees;
  };

  const handleShowScanPopup = () => setShowScanPopup(true);
  const handleCloseScanPopup = () => setShowScanPopup(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const breadcrumbItems = [
    { label: 'Preventive Interventions (PI)', href: "../../admin/preventive-interventions" },
    { label: 'Planify Intervention (PI)', href: "#" }
  ];

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
      {/* Toast notification */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="hidden sm:block absolute top-0 right-0 z-10">
        <Image src={arrows} alt="" width={212} />
      </div>

      <div className={`w-full z-30 ${isMobile ? 'mt-10' : 'ml-[129px]'}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px] border-2">
            <Breadcrumb items={breadcrumbItems} />
          </h1>
        </div>

        <div className="px-10 py-8">
          {(loading.locations || loading.technicians) ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                <p>Loading data...</p>
              </div>
            </div>
          ) : (error.locations || error.technicians) ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-800 mb-2">Error loading data</h3>
              <p className="text-sm text-gray-600 mb-4">
                {error.locations || error.technicians}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <AssignePiInterv 
              initialFormData={initialFormData}
              onSubmit={handleFormSubmit}
              cancelLink="../../admin/preventive-interventions"
              title="Assign Preventive Intervention (PI)"
              locationOptions={locations}
              assigneeOptions={technicians}
              submitButtonText={loading.submit ? "Creating..." : "Create Intervention"}
              onAddLocation={handleAddLocation}
              onAddAssignee={handleAddAssignee}
              isSubmitting={loading.submit}
              showRecurrenceOptions={true} // Enable recurrence options in form
            />
          )}
        </div>
      </div>

      {showScanPopup && <ScanPopup onClose={handleCloseScanPopup} />}
    </section>
  );
}

