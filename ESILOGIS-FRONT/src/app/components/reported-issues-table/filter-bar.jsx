import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Filter, Plus, X, Calendar } from "lucide-react"; 
import Link from "next/link";

//add report
const FilterBar = ({
  // State values from parent
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  showDatePicker,
  setShowDatePicker,
  selectedDate,
  resetAllFilters,
  
  // Functions from parent
  getDateLabel,
  handleDateSelect,
  resetDateFilter,
  applyDateFilter,
  
  // Refs from parent
  datePickerRef,
  
  // Options
  statusOptions,
  priorityOptions
}) => {
  // State for filter popups
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const filterRef = useRef(null);
  const dateButtonRef = useRef(null);
  
  // State for direct date input
  const [dateInput, setDateInput] = useState('');
  
  // Set dateInput to the current date when opened
  useEffect(() => {
    if (showDatePicker && !dateInput) {
      // Set to today's date in YYYY-MM-DD format
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      setDateInput(formattedDate);
    }
  }, [showDatePicker, dateInput]);
  
  // Handle date input change
  const handleDateInputChange = (e) => {
    setDateInput(e.target.value);
  };

  // Handle date input submission
  const handleDateInputSubmit = () => {
    if (!dateInput) return;
    
    try {
      const date = new Date(dateInput);
      
      // Check if valid date
      if (!isNaN(date.getTime())) {
        // Set the selected date and close the picker
        handleDateSelect(date.getDate(), date.getMonth(), date.getFullYear());
        applyDateFilter();
        setShowDatePicker(false);
      }
    } catch (error) {
      console.error("Invalid date format", error);
    }
  };
  
  // Clear the date filter
  const handleClearDate = () => {
    resetDateFilter();
    setDateInput('');
    setShowDatePicker(false);
  };
  
  // Handle clicks outside the filter popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowMobileFilters(false);
      }
    };
    
    if (showMobileFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileFilters]);

  return (
    <div className="relative">
      {/* Mobile view for small screens */}
      <div className="sm:hidden w-full">
        <div className="flex items-center justify-between p-2 bg-gray-100 border-b border-gray-200 shadow-sm">
          {/* Search input with magnifying glass icon */}
          <div className="relative flex-grow mr-2">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-md pl-8 pr-2 py-1 w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          </div>
          
          {/* Date filter button with X icon for reset */}
          <div className="relative" ref={dateButtonRef}>
            <button 
              onClick={() => {
                setShowMobileFilters(false); // Close filters if open
                setShowDatePicker(!showDatePicker);
              }}
              className="mx-1 px-3 py-1 border rounded-md bg-white text-sm flex items-center whitespace-nowrap"
            >
              <span>{getDateLabel()}</span>
              <ChevronDown size={20} className="ml-1" />
            </button>
            {selectedDate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetDateFilter();
                }}
                className="absolute -right-1 -top-1 w-4 h-4 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs"
                title="Clear date filter"
              >
                <X size={10} />
              </button>
            )}
          </div>
          
          {/* Filter button with popup */}
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => {
                setShowDatePicker(false); // Close date picker if open
                setShowMobileFilters(!showMobileFilters);
              }}
              className="mx-1 p-1 border rounded-md bg-white"
            >
              <Filter size={18} className={showMobileFilters ? "text-blue-500" : ""} />
            </button>
            
            {/* Filter popup menu */}
            {showMobileFilters && (
              <div className="absolute right-0 mt-1 w-60 bg-white rounded-md shadow-lg z-30 border border-gray-200">
                <div className="p-3">
                  {/* Status section */}
                  <h3 className="font-medium mb-2">Status</h3>
                  <div className="space-y-1 mb-4">
                    <button 
                      onClick={() => setFilterStatus("All")}
                      className={`block w-full text-left px-3 py-2 text-sm rounded ${
                        filterStatus === "All" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    {statusOptions
                      .filter(status => status !== "-")
                      .map(status => (
                        <button 
                          key={`status-${status}`}
                          onClick={() => setFilterStatus(status)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded ${
                            filterStatus === status ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                  </div>
                  
                  {/* Priority section */}
                  <h3 className="font-medium mb-2">Priority</h3>
                  <div className="space-y-1">
                    <button 
                      onClick={() => setFilterPriority("All")}
                      className={`block w-full text-left px-3 py-2 text-sm rounded ${
                        filterPriority === "All" ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                      }`}
                    >
                      All
                    </button>
                    {priorityOptions.map(priority => (
                      <button 
                        key={`priority-${priority}`}
                        onClick={() => setFilterPriority(priority)}
                        className={`block w-full text-left px-3 py-2 text-sm rounded ${
                          filterPriority === priority ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
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
          
          {/* Add Report button */}
          <div>
  <Link href="../../admin/reported-issues/report-issue">
    <button className="flex cursor-pointer items-center bg-[#0060B4] text-white rounded-md px-5 py-1 text-sm ml-12">
      <span className="mr-1">+</span>
      Add Report
    </button>
  </Link>
</div>
        </div>
      </div>
      
      {/* Desktop view - hidden on small screens */}
      <div className="hidden sm:block">
        <div className="flex flex-wrap items-center px-4 py-4 bg-gray-100 border-b border-gray-300 sticky top-0 z-10">
          {/* Search Input */}
          <div className="relative w-[285px] mb-0">
            <Search className="absolute mb-0.5 right-2 bottom-[3px] w-[20px]" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-4 rounded-[10px] h-[31px] w-[285px] outline-none bg-white"
            />
          </div>
          
          {/* Date Filter Button and Dropdown with X icon for reset */}
          <div className="relative mx-4" ref={dateButtonRef}>
            <button 
              className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-gray-200 text-sm"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <span className="mr-2">{getDateLabel()}</span>
              <ChevronDown size={16} />
            </button>
            
            {/* X icon to clear date filter - only shown when a date is selected */}
            {selectedDate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetDateFilter();
                }}
                className="absolute -right-1 -top-1 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs"
                title="Clear date filter"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter buttons - Status and Priority together */}
          <div className="flex flex-wrap gap-1 ">
            {/* Single All button at the start */}
            <button 
              onClick={resetAllFilters}
              className={`px-4 py-1 text-sm rounded-md ${
                filterStatus === "All" && filterPriority === "All"
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              All
            </button>
            
            {/* Status options without "All" */}
            {statusOptions
              .filter(status => status !== "-") 
              .map(status => (
                <button 
                  key={`status-${status}`}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-2 text-sm rounded-md ${
                    filterStatus === status
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {status}
                </button>
            ))}
            
            {/* Priority options without "All" */}
            {priorityOptions.map(priority => (
              <button 
                key={`priority-${priority}`}
                onClick={() => setFilterPriority(priority)}
                className={`px-3 py-2 text-sm rounded-md ${
                  filterPriority === priority
                    ? "bg-black text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
          
          <Link href="../../admin/reported-issues/report-issue">
            <button className="flex cursor-pointer items-center bg-[#0060B4] text-white rounded-md px-5 py-2 text-sm ml-20" >
              <span className="mr-1">+</span>
              Add Report
            </button>
          </Link>
        </div>
      </div>

      {/* Date picker popup - fixed positioning that matches the screenshot */}
      {showDatePicker && (
        <div 
          ref={datePickerRef}
          className="fixed inset-0 z-50 flex items-start justify-center pt-32"
          style={{
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDatePicker(false);
            }
          }}
        >
          <div className="bg-white shadow-lg rounded-md border border-gray-200 p-6 w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-medium text-gray-800 flex items-center">
                <Calendar size={20} className="mr-2" />
                Enter Date Filter
              </h4>
              <button 
                onClick={() => setShowDatePicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-5">
              <input
                type="date"
                value={dateInput}
                onChange={handleDateInputChange}
                className="border border-gray-300 rounded-md px-4 py-3 w-full text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                Format: YYYY-MM-DD
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded text-sm hover:bg-gray-300 transition-colors"
                onClick={handleClearDate}
              >
                Clear
              </button>
              
              <button 
                className="bg-[#0060B4] text-white px-5 py-2.5 rounded text-sm hover:bg-blue-700 transition-colors"
                onClick={handleDateInputSubmit}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 

export default FilterBar;