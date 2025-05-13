"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Clock, X, Info } from "lucide-react";
import WorkOrderPausePopup from "../popups/WorkOrderPausePopup";
import WorkOrderDonePopup from "../popups/WorkOrderDonePopup";
import { useRouter } from "next/navigation";

export default function CardPhone({
  workOrder,
  onBeginTask,
  onCompleteTask,
  onPauseTask,
  onResumeTask,
  onShowDetails,
  isSubmitting = false
}) {
  const router = useRouter();
  
  // Local state
  const [localStatus, setLocalStatus] = useState(workOrder.status.toLowerCase());
  const [showDonePopup, setShowDonePopup] = useState(false);
  const [showPausePopup, setShowPausePopup] = useState(false);
  const [pauseReason, setPauseReason] = useState("");

  // Timer state
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Popup form state
  const [actions, setActions] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [toastMessage, setToastMessage] = useState({ show: false, message: '', type: '' });

  const controls = useAnimationControls();
  const cardRef = useRef(null);
  const intervalRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isTimerRunning]);

  // Reset timer if workOrder changes (optional)
  useEffect(() => {
    setLocalStatus(workOrder.status.toLowerCase());
    // If work order is in progress, start timer
    if (workOrder.status.toLowerCase() === "in progress") {
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  }, [workOrder.id, workOrder.status]);

  // Show a toast notification
  const showToast = (message, type = 'success') => {
    setToastMessage({ show: true, message, type });
    setTimeout(() => setToastMessage({ show: false, message: '', type: '' }), 3000);
  };

  // Format timer function
  const formatTimer = () => {
    const hours = Math.floor(timer / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((timer % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timer % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleBegin = (e) => {
    e && e.stopPropagation();
    setLocalStatus("in progress");
    setTimer(0);
    setIsTimerRunning(true);
    if (onBeginTask) {
      try {
        onBeginTask(workOrder.id);
        showToast('Task started successfully!');
      } catch (error) {
        console.error('Error starting task:', error);
        showToast('Failed to start task. Please try again.', 'error');
      }
    }
  };

  const handlePause = (e) => {
    e && e.stopPropagation();
    // Open the pause popup instead of immediately changing status
    setShowPausePopup(true);
  };

  const handlePauseSubmit = () => {
    // Close the popup
    setShowPausePopup(false);
    
    if (!pauseReason.trim()) {
      showToast('Please provide a reason for pausing the task', 'warning');
      return;
    }
    
    try {
      // Now apply the changes
      setLocalStatus("paused");
      setIsTimerRunning(false);
      
      // Call the parent component's handler with the pause reason
      if (onPauseTask) {
        onPauseTask(workOrder.id, { reason: pauseReason });
        showToast('Task paused successfully');
      }
      
      // Reset the pause reason field
      setPauseReason("");
    } catch (error) {
      console.error('Error pausing task:', error);
      showToast('Failed to pause task. Please try again.', 'error');
    }
  };

  const handleResume = (e) => {
    e && e.stopPropagation();
    try {
      setLocalStatus("in progress");
      setIsTimerRunning(true);
      if (onResumeTask) {
        onResumeTask(workOrder.id);
        showToast('Task resumed successfully!');
      }
    } catch (error) {
      console.error('Error resuming task:', error);
      showToast('Failed to resume task. Please try again.', 'error');
    }
  };

  const handleDone = (e) => {
    e && e.stopPropagation();
    setShowDonePopup(true);
  };

  const handleDoneSubmit = () => {
    if (!actions.trim()) {
      showToast('Please provide actions taken', 'warning');
      return;
    }
    
    try {
      setShowDonePopup(false);
      setLocalStatus("complete");
      setIsTimerRunning(false);
      
      if (onCompleteTask) {
        onCompleteTask(workOrder.id, { 
          action: actions, // Note: API expects 'action' (singular)
          partsUsed, 
          notes 
        });
        showToast('Task completed successfully!');
      }
      
      setActions("");
      setPartsUsed("");
      setNotes("");
    } catch (error) {
      console.error('Error completing task:', error);
      showToast('Failed to complete task. Please try again.', 'error');
    }
  };

  const handleShowDetails = (e) => {
    // Prevent default if this is an event
    if (e) e.stopPropagation();
    
    try {
      // If there's a callback, execute it
      if (onShowDetails) {
        onShowDetails(workOrder.id);
      } else {
        // Otherwise navigate directly (fallback)
        router.push(`/technician/work-order-details/${workOrder.id}`);
      }
    } catch (error) {
      console.error('Error navigating to details:', error);
      showToast('Failed to open details. Please try again.', 'error');
    }
  };

  const renderActionButtons = () => {
    if (localStatus === "pending") {
      return (
        <div className="flex gap-2 w-full">
          <button
            className="w-full bg-[#6B7280] text-white py-2 px-4 rounded-[13.07px] text-sm hover:bg-gray-600 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              handleShowDetails(); 
            }}
          >
            Details
          </button>
          <button
            className="w-full bg-[#0060B4] text-white py-2 px-4 rounded-[13.07px] text-sm hover:bg-[#004d91] transition-colors"
            onClick={handleBegin}
            disabled={isSubmitting}
          >
            Begin
          </button>
        </div>
      );
    } else if (localStatus === "paused") {
      return (
        <div className="flex gap-2 w-full">
          <button
            className="w-full bg-[#6B7280] text-white py-2 px-4 rounded-[13.07px] text-sm hover:bg-gray-600 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              handleShowDetails(); 
            }}
          >
            Details
          </button>
          <button
            className="w-full bg-[#0060B4] text-white py-2 px-4 rounded-[13.07px] text-sm hover:bg-[#004d91] transition-colors"
            onClick={handleResume}
            disabled={isSubmitting}
          >
            Resume
          </button>
        </div>
      );
    } else if (localStatus === "in progress") {
      return (
        <div className="flex gap-2 w-full">
          <button
            className="w-full bg-[#6B7280] text-white py-2 px-4 rounded-[13.07px] text-sm hover:bg-gray-600 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              handleShowDetails(); 
            }}
          >
            Details
          </button>
          <button
            className="w-full bg-[#EA8B00] text-white py-2 px-4 rounded-[13.07px] text-sm hover:bg-[#d07a00] transition-colors"
            onClick={handlePause}
            disabled={isSubmitting}
          >
            Pause
          </button>
          <button
            className="w-full bg-[#0060B4] text-white py-2 px-4 rounded-[13.07px] text-sm hover:bg-[#004d91] transition-colors"
            onClick={handleDone}
            disabled={isSubmitting}
          >
            Done
          </button>
        </div>
      );
    } else {
      return (
        <div className="flex gap-2 w-full">
          <button
            className="w-full max-w-[145px] bg-[#6B7280] text-white py-2 px-4 rounded-[13.07px] text-sm hover:bg-gray-600 transition-colors"
            style={{ marginLeft: "auto" }}
            onClick={(e) => { 
              e.stopPropagation(); 
              handleShowDetails(); 
            }}
          >
            Details
          </button>
        </div>
      );
    }
  };

  return (
    <>
      <motion.div
        className="rounded-[15px] overflow-hidden border-[2px] border-solid border-[#BBD6ED] mb-3 bg-white relative"
        ref={cardRef}
        animate={controls}
        onClick={handleShowDetails}
        whileTap={{ scale: 0.98 }}
      >
        <div className="p-4">
          <div className="flex flex-row items-start justify-between mb-3">
            <div className="flex flex-col">
              <div className="text-[#373737] text-base">
                {workOrder.date}
              </div>
              <div className="text-[#0060B4] text-lg font-medium">
                {workOrder.location}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex -space-x-1 mb-1">
                {Array.isArray(workOrder.assignee) &&
                  workOrder.assignee.slice(0, 2).map((person, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-medium border border-white"
                    >
                      {person.avatar || (person.firstName ? person.firstName.charAt(0) : '?')}
                    </div>
                  ))}
                {workOrder.assignee && workOrder.assignee.length > 2 && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium border border-white">
                    +{workOrder.assignee.length - 2}
                  </div>
                )}
              </div>
              <div
                className={`px-2 py-0.5 rounded-full text-xs ${
                  workOrder.priority === "High"
                    ? "bg-red-100 text-red-800"
                    : workOrder.priority === "Medium" || workOrder.priority === "Med"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {workOrder.priority}
              </div>
            </div>
          </div>

          <div
            className="text-[#373737] text-sm mb-2 overflow-hidden"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {workOrder.description}
          </div>

          <div className="flex flex-row items-center mb-3">
            <div
              className={`w-2 h-2 rounded-full mr-1 ${
                localStatus === "in progress"
                  ? "bg-green-500"
                  : localStatus === "complete" || localStatus === "completed"
                  ? "bg-gray-500"
                  : localStatus === "pending"
                  ? "bg-yellow-500"
                  : localStatus === "paused"
                  ? "bg-orange-500"
                  : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-[#373737] capitalize">
              {localStatus}
            </span>

            {isTimerRunning && (
              <div className="ml-3 flex items-center text-sm text-[#373737]">
                <Clock className="mr-1 h-3 w-3" />
                {formatTimer()}
              </div>
            )}

            {workOrder.timer && !isTimerRunning && localStatus === "in progress" && (
              <div className="ml-3 flex items-center text-sm text-[#373737]">
                <Clock className="mr-1 h-3 w-3" />
                {workOrder.timer}
              </div>
            )}
          </div>

          {renderActionButtons()}
          
          {/* Badge for work order ID - helps users identify the card */}
          <div className="absolute top-2 right-2 bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full opacity-70">
            #{workOrder.id}
          </div>
        </div>
      </motion.div>

      {/* Complete Task Popup */}
      <WorkOrderDonePopup
        open={showDonePopup}
        onClose={() => setShowDonePopup(false)}
        onSubmit={handleDoneSubmit}
        actions={actions}
        setActions={setActions}
        partsUsed={partsUsed}
        setPartsUsed={setPartsUsed}
        notes={notes}
        setNotes={setNotes}
        isMobile={true}
        isSubmitting={isSubmitting}
      />

      {/* Pause Task Popup */}
      <WorkOrderPausePopup
        open={showPausePopup}
        onClose={() => setShowPausePopup(false)}
        onSubmit={handlePauseSubmit}
        details={pauseReason}
        setDetails={setPauseReason}
        isSubmitting={isSubmitting}
        isMobile={true}
      />

      {/* Toast notification */}
      {toastMessage.show && (
        <div 
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm shadow-lg flex items-center ${
            toastMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            toastMessage.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            toastMessage.type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
          style={{ maxWidth: '90%' }}
        >
          <span>{toastMessage.message}</span>
        </div>
      )}
    </>
  );
}