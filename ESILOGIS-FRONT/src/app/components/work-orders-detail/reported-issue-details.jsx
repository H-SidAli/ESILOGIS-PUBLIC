import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CompleteTaskForm from './complete-task-form';

export default function ReportedIssueDetails({ 
  workOrder, 
  onBeginTask, 
  onPauseTask,
  onResumeTask,
  isSubmitting 
}) {
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const router = useRouter();
  
  const handleCancel = () =>{
    router.push('/technician/workOrders');
  }

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
      case 'med':
        return 'text-amber-500';
      default:
        return 'text-blue-600';
    }
  };
  
  const handleCompleteSubmit = (workOrderId, formData) => {
    console.log("Completing task", workOrderId, formData);
    setShowCompleteForm(false);
  };

  // Render action buttons based on status
  const renderActionButtons = () => {
    const status = workOrder?.status?.toLowerCase();
    
    if (status === 'pending') {
      return (
        <>
          <button
            type="button" 
            className="px-15 py-1 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button" 
            className="px-15 py-1 rounded-md bg-[#EA8B00] text-white font-medium hover:bg-[#d07a00]"
            onClick={onPauseTask}
            disabled={isSubmitting}
          >
            Postpone
          </button>
          <button
            type="button" 
            className="px-15 py-1 rounded-md bg-[#0060B4] text-white font-medium hover:bg-[#004d91]"
            onClick={onBeginTask}
            disabled={isSubmitting}
          >
            Continue
          </button>
        </>
      );
    } else if (status === 'in progress') {
      return (
        <>
          <button
            type="button" 
            className="px-15 py-1 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
            disabled={isSubmitting}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button" 
            className="px-15 py-1 rounded-md bg-[#EA8B00] text-white font-medium hover:bg-[#d07a00]"
            onClick={onPauseTask}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Pause'}
          </button>
          <button
            type="button" 
            className="px-15 py-1 rounded-md bg-[#0060B4] text-white font-medium hover:bg-[#004d91]"
            onClick={() => setShowCompleteForm(true)}
            disabled={isSubmitting}
          >
            Complete
          </button>
        </>
      );
    } else if (status === 'paused') {
      return (
        <>
          <button
            type="button" 
            className="px-15 py-1 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
            disabled={isSubmitting}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button" 
            className="px-15 py-1 rounded-md bg-[#0060B4] text-white font-medium hover:bg-[#004d91]"
            onClick={onResumeTask}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Resume'}
          </button>
        </>
      );
    } else {
      return (
        <button
          type="button" 
          className="px-15 py-1 rounded-md border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
        >
          Back to work orders
        </button>
      );
    }
  };

  return (
    <div className="w-full mx-auto bg-white p-4 sm:p-20 rounded-lg shadow-sm max-w-6xl font-sans">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-15">Reported Issue Details</h2>
      
      <div className="space-y-4 sm:space-y-6">
        {/* Location */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
          <div className="text-gray-800 font-medium w-full sm:w-[120px]">Location</div>
          <div className="flex-1">{workOrder?.location || "Not specified"}</div>
        </div>

        {/* Description */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6">
          <div className="text-gray-800 font-medium w-full sm:w-[120px]">Description</div>
          <div className="flex-1">{workOrder?.description || "No description provided"}</div>
        </div>

        {/* Equipment */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
          <div className="text-gray-800 font-medium w-full sm:w-[120px]">Equipment</div>
          <div className="flex-1">{workOrder?.equipment || "Not specified"}</div>
        </div>

        {/* Priority */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
          <div className="text-gray-800 font-medium w-full sm:w-[120px]">Priority</div>
          <div className="flex-1">
            <span className={getPriorityClass(workOrder?.priority)}>
              {workOrder?.priority || "Low"}
            </span>
          </div>
        </div>

        {/* Pictures */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
          <div className="text-gray-800 font-medium w-full sm:w-[120px]">Pictures</div>
          <div className="flex-1">
            {workOrder?.pictures && workOrder.pictures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {workOrder.pictures.map((pic, index) => (
                  <a key={index} href="#" className="text-blue-600 underline cursor-pointer">
                    {pic}
                  </a>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">No pictures attached</span>
            )}
          </div>
        </div>

        {/* Assignees */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
          <div className="text-gray-800 font-medium w-full sm:w-[120px]">Assignees</div>
          <div className="flex-1">
            {workOrder?.assignees && workOrder.assignees.length > 0 ? (
              <div className="flex">
                {workOrder.assignees.map((assignee, index) => (
                  <div key={index} className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold -ml-1 first:ml-0 border border-white">
                    {assignee.avatar}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">No assignees</span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
          <div className="text-gray-800 font-medium w-full sm:w-[120px]">Status</div>
          <div className="flex-1 flex items-center">
            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
              workOrder?.status?.toLowerCase() === "in progress" ? "bg-green-500" :
              workOrder?.status?.toLowerCase() === "complete" || workOrder?.status?.toLowerCase() === "completed" ? "bg-blue-500" :
              workOrder?.status?.toLowerCase() === "pending" ? "bg-amber-500" :
              workOrder?.status?.toLowerCase() === "paused" ? "bg-orange-400" :
              "bg-red-500"
            }`}></div>
            <span>{workOrder?.status || "Pending"}</span>
          </div>
        </div>
      </div>

      {/* Footer with timer and action buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-100 gap-4">
        {/* Timer */}
        <div className="flex items-center text-gray-600 self-start sm:self-auto">
          <Clock className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">{workOrder?.timer || "00:12:12"}</span>
        </div>

        {/* Action buttons */}
<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
  {renderActionButtons()}
</div>
      </div>

      {/* Complete Task Form */}
      <CompleteTaskForm
        isOpen={showCompleteForm}
        onClose={() => setShowCompleteForm(false)}
        onSubmit={handleCompleteSubmit}
        isSubmitting={isSubmitting}
        workOrderId={workOrder?.id}
      />
    </div>
  );
}