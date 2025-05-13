import React, { useState, useRef, useEffect } from 'react';
import { Clock, MoreVertical } from 'lucide-react';
import { motion, useAnimationControls } from "framer-motion";
import WorkOrderDonePopup from '../popups/WorkOrderDonePopup';
import WorkOrderPausePopup from '../popups/WorkOrderPausePopup';

const formatTime = (seconds) => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const Card = ({
  workOrder,
  isFirstCard,
  isSelected,
  onSelect,
  onBeginTask,
  onCompleteTask,
  onPauseTask, // New prop for pause action
  onResumeTask, // New prop for resume action
  onPostpone,
  menuOpen,
  toggleMenu,
  menuButtonRef,
  menuPosition,
  getStatusColor,
  getPriorityColor,
  AssigneeDropdown,
  DropdownMenu,
  handleShowDetails,
  isSubmitting = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localStatus, setLocalStatus] = useState(workOrder.status.toLowerCase());
  const [showDonePopup, setShowDonePopup] = useState(false);
  const [showPausePopup, setShowPausePopup] = useState(false);

  // Timer state
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Popup form state
  const [actions, setActions] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  
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

  // Reset timer if workOrder changes
  useEffect(() => {
    setLocalStatus(workOrder.status.toLowerCase());
    // If work order is in progress, start timer
    if (workOrder.status.toLowerCase() === "in progress") {
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  }, [workOrder.id, workOrder.status]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    controls.start({
      height: isExpanded ? 0 : 'auto',
      opacity: isExpanded ? 0 : 1,
      transition: { duration: 0.3 }
    });
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(!isSelected);
    }
  };

  // Button logic
  const renderActionButtons = () => {
    if (localStatus === "pending") {
      return (
        <div className="flex space-x-2">
          <button
            className="bg-[#6B7280] text-white px-4 py-1 rounded-[13.07px] text-sm w-[145px] h-[32.67px] hover:bg-gray-600 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              handleShowDetails(workOrder.id);
            }}
          >
            Details
          </button>
          <button
            className="bg-[#EA8B00] text-white px-4 py-1 rounded-[13.07px] text-sm w-[145px] h-[32.67px] hover:bg-[#d07a00] transition-colors"
            onClick={() => {
              setLocalStatus("postponed");
              if (onPostpone) onPostpone(workOrder.id);
            }}
            disabled={isSubmitting}
          >
            Postpone
          </button>
          <button
            className="bg-[#0060B4] text-white px-4 py-1 rounded-[13.07px] text-sm w-[145px] h-[32.67px] hover:bg-[#004d91] transition-colors"
            onClick={() => {
              setLocalStatus("in progress");
              setTimer(0);
              setIsTimerRunning(true);
              if (onBeginTask) onBeginTask(workOrder.id);
            }}
            disabled={isSubmitting}
          >
            Begin
          </button>
        </div>
      );
    } else if (localStatus === "paused") {
      return (
        <div className="flex space-x-2">
          <button
            className="bg-[#6B7280] text-white px-4 py-1 rounded-[13.07px] text-sm w-[145px] h-[32.67px] hover:bg-gray-600 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              handleShowDetails(workOrder.id);
            }}
          >
            Details
          </button>
          <button
            className="bg-[#0060B4] text-white px-4 py-1 rounded-[13.07px] text-sm w-[145px] h-[32.67px] hover:bg-[#004d91] transition-colors"
            onClick={() => {
              setLocalStatus("in progress");
              setIsTimerRunning(true);
              if (onResumeTask) onResumeTask(workOrder.id);
            }}
            disabled={isSubmitting}
          >
            Resume
          </button>
        </div>
      );
    } else if (localStatus === "in progress") {
      return (
        <div className="flex space-x-2">
          <button
            className="bg-[#6B7280] text-white px-4 py-1 rounded-[13.07px] text-sm w-[145px] h-[32.67px] hover:bg-gray-600 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              handleShowDetails(workOrder.id);
            }}
          >
            Details
          </button>
          <button
            className="bg-[#EA8B00] text-white px-4 py-1 rounded-[13.07px] text-sm w-[145px] h-[32.67px] hover:bg-[#d07a00] transition-colors"
            onClick={handlePauseClick}
            disabled={isSubmitting}
          >
            Pause
          </button>
          <button
            className="bg-[#1DA83B] text-white px-4 py-1 rounded-[13.07px] text-sm w-[145px] h-[32.67px] hover:bg-[#198a31] transition-colors"
            onClick={() => setShowDonePopup(true)}
            disabled={isSubmitting}
          >
            Done
          </button>
        </div>
      );
    } else {
      return (
        <div className="flex space-x-2">
          <button
            className="bg-[#6B7280] text-white px-4 py-1 rounded-[13.07px] text-sm w-[145px] h-[32.67px] hover:bg-gray-600 transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              handleShowDetails(workOrder.id);
            }}
          >
            Details
          </button>
        </div>
      );
    }
  };

  // Handle Done popup submit
  const handleDoneSubmit = () => {
    if (!actions.trim()) {
      alert("Please provide actions taken");
      return;
    }
    
    setShowDonePopup(false);
    setLocalStatus("complete");
    setIsTimerRunning(false);
    
    if (onCompleteTask) {
      onCompleteTask(workOrder.id, { 
        action: actions, // Note: API expects 'action' (singular)
        partsUsed, 
        notes 
      });
    }
    
    setActions("");
    setPartsUsed("");
    setNotes("");
  };

  const handlePauseClick = (e) => {
    e.stopPropagation(); // Prevent card expansion
    setShowPausePopup(true);
  };
  
  // Handle Pause popup submit
  const handlePauseSubmit = () => {
    if (!pauseReason.trim()) {
      alert("Please provide a reason for pausing");
      return;
    }
    
    setShowPausePopup(false);
    // Only change status after confirmation
    setLocalStatus("paused");
    // Stop the timer after confirmation
    setIsTimerRunning(false);
    
    if (onPauseTask) {
      onPauseTask(workOrder.id, { reason: pauseReason });
    }
    
    setPauseReason("");
  };
  

  return (
    <div
      className={`text-sm flex flex-col w-full border-b border-gray-200 bg-white ${
        isFirstCard ? "rounded-t-[40px]" : ""
      }`}
      ref={cardRef}
    >
      {/* Main row */}
      <div
        className={`flex items-center py-4 px-4 cursor-pointer hover:bg-gray-50 ${
          isFirstCard ? "rounded-t-[40px]" : ""
        }`}
        onClick={toggleExpand}
      >
        {/* Checkbox */}
        <div className="flex items-center justify-center w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="w-4 h-4 accent-blue-600 cursor-pointer"
            checked={isSelected}
            onChange={handleCheckboxChange}
          />
        </div>
        {/* Date */}
        <div className="w-36 px-6 text-gray-700">{workOrder.date}</div>
        {/* Description */}
        <div className="flex-grow px-6 text-gray-700">{workOrder.description}</div>
        {/* Status */}
        <div className="w-32  text-center whitespace-nowrap text-gray-500 flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(localStatus)}`}></div>
          {localStatus.charAt(0).toUpperCase() + localStatus.slice(1)}
        </div>
        {/* Priority */}
        <div className="w-28 px-6 flex justify-center">
          <span className={`px-3 py-1 rounded-full text-xs ${getPriorityColor(workOrder.priority)}`}>
            {workOrder.priority}
          </span>
        </div>
        {/* Assignee */}
        <div className="w-32 px-6 flex justify-center">
          {AssigneeDropdown}
        </div>
        {/* Location */}
        <div className="w-28 px-6 text-center">{workOrder.location}</div>
        {/* Last Updated */}
        <div className="w-36 px-6">{workOrder.lastUpdated}</div>
        {/* More Actions */}
        <div className="w-8 px-2 relative" onClick={(e) => e.stopPropagation()}>
          {localStatus !== "complete" && (
            <button
              ref={menuButtonRef}
              className={`p-1 rounded-full hover:bg-gray-200 ${
                menuOpen ? "bg-gray-200" : ""
              }`}
              onClick={(e) => toggleMenu(e)}
            >
              <MoreVertical size={16} />
            </button>
          )}
          {menuOpen && DropdownMenu}
        </div>
      </div>
      {/* Expanded content */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={controls}
        className="overflow-hidden"
      >
        <div className="p-4 flex justify-end">
          {localStatus === "in progress" && (
            <div className="flex items-center text-gray-500 mr-4">
              <Clock size={16} className="mr-1" />
              <span>{formatTime(timer)}</span>
            </div>
          )}
          {renderActionButtons()}
        </div>
      </motion.div>
      {/* Done Popup */}
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
        isSubmitting={isSubmitting}
      />
      {/* Pause Popup */}
      <WorkOrderPausePopup
        open={showPausePopup}
        onClose={() => setShowPausePopup(false)}
        onSubmit={handlePauseSubmit}
        details={pauseReason}
        setDetails={setPauseReason}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Card;