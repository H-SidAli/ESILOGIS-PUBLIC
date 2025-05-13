"use client";
import React from 'react';

export default function AddFeedbackPopup({ onClose, onSubmit, initialFeedback = '', feedbackType = 'Leave Feedback' }) {
  const [feedback, setFeedback] = React.useState(initialFeedback);

  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit(feedback);
    }
  };

  const isEditable = feedbackType === 'Leave Feedback';
  const title = isEditable ? 'Add Feedback' : 'Your Feedback';

  return (
    <div className="fixed inset-0 bg-[#F9FAFB] flex items-center justify-center z-50">
      <div className="bg-white rounded-[10px] p-6 w-full max-w-[550px] mx-4 shadow-sm">
        {/* Title */}
        <h2 className="text-[20px] font-semibold text-[#101828] mb-8">
          Your Feedback
        </h2>

        {/* Feedback Input */}
        <div className="mb-8">
          <label 
            htmlFor="feedback" 
            className="block text-[14px] font-medium text-[#344054] mb-2"
          >
            Your Feedback
          </label>
          <textarea
            id="feedback"
            rows={6}
            disabled={!isEditable}
            className={`
              w-full 
              border 
              border-[#D0D5DD] 
              rounded-[8px] 
              p-4 
              text-[16px] 
              resize-none
              focus:outline-none 
              focus:ring-1 
              focus:ring-[#D0D5DD] 
              focus:border-[#D0D5DD]
              ${!isEditable ? 'bg-[#F9FAFB] text-[#475467]' : 'bg-white'}
            `}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Write your feedback here..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="
              px-4 
              py-2 
              text-[14px] 
              font-medium 
              text-[#344054] 
              bg-white 
              border 
              border-[#D0D5DD] 
              rounded-full 
              hover:bg-[#F9FAFB]
              transition-colors
            "
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}