"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddEquipmentForm from '@/app/components/Forms/AddEquipmentForm';
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import arrows from "../../../../../../public/Images/arrows.svg";
import Image from "next/image";

export default function AddEquipmentPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showScanPopup, setShowScanPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleShowScanPopup = () => setShowScanPopup(true);
  const handleCloseScanPopup = () => setShowScanPopup(false);

  // Handle form submission
  const handleSubmit = async (formData) => {
    // Clear previous errors
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      await response.json();
      
      // Success! Show success message but don't redirect
      setSuccess(true);
      
    } catch (err) {
      console.error("Error adding equipment:", err);
      setError(err.message || "Failed to add equipment. Please try again.");
    } finally {
      setIsSubmitting(false);
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

  const breadcrumbItems = [
    { label: 'Equipments', href: "../../admin/equipments" },
    { label: 'Add Equipment', href: "#" }
  ];

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
      <div className="hidden sm:block absolute top-0 right-0 z-10">
        <Image src={arrows} alt="" width={212} />
      </div>


      <div className={`w-full z-30 ${isMobile ? 'mt-10' : 'ml-[129px]'}`}>
        <div className="">
          <h1 className="font-oxanium p-6 font-semibold text-[26.07px] border-2">
            <Breadcrumb items={breadcrumbItems} />
          </h1>
        </div>

        <div className="px-10 py-6">
          {/* Pass the success/error states to the form */}
          <AddEquipmentForm 
            onScanClick={handleShowScanPopup} 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
            success={success}
          />
        </div>
      </div>

      <div className="absolute bottom-0 w-full">
      </div>

      {showScanPopup && <ScanPopup onClose={handleCloseScanPopup} />}
    </section>
  );
}

// ScanPopup Component
function ScanPopup({ onClose }) {
  return (
    <div className="fixed inset-0 flex justify-center items-center backdrop-blur-sm bg-black/30 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[400px] h-auto text-center relative">
        <button 
          className="absolute top-4 right-4 text-black text-xl flex items-center" 
          onClick={onClose}
        >
          &#8592; Cancel
        </button>

        <div className="mt-10 p-6 rounded-lg flex justify-center items-center w-[350px] h-[277px] mx-auto">
          <Image 
            src="/Images/codebar.svg" 
            alt="Barcode Scanner" 
            width={400} 
            height={277} 
          />
        </div>

        <button className="w-[300px] bg-orange-500 text-white font-semibold py-3 rounded-full mt-6 mx-auto">
          Scan Barcode
        </button>
        <button className="w-[300px] bg-blue-600 text-white font-semibold py-3 rounded-full mt-4 mx-auto">
          Enter Code Manually
        </button>

        <p className="text-gray-500 text-sm mt-6">
          Make sure the barcode is clearly visible
        </p>
      </div>
    </div>
  );
}