import React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

const WorkOrderPausePopup = ({
  open,
  onClose,
  onSubmit,
  details,
  setDetails,
  isSubmitting = false,
  isMobile = false
}) => {
  if (!open) return null;

  const popupContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 backdrop-blur-sm">
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-2xl p-8'} w-full max-w-md shadow-lg`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#009FE3]">Pause Work Order</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="mb-4">
            <label className="block mb-1 font-medium">
              Pause reason<span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={details}
              onChange={e => setDetails(e.target.value)}
              className="w-full border rounded-md p-2 min-h-[80px]"
              placeholder="Please provide details on why this work order is being paused..."
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-full border border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-[#0060B4] text-white hover:bg-[#004d91]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm Pause"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Use createPortal for mobile view
  return typeof document !== 'undefined' ? createPortal(popupContent, document.body) : null;
};

export default WorkOrderPausePopup;