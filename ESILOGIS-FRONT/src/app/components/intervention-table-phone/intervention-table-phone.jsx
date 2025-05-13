import React, { useState, useRef, useEffect } from 'react';
import InterventionsCards from '../intervention-cards/itervention-cards';
import { Search, ChevronDown, Calendar, Filter, X, Check } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 
import { format } from "date-fns";
import Link from 'next/link';

export default function InterventionsTablePhone({ 
  // Data props
  interventions = [],
  technicians = [],
  // Handler props
  onStatusChange = async (ids, status) => console.log("Status change:", ids, status),
  onPriorityChange = async (ids, priority) => console.log("Priority change:", ids, priority),
  onAssignWorkers = async (interventionIds, technicianIds) => console.log("Assign workers:", interventionIds, technicianIds),
  onCancelIntervention = async (ids) => console.log("Cancel interventions:", ids),
  onDeleteIntervention = async (ids) => console.log("Delete interventions:", ids),
  // Optional customization props
  addTaskLink = "../../admin/assigne-intervention",
  loadingData = false
}) { 
    // State management
    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedRows, setSelectedRows] = useState([]);
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterPriority, setFilterPriority] = useState("All");
    const [selectedDate, setSelectedDate] = useState(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filteredInterventions, setFilteredInterventions] = useState([]);
    const [headerHeight, setHeaderHeight] = useState(0);
    
    // Action modals state
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [bulkActionStatus, setBulkActionStatus] = useState("");
    const [bulkActionPriority, setBulkActionPriority] = useState("");
    const [loading, setLoading] = useState(true);
    const [cancellingInterventions, setCancellingInterventions] = useState(false);
    
    // Refs for outside click handling
    const datePickerRef = useRef(null);
    const filterRef = useRef(null);
    const headerRef = useRef(null);
    const statusModalRef = useRef(null);
    const priorityModalRef = useRef(null);
    const cancelConfirmRef = useRef(null);
    
    // Initialize data state from props
    useEffect(() => {
        setData(interventions);
        setFilteredInterventions(interventions);
        setLoading(loadingData);
    }, [interventions, loadingData]);

    // Measure header height to offset the cards container
    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, [selectedRows, selectedDate, filterStatus, filterPriority]);
    
    // Handle selection of an intervention
    const handleSelectIntervention = (id) => {
        setSelectedRows(prev => {
            if (prev.includes(id)) {
                return prev.filter(rowId => rowId !== id);
            } else {
                return [...prev, id];
            }
        });
    };
    
    // Handle showing intervention details
    const handleShowDetails = (id) => {
        console.log("Show details for intervention:", id);
        // Implement your details view logic here
    };
    
    // Handle editing an intervention
    const handleEditIntervention = (id) => {
        console.log("Edit intervention:", id);
        // Implement your edit logic here
    };
    
    // Check if any selected row is cancelled
    const hasSelectedCancelledItems = () => {
        return selectedRows.some(rowId => {
            const item = data.find(row => row.id === rowId);
            return item && item.status === "Cancelled";
        });
    };
    
    // Toggle the date picker
    const toggleDatePicker = () => {
        setIsDatePickerOpen(!isDatePickerOpen);
        if (isFilterOpen) setIsFilterOpen(false);
    };
    
    // Toggle the filter dropdown
    const toggleFilter = () => {
        setIsFilterOpen(!isFilterOpen);
        if (isDatePickerOpen) setIsDatePickerOpen(false);
    };
    
    // Handle date change
    const handleDateChange = (date) => {
        setSelectedDate(date);
        setIsDatePickerOpen(false);
    };
    
    // Clear date filter
    const clearDateFilter = () => {
        setSelectedDate(null);
    };
    
    // Open status modal for bulk actions
    const openStatusModal = () => {
        if (hasSelectedCancelledItems()) {
            alert("Cannot change status of cancelled interventions.");
            return;
        }
        setIsStatusModalOpen(true);
        setBulkActionStatus(""); // Reset selection
        // Close other modals if open
        setIsPriorityModalOpen(false);
        setIsCancelConfirmOpen(false);
    };
    
    // Open priority modal for bulk actions
    const openPriorityModal = () => {
        if (hasSelectedCancelledItems()) {
            alert("Cannot change priority of cancelled interventions.");
            return;
        }
        setIsPriorityModalOpen(true);
        setBulkActionPriority(""); // Reset selection
        // Close other modals if open
        setIsStatusModalOpen(false);
        setIsCancelConfirmOpen(false);
    };
    
    // Open cancel confirmation modal
    const openCancelConfirm = () => {
        setIsCancelConfirmOpen(true);
        // Close other modals if open
        setIsStatusModalOpen(false);
        setIsPriorityModalOpen(false);
    };
    
    // Apply bulk status change to selected interventions
    const applyBulkStatus = async () => {
        if (!bulkActionStatus) return;
        
        try {
            // Call the prop handler
            await onStatusChange(selectedRows, bulkActionStatus);
            
            // Update local state
            setData((prevData) =>
                prevData.map((task) =>
                    selectedRows.includes(task.id) ? { ...task, status: bulkActionStatus } : task
                )
            );
            
            // Close modal and show success
            setIsStatusModalOpen(false);
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status. Please try again.");
        }
    };
    
    // Apply bulk priority change to selected interventions
    const applyBulkPriority = async () => {
        if (!bulkActionPriority) return;
        
        try {
            // Call the prop handler
            await onPriorityChange(selectedRows, bulkActionPriority);
            
            // Update local state
            setData((prevData) =>
                prevData.map((task) =>
                    selectedRows.includes(task.id) ? { ...task, priority: bulkActionPriority } : task
                )
            );
            
            // Close modal
            setIsPriorityModalOpen(false);
        } catch (error) {
            console.error("Error updating priority:", error);
            alert("Failed to update priority. Please try again.");
        }
    };
    
    // Apply bulk cancel to selected interventions
    const applyBulkCancel = async () => {
        if (selectedRows.length === 0) {
            alert("No interventions selected for cancellation.");
            return;
        }
        
        setCancellingInterventions(true);
        try {
            // Call the prop handler
            await onCancelIntervention(selectedRows);
            
            // Update local state
            setData((prevData) =>
                prevData.map((intervention) =>
                    selectedRows.includes(intervention.id)
                        ? { ...intervention, status: "Cancelled" }
                        : intervention
                )
            );
            
            // Close modal and reset state
            setIsCancelConfirmOpen(false);
            
            // Show success message
            alert(`Successfully cancelled ${selectedRows.length} intervention(s).`);
        } catch (error) {
            console.error("Error cancelling interventions:", error);
            alert("Failed to cancel one or more interventions. Please try again.");
        } finally {
            setCancellingInterventions(false);
        }
    };
    
    // Clear selection of rows
    const clearSelection = () => {
        setSelectedRows([]);
    };
    
    // Handle clicks outside dropdowns to close them
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setIsDatePickerOpen(false);
            }
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
            if (statusModalRef.current && !statusModalRef.current.contains(event.target)) {
                setIsStatusModalOpen(false);
            }
            if (priorityModalRef.current && !priorityModalRef.current.contains(event.target)) {
                setIsPriorityModalOpen(false);
            }
            if (cancelConfirmRef.current && !cancelConfirmRef.current.contains(event.target)) {
                setIsCancelConfirmOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // Filter interventions based on search, date, status, and priority
    useEffect(() => {
        let filtered = [...data];
        
        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(item => 
                item.description.toLowerCase().includes(searchLower) ||
                item.location.toLowerCase().includes(searchLower) ||
                item.status.toLowerCase().includes(searchLower) ||
                item.dateTime.toLowerCase().includes(searchLower) ||
                (item.assignees && item.assignees.some(assignee => 
                    assignee.name.toLowerCase().includes(searchLower)
                ))
            );
        }
        
        // Apply date filter
        if (selectedDate) {
            const selectedDayName = format(selectedDate, 'EEEE');
            filtered = filtered.filter((item) => {
                // Extract day from dateTime (e.g., "Wednesday" from "Wednesday, 12:45")
                const itemDay = item.dateTime.split(',')[0].trim();
                return itemDay.toLowerCase() === selectedDayName.toLowerCase();
            });
        }
        
        // Apply status filter
        if (filterStatus !== "All") {
            filtered = filtered.filter(item => item.status === filterStatus);
        }
        
        // Apply priority filter
        if (filterPriority !== "All") {
            filtered = filtered.filter(item => item.priority === filterPriority);
        }
        
        setFilteredInterventions(filtered);
    }, [search, selectedDate, filterStatus, filterPriority, data]);

    return(
        <div className="interventions-mobile-container w-full bg-gray-100">
            {/* Search and filter row - solid background */}
            <div 
                ref={headerRef}
                className="sticky top-0 z-10 bg-gray-100 border-t border-b border-gray-300 py-2" 
                style={{ backdropFilter: 'none' }}
            >
                <div className="flex items-center justify-between gap-2 px-2">
                    {/* Search input */}
                    <div className="relative flex-grow">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border rounded-lg pl-8 pr-3 py-2 w-full text-sm focus:outline-none"
                        />
                    </div>
                    
                    {/* Date picker button */}
                    <div className="relative" ref={datePickerRef}>
                        <button
                            onClick={toggleDatePicker}
                            className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm ${
                                selectedDate ? "bg-black text-white" : "bg-gray-200"
                            }`}
                        >
                            <Calendar size={16} />
                            {selectedDate && (
                                <span 
                                    className="ml-1 cursor-pointer" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearDateFilter();
                                    }}
                                >
                                    ×
                                </span>
                            )}
                        </button>
                        
                        {/* Date picker dropdown */}
                        {isDatePickerOpen && (
                            <div className="absolute right-0 mt-1 z-20">
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={handleDateChange}
                                    inline
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Filter button */}
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={toggleFilter}
                            className="flex items-center justify-center px-3 py-2 bg-gray-200 rounded-lg text-sm"
                        >
                            <Filter size={16} />
                        </button>
                        
                        {/* Filter dropdown */}
                        {isFilterOpen && (
                            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-20">
                                <div className="p-2">
                                    <h3 className="font-medium text-sm mb-2">Status</h3>
                                    <div className="space-y-1 mb-3">
                                        {["All", "In Progress", "Complete", "Pending", "Postponed", "Cancelled"].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setFilterStatus(status)}
                                                className={`block w-full text-left px-2 py-1 text-sm rounded ${
                                                    filterStatus === status ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <h3 className="font-medium text-sm mb-2">Priority</h3>
                                    <div className="space-y-1">
                                        {["All", "High", "Medium", "Low"].map((priority) => (
                                            <button
                                                key={priority}
                                                onClick={() => setFilterPriority(priority)}
                                                className={`block w-full text-left px-2 py-1 text-sm rounded ${
                                                    filterPriority === priority ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"
                                                }`}
                                            >
                                                {priority}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Add button - using addTaskLink prop */}
                    <Link href={addTaskLink}>
                        <button className="bg-[#0060B4] text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
                            + Add Task
                        </button>
                    </Link>
                </div>
                
                {/* Active filters display */}
                <div className="flex flex-wrap gap-2 mt-2 px-2">
                    {selectedDate && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                            {selectedDate.toDateString()}
                            <button className="ml-1" onClick={clearDateFilter}>×</button>
                        </span>
                    )}
                    {filterStatus !== "All" && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                            Status: {filterStatus}
                            <button className="ml-1" onClick={() => setFilterStatus("All")}>×</button>
                        </span>
                    )}
                    {filterPriority !== "All" && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                            Priority: {filterPriority}
                            <button className="ml-1" onClick={() => setFilterPriority("All")}>×</button>
                        </span>
                    )}
                </div>
                
                {/* Selected items actions */}
                {selectedRows.length > 0 && (
                    <div className="bg-gray-100 text-[#757575] font-outfit mt-2 p-2 rounded-lg flex items-center gap-4 text-sm mx-2">
                        <span className="flex items-center gap-1">
                            {selectedRows.length} selected
                            <button 
                                className="hover:text-gray-800 ml-2" 
                                onClick={clearSelection}
                                aria-label="Clear selection"
                            >
                                <X size={14} />
                            </button>
                        </span>
                        <button 
                            className="hover:text-red-600"
                            onClick={openCancelConfirm}
                        >
                            Cancel Pi  
                        </button>
                        <span>|</span>
                        <button 
                            className={`${hasSelectedCancelledItems() ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={openStatusModal}
                            disabled={hasSelectedCancelledItems()}
                        >
                            Set Status
                        </button>
                        <button 
                            className={`${hasSelectedCancelledItems() ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={openPriorityModal}
                            disabled={hasSelectedCancelledItems()}
                        >
                            Set Priority
                        </button>
                    </div>
                )}
            </div>
            
            {/* 
              * List of intervention cards with proper top padding 
              * to prevent first card from being hidden under the sticky header 
              */}
            <div className="pb-20 mt-0">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">
                        Loading interventions...
                    </div>
                ) : filteredInterventions.length > 0 ? (
                    filteredInterventions.map(intervention => (
                        <InterventionsCards 
                            key={intervention.id}
                            id={intervention.id}
                            dateTime={intervention.dateTime}
                            location={intervention.location}
                            description={intervention.description}
                            status={intervention.status}
                            plannedAt={intervention.plannedAt}
                            priority={intervention.priority}
                            assignees={intervention.assignees}
                            onSelect={handleSelectIntervention}
                            isSelected={selectedRows.includes(intervention.id)}
                            onShowDetails={handleShowDetails}
                            onEdit={handleEditIntervention}
                            onCancel={(id) => {
                                setSelectedRows([id]);
                                openCancelConfirm();
                            }}
                        />
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No interventions match the current filters
                    </div>
                )}
            </div>

            {/* Status Modal */}
            {isStatusModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-25 flex justify-center items-center z-50">
                    <div 
                        ref={statusModalRef}
                        className="bg-white rounded-lg shadow-xl p-4 w-[90%] max-w-md"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium">Set Status for {selectedRows.length} items</h3>
                            <button 
                                onClick={() => setIsStatusModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            {["In Progress", "Complete", "Pending", "Postponed", "Cancelled", "Denied"].map((status) => (
                                <div 
                                    key={status} 
                                    className="mb-2 flex items-center"
                                >
                                    <input
                                        type="radio"
                                        id={`status-${status}`}
                                        name="bulk-status"
                                        checked={bulkActionStatus === status}
                                        onChange={() => setBulkActionStatus(status)}
                                        className="mr-2"
                                    />
                                    <label 
                                        htmlFor={`status-${status}`}
                                        className="cursor-pointer"
                                    >
                                        {status}
                                    </label>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsStatusModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyBulkStatus}
                                disabled={!bulkActionStatus}
                                className={`px-4 py-2 rounded-lg text-sm text-white ${
                                    bulkActionStatus ? "bg-[#0060B4] hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                                }`}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Priority Modal */}
            {isPriorityModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-25 flex justify-center items-center z-50">
                    <div 
                        ref={priorityModalRef}
                        className="bg-white rounded-lg shadow-xl p-4 w-[90%] max-w-md"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium">Set Priority for {selectedRows.length} items</h3>
                            <button 
                                onClick={() => setIsPriorityModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            {["High", "Medium", "Low"].map((priority) => (
                                <div 
                                    key={priority} 
                                    className="mb-2 flex items-center"
                                >
                                    <input
                                        type="radio"
                                        id={`priority-${priority}`}
                                        name="bulk-priority"
                                        checked={bulkActionPriority === priority}
                                        onChange={() => setBulkActionPriority(priority)}
                                        className="mr-2"
                                    />
                                    <label 
                                        htmlFor={`priority-${priority}`}
                                        className="cursor-pointer"
                                    >
                                        {priority}
                                    </label>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsPriorityModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={applyBulkPriority}
                                disabled={!bulkActionPriority}
                                className={`px-4 py-2 rounded-lg text-sm text-white ${
                                    bulkActionPriority ? "bg-[#0060B4] hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                                }`}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {isCancelConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-25 flex justify-center items-center z-50">
                    <div 
                        ref={cancelConfirmRef}
                        className="bg-white rounded-lg shadow-xl p-4 w-[90%] max-w-md"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium">Cancel Intervention{selectedRows.length > 1 ? 's' : ''}</h3>
                            <button 
                                onClick={() => setIsCancelConfirmOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <p>Are you sure you want to cancel {selectedRows.length} intervention{selectedRows.length > 1 ? 's' : ''}?</p>
                            <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsCancelConfirmOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                disabled={cancellingInterventions}
                            >
                                No, Keep
                            </button>
                            <button
                                onClick={applyBulkCancel}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                                disabled={cancellingInterventions}
                            >
                                {cancellingInterventions ? 
                                    "Cancelling..." : 
                                    `Yes, Cancel ${selectedRows.length > 1 ? 'All' : ''}`
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 

