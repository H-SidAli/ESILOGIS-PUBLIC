"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import NotificationsTable from "@/app/components/Tables/NotificationsTable";
import arrows from "../../../../../public/Images/arrows.svg";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

export default function NotificationsPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showAddFilePopup, setShowAddFilePopup] = useState(false);
  const [addFileHandler, setAddFileHandler] = useState(null);

  const handleShowAddFilePopup = (addFileHandler) => {
    setAddFileHandler(() => addFileHandler);
    setShowAddFilePopup(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <>
      <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
        <div className="hidden sm:block absolute top-0 right-0 z-10">
          <Image src={arrows} alt="" width={212} />
        </div>
        <div className={`w-full z-30 ${isMobile ? 'mt-10' : 'ml-[129px]'}`}>
          <div className="">
            <h1 className="font-oxanium p-6 font-semibold text-[26.07px]">
              Notifications
            </h1>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            <NotificationsTable onScanClick={handleShowAddFilePopup} />
          </div>
        </div>
      </section>

      {showAddFilePopup && (
        <AddFilePopup 
          onClose={() => setShowAddFilePopup(false)}
          onFileAdded={(file) => addFileHandler && addFileHandler(file)}
        />
      )}
    </>
  );
}

const AddFilePopup = ({ onClose, onFileAdded }) => {
  const fileInputRef = useRef(null);

  const handleUploadFromDevice = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFileAdded(selectedFile);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center backdrop-blur-sm bg-black/30 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[450px] h-auto text-center relative">
        <button 
          className="absolute top-4 right-4 text-black text-xl flex items-center" 
          onClick={onClose}
        >
          &#8592; Cancel
        </button>

        <div className="mt-10 p-6 rounded-lg flex justify-center items-center w-[400px] h-[277px] mx-auto">
          <Image 
            src="/Images/file.svg" 
            alt="File Upload" 
            width={400} 
            height={277}
            priority
          />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />

        <button 
          onClick={handleUploadFromDevice}
          className="w-[300px] bg-orange-500 text-white font-semibold py-3 rounded-full mt-6 mx-auto hover:bg-orange-600"
        >
          Upload from Device
        </button>
        <button 
          className="w-[300px] bg-blue-600 text-white font-semibold py-3 rounded-full mt-4 mx-auto hover:bg-blue-700"
        >
          Upload File
        </button>
      </div>
    </div>
  );
};