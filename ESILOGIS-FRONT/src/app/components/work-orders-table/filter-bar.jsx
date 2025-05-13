import React, { useState } from 'react';
import { Search, Filter as FilterIcon } from 'lucide-react';
import Link from 'next/link';

const statusOptions = ["In Progress", "Complete", "Pending", "Cancelled", "Denied"];
const priorityOptions = ["High", "Medium", "Low"];

const FilterBar = ({
  search,
  setSearch,
  onSearch,
  filterStatus,
  setFilterStatus,
  onStatusFilter,
  filterPriority,
  setFilterPriority,
  onPriorityFilter,
  resetAllFilters,
  statusOptions: customStatusOptions,
  priorityOptions: customPriorityOptions
}) => {
  const [showFilters, setShowFilters] = useState(false);

  // Use custom options or default ones
  const statusOpts = customStatusOptions || statusOptions;
  const priorityOpts = customPriorityOptions || priorityOptions;

  // Helper for "All" button
  const isAll = filterStatus === "All" && filterPriority === "All";

  // Handler functions that work with both prop naming conventions
  const handleSearchChange = (value) => {
    if (typeof setSearch === 'function') {
      setSearch(value);
    }
    if (typeof onSearch === 'function') {
      onSearch(value);
    }
  };

  const handleStatusChange = (status) => {
    if (typeof setFilterStatus === 'function') {
      setFilterStatus(status);
    }
    if (typeof onStatusFilter === 'function') {
      onStatusFilter(status);
    }
  };
  
  const handlePriorityChange = (priority) => {
    if (typeof setFilterPriority === 'function') {
      setFilterPriority(priority);
    }
    if (typeof onPriorityFilter === 'function') {
      onPriorityFilter(priority);
    }
  };

  return (
    <>
      {/* Desktop Filter Bar */}
      <div className="hidden sm:flex px-4 flex-row items-center justify-between gap-4 h-[74px] w-full border-t border-b border-gray-300 bg-gray-100">
        <div className="flex flex-row w-auto gap-4">
          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="absolute mb-0.5 right-2 bottom-1 w-5" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="border p-2 rounded-lg h-8 w-full outline-none bg-white"
            />
          </div>
          {/* Filter Buttons */}
          <div className="flex gap-2 h-8">
            <button
              onClick={resetAllFilters}
              className={`flex items-center px-3 rounded-md ${
                isAll ? "bg-black text-white" : "bg-gray-200"
              } h-8 cursor-pointer`}
            >
              All
            </button>
            {/* Status Filters */}
            {statusOpts.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`flex items-center px-3 rounded-md ${
                  filterStatus === status ? "bg-black text-white" : "bg-gray-200"
                } h-8 cursor-pointer`}
              >
                {status}
              </button>
            ))}
            {/* Priority Filters */}
            {priorityOpts.map((priority) => (
              <button
                key={priority}
                onClick={() => handlePriorityChange(priority)}
                className={`flex items-center px-3 rounded-md ${
                  filterPriority === priority ? "bg-black text-white" : "bg-gray-200"
                } h-8 cursor-pointer`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
        {/* Add Work Order Button */}
        <Link href="../../technician/report-issue-technician">
          <button className="bg-[#0060B4] text-white px-4 py-1 rounded-md h-8 flex items-center justify-center cursor-pointer">
            <span className="text-lg mr-1">+</span> Add New Report
          </button>
        </Link>
      </div>

      {/* Mobile Filter Bar */}
      <div className="sm:hidden flex flex-col gap-2 px-2 py-2 bg-white border-b border-gray-200 w-full">
        <div className="flex items-center">
          {/* Search Bar */}
          <div className="flex-1 relative mr-2">
            <Search className="absolute right-3 top-2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="border rounded-full h-8 w-full pl-3 pr-8 outline-none bg-white text-sm"
            />
          </div>
          {/* Filter Icon */}
          <button
            className="ml-2 p-2 rounded-full bg-gray-100 border border-gray-200"
            onClick={() => setShowFilters((v) => !v)}
          >
            <FilterIcon className="w-5 h-5 text-gray-700" />
          </button>
          {/* Add Work Order Button */}
          <Link href="../../technician/CreateWorkOrder" className="ml-2">
            <button className="bg-[#0060B4] text-white px-3 py-1 rounded-md h-8 flex items-center justify-center cursor-pointer text-sm">
              <span className="text-lg mr-1">+</span>
            </button>
          </Link>
        </div>
        {/* Inline Filter Buttons (inspired by staff table) */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => {
                resetAllFilters();
                setShowFilters(false);
              }}
              className={`px-4 py-1 rounded-full border ${
                isAll ? "bg-black text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              All
            </button>
            {/* Status Filters */}
            {statusOpts.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-4 py-1 rounded-full border ${
                  filterStatus === status
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {status}
              </button>
            ))}
            {/* Priority Filters */}
            {priorityOpts.map((priority) => (
              <button
                key={priority}
                onClick={() => handlePriorityChange(priority)}
                className={`px-4 py-1 rounded-full border ${
                  filterPriority === priority
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FilterBar;