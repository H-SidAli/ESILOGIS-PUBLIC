"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import DataTable from "react-data-table-component";
import { createPortal } from "react-dom";

export default function ReportHistoryTable() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [error, setError] = useState(null);
  const menuButtonRefs = useRef({});
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  // Feedback popup state
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState({
    id: null,
    type: '',
    content: ''
  });

  const router = useRouter();

  // Fetch interventions from backend
  useEffect(() => {
    async function fetchInterventions() {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3001/api/intervention", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch interventions");
        const result = await response.json();
        // Normalize data
        const interventions = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
          ? result.data
          : [];
        // Map to table format
        const mapped = interventions.map((item) => ({
          id: item.id,
          date: item.createdAt
            ? formatDate(item.createdAt)
            : "",
          description: item.description || "",
          equipment: item.equipment
            ? `${item.equipment.inventoryCode || ""} - ${item.equipment.type?.name || ""}`
            : "/",
          pictures: item.pictures && item.pictures.length > 0
            ? `${item.pictures.length} Picture${item.pictures.length > 1 ? "s" : ""}`
            : "2",
          location: item.location?.name || "/",
          status: item.status || "Pending",
          priority: item.priority || "",
          feedback: item.feedback || "Labor Feedback",
        }));
        setData(mapped);
        setFilteredData(mapped);
      } catch (err) {
        setError("Failed to load interventions");
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInterventions();
  }, []);

  // Format date from "2025-05-05 21:43:21.113" to "MM/DD/YYYY"
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // If standard parsing fails, try manual parsing
        const parts = dateStr.split(/[-\s:\.]/);
        if (parts.length >= 3) {
          return `${parts[1]}/${parts[2]}/${parts[0]}`;
        }
        return dateStr; // Return original if parsing fails
      }
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Date parsing error:", e);
      return dateStr; // Return original string if parsing fails
    }
  };

  // Responsive window size
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const handleFeedbackClick = (feedbackType, row) => {
    setCurrentFeedback({
      id: row.id,
      type: feedbackType,
      content: feedbackType === 'Your Feedback' ? row.feedbackContent || '' : ''
    });
    setShowFeedbackPopup(true);
  };

  const handleSubmitFeedback = () => {
    const updatedData = data.map(item => {
      if (item.id === currentFeedback.id) {
        return {
          ...item,
          feedback: 'Your Feedback',
          feedbackContent: currentFeedback.content,
          status: 'Completed'
        };
      }
      return item;
    });
    setData(updatedData);
    setShowFeedbackPopup(false);
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-500';
      case 'Pending': return 'bg-yellow-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Canceled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const MobileCard = ({ row }) => {
    return (
      <div className="bg-white p-4 mb-3 border-b border-gray-200">
        <div className="flex items-start mb-3">
          <input
            type="checkbox"
            checked={selectedRows.includes(row.id)}
            onChange={() => handleRowSelect(row.id)}
            className="w-4 h-4 mt-1 mr-3"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <span className="font-medium">{row.date}</span>
              <span className={`flex items-center text-sm`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(row.status)}`} />
                {row.status}
              </span>
            </div>
            <p className="text-gray-600 mt-1">{row.description}</p>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {row.equipment !== "/" && <span className="mr-2">{row.equipment}</span>}
                {row.pictures !== "/" && <span className="mr-2">{row.pictures}</span>}
                <span>{row.location}</span>
                {row.priority && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-300 bg-gray-100">
                    {row.priority}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleFeedbackClick(row.feedback, row)}
                  className={`text-xs px-2 py-1 rounded-[4px] ${
                    row.feedback === 'Your Feedback'
                      ? 'bg-[#EA8B00] text-white'
                      : 'bg-[#0060B4] text-white'
                  }`}
                >
                  {row.feedback}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getResponsiveColumns = () => {
    const baseColumns = [
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
            className="w-4 h-4"
          />
        ),
        width: "50px",
      },
      {
        name: "Date",
        selector: row => row.date,
        sortable: true,
        width: "120px",
      },
      {
        name: "Description",
        selector: row => row.description,
        sortable: true,
        grow: 2,
        wrap: true,
      },
      {
        name: "Equipment",
        selector: row => row.equipment,
        sortable: true,
      },
      {
        name: "Pictures",
        selector: row => row.pictures,
        sortable: true,
      },
      {
        name: "Location",
        selector: row => row.location,
        sortable: true,
      },
      {
        name: "Priority",
        selector: row => row.priority,
        sortable: true,
        cell: row =>
          row.priority ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold border border-gray-300 bg-gray-100">
              {row.priority}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          ),
      },
      {
        name: "Status",
        cell: row => (
          <span className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(row.status)}`} />
            {row.status}
          </span>
        ),
        sortable: true,
      },
      {
        name: "Feedback",
        cell: row => (
          <button
            onClick={() => handleFeedbackClick(row.feedback, row)}
            className={`text-sm px-3 py-1 rounded-[7px] ${
              row.feedback === 'Your Feedback'
                ? 'bg-[#EA8B00] text-white'
                : 'bg-[#0060B4] text-white'
            }`}
          >
            {row.feedback}
          </button>
        ),
      }
    ];

    return baseColumns;
  };

  return (
    <div className="w-full relative">

      {/* DataTable */}
      <div className="table-container w-full relative">
        {selectedRows.length > 0 && (
          <div className="h-[35px] sm:h-[50px] w-full absolute top-0 right-0 z-30 flex items-center gap-6 text-sm font-outfit text-[#757575] px-4 bg-gray-100">
            <button className="cursor-pointer">Delete Selected</button>
            <span>|</span>
            <button className="cursor-pointer">Update Status</button>
          </div>
        )}

        {windowSize.width < 768 ? (
          <div className="divide-y divide-gray-200">
            {filteredData.map(row => (
              <MobileCard key={row.id} row={row} />
            ))}
          </div>
        ) : (
          <DataTable
            columns={getResponsiveColumns()}
            data={filteredData}
            noHeader
            responsive
            pagination
            progressPending={loading}
            customStyles={{
              table: {
                style: {
                  backgroundColor: "#ffffff",
                },
              },
              headRow: {
                style: {
                  minHeight: "50px",
                  backgroundColor: "#ffffff",
                  borderBottom: "1px solid #E5E7EB",
                  marginBottom: "0",
                },
              },
              headCells: {
                style: {
                  color: "#6B7280",
                  fontSize: "14px",
                  padding: "12px 16px",
                  fontWeight: "600",
                },
              },
              rows: {
                style: {
                  backgroundColor: "#ffffff",
                  minHeight: "60px",
                  "&:not(:last-of-type)": {
                    borderBottom: "1px solid #E5E7EB",
                  },
                  "&:hover": {
                    backgroundColor: "#F9FAFB",
                  },
                },
              },
              cells: {
                style: {
                  padding: "12px 16px",
                  fontSize: "14px",
                },
              },
            }}
          />
        )}
      </div>

      {/* Feedback Popup */}
      {showFeedbackPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
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
      {error && <div className="text-red-500 p-4">{error}</div>}
    </div>
  );
}