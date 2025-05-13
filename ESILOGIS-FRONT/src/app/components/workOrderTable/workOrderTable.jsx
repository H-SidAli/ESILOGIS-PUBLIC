import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import {
  Search,
  MoreVertical,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  Check,
} from "lucide-react";
import { createPortal } from "react-dom";
import Link from "next/link";

export default function TaskTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [activeTimers, setActiveTimers] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [tasksInProgress, setTasksInProgress] = useState({});
  const [openAssigneeDropdown, setOpenAssigneeDropdown] = useState(null);
  const menuButtonRefs = useRef({});
  const timerIntervals = useRef({});
  const assigneeRefs = useRef({});

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "in progress":
        return "bg-green-500";
      case "completed":
      case "complete":
        return "bg-gray-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
      case "med":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      case "p1":
        return "bg-gray-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/intervention/my-assigned",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        const interventions = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
          ? result.data
          : [];

        // Format data to match component expectations
        const formattedData = interventions.map((item) => ({
          id: item.id,
          date: new Date(item.createdAt).toLocaleDateString() || "N/A",
          description: item.description || "N/A",
          status: item.status || "Pending",
          priority: item.priority || "Low",
          assignee: item.assignees || [],
          location: item.location?.name || "N/A",
          lastUpdated: item.updatedAt
            ? new Date(item.updatedAt).toLocaleDateString()
            : "N/A",
        }));

        setData(formattedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Outside click handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close menu dropdown
      if (
        menuOpen &&
        !event.target.closest(".menu-dropdown") &&
        !event.target.closest(".menu-button")
      ) {
        setMenuOpen(null);
      }

      // Close assignee dropdown
      if (
        openAssigneeDropdown &&
        !event.target.closest(".assignee-dropdown") &&
        !event.target.closest(".assignee-button")
      ) {
        setOpenAssigneeDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, openAssigneeDropdown]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timerIntervals.current).forEach((interval) => {
        clearInterval(interval);
      });
    };
  }, []);

  // Toggle assignee dropdown
  const toggleAssigneeDropdown = (id, e) => {
    e.stopPropagation(); // Prevent row selection when clicking dropdown

    if (openAssigneeDropdown === id) {
      setOpenAssigneeDropdown(null);
      return;
    }

    setOpenAssigneeDropdown(id);
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
      const windowHeight = window.innerHeight;
      const menuHeight = 160; // Approximate menu height

      // Check if there's enough space below
      const spaceBelow = windowHeight - rect.bottom;
      const showAbove = spaceBelow < menuHeight;

      let top, left;

      if (showAbove) {
        // Position above if not enough space below
        top = rect.top - menuHeight + window.scrollY;
      } else {
        // Position below
        top = rect.top + window.scrollY;
      }

      // Position to the left of the button
      left = rect.left - 240 + window.scrollX;

      setMenuPosition({
        top,
        left: Math.max(10, left), // Ensure it's not off screen to the left
      });
    }

    setMenuOpen(id);
  };

  // Timer functions
  const startTimer = (rowId) => {
    setActiveTimers((prev) => ({
      ...prev,
      [rowId]: prev[rowId] || { seconds: 0, display: "00:00:00" },
    }));

    if (timerIntervals.current[rowId]) {
      clearInterval(timerIntervals.current[rowId]);
    }

    timerIntervals.current[rowId] = setInterval(() => {
      setActiveTimers((prev) => {
        const currentTimer = prev[rowId] || { seconds: 0 };
        const newSeconds = currentTimer.seconds + 1;

        const hours = Math.floor(newSeconds / 3600)
          .toString()
          .padStart(2, "0");
        const minutes = Math.floor((newSeconds % 3600) / 60)
          .toString()
          .padStart(2, "0");
        const seconds = (newSeconds % 60).toString().padStart(2, "0");
        const display = `${hours}:${minutes}:${seconds}`;

        setData((prevData) =>
          prevData.map((task) =>
            task.id === rowId ? { ...task, timer: display } : task
          )
        );

        return {
          ...prev,
          [rowId]: { seconds: newSeconds, display },
        };
      });
    }, 1000);
  };

  const stopTimer = (rowId) => {
    if (timerIntervals.current[rowId]) {
      clearInterval(timerIntervals.current[rowId]);
      delete timerIntervals.current[rowId];
    }
  };

  // Task action handlers
  const handleBeginTask = async (rowId) => {
    try {
      // Call API to update status
      const response = await fetch(
        `http://localhost:3001/api/intervention/${rowId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: "IN_PROGRESS" }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Update local state
      setData((prevData) =>
        prevData.map((task) =>
          task.id === rowId ? { ...task, status: "In Progress" } : task
        )
      );
      setTasksInProgress((prev) => ({
        ...prev,
        [rowId]: true,
      }));
      startTimer(rowId);
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status");
    }
  };

  const handleCompleteTask = async (rowId) => {
    try {
      // Call API to update status
      const response = await fetch(
        `http://localhost:3001/api/intervention/${rowId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            status: "COMPLETED",
            // You may want to add resolution data here
            resolvedAt: new Date().toISOString()
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Update local state
      setData((prevData) =>
        prevData.map((task) =>
          task.id === rowId ? { ...task, status: "Completed" } : task
        )
      );
      stopTimer(rowId);
      setTasksInProgress((prev) => ({
        ...prev,
        [rowId]: false,
      }));
    } catch (error) {
      console.error("Error completing task:", error);
      alert("Failed to complete task");
    }
  };

  // Row selection handler
  const handleRowClick = (row) => {
    // Find if row is already selected
    const isSelected = selectedRows.some(
      (selectedRow) => selectedRow.id === row.id
    );

    // Toggle selection
    if (isSelected) {
      setSelectedRows(
        selectedRows.filter((selectedRow) => selectedRow.id !== row.id)
      );
    } else {
      setSelectedRows([...selectedRows, row]);
    }
  };

  // Handle showing task details
  const handleShowDetails = (id) => {
    alert(`Showing details for task ${id}`);
  };

  const handleDeleteTasks = async () => {
    try {
      const selectedIds = selectedRows.map((row) => row.id);

      // You might need to use Promise.all for multiple deletions
      // or check if your backend has a batch delete endpoint
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`http://localhost:3001/api/intervention/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          })
        )
      );

      // Update local state
      setData((prevData) =>
        prevData.filter((task) => !selectedIds.includes(task.id))
      );
      setSelectedRows([]);
    } catch (error) {
      console.error("Error deleting tasks:", error);
      alert("Failed to delete tasks");
    }
  };

  // Dropdown Menu Component
  const DropdownMenu = ({ row }) => {
    return createPortal(
      <div
        className="absolute bg-white shadow-2xl rounded-md z-50 border border-gray-200 w-60 menu-dropdown"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
      >
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={() => alert(`Viewing ${row.description}`)}
        >
          View
        </button>
        <hr />
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={() => alert(`Editing ${row.description}`)}
        >
          Edit
        </button>
        <hr />
        <button
          className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
          onClick={() => alert(`Deleting ${row.description}`)}
        >
          Delete
        </button>
      </div>,
      document.body
    );
  };

  // Assignee Dropdown Component - NEW
  const AssigneeDropdown = ({ row }) => {
    const assignees = Array.isArray(row.assignee) ? row.assignee : [];

    return (
      <div
        className="relative assignee-button"
        ref={(el) => (assigneeRefs.current[row.id] = el)}
      >
        <div
          className="flex items-center cursor-pointer"
          onClick={(e) => toggleAssigneeDropdown(row.id, e)}
        >
          {assignees.length > 0 ? (
            <>
              <div className="flex">
                {assignees.slice(0, 3).map((user, i) => (
                  <Avatar key={i} user={user} index={i} />
                ))}
                {assignees.length > 3 && (
                  <div
                    className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs border-2 border-white"
                    style={{ marginLeft: "-10px" }}
                  >
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
              <div className="ml-2 flex items-center">
                {openAssigneeDropdown === row.id ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center text-gray-400">
              <User size={16} className="mr-1" />
              <span>No assignee</span>
            </div>
          )}
        </div>

        {openAssigneeDropdown === row.id && (
          <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded z-40 border border-gray-200 w-56 assignee-dropdown">
            <div className="p-2 border-b border-gray-100">
              <h4 className="font-medium text-sm text-gray-700">
                Assigned to:
              </h4>
            </div>

            {assignees.length > 0 ? (
              <div className="max-h-48 overflow-y-auto">
                {assignees.map((user, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-gray-50 flex items-center"
                  >
                    <Avatar user={user} index={index} small />
                    <span className="ml-2 text-sm">
                      {typeof user === "string"
                        ? user
                        : user.name || `User ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-sm text-gray-500 italic">
                No assignees
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Updated Avatar component to support small size option
  const Avatar = ({ user, index, small = false }) => {
    const colors = [
      "bg-blue-500",
      "bg-red-500",
      "bg-green-500",
      "bg-purple-500",
    ];
    const size = small ? "w-6 h-6" : "w-8 h-8";
    const margin = index > 0 && !small ? "-10px" : "0";

    return (
      <div
        className={`${
          colors[index % colors.length]
        } ${size} rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white`}
        style={{ marginLeft: margin }}
      >
        {typeof user === "string"
          ? user.charAt(0).toUpperCase()
          : user.avatar
          ? user.avatar.charAt(0)
          : "U"}
      </div>
    );
  };

  // Define expanded row component with simple detail button
  const ExpandedComponent = ({ data }) => {
    // Don't show any action buttons if priority is P1
    if (data.priority?.toUpperCase() === "PI") {
      return null;
    }
  
    return (
      <div className="p-4 flex justify-end border-b border-gray-200">
        {data.timer && (
          <div className="flex items-center text-gray-500 mr-4">
            <Clock size={16} className="mr-1" />
            <span>{data.timer}</span>
          </div>
        )}
  
        <div className="flex space-x-2">
          {/* Detail Button */}
          <button
            className="bg-[#EA8B00] text-white px-4 py-1 rounded-[13.07px] text-sm w-[145px] h-[32.67px] hover:bg-[#d07a00] transition-colors"
            onClick={() => handleShowDetails(data.id)}
          >
            Detail
          </button>
  
          {/* Begin/Done Button */}
          {data.status.toLowerCase() === "in progress" &&
          tasksInProgress[data.id] ? (
            <button
              className="bg-[#1DA83B] text-white px-4 py-1 rounded-[13.07px] text-sm w-[207px] h-[32.67px] hover:bg-[#198a31] transition-colors"
              onClick={() => handleCompleteTask(data.id)}
            >
              Done
            </button>
          ) : (
            data.status.toLowerCase() !== "completed" &&
            data.status.toLowerCase() !== "complete" && (
              <button
                className="bg-[#0060B4] text-white px-4 py-1 rounded-[13.07px] text-sm w-[207px] h-[32.67px] hover:bg-[#004d91] transition-colors"
                onClick={() => handleBeginTask(data.id)}
              >
                Begin
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  // Define columns - UPDATED for assignee dropdown
  const columns = [
    {
      name: "Date",
      selector: (row) => row.date,
      sortable: true,
      width: "150px",
    },
    {
      name: "Description",
      selector: (row) => row.description,
      sortable: true,
      grow: 2,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      width: "150px",
      cell: (row) => (
        <div className="flex items-center">
          <span
            className={`mr-2 w-2 h-2 ${getStatusColor(
              row.status
            )} rounded-full`}
          ></span>
          <span>{row.status}</span>
        </div>
      ),
    },
    {
      name: "Priority",
      selector: (row) => row.priority,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${getPriorityColor(
            row.priority
          )}`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      name: "Assignee",
      selector: (row) => row.assignee,
      width: "180px",
      cell: (row) => <AssigneeDropdown row={row} />,
    },
    {
      name: "Location",
      selector: (row) => row.location,
      sortable: true,
      width: "150px",
    },
    {
      name: "Last Updated",
      selector: (row) => row.lastUpdated,
      sortable: true,
      width: "150px",
    },
    {
      name: "",
      button: "true",
      width: "80px",
      cell: (row) => (
        <div>
          {row.status.toLowerCase() !== "completed" &&
            row.status.toLowerCase() !== "complete" && (
              <div
                ref={(el) => (menuButtonRefs.current[row.id] = el)}
                className={`cursor-pointer p-1 rounded-full menu-button ${
                  menuOpen === row.id ? "bg-gray-200" : ""
                }`}
                onClick={(e) => toggleMenu(row.id, e)}
              >
                <MoreVertical size={16} />
              </div>
            )}
          {menuOpen === row.id && <DropdownMenu row={row} />}
        </div>
      ),
    },
  ];

  // Filter data based on search, status and priority
  const filteredData = data.filter((item) => {
    // Search filter
    const matchesSearch =
      !search ||
      Object.values(item).some(
        (val) =>
          val &&
          typeof val === "string" &&
          val.toLowerCase().includes(search.toLowerCase())
      );

    // Status filter
    const matchesStatus =
      filterStatus === "All" || item.status === filterStatus;

    // Priority filter
    const matchesPriority =
      filterPriority === "All" || item.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Handle row selection
  const handleRowSelected = (state) => {
    setSelectedRows(state.selectedRows);
  };

  // Table custom styles
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: "#f3f4f6",
        color: "#757575",
        minHeight: "30px",
        padding: "0px",
        margin: "0px",
        fontFamily: "outfit", // Fixed typo from original code
      },
    },
    rows: {
      style: {
        minHeight: "50px",
        margin: "0",
        borderBottom: 'none', // Remove default border
        '&:not(:last-of-type)': {
          borderBottom: 'none', // Remove default border
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: "#f9fafb",
      },
    },
    expanderRow: {
      style: {
        backgroundColor: "#ffffff",
        margin: "0",
        padding: "0",

      },
    },
    pagination: {
      style: {
        borderTopStyle: "solid",
        borderTopWidth: "1px",
        borderTopColor: "#e5e7eb",
      },
    },
  };

  return (
    <div className="w-full relative">
      {/* Toolbar */}
      <div className="px-4 flex flex-row items-center justify-between gap-4 h-[74px] w-full border-t border-b border-gray-300">
        <div className="flex flex-row w-auto gap-4">
          <div className="relative w-64">
            <Search className="absolute mb-0.5 right-2 bottom-1 w-5" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-2 rounded-lg h-8 w-full outline-none bg-white"
            />
          </div>
          <div className="flex gap-2 h-8">
            {/* Filters */}
            <button
              onClick={() => {
                setFilterStatus("All");
                setFilterPriority("All");
              }}
              className={`flex items-center px-3 rounded-md ${
                filterStatus === "All" && filterPriority === "All"
                  ? "bg-black text-white"
                  : "bg-gray-200"
              } h-8 cursor-pointer`}
            >
              All
            </button>
            {/* Status Filters */}
            {["In Progress", "Complete", "Pending"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  setFilterPriority("All");
                }}
                className={`flex items-center px-3 rounded-md ${
                  filterStatus === status
                    ? "bg-black text-white"
                    : "bg-gray-200"
                } h-8 cursor-pointer`}
              >
                {status}
              </button>
            ))}
            {/* Priority Filters */}
            {["High", "Med", "Low"].map((priority) => (
              <button
                key={priority}
                onClick={() => {
                  setFilterPriority(priority);
                  setFilterStatus("All");
                }}
                className={`flex items-center px-3 rounded-md ${
                  filterPriority === priority
                    ? "bg-black text-white"
                    : "bg-gray-200"
                } h-8 cursor-pointer`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
        <Link href="../../technician/ReportIssueTechnicien">
          <button className="bg-[#0060B4] text-white px-4 py-1 rounded-md h-8 flex items-center justify-center cursor-pointer">
            <span className="text-lg mr-1">+</span> Add Report
          </button>
        </Link>
      </div>

      <div className="relative">
        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <div className="w-full h-8 bg-gray-100 flex items-center justify-start px-4 absolute top-0 z-40">
            <button className="cursor-pointer" onClick={handleDeleteTasks}>
              Delete
            </button>
          </div>
        )}

        {/* DataTable with row click handler */}
        <DataTable
          columns={columns}
          data={filteredData}
          progressPending={loading}
          progressComponent={<div className="p-4">Loading...</div>}
          noDataComponent={<div className="p-4">No data found</div>}
          selectableRows
          selectableRowsHighlight
          onSelectedRowsChange={handleRowSelected}
          expandableRows
          expandableRowsComponent={ExpandedComponent}
          expandableRowExpanded={(row) => row.priority?.toLowerCase() !== "p1"}
          expandOnRowClicked={false}
          onRowClicked={handleRowClick}
          customStyles={customStyles}
          pagination
          paginationPerPage={5}
          paginationRowsPerPageOptions={[5]}
          dense
        />
      </div>
    </div>
  );

}