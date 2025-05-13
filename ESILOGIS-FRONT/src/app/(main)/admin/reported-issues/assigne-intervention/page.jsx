"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import arrows from "../../../../../../public/Images/arrows.svg";
import ReportIssueForm from "@/app/components/Forms/assigne-intervention-form";
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";

export default function ReportIssueAdminPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showScanPopup, setShowScanPopup] = useState(false);

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
    { label: 'Issues', href: "../../admin/reported-issues" },
    { label: 'Report Issue', href: "#" }
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

        <div className="px-10 py-8">
          <ReportIssueForm onScanClick={handleShowScanPopup} />
        </div>
      </div>

      {showScanPopup && <ScanPopup onClose={handleCloseScanPopup} />}
    </section>
  );
}

function ScanPopup({ onClose }) {
  return (
    <div className="fixed inset-0 flex justify-center items-center backdrop-blur-sm bg-black/30 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[450px] h-auto text-center relative">
        <button 
          className="absolute top-4 right-4 text-black text-xl flex items-center" 
          onClick={onClose}
        >
          &#8592; Cancel
        </button>

        <div className="mt-10 p-6 border-dashed border-2 border-gray-400 rounded-lg flex justify-center items-center w-[400px] h-[277px] mx-auto">
          <Image 
            src="/Images/codebar.svg" 
            alt="Barcode Scanner" 
            width={400} 
            height={277} 
          />
        </div>

        <button className="w-[300px] bg-orange-500 text-white font-semibold py-3 rounded-full mt-6 mx-auto hover:bg-orange-600">
          Take Photo
        </button>
        <button className="w-[300px] bg-blue-600 text-white font-semibold py-3 rounded-full mt-4 mx-auto hover:bg-blue-700">
          Upload Image
        </button>

        <p className="text-gray-500 text-sm mt-6">
          Make sure to take a clear picture of the barcode
        </p>
      </div>
    </div>
  );
}

{/*   <h2 className="text-2xl font-semibold mb-6">Report an Issue</h2>
             
            <form className="flex flex-col space-y-3">
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <select className="w-full border rounded-lg p-1">
                  <option>Select location</option>
                </select>
              </div>

              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea className="w-full border rounded-lg p-3 h-24" placeholder=""></textarea>
              </div>

              
              <div>
                <label className="block text-sm font-medium mb-1">Assign Equipment (Optional)</label>
                <div className="flex gap-2">
                  <input type="text" className="w-full border rounded-lg " />
                  <button className="bg-orange-500 text-white rounded-lg px-6 whitespace-nowrap">
                    Scan Barcode
                    </button>

                </div>
              </div>

              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Assign
                </label>
                <select className="w-full border rounded-lg p-1">
                  <option>Select Assignment</option>
                </select>
              </div>

              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <div className="flex gap-2">
                  <span className="px-4 py-2 rounded-full bg-blue-200 text-blue-600 text-sm">Low</span>
                  <span className="px-4 py-2 rounded-full bg-yellow-200 text-yellow-600 text-sm">Medium</span>
                  <span className="px-4 py-2 rounded-full bg-red-200 text-red-600 text-sm">High</span>
                </div>
              </div>

             
              <div className="flex justify-end gap-4 pt-4">
                <button className="border px-8 rounded-lg">Cancel</button>
                <button className="bg-blue-600 text-white px-8 py-0.5 rounded-lg">Report Issue</button>
              </div>
            </form> */}