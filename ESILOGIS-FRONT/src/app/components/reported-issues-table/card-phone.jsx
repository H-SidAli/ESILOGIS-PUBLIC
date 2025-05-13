import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react"; 
import Link from "next/link"; 
//edit
//Details
export default function InterventionsCards({ 
  // Basic information props
  id,
  dateTime = "Wednesday, 12:45",
  location = "S33",
  priority = "High",
  description = "Lorem Opium Lorem Opium...",
  status = "Complete",
  
  // Assignees handling props
  assignees = [],
  avatarPlaceholder = "https://randomuser.me/api/portraits/men/83.jpg",
  maxVisibleAssignees = 3,
  
  // Selection handling props
  onSelect = () => {},
  isSelected = false,
  selectable = true,
  
  // Action handling props
  onShowDetails = () => {},
  onEdit = () => {},
  onCancel = () => {},
  onApprove = () => {},
  onDeny = () => {},
  
  // UI customization props
  showButtons = true,
  showMenu = true,
  showStatus = true,
  showAssignees = true,
  lineClamp = 2,
  
  // Color customization props
  baseColor = "#757575",
  denyColor = "#C90000",
  approveColor = "#0060B4",
  
  // Additional props for extensibility
  className = "",
  cardStyle = {},
  menuOptions = null
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Local state for checkbox
  const [localSelected, setLocalSelected] = useState(isSelected);
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalSelected(isSelected);
  }, [isSelected]);
  
  // Handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // FIXED: Handle checkbox change to correctly pass both id and selection state
  const handleCheckboxChange = (e) => {
    e.stopPropagation(); // Prevent any parent click handlers
    const newSelectedState = e.target.checked;
    setLocalSelected(newSelectedState);
    
    // Call parent's onSelect with both id and selection state
    onSelect(newSelectedState);
  };

  // Get priority color class
  const getPriorityColorClass = (priority) => {
    switch(priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status color class
  const getStatusColorClass = (status) => {
    switch(status?.toLowerCase()) {
      case "in progress":
        return "bg-green-500";
      case "complete":
      case "completed":
        return "bg-gray-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      case "postponed":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  // Check if intervention is cancelled
  const isCancelled = status?.toLowerCase() === "cancelled";
  
  // Check if intervention needs approval
  const needsApproval = status?.toLowerCase() === "pending";
  
  // Check if intervention has assignees for display
  const hasAssignees = Array.isArray(assignees) && assignees.length > 0;
  
  // Check if we should show "N/A" for cancelled items
  const showNA = isCancelled;

  // Render default or custom menu options
  const renderMenuOptions = () => {
    if (menuOptions) {
      return menuOptions;
    }
    
    return (
      <div className="py-1"> 
      <Link href={`../../admin/reported-issues/report-details/${id}`}> 
      <button 
          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={() => {
            onShowDetails(id);
            setMenuOpen(false);
          }}
        >
          Details
        </button>
      </Link>
       
        <Link href={`../../admin/reported-issues/report-details-edit/${id}`}> 
        <button 
          className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
            isCancelled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => {
            if (!isCancelled) {
              onEdit(id);
              setMenuOpen(false);
            }
          }}
          disabled={isCancelled}
        >
          Edit
        </button>
        </Link>
        
        <button 
          className={`block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 ${
            isCancelled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => {
            if (!isCancelled) {
              onCancel(id);
              setMenuOpen(false);
            }
          }}
          disabled={isCancelled}
        >
          Cancel Intervention
        </button>
      </div>
    );
  };

  return( 
    <div 
      className={`text-sm flex flex-col w-full border border-gray-10 font-outfit bg-gray-100 text-[#757575] ${className}`} 
      style={cardStyle}
    > 
      {/* Header row */}
      <div className="flex flex-row w-full justify-between p-3">  
        <div className="flex flex-row gap-2 items-center">
          {selectable && (
            <input 
              type="checkbox" 
              checked={localSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()} // Extra protection to prevent bubbling
              className="h-4 w-4 cursor-pointer"
              aria-label={`Select ${description.substring(0, 20)}${description.length > 20 ? '...' : ''}`}
            />
          )}
          <h1 className="text-sm">{dateTime}</h1>
        </div>   
        <div className="flex flex-row gap-2 items-center"> 
          <h2 className="text-sm">{location}</h2>
          <div className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColorClass(priority)}`}>
            {priority}
          </div>
          {showMenu && (
            <div className="relative" ref={menuRef}>
              <button 
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card selection
                  setMenuOpen(!menuOpen);
                }}
              >
                <MoreVertical size={16} />
              </button>
              
              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                  {renderMenuOptions()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="px-4 pb-3">
        {/* Description text */}
        <p className={`mb-3 text-sm max-h-16 line-clamp-${lineClamp}`}>{description}</p>

        {/* Status and assignees/N/A section */}
        <div className="flex flex-row justify-between items-center mb-3">
          {/* Status with colored dot */}
          {showStatus && (
            <div className="flex items-center">
              <span className={`mr-2 w-2 h-2 ${getStatusColorClass(status)} rounded-full`}></span>
              <span className="text-sm">{status}</span>
            </div>
          )}

          {/* Show N/A for cancelled items, otherwise show assignees if available */}
          {showAssignees && (showNA ? (
            <span className="text-sm text-gray-500">N/A</span>
          ) : hasAssignees ? (
            <div className="flex -space-x-2">
              {assignees.slice(0, maxVisibleAssignees).map((assignee, index) => (
                <img 
                  key={index} 
                  src={assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=random`} 
                  alt={assignee.name || `Assignee ${index + 1}`}
                  className="w-6 h-6 rounded-full border border-white"
                />
              ))}
              {assignees.length > maxVisibleAssignees && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs text-gray-600">
                  +{assignees.length - maxVisibleAssignees}
                </div>
              )}
            </div>
          ) : null)}
        </div>

        {/* Action buttons - Only shown for Pending status if showButtons is true */}
        {showButtons && needsApproval && (
          <div className="flex space-x-2">
            <button 
              className="text-white py-2 rounded-md flex-1 text-center text-sm"
              style={{ backgroundColor: baseColor }}
              onClick={() => onShowDetails(id)}
            >
              Details
            </button>
            <button 
              className="text-white py-2 rounded-md flex-1 text-center text-sm"
              style={{ backgroundColor: denyColor }}
              onClick={() => onDeny(id)}
            >
              Deny
            </button>
            <button 
              className="text-white py-2 rounded-md flex-1 text-center text-sm"
              style={{ backgroundColor: approveColor }}
              onClick={() => onApprove(id)}
            >
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}