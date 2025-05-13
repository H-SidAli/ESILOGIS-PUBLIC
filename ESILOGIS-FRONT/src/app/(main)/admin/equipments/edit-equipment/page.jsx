"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import { useEffect, useState } from "react";
import Image from "next/image";
import arrows from "../../../../../../public/Images/arrows.svg";
import EditEquipmentForm from "@/app/components/Forms/EditEquipmentForm";
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";
import { useRef } from "react";
export default function EditEquipmentPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showFilePopup, setShowFilePopup] = useState(false);
  const [addFileHandler, setAddFileHandler] = useState(null);

  const handleShowFilePopup = (handler) => {
    setAddFileHandler(() => handler);
    setShowFilePopup(true);
  };

  const handleCloseFilePopup = () => setShowFilePopup(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const breadcrumbItems = [
    { label: 'Equipment', href: "../../admin/equipements" },
    { label: 'Edit Equipment', href: "#" }
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

        <div className="px-5 py-8">
          <EditEquipmentForm onAddFile={handleShowFilePopup} />
        </div>
      </div>

      {showFilePopup && (
        <AddFilePopup
          onClose={handleCloseFilePopup}
          onFileAdded={(file) => addFileHandler && addFileHandler(file)}
        />
      )}
    </section>
  );
}

function AddFilePopup({ onClose, onFileAdded }) {
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
      <div className="bg-white rounded-2xl shadow-lg w-[400px] h-auto text-center relative p-5">
        <button
          className="absolute top-4 right-4 text-black text-xl flex items-center"
          onClick={onClose}
        >
          &#8592; Cancel
        </button>

        <div className="mt-10 p-6 rounded-lg flex justify-center items-center w-[350px] h-[277px] mx-auto">
          <Image src="/Images/file.svg" alt="File Upload" width={400} height={277} />
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
        <button className="w-[300px] bg-blue-600 text-white font-semibold py-3 rounded-full mt-4 mx-auto hover:bg-blue-700">
          Upload File
        </button>
      </div>
    </div>
  );
}