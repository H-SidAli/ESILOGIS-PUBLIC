'use client';

import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { Search, MoreVertical, Calendar, X } from "lucide-react";
import { createPortal } from "react-dom";

export default function NotificationsTable() {
  const [data, setData] = useState([
    { id: 1, date: "10/05/2025", description: "Lemma Options", isRead: false },
    { id: 2, date: "10/05/2025", description: "User 12345 responded a new issue", isRead: false },
    { id: 3, date: "17/05/2025", description: "Work Order Complained", isRead: false }
  ]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef({});
  const dropdownRef = useRef(null);
  const [firstVisibleRowId, setFirstVisibleRowId] = useState(null);
  const windowSize = useWindowSize();

  // Date filter states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateInput, setDateInput] = useState('');
  const datePickerRef = useRef(null);

  function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
      width: typeof window !== "undefined" ? window.innerWidth : 0,
      height: typeof window !== "undefined" ? window.innerHeight : 0,
    });

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

    return windowSize;
  }

  // Handle click outside to close menu dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuOpen !== null) {
        // Check if the click is outside both the menu button and dropdown
        const isClickOutsideButton = !Object.values(menuButtonRefs.current)
          .some(buttonRef => buttonRef && buttonRef.contains(event.target));
        
        const isClickOutsideDropdown = 
          !event.target.closest('.menu-dropdown');
          
        if (isClickOutsideButton && isClickOutsideDropdown) {
          setMenuOpen(null);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    setFilteredData(data);
    if (data.length > 0) {
      setFirstVisibleRowId(data[0].id);
    }
  }, [data]);

  useEffect(() => {
    let result = data;
    if (search) {
      result = data.filter(item =>
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.date.toLowerCase().includes(search.toLowerCase())
      );
    }
    // Date filter (DD/MM/YYYY)
    if (selectedDate) {
      const selected = formatDate(selectedDate);
      result = result.filter(item => item.date === selected);
    }
    setFilteredData(result);
  }, [search, data, selectedDate]);

  // Date filter handlers
  function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    // Format as DD/MM/YYYY
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  function getDateLabel() {
    if (selectedDate) {
      return (
        <span className="flex items-center">
          {formatDate(selectedDate)}
          <button
            type="button"
            className="ml-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none"
            style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => {
              e.stopPropagation();
              handleClearDate();
            }}
            tabIndex={0}
          >
            <X size={14} />
          </button>
        </span>
      );
    }
    return "Date";
  }

  function handleDateInputChange(e) {
    setDateInput(e.target.value);
  }

  function handleDateInputSubmit() {
    if (!dateInput) return;
    try {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setShowDatePicker(false);
      }
    } catch (error) {
      console.error("Invalid date format", error);
    }
  }

  function handleClearDate() {
    setSelectedDate(null);
    setDateInput('');
    setShowDatePicker(false);
  }

  // Date Filter Modal component
  const DateFilterModal = () => {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center font-outfit justify-center bg-opacity-50"
        style={{
          backgroundColor: 'rgba(0,0,0,0.3)'
        }}>
        <div
          ref={datePickerRef}
          className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              <h2 className="text-lg font-medium">Enter Date Filter</h2>
            </div>
            <button
              onClick={() => setShowDatePicker(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <input
              type="date"
              value={dateInput}
              onChange={handleDateInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              inputMode="numeric"
              pattern="\d{4}-\d{2}-\d{2}"
            />
            <p className="text-sm text-gray-500 mb-6">Format: YYYY-MM-DD</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClearDate}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Clear
              </button>
              <button
                onClick={handleDateInputSubmit}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const handleRowSelect = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedRows(
      selectedRows.length === filteredData.length ? [] : filteredData.map(r => r.id)
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
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceRight = viewportWidth - rect.right;
      const dropdownWidth = 240;

      if (windowSize.width < 768) {
        setMenuPosition({
          top: spaceBelow < 150 ? rect.top - 120 : rect.bottom + 5,
          left: Math.max(10, rect.left - (dropdownWidth / 2) + 15),
        });
      } else {
        setMenuPosition({
          top: rect.top,
          left: spaceRight < dropdownWidth + 20 ? rect.left - dropdownWidth - 10 : rect.right + 10,
        });
      }
    }
    setMenuOpen(id);
  };

  const markAsRead = (id) => {
    setData(prevData => {
      return prevData.map(item => {
        if (item.id === id) {
          return { ...item, isRead: true };
        }
        return item;
      });
    });
    setMenuOpen(null);
  };

  const DropdownMenu = ({ row }) => {
    return createPortal(
      <div
        className="fixed bg-white shadow-2xl rounded-md z-40 border border-gray-200 w-60 menu-dropdown"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
        ref={dropdownRef}
      >
        <button 
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={() => markAsRead(row.id)}
        >
          Mark as read
        </button>
        <hr />
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
          Archive
        </button>
        <hr />
        <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">
          Delete
        </button>
      </div>,
      document.body
    );
  };

  const columns = [
    {
      name: (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={selectedRows.length === filteredData.length && filteredData.length > 0}
          aria-label="Select all notifications"
        />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row.id)}
          onChange={() => handleRowSelect(row.id)}
          aria-label={`Select notification ${row.id}`}
        />
      ),
      width: "50px",
      sortable: false,
    },
    {
      name: "Date",
      selector: row => row.date,
      sortable: true,
      grow: 1,
    },
    {
      name: "Description",
      selector: row => row.description,
      sortable: true,
      grow: 2,
    },
    {
      name: "",
      cell: (row) => (
        <div className="p-1 rounded-full flex items-center justify-end">
          {/* Placeholder div that takes up space whether circle is visible or not */}
          <div className="w-3 h-3 mr-2">
            {/* Orange dot indicator for unread notifications */}
            {!row.isRead && (
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            )}
          </div>
          <div
            ref={(el) => (menuButtonRefs.current[row.id] = el)}
            className={`cursor-pointer p-1 rounded-full ${
              menuOpen === row.id ? "bg-[#C9C9C9] opacity-85" : ""
            }`}
            onClick={(e) => toggleMenu(row.id, e)}
            aria-label="More options"
          >
            <MoreVertical size={18} />
          </div>
          {menuOpen === row.id && <DropdownMenu row={row} />}
        </div>
      ),
      width: "80px",
      sortable: false,
    },
  ];

  return (
    <div className="w-full relative font-outfit">
      {/* Date Filter Modal */}
      {showDatePicker && <DateFilterModal />}

      <div className="px-2 sm:px-4 flex items-center justify-between py-3 border-t border-b border-gray-300">
        <div className="relative w-full sm:w-[285px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute mb-0.5 right-2 bottom-[8px] sm:bottom-[3px] w-[20px]" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 rounded-[10px] h-[40px] sm:h-[31px] w-full sm:w-[285px] outline-none bg-white"
            />
          </div>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center border border-gray-300 rounded-md px-3 py-1 ${selectedDate ? "bg-blue-600 text-white" : "bg-gray-200"} h-[31px] cursor-pointer`}
          >
            {getDateLabel()}
            <Calendar size={16} className="ml-2" />
          </button>
        </div>
      </div>

      <div className="table-container w-full relative overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredData}
          conditionalRowStyles={[
            {
              when: row => row.id === firstVisibleRowId,
              style: {
                borderTopLeftRadius: windowSize.width < 768 ? "0px" : '40px',
                borderTopRightRadius: windowSize.width < 768 ? "0px" : '40px',
              },
            },
          ]}
          progressPending={loading}
          noHeader
          dense={false}
          responsive
          customStyles={{
            table: {
              style: {
                minWidth: '100%',
                marginTop: "0px",
                backgroundColor: "#f3f4f6",
                padding: windowSize.width < 768 ? "0px 0px" : "0px 8px"
              },
            },
            tableWrapper: {
              style: {
                width: '100%',
                display: 'block',
              },
            },
            headRow: {
              style: {
                minHeight: windowSize.width < 768 ? "10px" : "30px",
                paddingLeft: windowSize.width < 768 ? '5px' : "0px",
                marginBottom: "10px",
                fontSize: windowSize.width < 768 ? "0.85rem" : "1rem",
                width: '100%',
                border: "none"
              },
            },
            headCells: {
              style: {
                backgroundColor: "#f3f4f6",
                fontFamily: "outfit",
                color: "#757575",
                height: windowSize.width < 768 ? "40px" : "50px",
                padding: windowSize.width < 768 ? "0px 5px" : "0px 10px",
                fontSize: windowSize.width < 768 ? "0.75rem" : "0.875rem",
              },
            },
            rows: {
              style: {
                margin: "0px",
                minHeight: windowSize.width < 768 ? "70px" : "70px",
                fontSize: windowSize.width < 768 ? "0.75rem" : "0.875rem",
                width: '100%',
                paddingRight: '10px'
              },
            },
            cells: {
              style: {
                padding: windowSize.width < 768 ? "0px 10px" : "0px 10px",
              },
            },
          }}
        />
      </div>
    </div>
  );
}