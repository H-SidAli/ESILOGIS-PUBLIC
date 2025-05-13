'use client';

import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { createPortal } from "react-dom";
import { useRouter } from 'next/navigation';
import { Search, MoreVertical, ChevronDown, Download, FileEdit, Trash2, Bell, Calendar, X, Eye, Menu } from "lucide-react";

export default function FilesTable({ 
  files = [],
  loading = false,
  // Action handlers
  onDownload = (fileIds) => console.log("Downloading files:", fileIds),
  onRename = (fileId, newName) => console.log("Renaming file:", fileId, newName),
  onDelete = (fileIds) => console.log("Deleting files:", fileIds),
  onAddFile = (file) => console.log("Adding file:", file),
  onScanClick = () => console.log("Scan button clicked"),
  onViewFile = (fileId) => console.log("Viewing file:", fileId), // Add this new prop
  // UI customization
  addButtonText = "+ Add File",
  mobileAddButtonText = "+ Add",
  showMobileView = true
}) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef({});
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [firstVisibleRowId, setFirstVisibleRowId] = useState(null);
  const windowSize = useWindowSize();

  // --- Date filter states ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateInput, setDateInput] = useState('');
  const datePickerRef = useRef(null);

  // Initialize data from props
  useEffect(() => {
    setData(files);
    setFilteredData(files);
  }, [files]);

  const viewFile = row => onViewFile(row.id);



  const handleAddFile = (newFile) => {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth()+1}/${currentDate.getFullYear().toString().slice(-2)}`;
    const isoDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    // Create file object with required format
    const newFileEntry = { 
      id: data.length + 1,
      fileName: newFile.name, 
      lastUpdated: formattedDate, 
      size: `${(newFile.size / (1024*1024)).toFixed(1)} MB`,
      date: isoDate
    };
    
    // Call the prop handler
    onAddFile(newFileEntry);
    
    // Update local state
    setData(prev => [...prev, newFileEntry]);
    setFilteredData(prev => [...prev, newFileEntry]);
  };

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      setFirstVisibleRowId(filteredData[0].id);
    }
  }, [filteredData]);

  // --- Filtering logic with date filter ---
  useEffect(() => {
    let filtered = data;

    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(f =>
        f.fileName.toLowerCase().includes(lower) ||
        f.lastUpdated.toLowerCase().includes(lower) ||
        f.size.toLowerCase().includes(lower)
      );
    }

    // Date filter (YYYY-MM-DD)
    if (selectedDate) {
      const selected = formatDate(selectedDate);
      filtered = filtered.filter(f => f.date === selected);
    }

    setFilteredData(filtered);
  }, [search, selectedDate, data]);

  // Close menu on outside click
  useEffect(() => {
    const onClick = e => {
      if (menuOpen !== null && !e.target.closest(".menu-dropdown")) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  // Close date picker modal on outside click
  useEffect(() => {
    const handleClickOutside = event => {
      if (showDatePicker && datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // --- Date filter handlers ---
  function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    // Allow only numbers and dashes, and always update value
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

  // Selection handlers
  const handleRowSelect = id =>
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleSelectAll = () =>
    setSelectedRows(
      selectedRows.length === filteredData.length
        ? []
        : filteredData.map(r => r.id)
    );

  // Menu toggle & position
  const toggleMenu = (id, e) => {
    e.stopPropagation();
    if (menuOpen === id) return setMenuOpen(null);

    const btn = menuButtonRefs.current[id];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const dropdownW = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuPosition({
        top: spaceBelow < 150 ? rect.top - 120 : rect.top,
        left: isMobile ? 10 : rect.left - dropdownW - 10,
      });
    }
    setMenuOpen(id);
  };

  // Actions using prop handlers
  const downloadFile = row => onDownload([row.id]);
  const renameFile = row => onRename(row.id, row.fileName); // In real app, you'd prompt for new name
  const deleteFile = row => onDelete([row.id]);

  const downloadSelectedFiles = () => {
    onDownload(selectedRows);
  };

  const deleteSelectedFiles = () => {
    if (confirm(`Are you sure you want to delete ${selectedRows.length} selected file(s)?`)) {
      onDelete(selectedRows);
      // Update local state after deletion
      setData(prevData => prevData.filter(item => !selectedRows.includes(item.id)));
      setSelectedRows([]);
    }
  };

  // Dropdown menu
    const DropdownMenu = ({ row }) =>
    createPortal(
      <div
        className="fixed bg-white shadow-2xl rounded-md z-[1000] border border-gray-200 w-60 menu-dropdown"
        style={{ 
          top: menuPosition.top, 
          left: isMobile ? '50%' : menuPosition.left,
          transform: isMobile ? 'translateX(-50%)' : 'none'
        }}
      >
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
          onClick={() => viewFile(row)}
        >
          <Eye className="mr-2" size={16} /> View
        </button>
        <hr />
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
          onClick={() => downloadFile(row)}
        >
          <Download className="mr-2" size={16} /> Download
        </button>
        <hr />
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
          onClick={() => renameFile(row)}
        >
          <FileEdit className="mr-2" size={16} /> Change name
        </button>
        <hr />
        <button
          className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 flex items-center"
          onClick={() => deleteFile(row)}
        >
          <Trash2 className="mr-2" size={16} /> Delete
        </button>
      </div>,
      document.body
    );

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

  // Custom cell components
  const FileNameCell = ({ row }) => (
    <div className="flex flex-col">
      <span className="font-medium">{row.fileName}</span>
    </div>
  );

  const LastUpdatedCell = ({ row }) => (
    <span className="text-gray-600">{row.lastUpdated}</span>
  );

  const SizeCell = ({ row }) => (
    <span className="text-gray-600">{row.size}</span>
  );

  const columns = isMobile ? [
    {
      name: (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={
            selectedRows.length === filteredData.length &&
            filteredData.length > 0
          }
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
      ),
      cell: row => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row.id)}
          onChange={() => handleRowSelect(row.id)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
      ),
      width: "50px"
    },
    { 
      name: "File's Name", 
      selector: row => row.fileName,
      cell: row => <FileNameCell row={row} />,
      sortable: true,
      grow: 2,
      minWidth: "200px",
    },
    {
      name: "",
      width: "50px",
      cell: row => (
        <div ref={el => (menuButtonRefs.current[row.id] = el)}>
          <div
            className={`cursor-pointer p-1 rounded-full ${
              menuOpen === row.id ? "bg-gray-200" : ""
            }`}
            onClick={e => toggleMenu(row.id, e)}
          >
            <MoreVertical size={16} className="text-gray-400" />
          </div>
          {menuOpen === row.id && <DropdownMenu row={row} />}
        </div>
      ),
    },
  ] : [
    {
      name: (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={
            selectedRows.length === filteredData.length &&
            filteredData.length > 0
          }
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
      ),
      cell: row => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row.id)}
          onChange={() => handleRowSelect(row.id)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
      ),
      width: "50px"
    },
    { 
      name: "File's Name", 
      selector: row => row.fileName,
      cell: row => <FileNameCell row={row} />,
      sortable: true,
      grow: 2,
      minWidth: "200px",
    },
    { 
      name: "Last Updated", 
      selector: row => row.lastUpdated,
      cell: row => <LastUpdatedCell row={row} />,
      sortable: true,
      grow: 1,
      minWidth: "150px",
    },
    { 
      name: "Size", 
      selector: row => row.size,
      cell: row => <SizeCell row={row} />,
      sortable: true,
      grow: 1,
      minWidth: "100px",
    },
    {
      name: "",
      width: "50px",
      cell: row => (
        <div ref={el => (menuButtonRefs.current[row.id] = el)}>
          <div
            className={`cursor-pointer p-1 rounded-full ${
              menuOpen === row.id ? "bg-gray-200" : ""
            }`}
            onClick={e => toggleMenu(row.id, e)}
          >
            <MoreVertical size={16} className="text-gray-400" />
          </div>
          {menuOpen === row.id && <DropdownMenu row={row} />}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full border-1 border-gray-300 font-outfit">
      {/* Show the date filter modal when needed */}
      {showDatePicker && <DateFilterModal />}
      
      {/* Desktop Header */}
      <div className="hidden md:flex px-6 py-4 items-center justify-between border-t border-b border-gray-300">
        <div className="flex space-x-3 items-center">
          <div className="relative ">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-64 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="flex space-x-3">
          {selectedRows.length > 0 && (
            <button
              onClick={downloadSelectedFiles}
              className="px-4 py-2 border border-gray-300 bg-white text-sm rounded-lg hover:bg-gray-100"
            >
              Download
            </button>
          )}
          <button
            onClick={() => onScanClick(handleAddFile)}
            className="px-4 py-2 bg-[#0060B4] text-white text-sm rounded-lg hover:bg-blue-700"
          >
            {addButtonText}
          </button>
        </div>
      </div>
      
      {/* Mobile Header */}
      {showMobileView && (
        <div className="md:hidden px-4 py-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 min-w-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center border border-gray-300 rounded-md px-3 py-1 ${selectedDate ? "bg-blue-600 text-white" : "bg-gray-200"} h-[31px] cursor-pointer`}
            >
              {getDateLabel()}
              <Calendar size={14} className="ml-2" />
            </button>
            <button
              onClick={() => onScanClick(handleAddFile)}
              className="shrink-0 px-3 py-2 bg-[#0060B4] text-white text-sm rounded-lg whitespace-nowrap"
            >
              {mobileAddButtonText}
            </button>
          </div>
          {selectedRows.length > 0 && (
            <button
              onClick={downloadSelectedFiles}
              className="mt-2 w-full py-1.5 border border-gray-300 bg-white text-sm rounded-lg hover:bg-gray-100"
            >
              Download Selected
            </button>
          )}
        </div>
      )}

      {/* DataTable */}
      <div className="w-full max-w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredData}
          highlightOnHover
          progressPending={loading}
          responsive
          noHeader
          fixedHeader
          fixedHeaderScrollHeight={isMobile ? "calc(100vh - 220px)" : "calc(100vh - 200px)"}
          conditionalRowStyles={[
            {
              when: row => row.id === firstVisibleRowId,
              style: {
                borderTopLeftRadius: windowSize.width < 768 ? "0px" : '40px',
                borderTopRightRadius: windowSize.width < 768 ? "0px" : '40px',
              },
            },
          ]}
          customStyles={{
            table: {
              style: {
                minWidth: '100%',
                marginTop: "0px",
                backgroundColor: "#f3f4f6",
                padding: windowSize.width < 768 ? "0px 0px" : "0px 8px",
                fontFamily: "outfit",
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
