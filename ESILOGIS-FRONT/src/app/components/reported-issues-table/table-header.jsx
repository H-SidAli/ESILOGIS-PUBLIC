import React, { useState, useRef, useEffect } from "react";

const TableHeader = ({ 
  selectAll, 
  toggleSelectAll, 
  hasSelectedItems = false,
  onCancelReports,
  onSetStatus,
  onSetPriority,
  onSetAssignee
}) => {
  return (
    <div className="flex items-center py-4 px-4 bg-gray-100 border-b border-gray-200 text-sm font-medium min-w-[1000px]">
      <div className="w-8 ml-2">
        <input
          type="checkbox"
          checked={selectAll}
          onChange={toggleSelectAll}
          className="w-4 h-4 accent-blue-600 cursor-pointer"
        />
      </div>

      {hasSelectedItems ? (
        /* Show action buttons when items are selected */
        <div className="flex items-center text-[#757575]">
          <button 
            onClick={onCancelReports}
            className="ml-4 cursor-pointer hover:text-black"
          >
            Cancel Report
          </button>
          <span className="mx-3">|</span>
          <button
            onClick={onSetStatus}
            className="cursor-pointer hover:text-black"
          >
            Set Status
          </button>
          <button
            onClick={onSetPriority}
            className="ml-4 cursor-pointer hover:text-black"
          >
            Set Priority
          </button>
          <button
            onClick={onSetAssignee}
            className="ml-4 cursor-pointer hover:text-black">
            Set Assignee
          </button>
        </div>
      ) : (
        /* Show regular column headers when no items selected */
        <>
          <div className="w-36 text-gray-500">Date</div>
          <div className="flex-grow text-gray-500">Description</div>
          <div className="w-24 text-center text-gray-500">Status</div>
          <div className="w-24 text-center text-gray-500">Priority</div>
          <div className="w-24 text-center text-gray-500">Assignee</div>
          <div className="w-24 text-center text-gray-500">Location</div>
          <div className="w-36 text-gray-500">Last Updated</div>
          <div className="w-8">&nbsp;</div>
        </>
      )}
    </div>
  );
}; 

export default TableHeader;