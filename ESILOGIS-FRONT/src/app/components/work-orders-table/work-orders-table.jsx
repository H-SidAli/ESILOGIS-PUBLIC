import React, { useState, useEffect, useRef } from "react";
import { 
  MoreVertical, 
  X, 
  ChevronDown, 
  ChevronUp,
  Clock,
  User,
  Users,
  Search,
  Check,
  Calendar
} from "lucide-react"; 
import { createPortal } from "react-dom";
import Card from "./card";
import PhoneCard from "./card-phone";
import TableHeader from "./table-header";
import FilterBar from "./filter-bar";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function WorkOrdersTable({ 
  workOrders = [], 
  loading = false,
  currentWorker = {},
  onBeginTask,
  onCompleteTask,
  onPauseTask,
  onResumeTask,
  onDenyTask,
  onDeleteWorkOrders,
  onShowDetails,
  onEditWorkOrder,
  isSubmitting = false
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [selectedItems, setSelectedItems] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [activeTimers, setActiveTimers] = useState({});
  const [tasksInProgress, setTasksInProgress] = useState({});
  const [openAssigneeDropdown, setOpenAssigneeDropdown] = useState(null);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState([]);
  const [activeWorkOrders, setActiveWorkOrders] = useState([]);
  
  // Refs
  const menuButtonRefs = useRef({});
  const timerIntervals = useRef({});
  const assigneeRefs = useRef({});
  const router = useRouter();

  // Filter out completed and cancelled work orders first
  useEffect(() => {
    const filtered = workOrders.filter(wo => {
      const status = (wo.status || "").toLowerCase();
      return status !== "complete" && 
             status !== "completed" && 
             status !== "cancelled" &&
             status !== "canceled";
    });
    setActiveWorkOrders(filtered);
  }, [workOrders]);

  // Initialize tasksInProgress and timers based on workOrders prop
  useEffect(() => {
    const inProgressTasks = {};
    activeWorkOrders.forEach(item => {
      // Initialize timer for both "in progress" and "paused" tasks to keep track of total time
      if (item.timer && (item.status?.toLowerCase() === "in progress" || item.status?.toLowerCase() === "paused")) {
        const parts = item.timer.split(':');
        const seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        setActiveTimers(prev => ({
          ...prev,
          [item.id]: { seconds, display: item.timer }
        }));
        
        // Only mark as in progress if status is actually "in progress"
        if (item.status.toLowerCase() === "in progress") {
          inProgressTasks[item.id] = true;
          // Start the timer for tasks that are in progress
          if (!timerIntervals.current[item.id]) {
            startTimerFromCurrentValue(item.id);
          }
        }
      }
    });
    setTasksInProgress(inProgressTasks);
    applyFilters(search, filterStatus, filterPriority);
  }, [activeWorkOrders]);

  // Status and priority options (removed Complete and Cancelled from options)
  const statusOptions = ["In Progress", "Pending", "Paused", "Denied"];
  const priorityOptions = ["High", "Medium", "Low"];

  // Outside click handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close menu dropdown
      if (
        menuOpen &&
        !event.target.closest(".menu-dropdown") &&
        !event.target.closest(".menu-button")
      ) {
        setMenuOpen(null);
      }
      // Close assignee dropdown
      if (
        openAssigneeDropdown &&
        !event.target.closest(".assignee-dropdown") &&
        !event.target.closest(".assignee-button")
      ) {
        setOpenAssigneeDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, openAssigneeDropdown]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timerIntervals.current).forEach((interval) => {
        clearInterval(interval);
      });
    };
  }, []);

  // Status color mapping
  const getStatusColor = (status) => {
    if (!status) return "bg-gray-500";
    switch (status.toLowerCase()) {
      case "in progress":
        return "bg-green-500";
      case "completed":
      case "complete":
        return "bg-gray-500";
      case "pending":
        return "bg-yellow-500";
      case "paused":
        return "bg-orange-500";
      case "cancelled":
      case "canceled":
        return "bg-red-500";
      case "denied":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    if (!priority) return "bg-gray-100 text-gray-800";
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
      case "med":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Toggle assignee dropdown
  const toggleAssigneeDropdown = (id, e) => {
    e.stopPropagation();
    if (openAssigneeDropdown === id) {
      setOpenAssigneeDropdown(null);
      return;
    }
    setOpenAssigneeDropdown(id);
  };

  // Toggle menu
  const toggleMenu = (id, e) => {
    e.stopPropagation();
    if (menuOpen === id) {
      setMenuOpen(null);
      return;
    }
    const button = menuButtonRefs.current[id];
    if (button) {
      const rect = button.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const menuHeight = 160;
      const spaceBelow = windowHeight - rect.bottom;
      const showAbove = spaceBelow < menuHeight;
      let top, left;
      if (showAbove) {
        top = rect.top - menuHeight + window.scrollY;
      } else {
        top = rect.top + window.scrollY;
      }
      left = rect.left - 240 + window.scrollX;
      setMenuPosition({
        top,
        left: Math.max(10, left),
      });
    }
    setMenuOpen(id);
  };

  // Timer functions
  // Start timer preserving existing timer value
  const startTimerFromCurrentValue = (rowId) => {
    // Don't reset timer value, keep existing one
    if (timerIntervals.current[rowId]) {
      clearInterval(timerIntervals.current[rowId]);
    }

    timerIntervals.current[rowId] = setInterval(() => {
      setActiveTimers((prev) => {
        const currentTimer = prev[rowId] || { seconds: 0 };
        const newSeconds = currentTimer.seconds + 1;
        const hours = Math.floor(newSeconds / 3600)
          .toString()
          .padStart(2, "0");
        const minutes = Math.floor((newSeconds % 3600) / 60)
          .toString()
          .padStart(2, "0");
        const seconds = (newSeconds % 60).toString().padStart(2, "0");
        const display = `${hours}:${minutes}:${seconds}`;
        return {
          ...prev,
          [rowId]: { seconds: newSeconds, display },
        };
      });
    }, 1000);
  };

  // Original startTimer function (used when first beginning a task)
  const startTimer = (rowId) => {
    setActiveTimers((prev) => ({
      ...prev,
      [rowId]: prev[rowId] || { seconds: 0, display: "00:00:00" },
    }));
    
    startTimerFromCurrentValue(rowId);
  };

  const stopTimer = (rowId) => {
    if (timerIntervals.current[rowId]) {
      clearInterval(timerIntervals.current[rowId]);
      delete timerIntervals.current[rowId];
    }
  };

  // Task action handlers that use the props
  const handleBeginTaskWrapper = (rowId) => {
    if (onBeginTask) {
      onBeginTask(rowId);
      // Update local UI state for immediate feedback
      setTasksInProgress(prev => ({
        ...prev,
        [rowId]: true,
      }));
      startTimer(rowId);
    }
  };

  const handleCompleteTaskWrapper = (rowId, data = {}) => {
    if (onCompleteTask) {
      onCompleteTask(rowId, data);
      // Update local UI state for immediate feedback
      setTasksInProgress(prev => ({
        ...prev,
        [rowId]: false,
      }));
      stopTimer(rowId);
    }
  };

  const handlePauseTaskWrapper = (rowId, data = {}) => {
    if (onPauseTask) {
      onPauseTask(rowId, data);
      // Update local UI state for immediate feedback
      setTasksInProgress(prev => ({
        ...prev,
        [rowId]: false,
      }));
      // Stop the timer but preserve the current value
      stopTimer(rowId);
    }
  };

  const handleResumeTaskWrapper = (rowId) => {
    if (onResumeTask) {
      onResumeTask(rowId);
      // Update local UI state for immediate feedback
      setTasksInProgress(prev => ({
        ...prev,
        [rowId]: true,
      }));
      // Resume timer from its current value
      startTimerFromCurrentValue(rowId);
    }
  };

  const handleDenyTaskWrapper = (rowId, reason = "") => {
    if (onDenyTask) {
      onDenyTask(rowId, reason);
    }
  };

  const handleDeleteWorkOrdersWrapper = () => {
    const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    if (onDeleteWorkOrders && selectedIds.length > 0) {
      onDeleteWorkOrders(selectedIds);
      setSelectedItems({});
      setSelectAll(false);
    }
  };
  
  // Filter functions
  const applyFilters = (query, status, priority) => {
    // Start with active work orders (already filtered to exclude completed and cancelled)
    let filtered = [...activeWorkOrders];
    
    // Apply search query filter
    if (query) {
      filtered = filtered.filter(wo => 
        (wo.description?.toLowerCase() || "").includes(query.toLowerCase()) ||
        (wo.id?.toString() || "").includes(query) ||
        (wo.location?.toLowerCase() || "").includes(query.toLowerCase())
      );
    }
    
    // Apply status filter
    if (status !== "All") {
      filtered = filtered.filter(wo => 
        (wo.status?.toLowerCase() || "") === status.toLowerCase()
      );
    }
    
    // Apply priority filter
    if (priority !== "All") {
      filtered = filtered.filter(wo => {
        const woPriority = (wo.priority || "").toLowerCase();
        const filterValue = priority.toLowerCase();
        return woPriority === filterValue || 
               (filterValue === "medium" && woPriority === "med") || 
               (filterValue === "med" && woPriority === "medium");
      });
    }
    
    setFilteredWorkOrders(filtered);
  };

  const handleSearch = (query) => {
    setSearch(query);
    applyFilters(query, filterStatus, filterPriority);
  };
  
  const handleStatusFilter = (status) => {
    setFilterStatus(status);
    applyFilters(search, status, filterPriority);
  };
  
  const handlePriorityFilter = (priority) => {
    setFilterPriority(priority);
    applyFilters(search, filterStatus, priority);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setFilterStatus("All");
    setFilterPriority("All");
    setSearch("");
    applyFilters("", "All", "All");
  };

  // Toggle select all
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const newSelectedItems = {};
    filteredWorkOrders.forEach(item => {
      newSelectedItems[item.id] = newSelectAll;
    });
    setSelectedItems(newSelectedItems);
  };

  // Handle individual row selection
  const handleSelect = (id, isSelected) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: isSelected
    }));
  };

  // Avatar component
  const Avatar = ({ user, index, small = false }) => {
    const colors = [
      "bg-blue-500",
      "bg-red-500",
      "bg-green-500",
      "bg-purple-500",
    ];
    const size = small ? "w-6 h-6" : "w-8 h-8";
    const margin = index > 0 && !small ? "-10px" : "0";
    return (
      <div
        className={`${
          colors[index % colors.length]
        } ${size} rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white`}
        style={{ marginLeft: margin }}
      >
        {typeof user === "string"
          ? user.charAt(0).toUpperCase()
          : user.avatar
          ? user.avatar.charAt(0)
          : "U"}
      </div>
    );
  };

  // Assignee Dropdown Component
  const AssigneeDropdown = ({ row }) => {
    const assignees = Array.isArray(row.assignee) ? row.assignee : [];
    return (
      <div
        className="relative assignee-button"
        ref={(el) => (assigneeRefs.current[row.id] = el)}
      >
        <div
          className="flex items-center cursor-pointer"
          onClick={(e) => toggleAssigneeDropdown(row.id, e)}
        >
          {assignees.length > 0 ? (
            <>
              <div className="flex">
                {assignees.slice(0, 3).map((user, i) => (
                  <Avatar key={i} user={user} index={i} />
                ))}
                {assignees.length > 3 && (
                  <div
                    className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs border-2 border-white"
                    style={{ marginLeft: "-10px" }}
                  >
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
              <div className="ml-2 flex items-center">
                {openAssigneeDropdown === row.id ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center text-gray-400">
              <User size={16} className="mr-1" />
              <span>No assignee</span>
            </div>
          )}
        </div>
        {openAssigneeDropdown === row.id && (
          <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded z-40 border border-gray-200 w-56 assignee-dropdown">
            <div className="p-2 border-b border-gray-100">
              <h4 className="font-medium text-sm text-gray-700">
                Assigned to:
              </h4>
            </div>
            {assignees.length > 0 ? (
              <div className="max-h-48 overflow-y-auto">
                {assignees.map((user, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-gray-50 flex items-center"
                  >
                    <Avatar user={user} index={index} small />
                    <span className="ml-2 text-sm">
                      {typeof user === "string"
                        ? user
                        : user.name || `User ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-sm text-gray-500 italic">
                No assignees
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Dropdown Menu Component
  const DropdownMenu = ({ row }) => {
    return createPortal(
      <div
        className="absolute bg-white shadow-2xl rounded-md z-50 border border-gray-200 w-60 menu-dropdown"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
      >
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={() => {
            setMenuOpen(null);
            onShowDetails(row.id);
          }}
        >
          View
        </button>
        <hr />
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={() => {
            setMenuOpen(null);
            onEditWorkOrder(row.id);
          }}
        >
          Edit
        </button>
        <hr />
        {row.status === 'Pending' && (
          <>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              onClick={() => {
                setMenuOpen(null);
                handleDenyTaskWrapper(row.id);
              }}
            >
              Deny Task
            </button>
            <hr />
          </>
        )}
        <button
          className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
          onClick={() => {
            setMenuOpen(null);
            onDeleteWorkOrders([row.id]);
          }}
        >
          Delete
        </button>
      </div>,
      document.body
    );
  };

  return (
    <div className="text-sm flex flex-col w-full font-outfit bg-gray-100 rounded h-full overflow-hidden">
      <FilterBar 
        onSearch={handleSearch}
        onStatusFilter={handleStatusFilter}
        onPriorityFilter={handlePriorityFilter}
        search={search}
        filterStatus={filterStatus}
        filterPriority={filterPriority}
        resetAllFilters={resetAllFilters}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
      />
      <div className="flex-1 overflow-y-auto w-full">
        {/* Desktop View */}
        <div className="hidden sm:block w-full">
          <TableHeader 
            selectAll={selectAll}
            toggleSelectAll={toggleSelectAll}
            hasSelectedItems={Object.values(selectedItems).some(selected => selected === true)}
            onDeleteWorkOrders={handleDeleteWorkOrdersWrapper}
          />
          {loading ? (
            <div className="text-center ">Loading...</div>
          ) : filteredWorkOrders.length === 0 ? (
            <div className="text-center ">No work orders found</div>
          ) : (
            filteredWorkOrders.map((workOrder, index) => (
              <div key={workOrder.id}>
                <Card bg-gray-100
                  workOrder={workOrder}
                  isFirstCard={index === 0}
                  isSelected={!!selectedItems[workOrder.id]}
                  onSelect={(isSelected) => handleSelect(workOrder.id, isSelected)}
                  onBeginTask={() => handleBeginTaskWrapper(workOrder.id)}
                  onCompleteTask={(id, data) => handleCompleteTaskWrapper(id || workOrder.id, data)}
                  onPauseTask={(id, data) => handlePauseTaskWrapper(id || workOrder.id, data)}
                  onResumeTask={() => handleResumeTaskWrapper(workOrder.id)}
                  isInProgress={tasksInProgress[workOrder.id]}
                  timer={activeTimers[workOrder.id]?.display || workOrder.timer}
                  menuOpen={menuOpen === workOrder.id}
                  toggleMenu={(e) => toggleMenu(workOrder.id, e)}
                  menuButtonRef={(el) => menuButtonRefs.current[workOrder.id] = el}
                  menuPosition={menuPosition}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  AssigneeDropdown={<AssigneeDropdown row={workOrder} />}
                  DropdownMenu={menuOpen === workOrder.id ? <DropdownMenu row={workOrder} /> : null}
                  handleShowDetails={() => onShowDetails(workOrder.id)}
                  isSubmitting={isSubmitting}
                />
              </div>
            ))
          )}
        </div>
        {/* Mobile View */}
        <div className="sm:hidden w-full mt-4">
          {loading ? (
            <div className="text-center p-4">Loading...</div>
          ) : filteredWorkOrders.length === 0 ? (
            <div className="text-center p-4">No work orders found</div>
          ) : (
            filteredWorkOrders.map((workOrder) => (
              <div key={workOrder.id} className="bg-gray-100 ">
                <PhoneCard
                  workOrder={workOrder}
                  isSelected={!!selectedItems[workOrder.id]}
                  onSelect={(isSelected) => handleSelect(workOrder.id, isSelected)}
                  onBeginTask={() => handleBeginTaskWrapper(workOrder.id)}
                  onCompleteTask={(id, data) => handleCompleteTaskWrapper(id || workOrder.id, data)}
                  onPauseTask={(id, data) => handlePauseTaskWrapper(id || workOrder.id, data)}
                  onResumeTask={() => handleResumeTaskWrapper(workOrder.id)}
                  isInProgress={tasksInProgress[workOrder.id]}
                  timer={activeTimers[workOrder.id]?.display || workOrder.timer}
                  getStatusColor={getStatusColor}
                  getPriorityColor={getPriorityColor}
                  onShowDetails={() => onShowDetails(workOrder.id)}
                  isSubmitting={isSubmitting}
                />
              </div>  
            ))
          )}
        </div>
      </div>
    </div>
  );
}