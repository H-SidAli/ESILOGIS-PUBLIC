import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

export default function InterventionsCards({ 
  id,
  dateTime = "Wednesday, 12:45",
  location = "S33",
  priority = "High",
  description = "Lorem Opium Lorem Opium...",
  status = "In Progress",
  plannedAt = "2023-10-12T12:45:00Z",
  assignees = [],
  onSelect = () => {},
  isSelected = false,
  onShowDetails = () => {},
  onEdit = () => {},
  onCancel = () => {}
}) { 
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
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

  // Get priority color class
  const getPriorityColorClass = (priority) => {
    switch(priority.toLowerCase()) {
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
    switch(status.toLowerCase()) {
      case "in progress":
        return "bg-green-500";
      case "complete":
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
  const isCancelled = status.toLowerCase() === "cancelled";

  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return "Invalid date";
    }
  };
  return( 
    <div className="text-sm flex flex-col w-full border border-gray-10 px-4 py-4 font-outfit bg-gray-100 text-[#757575]"> 
      <div className="flex flex-row w-full justify-between p-4">  
        <div className="flex flex-row gap-3 items-center">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onSelect(id)}
            className="h-4 w-4"
          />   
          <h1 className="">{dateTime}</h1>
        </div>   
        <div className="flex flex-row gap-3 items-center"> 
          <h2 className="">{location}</h2>
          <div className={`px-2 py-1 rounded-full text-xs ${getPriorityColorClass(priority)}`}>
            {priority}
          </div>
          <div className="relative" ref={menuRef}>
            <button 
              className="p-1 rounded-full hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreVertical size={16} />
            </button>
            
            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button 
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => {
                      onShowDetails(id);
                      setMenuOpen(false);
                    }}
                  >
                    Show Details
                  </button>
                  
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
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-2">
        <p className=" mb-4">{description}</p>

        <div className="flex flex-row justify-between items-center">
          <div className="flex items-center">
            <span className={`mr-2 w-2 h-2 bg-blue-500 rounded-full`}></span>
            <span>{formatDate(plannedAt)}</span>
          </div>

          {assignees.length > 0 && (
            <div className="flex -space-x-2">
              {assignees.slice(0, 3).map((assignee, index) => (
                <img 
                  key={index} 
                  src={assignee.avatar || `https://ui-avatars.com/api/?name=${assignee.name}&background=random`} 
                  alt={assignee.name}
                  className="w-6 h-6 rounded-full border border-white"
                />
              ))}
              {assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs text-gray-600">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}