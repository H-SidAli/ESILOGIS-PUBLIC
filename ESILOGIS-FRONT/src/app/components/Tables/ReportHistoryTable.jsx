"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import DataTable from "react-data-table-component";
import { Search, MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";

export default function EquipmentTable() {
  // Existing state declarations
  const [data, setData] = useState([
    {
      id: 1,
      date: "10/02/2025",
      description: "Lorem Opisium Lorem Opisium...",
      equipment: "/",
      pictures: "2 Pictures",
      location: "$33",
      status: "Completed",
      feedback: "Leave Feedback"
    },
    {
      id: 2,
      date: "10/02/2025",
      description: "Lorem Opisium Lorem Opisium...",
      equipment: "XXXXX",
      pictures: "2 Pictures",
      location: "$33",
      status: "Completed",
      feedback: "Your Feedback"
    },
    {
      id: 3,
      date: "10/02/2025",
      description: "Lorem Opisium Lorem Opisium...",
      equipment: "XXXXX",
      pictures: "/",
      location: "$33",
      status: "Pending",
      feedback: "Leave Feedback"
    },
    {
      id: 4,
      date: "10/02/2025",
      description: "Lorem Opisium Lorem Opisium...",
      equipment: "/",
      pictures: "1 Picture",
      location: "$33",
      status: "In Progress",
      feedback: "Leave Feedback"
    }
  ]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [error, setError] = useState(null);
  const menuButtonRefs = useRef({});

  // New state for popup
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState({
    id: null,
    type: '',
    content: ''
  });

  const router = useRouter();


  // Existing useEffect hooks remain unchanged
  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  useEffect(() => {
    let filtered = data;
    if (search) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          value.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
    }
    if (filterStatus !== "All") {
      filtered = filtered.filter(item =>
        item.status === filterStatus
      );
    }
    setFilteredData(filtered);
  }, [search, filterStatus, data]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.menu-dropdown')) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Existing handlers remain unchanged
  const handleRowSelect = (id) => {
    setSelectedRows(prevSelected =>
      prevSelected.includes(id) 
        ? prevSelected.filter(rowId => rowId !== id) 
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedRows(
      selectedRows.length === filteredData.length 
        ? [] 
        : filteredData.map(row => row.id)
    );
  };

  const toggleMenu = (id, e) => {
    e.stopPropagation();
   
    if (menuOpen === id) {
      setMenuOpen(null);
      return;
    }
   
    const button = menuButtonRefs.current[id];
    if (button) {
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const dropdownWidth = 240;
     
      if (spaceBelow < 150) {
        setMenuPosition({
          top: rect.top - 120,
          left: rect.left - dropdownWidth - 10
        });
      } else {
        setMenuPosition({
          top: rect.top,
          left: rect.left - dropdownWidth - 10
        });
      }
    }
   
    setMenuOpen(id);
  };

  // New feedback handlers
  const handleFeedbackClick = (row) => {
    setCurrentFeedback({
      id: row.id,
      type: row.feedback,
      content: row.feedback === 'Your Feedback' ? 'Sample feedback content' : ''
    });
    setShowFeedbackPopup(true);
  };

  const handleSubmitFeedback = () => {
    const updatedData = data.map(item => {
      if (item.id === currentFeedback.id) {
        return { 
          ...item, 
          feedback: 'Your Feedback',
          status: 'Completed' // Optional: update status if needed
        };
      }
      return item;
    });
    setData(updatedData);
    setShowFeedbackPopup(false);
  };

  const DropdownMenu = ({ row }) => {
    return createPortal(
      <div
        className="fixed bg-white shadow-2xl rounded-md z-[1000] border border-gray-200 w-60 menu-dropdown"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`
        }}
      >
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100">View</button>
        <hr />
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100">Edit</button>
        <hr />
        <button className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600">Delete</button>
      </div>,
      document.body
    );
  };

  const columns = [
    {
      name: <input
        type="checkbox"
        onChange={handleSelectAll}
        checked={selectedRows.length === filteredData.length && filteredData.length > 0}
      />,
      cell: (row) => (
        <input 
          type="checkbox" 
          checked={selectedRows.includes(row.id)}
          onChange={() => handleRowSelect(row.id)}
        />
      ),
      width: "50px",
    },
    {
      name: "Date",
      selector: (row) => row.date,
      sortable: true
    },
    {
      name: "Description",
      selector: (row) => row.description,
      sortable: true,
      width: "250px"
    },
    {
      name: "Equipment",
      selector: (row) => row.equipment,
      sortable: true
    },
    {
      name: "Pictures Attached",
      selector: (row) => row.pictures,
      sortable: true
    },
    {
      name: "Location",
      selector: (row) => row.location,
      sortable: true
    },
    {
      name: "Status",
      cell: (row) => (
        <span className={`flex items-center`}>
          <span className={`mr-2 w-2 h-2 rounded-full ${
            row.status === 'Completed' ? 'bg-green-500' :
            row.status === 'Pending' ? 'bg-yellow-500' :
            row.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-500'
          }`}></span>
          <span className="text-black">{row.status}</span>
        </span>
      ),
      sortable: true
    },
    {
      name: "Feedback",
      cell: (row) => (
        <button
          onClick={() => handleFeedbackClick(row)}
          className={`text-sm text-white px-3 py-1 rounded ${
            row.feedback === 'Your Feedback'
              ? 'bg-[#EA8B00]'
              : 'bg-[#0060B4]'
          }`}
        >
          {row.feedback}
        </button>
      ),
      sortable: true
    },
    {
      name: "",
      cell: (row) => (
        <div className="p-2 rounded-full">
          <div
            ref={el => menuButtonRefs.current[row.id] = el}
            className={`cursor-pointer p-1 rounded-full ${menuOpen === row.id ? 'bg-[#C9C9C9] opacity-85' : ''}`}
            onClick={(e) => toggleMenu(row.id, e)}
          >
            <MoreVertical />
          </div>
          {menuOpen === row.id && <DropdownMenu row={row} />}
        </div>
      ),
      width: "80px",
    },
  ];

  return (
    <div className="w-full relative">
      

      <div className="table-container relative"> 
        {selectedRows.length > 0 && (
          <div className="Clickables w-[1350px] h-[29px] bg-gray-100 absolute top-0 right-0 z-40 flex flex-row items-center justify-start gap-6 text-sm font-outfit text-[#757575] ">
            <button className="cursor-pointer"> Delete Selected</button>
            <span>|</span>
            <button className="cursor-pointer"> Update Status</button>
          </div>
        )}
        
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={10}
          highlightOnHover
          progressPending={loading}
          progressComponent={
            <div className="p-4 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0060B4]"></div>
            </div>
          }
          noDataComponent={
            <div className="p-8 text-center font-outfit text-gray-500">
              {error ? `Error: ${error}` : loading ? 'Loading...' : 'No records found'}
            </div>
          }
          customStyles={{
            table: {
              style: {
                backgroundColor: '#FFFFFF',
                borderCollapse: 'separate',
                borderSpacing: '0',
              },
            },
            headRow: {
              style: {
                backgroundColor: '#f3f4f6',
                borderBottom: '1px solid #E5E7EB',
                minHeight: '40px',
              },
            },
            headCells: {
              style: {
                fontFamily: 'outfit, sans-serif',
                color: '#757575',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 16px',
                borderRight: 'none',
              },
            },
            rows: {
              style: {
                minHeight: '52px',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#F9FAFB',
                  cursor: 'pointer',
                },
              },
              stripedStyle: {
                backgroundColor: '#F9FAFB',
              },
            },
            cells: {
              style: {
                padding: '12px 16px',
                borderBottom: '1px solid #E5E7EB',
              },
            },
            pagination: {
              style: {
                borderTop: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
              },
              pageButtonsStyle: {
                borderRadius: '4px',
                height: '32px',
                minWidth: '32px',
                padding: '0 6px',
                margin: '0 4px',
                cursor: 'pointer',
                transition: 'all .2s ease-in-out',
                backgroundColor: '#FFFFFF',
                '&:hover:not(:disabled)': {
                  backgroundColor: '#F3F4F6',
                },
              },
            },
          }}
          dense
        />
      </div>

      {/* Feedback Popup */}
      {showFeedbackPopup && (
        <div className="fixed inset-0  bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {currentFeedback.type === 'Your Feedback' ? 'View Feedback' : 'Add Feedback'}
            </h2>
            
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 mb-4"
              rows={4}
              value={currentFeedback.content}
              onChange={(e) => setCurrentFeedback({
                ...currentFeedback,
                content: e.target.value
              })}
              disabled={currentFeedback.type === 'Your Feedback'}
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFeedbackPopup(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              {currentFeedback.type !== 'Your Feedback' && (
                <button
                  onClick={handleSubmitFeedback}
                  className="px-4 py-2 bg-[#0060B4] text-white rounded-lg hover:bg-blue-700"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};