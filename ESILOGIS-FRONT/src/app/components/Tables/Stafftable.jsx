import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { Search, MoreVertical, Filter } from "lucide-react";
import { createPortal } from "react-dom";
import Link from "next/link";

export default function StaffTable() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDepartments, setFilterDepartments] = useState([]); // Changed to array for multiple selection
  const [filterAvailability, setFilterAvailability] = useState([]); 
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const menuButtonRefs = useRef({});
  const windowSize = useWindowSize();
  const [firstVisibleRowId, setFirstVisibleRowId] = useState(null);

// Add this effect to update the firstVisibleRowId whenever filteredData changes
useEffect(() => {
  if (filteredData && filteredData.length > 0) {
    setFirstVisibleRowId(filteredData[0].id);
  } else {
    setFirstVisibleRowId(null);
  }
}, [filteredData]);

  function useWindowSize() {
    const [windowSize, setWindowSize] = useState({
      width: typeof window !== "undefined" ? window.innerWidth : 0,
      height: typeof window !== "undefined" ? window.innerHeight : 0,
    });

    useEffect(() => {
      // Handler to call on window resize
      function handleResize() {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }

      // Add event listener
      window.addEventListener("resize", handleResize);
      
      // Call handler right away so state gets updated with initial window size
      handleResize();
      
      // Remove event listener on cleanup
      return () => window.removeEventListener("resize", handleResize);
    }, []); // Empty array ensures that effect is only run on mount and unmount

    return windowSize;
  }

  // Mock data to replace API fetch
  const mockTechnicians = [
    {
      id: 1,
      profile: "",
      lastName: "Smith",
      firstName: "John",
      email: "john.smith@example.com",
      phoneNumber: "+1 555-123-4567",
      department: "Engineering",
      availability: "Available"
    },
    {
      id: 2,
      profile: "https://randomuser.me/api/portraits/men/32.jpg",
      lastName: "Johnson",
      firstName: "Emily",
      email: "emily.johnson@example.com",
      phoneNumber: "+1 555-234-5678",
      department: "Customer Support",
      availability: "Not available"
    },
    {
      id: 3,
      profile: "https://randomuser.me/api/portraits/women/45.jpg",
      lastName: "Williams",
      firstName: "Michael",
      email: "michael.williams@example.com",
      phoneNumber: "+1 555-345-6789",
      department: "Engineering",
      availability: "Available"
    },
    {
      id: 4,
      profile: "",
      lastName: "Brown",
      firstName: "Sarah",
      email: "sarah.brown@example.com",
      phoneNumber: "+1 555-456-7890",
      department: "HR",
      availability: "Desactivated"
    },
    {
      id: 5,
      profile: "https://randomuser.me/api/portraits/men/67.jpg",
      lastName: "Davis",
      firstName: "David",
      email: "david.davis@example.com",
      phoneNumber: "+1 555-567-8901",
      department: "Finance",
      availability: "Available"
    },
    {
      id: 6,
      profile: "",
      lastName: "Miller",
      firstName: "Jessica",
      email: "jessica.miller@example.com",
      phoneNumber: "+1 555-678-9012",
      department: "Marketing",
      availability: "Not available"
    },
    {
      id: 7,
      profile: "https://randomuser.me/api/portraits/women/22.jpg",
      lastName: "Wilson",
      firstName: "James",
      email: "james.wilson@example.com",
      phoneNumber: "+1 555-789-0123",
      department: "Sales",
      availability: "Available"
    },
    {
      id: 8,
      profile: "",
      lastName: "Taylor",
      firstName: "Lisa",
      email: "lisa.taylor@example.com",
      phoneNumber: "+1 555-890-1234",
      department: "Engineering",
      availability: "Desactivated"
    },
    {
      id: 9,
      profile: "https://randomuser.me/api/portraits/men/55.jpg",
      lastName: "Anderson",
      firstName: "Robert",
      email: "robert.anderson@example.com",
      phoneNumber: "+1 555-901-2345",
      department: "Customer Support",
      availability: "Available"
    },
    {
      id: 10,
      profile: "",
      lastName: "Thomas",
      firstName: "Jennifer",
      email: "jennifer.thomas@example.com",
      phoneNumber: "+1 555-012-3456",
      department: "Marketing",
      availability: "Not available"
    }
  ];

  useEffect(() => {
    // Simulate API call with mock data
    const fetchData = async () => {
      try {
        // Simulate network delay
        setTimeout(() => {
          const formattedData = mockTechnicians.map((user) => ({
            id: user.id,
            profile: user.profile && user.profile.trim() !== "" ? user.profile : null,
            lastName: user.lastName || "N/A",
            firstName: user.firstName || "N/A",
            email: user.email || "N/A",
            phoneNumber: user.phoneNumber || "N/A",
            department: user.department || "N/A",
            availability: user.availability || "N/A",
          }));

          setData(formattedData);
          setFilteredData(formattedData);
          setLoading(false);
        }, 800); // Simulate 800ms delay for API call
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    // Call the mock data function instead of the original fetch
    fetchData();
  }, []);

  useEffect(() => {
    let result = data;

    // Filter by departments (multiple selection)
    if (filterDepartments.length > 0) {
      result = result.filter((user) =>
        filterDepartments.includes(user.department)
      );
    }

    // Filter by availability (multiple selection)
    if (filterAvailability.length > 0) {
      result = result.filter((user) =>
        filterAvailability.includes(user.availability)
      );
    }

    if (search) {
      result = result.filter((user) =>
        Object.values(user).some((value) =>
          value !== null && value.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    setFilteredData(result);
  }, [search, filterDepartments, filterAvailability, data]);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest(".menu-dropdown")) {
        setMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

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
      if (windowSize.width < 768) {
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

  // Check if any selected rows contain deactivated accounts
  const checkSelectedRowsAvailability = () => {
    // Get the full row data for selected rows
    const selectedRowsData = data.filter(row => selectedRows.includes(row.id));
    
    // Check if any of the selected rows are deactivated
    const hasDeactivated = selectedRowsData.some(row => row.availability === "Desactivated");
    
    // Check if all selected rows are activated (Available or Not available)
    const allActivated = selectedRowsData.every(row => 
      row.availability === "Available" || row.availability === "Not available"
    );
    
    return { hasDeactivated, allActivated };
  };

  // Handle account activation/deactivation
  const handleAccountStatus = () => {
    const { hasDeactivated } = checkSelectedRowsAvailability();
    if (hasDeactivated) {
      alert("Activating selected accounts");
      // Logic to activate accounts would go here
    } else {
      alert("Deactivating selected accounts");
      // Logic to deactivate accounts would go here
    }
  };

  // Toggle department filter - using the same logic as availability filter
  const toggleDepartmentFilter = (department) => {
    setFilterDepartments(prev => {
      if (prev.includes(department)) {
        return prev.filter(item => item !== department);
      } else {
        return [...prev, department];
      }
    });
  };

  // Toggle availability filter
  const toggleAvailabilityFilter = (availability) => {
    setFilterAvailability(prev => {
      if (prev.includes(availability)) {
        return prev.filter(item => item !== availability);
      } else {
        return [...prev, availability];
      }
    });
  };

  const clearAllFilters = () => {
    setFilterDepartments([]);
    setFilterAvailability([]);
  };

  // Component for the dropdown menu
  const DropdownMenu = ({ row }) => {
    return createPortal(
      <div
        className="fixed bg-white shadow-2xl rounded-md z-40 border border-gray-200 w-60 menu-dropdown"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
      > 
      <Link href="./../../admin/worker-detail">
      <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
        >
          Show Details
        </button>
      </Link>
        <hr /> 
        <Link href="./../../admin/edit-worker-detail">
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
        >
          Edit
        </button>
        </Link>
        <hr />
        <button
          className={`w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100`}
        >
          {row.availability === "Desactivated" ? "Activate" : "Deactivate"}
        </button>
      </div>,
      document.body
    );
  };

  // Determine which columns to show based on screen size
  const getResponsiveColumns = () => {
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
          />
        ),
        cell: (row) => (
          <input
            type="checkbox"
            checked={selectedRows.includes(row.id)}
            onChange={() => handleRowSelect(row.id)}
            aria-label={`Select ${row.firstName} ${row.lastName}`} 
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
              <span className="text-gray-500 text-xs">N/A</span>
            </div>
          ),
        width: "70px",
        sortable: false,
      },
      {
        name: "Availability",
        selector: (row) => (
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${getStatusDotColor(row.availability)}`}></div>
            <span className="hidden sm:inline">{row.availability}</span>
          </div>
        ),
        sortable: true,
        width: "120px",
      },
    ];

    // For extra small screens (mobile)
    if (windowSize.width < 640) {
      return [
        {
          name: "",
          selector: (row) => (
            <div className="flex w-full py-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(row.id)}
                  onChange={() => handleRowSelect(row.id)}
                  className="w-4 h-4"
                />
                {row.profile ? (
                  <img
                    src={row.profile}
                    alt={`${row.firstName} ${row.lastName}`}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">N/A</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 ml-3">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {row.firstName} {row.lastName}
                    </span>
                    <span className="text-gray-500 text-xs">{row.department}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-1.5 ${getStatusDotColor(row.availability)}`} />
                      <span className="text-xs text-gray-600">{row.availability}</span>
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
                
                <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                  <span>{row.email}</span>
                  <span>{row.phoneNumber}</span>
                </div>
              </div>
            </div>
          ),
          grow: 1,
        }
      ];
    }
    
    // For small screens
    if (windowSize.width < 768) {
      return [
        ...baseColumns,
        { 
          name: "Last Name", 
          selector: (row) => row.lastName, 
          sortable: true, 
          width: "auto" 
        },
        { 
          name: "First Name", 
          selector: (row) => row.firstName, 
          sortable: true, 
          width: "auto" 
        },
        { 
          name: "Department", 
          selector: (row) => row.department, 
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
    if (windowSize.width < 1024) {
      return [
        ...baseColumns,
        { 
          name: "Last Name", 
          selector: (row) => row.lastName, 
          sortable: true,
          width: "auto" 
        },
        { 
          name: "First Name", 
          selector: (row) => row.firstName, 
          sortable: true,
          width: "auto" 
        },
        { 
          name: "Email", 
          selector: (row) => row.email,
          width: "auto" 
        },
        { 
          name: "Department", 
          selector: (row) => row.department,
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
        selector: (row) => row.lastName, 
        sortable: true,
        width: "auto" 
      },
      { 
        name: "First Name", 
        selector: (row) => row.firstName, 
        sortable: true,
        width: "auto" 
      },
      { 
        name: "Email", 
        selector: (row) => row.email,
        width: "auto" 
      },
      { 
        name: "Phone Number", 
        selector: (row) => row.phoneNumber,
        width: "auto" 
      },
      { 
        name: "Department", 
        selector: (row) => row.department,
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

  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Customer Support",
  ];

  // Availability options for filtering
  const availabilityOptions = [
    { id: 'available', label: 'Available' },
    { id: 'not-available-1', label: 'Not available' },
    { id: 'desactivated', label: 'Desactivated' }
  ];

  return (
    <div className="w-full relative">
      {/* Filters and Search - Mobile first layout */}
      <div className="px-2 sm:px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 py-3 sm:h-[74px] w-full border-t border-b border-gray-300">
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">
          {/* Search input */}
          <div className="relative w-full sm:w-[285px]">
            <Search className="absolute mb-0.5 right-2 bottom-[8px] sm:bottom-[3px] w-[20px]" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 sm:p-4 rounded-[10px] h-[40px] sm:h-[31px] w-full sm:w-[285px] outline-none bg-white"
            />
          </div>
          
          {/* Filters toggle for mobile */}
          <div className="sm:hidden flex justify-between w-full">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-gray-200 px-3 py-2 rounded-[7px]"
            >
              <Filter size={16} />
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>
            
            <button className="bg-[#0060B4] text-white px-3 py-2 rounded-[10px] h-[40px] flex items-center justify-center gap-1">
              <span className="text-[18px]">+</span> <span>Add</span>
            </button>
          </div>

          {/* Department filters section - Updated with multi-select */}
          <div className={`flex flex-wrap gap-2 sm:gap-4 sm:h-[31px] ${showFilters ? "block w-full" : "hidden sm:flex"}`}>
            <button
              onClick={clearAllFilters}
              className={`flex items-center p-2 rounded-[7px] text-sm ${
                filterDepartments.length === 0 && filterAvailability.length === 0 ? "bg-black text-white" : "bg-gray-200"
              } h-[31px] cursor-pointer`}
            >
              All
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => toggleDepartmentFilter(dept)}
                className={`flex items-center p-2 rounded-[7px] text-sm ${
                  filterDepartments.includes(dept)
                    ? "bg-black text-white"
                    : "bg-gray-200"
                } h-[31px] cursor-pointer`}
              >
                {dept}
              </button>
            ))}
          </div>
          
          {/* Availability filters */}
          <div className={`flex flex-wrap gap-2 sm:gap-4 sm:h-[31px] ${showFilters ? "block w-full mt-2" : "hidden sm:flex"}`}>
            {availabilityOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleAvailabilityFilter(option.label)}
                className={`flex items-center p-2 rounded-[7px] text-sm ${
                  filterAvailability.includes(option.label)
                    ? "bg-black text-white"
                    : "bg-gray-200"
                } h-[31px] cursor-pointer`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Staff Button (Desktop only) */} 
        <Link href="../../admin/add-technical-staff">
          <button className="hidden sm:flex bg-[#0060B4] text-white p-3 rounded-[15px] h-[31px] w-[120px] items-center justify-around font-outfit font-normal cursor-pointer whitespace-nowrap">
            <span className="text-[20px]">+</span> <span>Add Staff</span>
          </button>
        </Link>
      </div>

      {/* Table Container */}
      <div className="table-container w-full relative overflow-x-auto">
        {selectedRows.length > 0 && (
          <div className=" h-[35px] sm:h-[50px]  Clickables w-[calc(100%-40px)] absolute top-0 right-0 z-30 flex flex-row items-center justify-start gap-6 text-sm font-outfit text-[#757575] px-4 bg-gray-100">
            <button 
              className="cursor-pointer"
              onClick={handleAccountStatus}
            > 
              {checkSelectedRowsAvailability().hasDeactivated 
                ? "Activate Account" 
                : "Deactivate Account"}
            </button>
          </div>
        )}

        <DataTable
          columns={getResponsiveColumns()}
          data={filteredData}
          conditionalRowStyles={[
            {
              when: row => row.id === firstVisibleRowId,
              style: {
                borderTopLeftRadius:windowSize.width < 768 ? "0px" : '40px',
                borderTopRightRadius:windowSize.width < 768 ? "0px" : '40px',
              },
            },
          ]}
          progressPending={loading}
          noHeader
          dense={false}
          responsive
          className="w-full"
          customStyles={{ 
            table: {
              style: {
                minWidth: '100%',
                marginTop: "0px",
                backgroundColor: "#f3f4f6",
                padding: windowSize.width < 768 ? "0px" : "0px 8px"
              },
            },
            tableWrapper: {
              style: {
                width: '100%',
                display: 'block',
              },
            },
            responsiveWrapper: {
              style: {
                width: '100%',
                minWidth: '100%',
              },
            },
            headRow:  {
              style: {
                display: windowSize.width < 768 ? 'none' : 'flex',
                minHeight: "30px",
                paddingLeft: windowSize.width < 768 ? '5px': "0px",
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
                backgroundColor: 'white',
                minHeight: windowSize.width < 768 ? "auto" : "70px",
                fontSize: windowSize.width < 768 ? "0.75rem" : "0.875rem",
                width: '100%',
                paddingRight: '10px',
                '&:not(:last-of-type)': {
                  borderBottom: '1px solid #f0f0f0',
                },
              },
            },
            cells: {
              style: {
                padding: windowSize.width < 768 ? "8px 16px" : "0px 10px",
              },
            },
          }}
        />
      </div>
    </div>
  );
}