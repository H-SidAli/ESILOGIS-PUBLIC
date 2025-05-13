"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import EquipmentTypesTable from "@/app/components/Tables/EquipementsType";
import arrows from "../../../../../../public/Images/arrows.svg";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Loader, AlertCircle, X, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// API endpoint
const API_URL = 'http://localhost:3001/api/equipment-type';

// Helper function to decode JWT token
const decodeJWT = (token) => {
  try {
    // JWT token is split into three parts: header, payload, signature
    // We need the payload part (index 1)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export default function EquipmentTypesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddTypePopup, setShowAddTypePopup] = useState(false);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });
  const [user, setUser] = useState({ firstName: '', lastName: '', email: '', role: '' });

  // Toast notification helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: '' }), 3000);
  }, []);

  // Extract user information from JWT token
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      const decodedToken = decodeJWT(token);
      if (decodedToken) {
        setUser({
          firstName: decodedToken.firstName || '',
          lastName: decodedToken.lastName || '',
          email: decodedToken.email || decodedToken.sub || '',
          role: decodedToken.role || 'user'
        });
        console.log('User data extracted from JWT:', {
          email: decodedToken.email || decodedToken.sub || 'No email found',
          role: decodedToken.role || 'user'
        });
      } else {
        showToast('Invalid authentication token', 'error');
        setTimeout(() => router.push('/login'), 2000);
      }
    } else {
      showToast('Authentication required', 'error');
      setTimeout(() => router.push('/login'), 2000);
    }
  }, [router, showToast]);

  // Fetch equipment types from API - memoized to avoid unnecessary recreations
  const fetchEquipmentTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      const response = await fetch(API_URL, {
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
      console.log('Fetched equipment types:', data);
      
      // Handle the API response based on the schema [{ id, name, category }]
      if (Array.isArray(data)) {
        setEquipmentTypes(data);
      } else if (data.data && Array.isArray(data.data)) {
        setEquipmentTypes(data.data);
      } else {
        setEquipmentTypes([]);
        console.warn('Unexpected data format received from API');
      }
    } catch (error) {
      console.error("Error fetching equipment types:", error);
      setError(error.message);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initial fetch after component mounts
  useEffect(() => {
    if (mounted) {
      fetchEquipmentTypes();
    }
  }, [mounted, fetchEquipmentTypes]);

  // Handle window resize and set mounted state
  useEffect(() => {
    setMounted(true);
    
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize(); // Initialize on mount
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to create a new equipment type via API
  const handleAddEquipmentType = async (name, category) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, category })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      const newType = await response.json();
      console.log('Created new equipment type:', newType);
      
      // Handle different response formats
      const typeToAdd = newType.data || newType;
      
      // Add the new type to the state
      setEquipmentTypes(prev => [...prev, typeToAdd]);
      setShowAddTypePopup(false);
      showToast(`Equipment type "${name}" added successfully!`);
    } catch (error) {
      console.error("Error adding equipment type:", error);
      showToast(`Failed to add equipment type: ${error.message}`, 'error');
    }
  };

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) return null;

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
      {/* Toast notification */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
          toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
          <span className="pr-2">{toast.message}</span>
          <button 
            onClick={() => setToast({ visible: false, message: '', type: '' })}
            className="ml-auto p-1 hover:bg-gray-200 rounded-full"
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      <div className="hidden sm:block absolute top-0 right-0 z-10">
        <Image src={arrows} alt="" width={212} priority />
      </div>
      <div className={`w-full ${isMobile ? "mt-24" : "ml-[134px]"}`}>
        <div className="">
          <h1 className="p-6 font-semibold text-[26.07px]">
            Equipment Types
          </h1>
        </div>

        <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <Loader className="h-10 w-10 text-[#0060B4] animate-spin mb-4" />
              <p className="text-gray-600">Loading equipment types...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-64">
              <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
              <p className="text-red-500 mb-2 font-medium">Error loading equipment types</p>
              <p className="text-gray-600">{error}</p>
              <button 
                onClick={fetchEquipmentTypes}
                className="mt-4 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : equipmentTypes.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-center">
              <p className="text-gray-600 mb-4">No equipment types found.</p>
              <button 
                onClick={() => setShowAddTypePopup(true)}
                className="px-4 py-2 bg-[#0060B4] text-white rounded-md hover:bg-[#0056A4] transition-colors"
              >
                Add Equipment Type
              </button>
            </div>
          ) : (
            <EquipmentTypesTable 
              equipmentTypes={equipmentTypes}
              setEquipmentTypes={setEquipmentTypes}
              onAddEquipmentType={() => setShowAddTypePopup(true)}
              onRefresh={fetchEquipmentTypes}
            />
          )}
        </div>
      </div>

      {showAddTypePopup && (
        <AddEquipmentTypePopup 
          onClose={() => setShowAddTypePopup(false)}
          onSave={handleAddEquipmentType}
        />
      )}
    </section>
  );
}

function AddEquipmentTypePopup({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ name: '', category: '' });

  const handleSave = async () => {
    // Validate inputs
    const errors = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!category.trim()) errors.category = 'Category is required';
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({ name: '', category: '' });
    setIsSubmitting(true);
    try {
      await onSave(name.trim(), category.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-[20px] p-6 w-full max-w-[450px] mx-4 shadow-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#1E1E1E]">Add New Equipment Type</h2>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
          
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1E1E1E]">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0060B4] text-sm ${
                validationErrors.name ? 'border-red-500' : 'border-[#E5E7EB]'
              }`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) {
                  setValidationErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              placeholder="Enter equipment type name"
              required
              autoFocus
            />
            {validationErrors.name && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
            )}
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1E1E1E]">
              Category<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2 border rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#0060B4] text-sm ${
                validationErrors.category ? 'border-red-500' : 'border-[#E5E7EB]'
              }`}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (e.target.value.trim()) {
                  setValidationErrors(prev => ({ ...prev, category: '' }));
                }
              }}
              placeholder="Enter category"
              required
            />
            {validationErrors.category && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.category}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E7EB] rounded-[10px] hover:bg-gray-50 text-sm font-medium transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 bg-[#0060B4] text-white rounded-[10px] hover:bg-[#0056A4] text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}