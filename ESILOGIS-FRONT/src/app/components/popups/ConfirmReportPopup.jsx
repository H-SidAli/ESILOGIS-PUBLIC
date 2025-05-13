"use client";
import { useEffect, useRef } from "react";

export default function ConfirmReportPopup({ onConfirm, onCancel }) {
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onCancel();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div 
        ref={popupRef}
        className="bg-white rounded-[20px] py-10 px-17 w-full max-w-[700px] mx-4"
      >
        {/* Go Back Button */}
        <div className="flex justify-end">
          <button 
            onClick={onCancel}
            className="text-[#475467] hover:text-[#344054] flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16.6668 10H3.3335" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.3335 15L3.3335 10L8.3335 5" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Go Back
          </button>
        </div>

        {/* Confirmation Text */}
        <div className="text-center mt-6 mb-8">
          <p className="text-[#101828] text-[18px] leading-6">
            Confirm your report? By proceeding, you acknowledge that the information provided is accurate and you are responsible for this report.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <button
            onClick={onCancel}
            className="w-full sm:w-[200px] py-2 px-5 bg-[#475467] text-white rounded-full font-medium hover:bg-[#344054]"
          >
            Cancel Report
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-[200px] py-2 px-5 bg-[#0060B4] text-white rounded-full font-medium hover:bg-[#004d91]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}