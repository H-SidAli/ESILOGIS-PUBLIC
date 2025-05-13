"use client";
import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { Search, MoreVertical, Loader } from "lucide-react";
import { createPortal } from "react-dom";

export default function UsersTable({ users = [], onViewDetails, onBlockUser, onUnblockUser }) {
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef({});
  const menuRef = useRef(null);
  const windowSize = useWindowSize();
  const [viewMode, setViewMode] = useState("all");
  const [actionInProgress, setActionInProgress] = useState(null);


 // Helper function to determine if a user is blocked
 const isUserBlocked = (user) => {
  // Handle different possible formats of the isBlocked field
  if (user.isBlocked === true) return true;
  if (user.isBlocked === 1) return true;
  if (user.isBlocked === "true") return true;
  if (user.isBlocked === "1") return true;
  if (user.status === "BLOCKED") return true;
  
  // All other cases, treat as not blocked
  return false;
};

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

// Initialize filtered data with users
useEffect(() => {
  setFilteredData(users);
}, [users]);

// Filter and sort users based on search and view mode
useEffect(() => {
  let filtered = users;
  
  // Filter by view mode using the helper function
  if (viewMode === "blocked") {
    filtered = filtered.filter(user => isUserBlocked(user));
  } else if (viewMode === "active") {
    filtered = filtered.filter(user => !isUserBlocked(user));
  }
  
  // Filter by search term
  if (search) {
    filtered = filtered.filter((user) => {
      // Fields to search in
      const searchFields = [
        user.firstName,
        user.lastName,
        user.email,
        user.role
      ].filter(Boolean);
      
      // Check if any field contains the search term
      return searchFields.some(field => 
        typeof field === 'string' && 
        field.toLowerCase().includes(search.toLowerCase())
      );
    });
  }
  
  // Sort: Active users first, then blocked users
  filtered.sort((a, b) => {
    const aIsBlocked = isUserBlocked(a);
    const bIsBlocked = isUserBlocked(b);
    
    if (aIsBlocked && !bIsBlocked) return 1;  // b (active) comes before a (blocked)
    if (!aIsBlocked && bIsBlocked) return -1; // a (active) comes before b (blocked)
    return 0; // maintain original order within the same status
  });
  
  setFilteredData(filtered);
}, [search, users, viewMode]);

// Rest of the component remains the same...
// Close menu on outside click
useEffect(() => {
  if (!menuOpen) return;
  function handleClickOutside(e) {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target) &&
      (!menuButtonRefs.current[menuOpen] || !menuButtonRefs.current[menuOpen].contains(e.target))
    ) {
      setMenuOpen(null);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [menuOpen]);

const handleToggleViewMode = (mode) => {
  setViewMode(mode);
};

const handleToggleBlocked = async (user) => {
  setActionInProgress(user.id);
  
  try {
    if (isUserBlocked(user)) {
      await onUnblockUser(user.id);
    } else {
      await onBlockUser(user.id);
    }
  } catch (error) {
    console.error("Error toggling user status:", error);
  } finally {
    setActionInProgress(null);
    setMenuOpen(null);
  }
};

  const handleRowSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
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
      const spaceBelow = viewportHeight - rect.bottom;
      
      // Position the menu above if there's not enough space below
      setMenuPosition({
        top: spaceBelow < 150 ? rect.top - 120 : rect.bottom,
        left: Math.max(10, rect.left - 180),
      });
    }
    setMenuOpen(id);
  };

  const DropdownMenu = ({ user }) =>
    createPortal(
      <div
        ref={menuRef}
        className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 w-[180px] py-1"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
      >
        <button
          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2"
          onClick={() => {
            onViewDetails(user);
            setMenuOpen(null);
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>
        <hr className="my-1" />
        <button
          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2"
          onClick={() => handleToggleBlocked(user)}
          style={{ color: isUserBlocked(user) ? "green" : "red" }}
          disabled={actionInProgress === user.id}
        >
          {actionInProgress === user.id ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={isUserBlocked(user)
                    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  }
                />
              </svg>
              {isUserBlocked(user) ? "Unblock User" : "Block User"}
            </>
          )}
        </button>
      </div>,
      document.body
    );

  const getResponsiveColumns = () => {
    if (windowSize.width < 640) {
      return [
        {
          name: '',
          cell: (row) => (
            <div className="w-full py-2">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(row.id)}
                  onChange={() => handleRowSelect(row.id)}
                  className="mt-2"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {row.lastName} {row.firstName}
                      </p>
                      <p className="text-xs text-gray-500">{row.email}</p>
                      <p className="text-xs text-gray-600 mt-1">Role: {row.role || 'User'}</p>
                      {isUserBlocked(row) ? (
                        <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Blocked</span>
                      ) : (
                        <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </div>
                    <div>
                      <button
                        ref={(el) => (menuButtonRefs.current[row.id] = el)}
                        onClick={(e) => toggleMenu(row.id, e)}
                        className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${
                          menuOpen === row.id ? "bg-gray-100" : ""
                        }`}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen === row.id && <DropdownMenu user={row} />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ];
    }

    return [
      {
        name: (
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={
              selectedRows.length === filteredData.length &&
              filteredData.length > 0
            }
          />
        ),
        cell: (row) => (
          <input
            type="checkbox"
            checked={selectedRows.includes(row.id)}
            onChange={() => handleRowSelect(row.id)}
          />
        ),
        width: "50px",
        sortable: false,
      },
      {
        name: "Last Name",
        selector: (row) => row.lastName,
        sortable: true,
      },
      {
        name: "First Name",
        selector: (row) => row.firstName,
        sortable: true,
      },
      {
        name: "Email",
        selector: (row) => row.email,
        sortable: true,
      },
      {
        name: "Role",
        selector: (row) => row.role || 'User',
        sortable: true,
      },
      {
        name: "Status",
        cell: (row) => (
          isUserBlocked(row) ? (
            <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">Blocked</span>
          ) : (
            <span className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded-full">Active</span>
          )
        ),
        sortable: true,
        width: "100px",
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
            >
              <MoreVertical />
            </div>
            {menuOpen === row.id && <DropdownMenu user={row} />}
          </div>
        ),
        width: "60px",
        sortable: false,
      },
    ];
  };

  return (
    <div className="w-full relative font-outfit">
      <div className="px-4 flex items-center justify-between gap-4 py-3 h-[74px] w-full border-t border-b border-gray-300">
        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-xs sm:max-w-sm">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 p-2 pr-8 rounded-[10px] h-[35px] outline-none text-sm"
            />
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4 h-[31px]">
            <button
              className={`px-3 py-1 rounded-[7px] text-sm ${viewMode === "all" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
              onClick={() => handleToggleViewMode("all")}
            >
              All
            </button>
            <button
              className={`px-4 py-1 rounded-[7px] text-sm text-center leading-tight ${viewMode === "blocked" ? "bg-black text-white" : "bg-gray-200 text-gray-700"}`}
              onClick={() => handleToggleViewMode("blocked")}
            >
              <span className="block sm:hidden whitespace-nowrap py-1.5">Blocked<br />Users</span>
              <span className="hidden sm:inline whitespace-nowrap py-2">Blocked Users</span>
            </button>
          </div>
        </div>
      </div>

      <div className="table-container w-full relative overflow-x-auto">
        <DataTable
          dense={false}
          columns={getResponsiveColumns()}
          data={filteredData}
          progressPending={loading}
          noHeader={windowSize.width < 640}
          responsive
          className="w-full"
          progressComponent={
            <div className="flex justify-center items-center p-8">
              <Loader className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          }
          noDataComponent={
            <div className="p-8 text-center text-gray-500">
              {search ? `No users matching "${search}"` : "No users found"}
            </div>
          }
          customStyles={{
            table: {
              style: {
                backgroundColor: "#f3f4f6",
                padding: "0px 8px",
              },
            },
            headRow: {
              style: windowSize.width < 640 ? {
                display: "none",
              } : {
                backgroundColor: "#f3f4f6",
                minHeight: "50px",
              },
            },
            headCells: {
              style: {
                fontFamily: "outfit",
                color: "#757575",
                fontSize: "0.875rem",
              },
            },
            rows: {
              style: {
                backgroundColor: "white",
                minHeight: "70px",
                borderBottom: "1px solid #E5E7EB",
                "&:first-of-type": {
                  borderTopLeftRadius: windowSize.width < 768 ? "0px" : '40px',
                  borderTopRightRadius: windowSize.width < 768 ? "0px" : '40px',
                },
              },
            },
            cells: {
              style: {
                padding: "0px 10px",
              },
            },
          }}
        />
      </div>
    </div>
  );
}