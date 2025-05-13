import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { Search, MoreVertical, Filter, X, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import Link from "next/link";

export default function StaffTable({
  role = "admin",
  // Data props
  technicians = [],
  loading = false,
  // Handler props
  onStatusChange = async (ids, status) => console.log("Status change:", ids, status),
  onView = async (id) => console.log("View staff:", id),
  onEdit = async (id) => console.log("Edit staff:", id),
  onRefresh = () => console.log("Refreshing data"),
  // Optional customization props
  addStaffLink = "/admin/add-technical-staff",
  departmentOptions = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Customer Support"],
  availabilityOptions = ["Available", "Not available", "Desactivated"]
}) {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [filterAvailability, setFilterAvailability] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const menuButtonRefs = useRef({});
  const [firstVisibleRowId, setFirstVisibleRowId] = useState(null);
  const [tableHeight, setTableHeight] = useState("calc(100vh - 180px)");
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0);
  
  // Dropdown states for filter menus
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showAvailabilityDropdown, setShowAvailabilityDropdown] = useState(false);
  
  // Refs for filter dropdowns
  const departmentDropdownRef = useRef(null);
  const availabilityDropdownRef = useRef(null);
  const departmentButtonRef = useRef(null);
  const availabilityButtonRef = useRef(null);
  
  // Status modal state and ref
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const statusButtonRef = useRef(null);
  
  // Initialize window width
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      
      window.addEventListener("resize", handleResize);
      handleResize();
      
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);
  
  // Update table height when filters are shown/hidden on mobile
  useEffect(() => {
    if (windowWidth < 768) {
      const filterHeight = showFilters ? 150 : 0; // Approximate height of filter section when expanded
      setTableHeight(`calc(100vh - 180px - ${filterHeight}px)`);
    } else {
      setTableHeight("calc(100vh - 180px)");
    }
  }, [showFilters, windowWidth]);

  // Initialize data from props
  useEffect(() => {
    setData(technicians);
    setFilteredData(technicians);
  }, [technicians]);

  // Update the firstVisibleRowId whenever filteredData changes
  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      setFirstVisibleRowId(filteredData[0].id);
    } else {
      setFirstVisibleRowId(null);
    }
  }, [filteredData]);

  // Apply filters
  useEffect(() => {
    let result = data;

    // Filter by department (single selection)
    if (filterDepartment) {
      result = result.filter((user) => user.department === filterDepartment);
    }

    // Filter by availability (single selection)
    if (filterAvailability) {
      result = result.filter((user) => user.availability === filterAvailability);
    }

    if (search) {
      result = result.filter((user) =>
        Object.values(user).some((value) =>
          value !== null && value.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    setFilteredData(result);
  }, [search, filterDepartment, filterAvailability, data]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close menu dropdown
      if (menuOpen && !event.target.closest(".menu-dropdown")) {
        setMenuOpen(null);
      }
      
      // Close status modal
      if (statusModalOpen && !event.target.closest(".status-modal")) {
        setStatusModalOpen(false);
      }
      
      // Close department dropdown
      if (showDepartmentDropdown && 
          !departmentDropdownRef.current?.contains(event.target) && 
          !departmentButtonRef.current?.contains(event.target)) {
        setShowDepartmentDropdown(false);
      }
      
      // Close availability dropdown
      if (showAvailabilityDropdown && 
          !availabilityDropdownRef.current?.contains(event.target) && 
          !availabilityButtonRef.current?.contains(event.target)) {
        setShowAvailabilityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, statusModalOpen, showDepartmentDropdown, showAvailabilityDropdown]);

  // Row selection handling
  const handleRowSelect = (id) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((rowId) => rowId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedRows(
      selectedRows.length === filteredData.length
        ? []
        : filteredData.map((row) => row.id)
    );
  };

  // Clear selection of rows
  const clearSelection = () => {
    setSelectedRows([]);
  };

  // Toggle menu
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
      const dropdownWidth = 240; // Width of the dropdown menu

      // Position the dropdown based on available space
      if (windowWidth < 768) {
        // On mobile screens, position menu below or above the button
        if (spaceBelow < 150) {
          // Not enough space below, position above
          setMenuPosition({
            top: rect.top - 120, // Height of dropdown
            left: Math.max(10, rect.left - (dropdownWidth / 2) + 15), // Center aligned but not off screen
          });
        } else {
          // Enough space below, position below
          setMenuPosition({
            top: rect.bottom + 5,
            left: Math.max(10, rect.left - (dropdownWidth / 2) + 15), // Center aligned but not off screen
          });
        }
      } else {
        // On desktop screens, position to the left or right
        if (spaceRight < dropdownWidth + 20) {
          // Not enough space on right, position to left
          setMenuPosition({
            top: rect.top,
            left: rect.left - dropdownWidth - 10,
          });
        } else {
          // Enough space on right, position to right
          setMenuPosition({
            top: rect.top,
            left: rect.right + 10,
          });
        }
      }
    }

    setMenuOpen(id);
  };

  // Get status dot color based on availability
  const getStatusDotColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-500";
      case "Not available":
        return "bg-red-500";
      case "Desactivated":
        return "bg-gray-500";
      default:
        return "bg-gray-300";
    }
  };

  // Handle account activation/deactivation
  const handleAccountStatus = async (status) => {
    try {
      await onStatusChange(selectedRows, status);
      
      setData(prevData => 
        prevData.map(user => {
          if (selectedRows.includes(user.id)) {
            return { ...user, availability: status };
          }
          return user;
        })
      );
      
      setStatusModalOpen(false);
      setSelectedRows([]);
    } catch (error) {
      console.error("Error changing status:", error);
      alert("Failed to update account status");
    }
  };

  // Toggle department filter - single selection
  const toggleDepartmentFilter = (department) => {
    setFilterDepartment(prev => prev === department ? null : department);
    setShowDepartmentDropdown(false);
  };

  // Toggle availability filter - single selection
  const toggleAvailabilityFilter = (availability) => {
    setFilterAvailability(prev => prev === availability ? null : availability);
    setShowAvailabilityDropdown(false);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterDepartment(null);
    setFilterAvailability(null);
    setShowDepartmentDropdown(false);
    setShowAvailabilityDropdown(false);
  };
  
  // Dropdown menu component
  const DropdownMenu = ({ row }) => {
    // Actions common to both roles
    const handleViewClick = (e) => {
      e.stopPropagation();
      onView(row.id);
    };
    
    // Technician-only menu
    if (role === "technician") {
      return createPortal(
        <div
          className="fixed bg-white shadow-2xl rounded-md z-50 border border-gray-200 w-48 menu-dropdown font-outfit"
          style={{
            top: windowWidth < 768 ? `${menuPosition.top}px` : `${menuPosition.top}px`,
            left: windowWidth < 768 ? `${menuPosition.left}px` : `${menuPosition.left}px`,
            transform: windowWidth < 768 ? 'translateX(-50%)' : 'none',
          }}
        >
          <button
            onClick={handleViewClick}
            className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm font-outfit"
          >
            Show Details
          </button>
        </div>,
        document.body
      );
    }

    // Admin menu
    const handleEditClick = (e) => {
      e.stopPropagation();
      onEdit(row.id);
    };

    const handleStatusChange = async (e) => {
      e.stopPropagation();
      const newStatus = row.availability === "Desactivated" ? "Available" : "Desactivated";
      try {
        await onStatusChange([row.id], newStatus);
        setData(prevData =>
          prevData.map(user => {
            if (user.id === row.id) {
              return { ...user, availability: newStatus };
            }
            return user;
          })
        );
        setMenuOpen(null);
      } catch (error) {
        console.error("Error changing status:", error);
        alert("Failed to update account status");
      }
    };

    return createPortal(
      <div
        className="fixed bg-white shadow-2xl rounded-md z-50 border border-gray-200 w-48 menu-dropdown font-outfit"
        style={{
          top: windowWidth < 768 ? `${menuPosition.top}px` : `${menuPosition.top}px`,
          left: windowWidth < 768 ? `${menuPosition.left}px` : `${menuPosition.left}px`,
          transform: windowWidth < 768 ? 'translateX(-50%)' : 'none',
        }}
      >
        <button
          onClick={handleViewClick}
          className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm font-outfit"
        >
          Show Details
        </button>
        <hr />
        <button
          onClick={handleEditClick}
          className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm font-outfit"
        >
          Edit
        </button>
        <hr />
        <button
          className="w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100 text-sm font-outfit"
          onClick={handleStatusChange}
        >
          {row.availability === "Desactivated" ? "Activate" : "Deactivate"}
        </button>
      </div>,
      document.body
    );
  };

  // Column definitions based on screen size
  const getResponsiveColumns = () => {
    // Define baseColumns only once
    const baseColumns = [
      {
        name: (
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={
              selectedRows.length === filteredData.length &&
              filteredData.length > 0
            }
            aria-label="Select all rows"
            className="font-outfit"
          />
        ),
        cell: (row) => (
          <input
            type="checkbox"
            checked={selectedRows.includes(row.id)}
            onChange={() => handleRowSelect(row.id)}
            aria-label={`Select ${row.firstName} ${row.lastName}`}
            className="font-outfit" 
          />
        ),
        width: "50px", 
        sortable: false,
      },
      {
        name: "Profile",
        selector: (row) =>
          row.profile ? (
            <img
              src={row.profile}
              alt={`${row.firstName} ${row.lastName}`}
              className="w-5 h-5 md:w-10 md:h-10 rounded-full"
            />
          ) : (
            <div className="w-5 h-5 md:w-10 md:h-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-xs font-outfit">N/A</span>
            </div>
          ),
        width: "70px",
        sortable: false,
      },
      {
        name: "Availability",
        selector: (row) => (
          <div className="flex items-center font-outfit">
            <div className={`w-3 h-3 rounded-full mr-2 ${getStatusDotColor(row.availability)}`}></div>
            <span className="hidden sm:inline">{row.availability}</span>
          </div>
        ),
        sortable: true,
        width: "120px",
      },
    ];

    // For extra small screens (mobile)
    if (windowWidth < 640) {
      return [
        {
          name: '',
          cell: (row) => (
            <div className="w-full py-2 font-outfit">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => handleRowSelect(row.id)}
                    className="w-4 h-4 mt-1 font-outfit"
                  />
                  {row.profile ? (
                    <img
                      src={row.profile}
                      alt={`${row.firstName} ${row.lastName}`}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-outfit">N/A</span>
                    </div>
                  )}
                </div>
  
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-medium text-sm font-outfit">
                        {row.firstName} {row.lastName}
                      </p>
                      <p className="text-gray-500 text-xs font-outfit">{row.department}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${getStatusDotColor(row.availability)}`} />
                        <span className="text-xs font-outfit">{row.availability}</span>
                      </div>
                      <div
                        ref={(el) => (menuButtonRefs.current[row.id] = el)}
                        className={`cursor-pointer p-1 rounded-full ${
                          menuOpen === row.id ? "bg-[#C9C9C9] opacity-85" : ""
                        }`}
                        onClick={(e) => toggleMenu(row.id, e)}
                      >
                        <MoreVertical size={16} />
                      </div>
                      {menuOpen === row.id && <DropdownMenu row={row} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-outfit">
                    <span>{row.email}</span>
                    <span>•</span>
                    <span>{row.phoneNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          ),
          width: 'auto',
          grow: 1,
        },
      ];
    }
    
    // For small screens
    if (windowWidth < 768) {
      return [
        ...baseColumns,
        { 
          name: "Last Name", 
          selector: (row) => <span className="font-outfit">{row.lastName}</span>, 
          sortable: true, 
          width: "auto" 
        },
        { 
          name: "First Name", 
          selector: (row) => <span className="font-outfit">{row.firstName}</span>, 
          sortable: true, 
          width: "auto" 
        },
        { 
          name: "Department", 
          selector: (row) => <span className="font-outfit">{row.department}</span>, 
          width: "auto" 
        },
        {
          name: "",
          cell: (row) => (
            <div className="p-1 rounded-full">
              <div
                ref={(el) => (menuButtonRefs.current[row.id] = el)}
                className={`cursor-pointer p-1 rounded-full ${
                  menuOpen === row.id ? "bg-[#C9C9C9] opacity-85" : ""
                }`}
                onClick={(e) => toggleMenu(row.id, e)}
                aria-label="More options"
              >
                <MoreVertical size={20} />
              </div>
              {menuOpen === row.id && <DropdownMenu row={row} />}
            </div>
          ),
          width: "50px",
          sortable: false,
        },
      ];
    }
    
    // For medium screens
    if (windowWidth < 1024) {
      return [
        ...baseColumns,
        { 
          name: "Last Name", 
          selector: (row) => <span className="font-outfit">{row.lastName}</span>, 
          sortable: true,
          width: "auto" 
        },
        { 
          name: "First Name", 
          selector: (row) => <span className="font-outfit">{row.firstName}</span>, 
          sortable: true,
          width: "auto" 
        },
        { 
          name: "Email", 
          selector: (row) => <span className="font-outfit">{row.email}</span>,
          width: "auto" 
        },
        { 
          name: "Department", 
          selector: (row) => <span className="font-outfit">{row.department}</span>,
          width: "auto" 
        },
        {
          name: "",
          cell: (row) => (
            <div className="p-2 rounded-full">
              <div
                ref={(el) => (menuButtonRefs.current[row.id] = el)}
                className={`cursor-pointer p-1 rounded-full ${
                  menuOpen === row.id ? "bg-[#C9C9C9] opacity-85" : ""
                }`}
                onClick={(e) => toggleMenu(row.id, e)}
                aria-label="More options"
              >
                <MoreVertical />
              </div>
              {menuOpen === row.id && <DropdownMenu row={row} />}
            </div>
          ),
          width: "60px",
          sortable: false,
        },
      ];
    }
    
    // For large screens - show all columns
    return [
      ...baseColumns,
      { 
        name: "Last Name", 
        selector: (row) => <span className="font-outfit">{row.lastName}</span>, 
        sortable: true,
        width: "auto" 
      },
      { 
        name: "First Name", 
        selector: (row) => <span className="font-outfit">{row.firstName}</span>, 
        sortable: true,
        width: "auto" 
      },
      { 
        name: "Email", 
        selector: (row) => <span className="font-outfit">{row.email}</span>,
        width: "auto" 
      },
      { 
        name: "Phone Number", 
        selector: (row) => <span className="font-outfit">{row.phoneNumber}</span>,
        width: "auto" 
      },
      { 
        name: "Department", 
        selector: (row) => <span className="font-outfit">{row.department}</span>,
        width: "auto" 
      },
      {
        name: "",
        cell: (row) => (
          <div className="p-2 rounded-full">
            <div
              ref={(el) => (menuButtonRefs.current[row.id] = el)}
              className={`cursor-pointer p-1 rounded-full ${
                menuOpen === row.id ? "bg-[#C9C9C9] opacity-85" : ""
              }`}
              onClick={(e) => toggleMenu(row.id, e)}
              aria-label="More options"
            >
              <MoreVertical />
            </div>
            {menuOpen === row.id && <DropdownMenu row={row} />}
          </div>
        ),
        width: "60px",
        sortable: false,
      },
    ];
  };

  return (
    <div className="w-full flex flex-col h-screen font-outfit">
      {/* Filters and Search - Fixed at top with UPDATED DROPDOWN FILTER DESIGN */}
      <div className="px-2 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 py-3 sm:h-[74px] w-full border-t border-b border-gray-300 bg-gray-100 sticky top-0 z-30 font-outfit">
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">
          {/* Search input */}
          <div className="relative w-full sm:w-[285px]">
            <Search className="absolute mb-0.5 right-2 bottom-[8px] sm:bottom-[3px] w-[20px]" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 sm:p-4 rounded-[10px] h-[40px] sm:h-[31px] w-full sm:w-[285px] outline-none bg-white font-outfit"
            />
          </div>
          
          {/* Filters toggle for mobile */}
          <div className="sm:hidden flex justify-between w-full">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-gray-200 px-3 py-2 rounded-[7px] font-outfit"
            >
              <Filter size={16} />
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>
            
            {role !== "technician" && addStaffLink && (
              <Link href={addStaffLink}>
                <button 
                  className="bg-[#0060B4] text-white px-3 py-2 rounded-[10px] h-[40px] flex items-center justify-center gap-1 font-outfit"
                >
                  <span className="text-[18px]">+</span>
                  <span>Add Staff</span>
                </button>
              </Link>
            )}
          </div>

          {/* UPDATED: Filter dropdowns section */}
          <div className={`flex flex-col sm:flex-row gap-2 w-full sm:w-auto ${showFilters ? "flex" : "hidden sm:flex"}`}>
            {/* All filters reset button */}
            <button
              onClick={clearAllFilters}
              className={`flex items-center justify-center px-3 py-1 rounded-md ${
                !filterDepartment && !filterAvailability ? "bg-black text-white" : "bg-gray-200"
              } h-8 cursor-pointer`}
            >
              All
            </button>

            {/* Department dropdown */}
            <div className="relative">
              <button
                ref={departmentButtonRef}
                onClick={() => {
                  setShowDepartmentDropdown(!showDepartmentDropdown);
                  setShowAvailabilityDropdown(false);
                }}
                className={`flex items-center justify-between gap-2 px-3 py-1 rounded-md ${
                  filterDepartment ? "bg-black text-white" : "bg-gray-200"
                } h-8 cursor-pointer min-w-[120px]`}
              >
                <span>{filterDepartment || "Department"}</span>
                <ChevronDown size={16} />
              </button>
              
              {showDepartmentDropdown && (
                <div 
                  ref={departmentDropdownRef}
                  className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md z-40 border border-gray-200 w-48"
                >
                  <div className="max-h-48 overflow-y-auto py-1">
                    {departmentOptions.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => toggleDepartmentFilter(dept)}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          filterDepartment === dept 
                            ? "bg-gray-100 font-medium" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Availability dropdown */}
            <div className="relative">
              <button
                ref={availabilityButtonRef}
                onClick={() => {
                  setShowAvailabilityDropdown(!showAvailabilityDropdown);
                  setShowDepartmentDropdown(false);
                }}
                className={`flex items-center justify-between gap-2 px-3 py-1 rounded-md ${
                  filterAvailability ? "bg-black text-white" : "bg-gray-200"
                } h-8 cursor-pointer min-w-[120px]`}
              >
                <span>{filterAvailability || "Availability"}</span>
                <ChevronDown size={16} />
              </button>
              
              {showAvailabilityDropdown && (
                <div 
                  ref={availabilityDropdownRef}
                  className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md z-40 border border-gray-200 w-48"
                >
                  <div className="max-h-48 overflow-y-auto py-1">
                    {availabilityOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => toggleAvailabilityFilter(option)}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          filterAvailability === option 
                            ? "bg-gray-100 font-medium" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Staff Button (Desktop only) */} 
        {role !== "technician" && addStaffLink && (
          <Link href={addStaffLink}>
            <button className="hidden sm:flex bg-[#0060B4] text-white p-3 rounded-[15px] h-[31px] w-[120px] items-center justify-around font-outfit font-normal cursor-pointer whitespace-nowrap">
              <span className="text-[20px]">+</span> <span>Add Staff</span>
            </button>
          </Link>
        )}

    
      </div>

      {/* Table Container with fixed height and scrollable */}
      <div className="table-container flex-1 w-full relative overflow-hidden">
        {selectedRows.length > 0 && (
          <>
            {/* Action bar with updated styling */}
            <div className={`bg-gray-100 z-40 border-b border-gray-200 ${
              windowWidth < 768 ? "sticky top-0 py-3 px-4" : "h-[45px] absolute top-0 left-8 right-0 flex items-center px-4"
            } font-outfit`}>
              {windowWidth < 768 ? (
                <div className="flex items-center justify-between text-sm font-outfit">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">{selectedRows.length} selected</span>
                    <button 
                      onClick={clearSelection} 
                      className="flex items-center justify-center p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={clearSelection}
                      className="text-gray-600 font-outfit"
                    >
                      Cancel
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      ref={statusButtonRef}
                      onClick={() => setStatusModalOpen(true)}
                      className="text-gray-600 font-outfit"
                    >
                      Set Status
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <button
                    ref={statusButtonRef}
                    onClick={() => setStatusModalOpen(true)}
                    className="cursor-pointer hover:text-gray-900 status-button flex items-center gap-1 text-[#757575] font-outfit"
                  >
                    <span>Set Status</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Status Modal with blurred background */}
        {statusModalOpen &&
          createPortal(
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-[9999] font-outfit">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 status-modal font-outfit">
                <h2 className="text-lg font-semibold mb-4 font-outfit">Change Status</h2>
                <div className="space-y-1 font-outfit">
                  <button
                    onClick={() => handleAccountStatus("Available")}
                    className="w-full p-3 text-left hover:bg-gray-100 rounded border-gray-100 font-outfit"
                  >
                    Available
                  </button>
                  <button
                    onClick={() => handleAccountStatus("Not available")}
                    className="w-full p-3 text-left hover:bg-gray-100 rounded border-gray-100 font-outfit"
                  >
                    Not available
                  </button>
                  <button
                    onClick={() => handleAccountStatus("Desactivated")}
                    className="w-full p-3 text-left hover:bg-gray-100 rounded border-gray-100 font-outfit"
                  >
                    Desactivated
                  </button>
                </div>
                <div className="w-full flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setStatusModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-outfit"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Scrollable data table */}
        <div style={{ height: tableHeight, overflow: 'auto' }}>
          <DataTable
            columns={getResponsiveColumns()}
            data={filteredData}
            conditionalRowStyles={[
              {
                when: row => row.id === firstVisibleRowId,
                style: {
                  borderTopLeftRadius: windowWidth < 768 ? "0px" : '40px',
                  borderTopRightRadius: windowWidth < 768 ? "0px" : '40px',
                },
              },
            ]}
            progressPending={loading}
            noHeader
            dense={windowWidth < 768}
            responsive
            className="w-full font-outfit"
            fixedHeader
            fixedHeaderScrollHeight={tableHeight}
            noDataComponent={
              <div className="p-8 text-center font-outfit text-gray-500">
                {loading ? "Loading..." : "No staff members found"}
              </div>
            }
            customStyles={{ 
              table: {
                style: {
                  minWidth: '100%',
                  marginTop: "0px",
                  backgroundColor: "#f3f4f6", 
                  fontFamily: "outfit",
                },
              },
              tableWrapper: {
                style: {
                  width: '100%',
                  display: 'block',
                  paddingBottom: selectedRows.length > 0 && windowWidth < 768 ? "50px" : "0",
                  fontFamily: "outfit",
                },
              },
              responsiveWrapper: {
                style: {
                  width: '100%',
                  minWidth: '100%',
                  fontFamily: "outfit",
                },
              },
              headRow: {
                style: {
                  minHeight: windowWidth < 768 ? "10px" : "30px",
                  paddingLeft: windowWidth < 768 ? '5px': "0px",
                  fontSize: windowWidth < 768 ? "0.85rem" : "1rem",
                  width: '100%',
                  border: "none",
                  position: 'sticky',
                  top: '0px',
                  zIndex: 10,
                  backgroundColor: "#f3f4f6",
                  display: windowWidth < 768 ? 'none' : 'flex',
                  fontFamily: "outfit",
                },
              },
              headCells: {
                style: {
                  backgroundColor: "#f3f4f6",
                  fontFamily: "outfit",
                  color: "#757575",
                  height: windowWidth < 768 ? "40px" : "50px",
                  padding: windowWidth < 768 ? "0px 5px" : "0px 10px",
                  fontSize: windowWidth < 768 ? "0.75rem" : "0.875rem",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  position: 'sticky',
                  top: '0px',
                  zIndex: 10,
                },
              },
              rows: {
                style: {
                  backgroundColor: 'white',
                  minHeight: windowWidth < 768 ? "70px" : 'auto',
                  height: windowWidth < 640 ? "100px" : '70px',
                  padding: windowWidth < 768 ? "8px 16px" : "0px",
                  marginBottom: "0",
                  '&:not(:last-of-type)': {
                    borderBottom: '1px solid #E5E7EB',
                  },
                  fontFamily: "outfit",
                },
              },
              cells: {
                style: {
                  padding: windowWidth < 768 ? "4px 8px" : "0px 10px",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "outfit",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 

//add staff