import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, X, ChevronDown } from "lucide-react"; 
import { motion, useAnimationControls } from "framer-motion"; 
import Card from "./card";
import PhoneCard from "./card-phone";
import TableHeader from "./table-header";
import FilterBar from "./filter-bar";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReportedIntervCards({
  // Data props
  reports = [],
  loading = false,
  // Handler props
  onStatusChange = async (ids, status) => console.log("Status change:", ids, status),
  onPriorityChange = async (ids, priority) => console.log("Priority change:", ids, priority),
  onCancel = async (ids) => console.log("Cancel reports:", ids),
  onApprove = async (id) => console.log("Approve report:", id),
  onDeny = async (id) => console.log("Deny report:", id),
  onDetails = async (id) => console.log("View details for report:", id),
  onDelete = async (id) => console.log("Delete report:", id),
  onAssign = async (ids, assigneeIds) => console.log("Assign reports:", ids, "to", assigneeIds),
  // Optional customization props
  addReportLink = "/admin/reported-issues/report-issue-admin",
  statusOptions = ["In Progress", "Pending", "Postponed", "Completed", "Cancelled", "Denied"],
  priorityOptions = ["High", "Medium", "Low"],
  availableAssignees = [] // Available staff to assign
}) {
  // Internal state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [interventions, setInterventions] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  
  // Modal states for status and priority selection
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  
  // Modal state for assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  
  // Date filter states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [agendaView, setAgendaView] = useState([]);
  
  // Refs for click outside handling
  const datePickerRef = useRef(null);
  const statusModalRef = useRef(null);
  const priorityModalRef = useRef(null);
  const assignModalRef = useRef(null);
  
  // Initialize data state from props
  useEffect(() => {
    setInterventions(reports);
  }, [reports]);

  // Add these action handlers for selection actions
  const handleCancelReports = async () => {
    const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    if (selectedIds.length === 0) return;
    
    try {
      // Call the prop handler
      await onCancel(selectedIds);
      
      // Update local state
      setInterventions(prevInterventions => 
        prevInterventions.map(intervention => {
          if (selectedIds.includes(intervention.id.toString())) {
            return { ...intervention, status: "Cancelled" };
          }
          return intervention;
        })
      );
      
      // Clear selections after operation
      setSelectedItems({});
      setSelectAll(false);
    } catch (error) {
      console.error("Error cancelling reports:", error);
      alert("Failed to cancel one or more reports");
    }
  };
  
  const handleSetStatus = () => {
    setShowStatusModal(true);
  };
  
  const handleApplyStatus = async () => {
    if (!selectedStatus) {
      setShowStatusModal(false);
      return;
    }
    
    const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    if (selectedIds.length === 0) return;
    
    try {
      // Call the prop handler
      await onStatusChange(selectedIds, selectedStatus);
      
      // Update local state
      setInterventions(prevInterventions =>
        prevInterventions.map(intervention => {
          if (selectedIds.includes(intervention.id.toString())) {
            return { ...intervention, status: selectedStatus };
          }
          return intervention;
        })
      );
      
      // Clear selections and close modal
      setSelectedItems({});
      setSelectAll(false);
      setShowStatusModal(false);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };
  
  const handleSetPriority = () => {
    setShowPriorityModal(true);
  };
  
  const handleApplyPriority = async () => {
    if (!selectedPriority) {
      setShowPriorityModal(false);
      return;
    }
    
    const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    if (selectedIds.length === 0) return;
    
    try {
      // Call the prop handler
      await onPriorityChange(selectedIds, selectedPriority);
      
      // Update local state
      setInterventions(prevInterventions =>
        prevInterventions.map(intervention => {
          if (selectedIds.includes(intervention.id.toString())) {
            return { ...intervention, priority: selectedPriority };
          }
          return intervention;
        })
      );
      
      // Clear selections and close modal
      setSelectedItems({});
      setSelectAll(false);
      setShowPriorityModal(false);
    } catch (error) {
      console.error("Error updating priority:", error);
      alert("Failed to update priority");
    }
  };
  
  // New functions for assignment
  const handleSetAssignee = () => {
    setShowAssignModal(true);
  };
  
  const toggleAssigneeSelection = (assigneeId) => {
    setSelectedAssignees(prev => {
      if (prev.includes(assigneeId)) {
        return prev.filter(id => id !== assigneeId);
      } else {
        return [...prev, assigneeId];
      }
    });
  };
  
  const handleApplyAssignment = async () => {
    if (selectedAssignees.length === 0) {
      setShowAssignModal(false);
      return;
    }
    
    const selectedIds = Object.keys(selectedItems).filter(id => selectedItems[id]);
    if (selectedIds.length === 0) return;
    
    try {
      // Call the prop handler
      await onAssign(selectedIds, selectedAssignees);
      
      // Clear selections and close modal
      setSelectedItems({});
      setSelectAll(false);
      setShowAssignModal(false);
      setSelectedAssignees([]);
    } catch (error) {
      console.error("Error assigning interventions:", error);
      alert("Failed to assign interventions");
    }
  };

  // Toggle select all function
  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    // Create a new selectedItems object based on selectAll state
    const newSelectedItems = {};
    filteredInterventions.forEach(item => {
      newSelectedItems[item.id] = newSelectAll;
    });
    
    setSelectedItems(newSelectedItems);
  };

  // Reset all filters function
  const resetAllFilters = () => {
    setFilterStatus("All");
    setFilterPriority("All");
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
  };

  // Get date label for button
  const getDateLabel = () => {
    return selectedDate ? formatDate(selectedDate) : "Date";
  };
  
  // Reset date filter
  const resetDateFilter = () => {
    setSelectedDate(null);
    setAgendaView([]);
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    // Get days from previous month to fill the first week
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    
    const days = [];
    
    // Add days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true
      });
    }
    
    // Add days from next month
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const remainingDays = 42 - days.length; // 6 weeks x 7 days = 42
    
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  // Check if a date is selected
  const isDateSelected = (day, month, year) => {
    if (!selectedDate) return false;
    
    const date = new Date(selectedDate);
    return (
      date.getDate() === day &&
      date.getMonth() === month &&
      date.getFullYear() === year
    );
  };

  // Handle date selection
  const handleDateSelect = (day, month, year) => {
    const newSelectedDate = new Date(year, month, day);
    setSelectedDate(newSelectedDate);
    generateAgendaForDate(newSelectedDate);
  };

  // Format month name
  const formatMonthYear = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Generate agenda for selected date
  const generateAgendaForDate = (date) => {
    if (!date) {
      setAgendaView([]);
      return;
    }

    // Filter interventions based on selected date
    const filteredByDate = interventions.filter(item => {
      // Parse the item date - only use the date field, not lastUpdated
      const itemDate = new Date(item.date);
      let interventionDate;

      if (isNaN(itemDate.getTime())) {
        // Try to extract a date from formats like "12/03/2025"
        const dateMatch = item.date.match(/(\d+)\/(\d+)\/(\d+)/);
        if (dateMatch) {
          interventionDate = new Date(`${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`);
        } else {
          // Use current date for demo data with day names
          interventionDate = new Date();
        }
      } else {
        interventionDate = itemDate;
      }

      // Compare just the date parts
      return interventionDate.toDateString() === date.toDateString();
    });

    // Group by day for the agenda view
    if (filteredByDate.length > 0) {
      setAgendaView([{
        date: date.toDateString(),
        items: filteredByDate
      }]);
    } else {
      setAgendaView([]);
    }
  };

  // Apply date filter
  const applyDateFilter = () => {
    setShowDatePicker(false);
  };

  // Helper function for agenda item priority styling
  const getPriorityBadgeClass = (priority) => {
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

  // Close modals when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
      
      if (statusModalRef.current && !statusModalRef.current.contains(event.target)) {
        setShowStatusModal(false);
      }
      
      if (priorityModalRef.current && !priorityModalRef.current.contains(event.target)) {
        setShowPriorityModal(false);
      }
      
      if (assignModalRef.current && !assignModalRef.current.contains(event.target)) {
        setShowAssignModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handler functions for cards using prop handlers
  const handleDelete = async (id) => {
    try {
      await onDelete(id);
      
      // Update local state
      setInterventions(interventions.filter(item => item.id !== id));
      
      // Update selectedItems to remove the deleted item
      const newSelectedItems = { ...selectedItems };
      delete newSelectedItems[id];
      setSelectedItems(newSelectedItems);
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete report");
    }
  };
  
  const handleApprove = async (id) => {
    try {
      await onApprove(id);
      
      // Update local state
      setInterventions(interventions.map(item => 
        item.id === id ? { ...item, status: "In Progress" } : item
      ));
    } catch (error) {
      console.error("Error approving report:", error);
      alert("Failed to approve report");
    }
  };
  
  const handleDeny = async (id) => {
    try {
      await onDeny(id);
      
      // Update local state
      setInterventions(interventions.map(item => 
        item.id === id ? { ...item, status: "Denied" } : item
      ));
    } catch (error) {
      console.error("Error denying report:", error);
      alert("Failed to deny report");
    }
  };
  
  const handleDetails = (id) => {
    onDetails(id);
  };

  // Handle checkbox selection
  const handleSelect = (id, isSelected) => {
    const newSelectedItems = {
      ...selectedItems,
      [id]: isSelected
    };
    setSelectedItems(newSelectedItems);
    
    // Check if all visible items are selected to update selectAll state
    const allSelected = filteredInterventions.every(item => newSelectedItems[item.id]);
    setSelectAll(allSelected);
  };
  
  // Filter interventions based on search, status, priority, and date
  const filteredInterventions = interventions.filter(item => {
    // Search filter
    const matchesSearch = !search || 
      Object.values(item).some(val => 
        typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase())
      );
      
    // Status filter
    const matchesStatus = filterStatus === 'All' || 
      (item.status && item.status === filterStatus);
      
    // Priority filter  
    const matchesPriority = filterPriority === 'All' || 
      (item.priority && item.priority === filterPriority);
    
    // Date filter
    let matchesDate = true;
    if (selectedDate) {
      const itemDate = new Date(item.date);
      
      let interventionDate;
      if (isNaN(itemDate.getTime())) {
        const dateMatch = item.date.match(/(\d+)\/(\d+)\/(\d+)/);
        if (dateMatch) {
          interventionDate = new Date(`${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`);
        } else {
          interventionDate = new Date();
        }
      } else {
        interventionDate = itemDate;
      }
      
      if (interventionDate.toDateString() !== selectedDate.toDateString()) {
        matchesDate = false;
      }
    }
      
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  const router = useRouter();
  
  const handleAddReport = () => {
    router.push(addReportLink);
  };

  return (
    <div className="text-sm flex flex-col w-full font-outfit bg-gray-100 border border-gray-300 rounded h-full overflow-hidden">
      {/* Fixed header container */}
      <div className="sticky top-0 z-20 bg-gray-100 w-full">
        <FilterBar 
          addreport={handleAddReport}
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          agendaView={agendaView}
          datePickerRef={datePickerRef}
          getDateLabel={getDateLabel}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          formatMonthYear={formatMonthYear}
          generateCalendarDays={generateCalendarDays}
          isDateSelected={isDateSelected}
          handleDateSelect={handleDateSelect}
          resetDateFilter={resetDateFilter}
          formatDate={formatDate}
          getPriorityBadgeClass={getPriorityBadgeClass}
          applyDateFilter={applyDateFilter}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          resetAllFilters={resetAllFilters}
        />
      </div>
      
      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30">
          <div 
            ref={statusModalRef}
            className="bg-white rounded-lg shadow-lg w-80 p-4"
          >
            <h2 className="text-lg font-medium mb-4">Change Status</h2>
            <div className="space-y-2">
              {statusOptions.map((status) => (
                <div 
                  key={status} 
                  onClick={() => setSelectedStatus(status)}
                  className={`cursor-pointer p-2 rounded-md hover:bg-gray-100 ${selectedStatus === status ? 'bg-blue-50 border border-blue-300' : ''}`}
                >
                  {status}
                </div>
              ))}
              <div className="flex justify-end mt-4 pt-2 border-gray-200">
                <button 
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 mr-2"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={handleApplyStatus}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Priority Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30">
          <div 
            ref={priorityModalRef}
            className="bg-white rounded-lg shadow-lg w-80 p-4"
          >
            <h2 className="text-lg font-medium mb-4">Change Priority</h2>
            <div className="space-y-2">
              {priorityOptions.map((priority) => (
                <div 
                  key={priority} 
                  onClick={() => setSelectedPriority(priority)}
                  className={`cursor-pointer p-2 rounded-md hover:bg-gray-100 ${
                    selectedPriority === priority ? 'bg-blue-50 border border-blue-300' : ''
                  }`}
                >
                  {priority}
                </div>
              ))}
              <div className="flex justify-end mt-4 pt-2 border-gray-200">
                <button 
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 mr-2"
                  onClick={() => setShowPriorityModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={handleApplyPriority}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-white/30">
          <div 
            ref={assignModalRef}
            className="bg-white rounded-lg shadow-lg w-80 p-4 max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-lg font-medium mb-4">Assign Interventions</h2>
            {availableAssignees.length === 0 ? (
              <p className="text-gray-500">No assignees available</p>
            ) : (
              <div className="space-y-2">
                {availableAssignees.map((assignee) => (
                  <div 
                    key={assignee.id} 
                    onClick={() => toggleAssigneeSelection(assignee.id)}
                    className={`cursor-pointer p-2 rounded-md hover:bg-gray-100 flex items-center ${
                      selectedAssignees.includes(assignee.id) ? 'bg-blue-50 border border-blue-300' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{assignee.name}</div>
                      <div className="text-xs text-gray-500">{assignee.role}</div>
                    </div>
                    <div className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center">
                      {selectedAssignees.includes(assignee.id) && (
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end mt-4 pt-2 border-t border-gray-200">
                  <button 
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 mr-2"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedAssignees([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={handleApplyAssignment}
                    disabled={selectedAssignees.length === 0}
                  >
                    Assign
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto w-full">
        {/* Desktop view - hidden on small screens */}
        <div className="hidden sm:block w-full">
          <div className="w-full">
            <div className="sticky top-0 z-10 bg-white w-full">
              <TableHeader 
                selectAll={selectAll}
                toggleSelectAll={toggleSelectAll}
                hasSelectedItems={Object.values(selectedItems).some(selected => selected === true)}
                onCancelReports={handleCancelReports}
                onSetStatus={handleSetStatus}
                onSetPriority={handleSetPriority}
                onSetAssignee={handleSetAssignee}
              />
            </div>
            
            <div className="w-full">
              {loading ? (
                <div className="text-center p-4">Loading...</div>
              ) : filteredInterventions.length === 0 ? (
                <div className="text-center p-4">No interventions found</div>
              ) : (
                filteredInterventions.map((intervention, index) => (
                  <Card 
                    key={intervention.id}
                    intervention={intervention}
                    onDelete={handleDelete}
                    onApprove={handleApprove}
                    onDeny={handleDeny}
                    onDetails={handleDetails}
                    isFirstCard={index === 0}
                    isSelected={!!selectedItems[intervention.id]}
                    onSelect={(isSelected) => handleSelect(intervention.id, isSelected)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      
        {/* Mobile view - shown only on small screens */}
        <div className="sm:hidden w-full">
          {/* Mobile selection header - only show when items are selected */}
          {Object.values(selectedItems).some(selected => selected === true) && (
            <div className="sticky top-0 z-30 bg-gray-100 border-b border-gray-200 px-4 py-2 gap-2 flex items-center shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {Object.values(selectedItems).filter(selected => selected === true).length} selected
                </span>
                <button 
                  onClick={() => setSelectedItems({})}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="text-gray-600 text-sm"
                  onClick={handleCancelReports}
                >
                  Cancel PI
                </button>
                <span className="text-gray-300">|</span>
                <button
                  className="text-gray-600 text-sm"
                  onClick={handleSetStatus}
                >
                  Set Status
                </button>
                <button
                  className="text-gray-600 text-sm"
                  onClick={handleSetPriority}
                >
                  Set Priority
                </button>
                <button
                  className="text-gray-600 text-sm"
                  onClick={handleSetAssignee}
                >
                  Assign To
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center p-4">Loading...</div>
          ) : filteredInterventions.length === 0 ? (
            <div className="text-center p-4">No interventions found</div>
          ) : (
            <div className="w-full">
              {filteredInterventions.map((intervention) => (
                <PhoneCard
                  key={intervention.id}
                  id={intervention.id}
                  dateTime={intervention.date}
                  location={intervention.location}
                  priority={intervention.priority}
                  description={intervention.description}
                  status={intervention.status}
                  assignees={intervention.assignees}
                  isSelected={!!selectedItems[intervention.id]}
                  onSelect={(isSelected) => handleSelect(intervention.id, isSelected)}
                  onShowDetails={() => handleDetails(intervention.id)}
                  onEdit={() => console.log(`Editing intervention ${intervention.id}`)}
                  onCancel={() => handleDelete(intervention.id)}
                  onApprove={() => handleApprove(intervention.id)}
                  onDeny={() => handleDeny(intervention.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}