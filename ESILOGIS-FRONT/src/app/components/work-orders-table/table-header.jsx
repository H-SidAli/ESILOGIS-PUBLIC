import React from 'react';

const TableHeader = ({ 
  selectAll, 
  toggleSelectAll, 
  hasSelectedItems,
  onCancelWorkOrders,
  onSetStatus,
  onSetPriority 
}) => {
  return (
    <div className="flex items-center py-2 px-4 bg-gray-100 border-b border-gray-200 text-sm font-medium min-w-[1000px]">
  <div className="w-8 ml-2 flex-shrink-0">
    <input
      type="checkbox"
      checked={selectAll}
      onChange={toggleSelectAll}
      className="w-4 h-4 accent-blue-600 cursor-pointer"
    />
  </div>


      <div className="w-36 px-6 text-gray-500">Date</div>
      <div className="flex-grow px-6 text-gray-500">Description</div>
      <div className="w-32 px-6 text-center text-gray-500">Status</div>
      <div className="w-28 px-6 text-center text-gray-500">Priority</div>
      <div className="w-32 px-6 text-center text-gray-500">Assignee</div>
      <div className="w-28 px-6 text-center text-gray-500">Location</div>
      <div className="w-36 px-6 text-gray-500">Last Updated</div>
      <div className="w-8 px-2">&nbsp;</div>
  
  
    </div>
  );
};

export default TableHeader;