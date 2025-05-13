import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, User, Users } from "lucide-react"; 
import { motion, useAnimationControls } from "framer-motion"; 
import Link from "next/link";
//Details
const Card = ({ 
  intervention, 
  onDelete, 
  onApprove, 
  onDeny, 
  onDetails, 
  isFirstCard,
  isSelected = false,
  onSelect
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showAssigneePopup, setShowAssigneePopup] = useState(false);
    const controls = useAnimationControls();
    const menuRef = useRef(null);
    const assigneeRef = useRef(null);
    
    // Close menu and assignee popup when clicking outside
    useEffect(() => {
      function handleClickOutside(event) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setMenuOpen(false);
        }
        if (assigneeRef.current && !assigneeRef.current.contains(event.target)) {
          setShowAssigneePopup(false);
        }
      }
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
    
    const toggleMenu = (e) => {
      e.stopPropagation();
      setMenuOpen(!menuOpen);
    };
    
    const toggleAssigneePopup = (e) => {
      e.stopPropagation();
      setShowAssigneePopup(!showAssigneePopup);
    };
  
    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
      controls.start({
        height: isExpanded ? 0 : 'auto',
        opacity: isExpanded ? 0 : 1,
        transition: { duration: 0.3 }
      });
    };

    // Handler for checkbox change
    const handleCheckboxChange = (e) => {
      e.stopPropagation();
      if (onSelect) {
        onSelect(!isSelected);
      }
    };
    
    // Priority badge styling
    const getPriorityBadgeStyle = (priority) => {
      switch (priority?.toLowerCase()) {
        case "high":
          return "bg-red-100 text-red-600";
        case "medium":
          return "bg-yellow-100 text-yellow-600";
        case "low":
          return "bg-blue-100 text-blue-600";
        default:
          return "bg-gray-100 text-gray-600";
      }
    };
  
    // Status dot styling
    const getStatusDotStyle = (status) => {
      switch (status?.toLowerCase()) {
        case "in progress":
          return "bg-green-500";
        case "pending":
          return "bg-yellow-500";
        case "postponed":
          return "bg-orange-500";
        case "completed":
        case "cancelled":
          return "bg-gray-400";
        case "denied":
          return "bg-red-500";
        case "-":
        default:
          return "bg-gray-300";
      }
    };
    
    // Get assignee initials for avatar
    const getAssigneeInitials = (name) => {
      if (!name) return "";
      
      const nameParts = name.split(" ");
      if (nameParts.length === 1) return nameParts[0][0];
      
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`;
    };
    
    // Get background color for avatar based on name
    const getAvatarColor = (name) => {
      if (!name) return "bg-gray-300";
      
      const colors = [
        "bg-blue-500", "bg-green-500", "bg-yellow-500", 
        "bg-red-500", "bg-purple-500", "bg-pink-500",
        "bg-indigo-500", "bg-teal-500"
      ];
      
      // Simple hash function to get consistent color for name
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      return colors[Math.abs(hash) % colors.length];
    };
    
    // Check if we have assignees
    const hasAssignees = Array.isArray(intervention.assignees) && intervention.assignees.length > 0;
  
    // Apply border radius styling conditionally based on isFirstCard prop
    const cardStyle = isFirstCard 
      ? "text-sm flex flex-col w-full border-b border-t border-gray-200 bg-white rounded-t-[40px] sm:rounded-t-[40px]" 
      : "text-sm flex flex-col w-full border-b border-t border-gray-200 bg-white";
  
    // Check if status is Pending (requires approval)
    const needsApproval = intervention.status === "Pending";
  
    // Render assignee avatar (single or multiple)
    const renderAssigneeAvatars = () => {
      if (!hasAssignees) {
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={16} className="text-gray-500" />
          </div>
        );
      }
      
      // If we have only one assignee, show their avatar
      if (intervention.assignees.length === 1) {
        const assignee = intervention.assignees[0];
        
        if (assignee.avatarUrl) {
          return (
            <img 
              src={assignee.avatarUrl} 
              alt={assignee.name}
              className="w-8 h-8 rounded-full object-cover border border-gray-300" 
            />
          );
        } else {
          // Show initials avatar if no image is available
          return (
            <div className={`w-8 h-8 ${getAvatarColor(assignee.name)} rounded-full flex items-center justify-center text-white font-medium`}>
              {getAssigneeInitials(assignee.name)}
            </div>
          );
        }
      }
      
      // If we have multiple assignees, show an avatar stack
      return (
        <div className="relative flex items-center">
          {intervention.assignees.slice(0, 2).map((assignee, idx) => (
            <div 
              key={idx} 
              className={`w-7 h-7 rounded-full border-2 border-white ${idx > 0 ? "absolute" : ""}`}
              style={idx > 0 ? { left: "14px" } : {}}
            >
              {assignee.avatarUrl ? (
                <img 
                  src={assignee.avatarUrl} 
                  alt={assignee.name}
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <div className={`w-full h-full ${getAvatarColor(assignee.name)} rounded-full flex items-center justify-center text-white font-medium text-xs`}>
                  {getAssigneeInitials(assignee.name)}
                </div>
              )}
            </div>
          ))}
          
          {intervention.assignees.length > 2 && (
            <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center absolute left-7 text-xs font-medium text-gray-600">
              +{intervention.assignees.length - 2}
            </div>
          )}
        </div>
      );
    };
    
    return (
      <div className={cardStyle}>
        {/* Desktop layout - hidden on mobile */}
        <div 
          className={`hidden sm:flex items-center py-4 px-4 cursor-pointer hover:bg-gray-50 ${isFirstCard ? "rounded-t-[40px]" : ""}`}
          onClick={toggleExpand}
        > 
          {/* Checkbox */}
          <div className="flex items-center justify-center w-8" onClick={(e) => e.stopPropagation()}>
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-blue-600 cursor-pointer" 
              checked={isSelected}
              onChange={handleCheckboxChange}
            />
          </div>
  
          {/* Date */}
          <div className="w-36 text-gray-700">{intervention.date}</div>
  
          {/* Description */}
          <div className="flex-grow text-gray-700">{intervention.description}</div>
  
          {/* Status with colored dot */}
          <div className="w-24 text-center text-gray-500 flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusDotStyle(intervention.status)}`}></div>
            {intervention.status || "-"}
          </div>
  
          {/* Priority */}
          <div className="w-24 flex justify-center">
            <span className={`px-3 py-1 rounded-full text-xs ${getPriorityBadgeStyle(intervention.priority)}`}>
              {intervention.priority}
            </span>
          </div>
  
          {/* Assignees - Now showing profile picture(s) with popup */}
          <div className="w-24 flex justify-center" ref={assigneeRef}>
            <div className="relative">
              <button 
                className="focus:outline-none" 
                onClick={toggleAssigneePopup}
              >
                {renderAssigneeAvatars()}
              </button>
              
              {/* Popup for assignee details */}
              {showAssigneePopup && hasAssignees && (
                <div className="absolute z-20 bg-white shadow-lg rounded-md p-3 w-64 left-1/2 transform -translate-x-1/2 mt-2 border border-gray-200">
                  <div className="font-medium text-sm mb-2 flex items-center">
                    <Users size={16} className="mr-2" /> 
                    <span>{intervention.assignees.length} {intervention.assignees.length === 1 ? 'Assignee' : 'Assignees'}</span>
                  </div>
                  
                  {intervention.assignees.map((assignee, idx) => (
                    <div key={idx} className={`flex items-center py-2 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                      <div className="mr-3">
                        {assignee.avatarUrl ? (
                          <img 
                            src={assignee.avatarUrl} 
                            alt={assignee.name}
                            className="w-8 h-8 rounded-full object-cover border border-gray-300" 
                          />
                        ) : (
                          <div className={`w-8 h-8 ${getAvatarColor(assignee.name)} rounded-full flex items-center justify-center text-white font-medium`}>
                            {getAssigneeInitials(assignee.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{assignee.name}</div>
                        <div className="text-xs text-gray-500">
                          {assignee.role || "Team Member"}
                        </div>
                        {assignee.contact && (
                          <div className="text-xs text-gray-500">
                            {assignee.contact}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
  
          {/* Location */}
          <div className="w-24 text-center">{intervention.location}</div>
  
          {/* Last updated */}
          <div className="w-36">{intervention.lastUpdated}</div>
  
          {/* More actions button */}
          <div className="w-8 relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button className="p-1 rounded-full hover:bg-gray-200" onClick={toggleMenu}>
              <MoreVertical size={16} />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 w-40 z-10">
                <Link href={`../../admin/reported-issues/report-details/${intervention.id}`}> 
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    // onDetails?.(intervention.id);
                  }}
                >
                  Details
                </button>
                </Link>
               
                <hr /> 
                <Link href={`../../admin/reported-issues/report-details-edit/${intervention.id}`}> 
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle edit action
                  }}
                >
                  Edit
                </button>
                </Link>
               
                <hr />
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(intervention.id);
                  }}
                >
                  Cancel intervention
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile layout - shown only on small screens */}
        <div className="sm:hidden p-4 bg-white">
          {/* First row: checkbox, date, location */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                className="w-4 h-4 mr-3 accent-blue-600 cursor-pointer" 
                checked={isSelected}
                onChange={handleCheckboxChange}
              />
              <span className="text-gray-700">{intervention.date}</span>
            </div>
            <span className="text-gray-700">{intervention.location}</span>
          </div>
          
          {/* Second row: description */}
          <div className="mb-2">
            <p className="text-gray-700">{intervention.description}</p>
          </div>
          
          {/* Third row: assignee(s) and priority badge */}
          <div className="flex justify-between items-center mb-3">
            <div ref={assigneeRef}>
              <button onClick={toggleAssigneePopup}>
                {renderAssigneeAvatars()}
              </button>
              
              {/* Mobile assignee popup */}
              {showAssigneePopup && hasAssignees && (
                <div className="absolute z-20 bg-white shadow-lg rounded-md p-3 w-64 mt-2 border border-gray-200">
                  <div className="font-medium text-sm mb-2 flex items-center">
                    <Users size={16} className="mr-2" /> 
                    <span>{intervention.assignees.length} {intervention.assignees.length === 1 ? 'Assignee' : 'Assignees'}</span>
                  </div>
                  
                  {intervention.assignees.map((assignee, idx) => (
                    <div key={idx} className={`flex items-center py-2 ${idx > 0 ? 'border-t border-gray-100' : ''}`}>
                      <div className="mr-3">
                        {assignee.avatarUrl ? (
                          <img 
                            src={assignee.avatarUrl} 
                            alt={assignee.name}
                            className="w-8 h-8 rounded-full object-cover border border-gray-300" 
                          />
                        ) : (
                          <div className={`w-8 h-8 ${getAvatarColor(assignee.name)} rounded-full flex items-center justify-center text-white font-medium`}>
                            {getAssigneeInitials(assignee.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{assignee.name}</div>
                        <div className="text-xs text-gray-500">
                          {assignee.role || "Team Member"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <span className={`px-3 py-1 rounded-full text-xs ${getPriorityBadgeStyle(intervention.priority)}`}>
              {intervention.priority}
            </span>
          </div>
          
          {/* Buttons row */}
          <div className="flex space-x-2"> 
            <Link href={`../../admin/reported-issues/report-details/${intervention.id}`}>  
            <button 
              className="bg-[#757575] text-white py-2 rounded-md flex-1 text-center"
             
            >
              Details
            </button>
            
            </Link>
          
            
            {needsApproval && (
              <>
                <button 
                  className="bg-[#C90000] text-white py-2 rounded-md flex-1 text-center"
                  onClick={() => onDeny?.(intervention.id)}
                >
                  Deny
                </button>
                <button 
                  className="bg-[#0060B4] text-white py-2 rounded-md flex-1 text-center"
                  onClick={() => onApprove?.(intervention.id)}
                >
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Action buttons container for desktop - animated with Framer Motion */}
        <motion.div 
          className="hidden sm:block"
          initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
          animate={controls}
        >
          <div className="py-4 flex justify-end pr-8">
            <div className="flex space-x-2"> 
              <Link href={`../../admin/reported-issues/report-details/${intervention.id}`}>
                   <button 
                className="bg-[#757575] text-white px-4 py-2 rounded-xl w-[145px] text-center"
              
              >
                Details
              </button>
              </Link>
             
              
              {/* Only show Deny and Approve buttons when status is "Pending" */}
              {needsApproval && (
                <>
                  <button 
                    className="bg-[#C90000] text-white px-4 py-2 rounded-xl w-[145px] text-center"
                    onClick={() => onDeny?.(intervention.id)}
                  >
                    Deny
                  </button>
                  <button 
                    className="bg-[#0060B4] text-white px-4 py-2 rounded-xl w-[200px] text-center"
                    onClick={() => onApprove?.(intervention.id)}
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };
  
export default Card;