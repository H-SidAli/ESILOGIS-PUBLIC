import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { Search, MoreVertical, Check } from "lucide-react";
import { createPortal } from "react-dom";

export default function TaskTable() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [assignWorkerModalOpen, setAssignWorkerModalOpen] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [workerSearch, setWorkerSearch] = useState("");
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const menuButtonRefs = useRef({});
  const [isDeleting, setIsDeleting] = useState(false);

  // Map backend status to frontend status
  const mapStatusFromBackend = (backendStatus) => {
    const statusMap = {
      IN_PROGRESS: "In Progress",
      COMPLETED: "Complete",
      PENDING: "Pending",
      // Add any other statuses from your backend
    };
    return statusMap[backendStatus] || backendStatus || "N/A";
  };

  const mapPriorityFromBackend = (backendPriority) => {
    const priorityMap = {
      HIGH: "High",
      MEDIUM: "Medium",
      LOW: "Low",
      // Add any other priorities from your backend
    };
    return priorityMap[backendPriority] || backendPriority || "N/A";
  };
  // Status color mapping
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "in progress":
        return "bg-green-500";
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
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Priority change handler
  const handlePriorityChange = async (newPriority) => {
    try {
      // Map UI priority names to backend enum values
      const priorityMapping = {
        High: "HIGH",
        Medium: "MEDIUM",
        Low: "LOW",
      };

      const backendPriority = priorityMapping[newPriority];

      // Process each selected task
      const updatePromises = selectedRows.map(async (taskId) => {
        const response = await fetch(
          `http://localhost:3001/api/intervention/${taskId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify({ priority: backendPriority }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to update priority for task ${taskId}: ${response.status}`
          );
        }

        return taskId;
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Update local state
      setData((prevData) =>
        prevData.map((task) =>
          selectedRows.includes(task.id)
            ? { ...task, priority: newPriority }
            : task
        )
      );

      setPriorityModalOpen(false);
    } catch (error) {
      console.error("Error updating priority:", error);
      alert("Failed to update priority. Please try again.");
    }
  };

  // Handle delete
  // Add this function to your component
  const handleDeleteTasks = async () => {
    try {
      if (selectedRows.length === 0) {
        alert("No tasks selected for deletion.");
        return;
      }

      // Confirm deletion
      if (
        !confirm(
          `Are you sure you want to delete ${selectedRows.length} task(s)?`
        )
      ) {
        return;
      }

      setIsDeleting(true);

      // Process each selected task
      const deletePromises = selectedRows.map(async (taskId) => {
        const response = await fetch(
          `http://localhost:3001/api/intervention/${taskId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete task ${taskId}: ${response.status}`
          );
        }

        return taskId;
      });

      // Wait for all deletions to complete
      await Promise.all(deletePromises);

      // Update local state
      setData((prevData) =>
        prevData.filter((task) => !selectedRows.includes(task.id))
      );

      // Clear selection
      setSelectedRows([]);

      // Show success message
      alert(`Successfully deleted ${selectedRows.length} task(s).`);
    } catch (error) {
      console.error("Error deleting tasks:", error);
      alert("Failed to delete one or more tasks. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle worker selection
  const toggleWorkerSelection = (worker) => {
    // Store the worker ID instead of displayText
    const workerId = typeof worker === "object" ? worker.id : worker;

    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((w) => w !== workerId)
        : [...prev, workerId]
    );
  };

  // Fetch workers from endpoint
  // Fetch workers from endpoint
  const fetchWorkers = async () => {
    setLoadingWorkers(true);
    try {
      // Fixed URL format with correct protocol separator
      const response = await fetch("http://localhost:3001/api/technicians", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      // Fixed error check to use response.ok instead of response.success
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Technicians data:", result);

      // Extract the data from the response
      const techniciansData = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
        ? result.data
        : [];

      // Format each worker to include a display name with first and last name
      const formattedWorkers = techniciansData.map((worker) => ({
        id: worker.id,
        personId: worker.personId || worker.id,
        firstName: worker.firstName || "",
        lastName: worker.lastName || "",
        name: `${worker.firstName || ""} ${worker.lastName || ""}`.trim(),
        displayText:
          `${worker.firstName || ""} ${worker.lastName || ""}`.trim() ||
          `Tech #${worker.id}`,
      }));

      console.log("Formatted workers:", formattedWorkers);

      setAvailableWorkers(formattedWorkers);
      setFilteredWorkers(formattedWorkers);
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  // Handle worker search - updated for the new worker object structure
  useEffect(() => {
    if (availableWorkers.length > 0) {
      const filtered = availableWorkers.filter((worker) => {
        // Now all workers should have a name property
        const searchName = worker.name || worker.displayText || "";
        return searchName.toLowerCase().includes(workerSearch.toLowerCase());
      });
      setFilteredWorkers(filtered);
    }
  }, [workerSearch, availableWorkers]);

  // Handle worker search
  useEffect(() => {
    if (availableWorkers.length > 0) {
      const filtered = availableWorkers.filter((worker) => {
        // Handle different data types (string vs object with name property)
        const workerName = typeof worker === "string" ? worker : worker.name;
        return workerName.toLowerCase().includes(workerSearch.toLowerCase());
      });
      setFilteredWorkers(filtered);
    }
  }, [workerSearch, availableWorkers]);

  // Assign workers handler with API call
  const handleAssignWorkers = async () => {
    try {
      // Format data for API call - using IDs directly
      const assignmentData = {
        interventionIds: selectedRows,
        technicianIds: selectedWorkers, // Already an array of IDs
      };

      console.log("Submitting assignment:", JSON.stringify(assignmentData));

      // Make API call
      const response = await fetch(
        "http://localhost:3001/api/intervention/assignIntervention/multiple",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(assignmentData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Update local data state
      setData((prevData) =>
        prevData.map((task) => {
          if (selectedRows.includes(task.id)) {
            // Handle different assignee formats
            let currentAssignees = [];

            if (Array.isArray(task.assignee)) {
              currentAssignees = [...task.assignee]; // Already an array of objects
            } else if (task.assignee !== "N/A") {
              // Convert string to array of objects
              currentAssignees = task.assignee.split(", ").map((name) => ({
                id: name,
                personId: name,
                displayText: name,
              }));
            }

            // Create new worker objects
            const newWorkerObjects = selectedWorkers.map((worker) => ({
              id: typeof worker === "string" ? worker : worker.id,
              personId:
                typeof worker === "string"
                  ? worker
                  : worker.personId || worker.name,
              displayText:
                typeof worker === "string"
                  ? worker
                  : worker.name || worker.personId,
            }));

            // Filter out duplicates by id
            const existingIds = currentAssignees.map((a) => a.id);
            const filteredNewWorkers = newWorkerObjects.filter(
              (worker) => !existingIds.includes(worker.id)
            );

            // Combine both arrays
            const allAssignees = [...currentAssignees, ...filteredNewWorkers];

            return {
              ...task,
              assignee: allAssignees.length > 0 ? allAssignees : "N/A",
            };
          }
          return task;
        })
      );

      // Reset state and close modal
      setSelectedWorkers([]);
      setAssignWorkerModalOpen(false);
    } catch (error) {
      console.error("Error assigning workers:", error);
      alert("Failed to assign workers");
    }
  };

  useEffect(() => {
    // fetching the interventions
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/intervention", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        const result = await response.json();
        console.log("Interventions data:", result);

        // Check if result has data property or is an array itself
        const interventionsArray = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
          ? result.data
          : result.interventions
          ? result.interventions
          : [];

        console.log("Interventions array to process:", interventionsArray);

        const formattedData = interventionsArray.map((task) => {
          // Handle assignees as array
          let assigneeInfo = "N/A";
          if (Array.isArray(task.assignees) && task.assignees.length > 0) {
            assigneeInfo = task.assignees.map((assignee) => ({
              id: assignee.id || assignee.personId,
              personId: assignee.personId,
              displayText: `Tech #${assignee.personId}`,
            }));
          }

          // Map the status and priority using our mapping functions
          return {
            id: task.id,
            date: task.createdAt || "N/A",
            description: task.description || "N/A",
            status: mapStatusFromBackend(task.status), // Keep mapping for display purposes
            priority: mapPriorityFromBackend(task.priority),
            assignee: assigneeInfo,
            location: task.location?.name || "N/A",
            lastUpdated: task.resolvedAt || "N/A",
          };
        });

        setData(formattedData);
        setFilteredData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtering effect - removed status filtering
  useEffect(() => {
    let filtered = data;

    // General search across all fields
    if (search) {
      filtered = filtered.filter((task) =>
        Object.values(task).some((value) => {
          // Handle different types of values when searching
          if (Array.isArray(value)) {
            return value.some((item) =>
              item.displayText
                ?.toString()
                .toLowerCase()
                .includes(search.toLowerCase())
            );
          }
          return value.toString().toLowerCase().includes(search.toLowerCase());
        })
      );
    }

    // Filter only by priority now
    if (filterPriority !== "All") {
      filtered = filtered.filter((task) => task.priority === filterPriority);
    }

    setFilteredData(filtered);
  }, [search, filterPriority, data]);

  // Outside click handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuOpen &&
        !event.target.closest(".menu-dropdown") &&
        !event.target.closest(".menu-button")
      ) {
        setMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Row selection handler
  const handleRowSelect = (id) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((rowId) => rowId !== id)
        : [...prevSelected, id]
    );
  };

  // Row click handler
  const handleRowClick = (row) => {
    handleRowSelect(row.id);
  };

  // Select all rows handler
  const handleSelectAll = () => {
    setSelectedRows(
      selectedRows.length === filteredData.length
        ? []
        : filteredData.map((row) => row.id)
    );
  };

  // Toggle menu with improved positioning logic
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
      const menuHeight = 160; // Approximate height of the menu
      const menuWidth = 240;

      // Check if there's enough space below
      const spaceBelow = windowHeight - rect.bottom;
      const showAbove = spaceBelow < menuHeight;

      // Determine top position
      let topPosition;
      if (showAbove) {
        // Position above the button
        topPosition = rect.top - menuHeight + window.scrollY;
      } else {
        // Position below the button
        topPosition = rect.top + window.scrollY;
      }

      // Ensure left position is within viewport
      let leftPosition = rect.left - menuWidth + window.scrollX;
      if (leftPosition < 0) {
        leftPosition = rect.left + window.scrollX;
      }

      setMenuPosition({
        top: topPosition,
        left: leftPosition,
      });
    }

    setMenuOpen(id);
  };

  // Dropdown Menu Component
  const DropdownMenu = ({ row }) => {
    const button = menuButtonRefs.current[row.id];
    const windowHeight = window.innerHeight;
    const isNearBottom =
      button && windowHeight - button.getBoundingClientRect().bottom < 160;

    return createPortal(
      <div
        className={`absolute bg-white shadow-2xl rounded-md z-[1000] border border-gray-200 w-60 menu-dropdown`}
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
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={() => {
            setSelectedRows([row.id]);
            setAssignWorkerModalOpen(true);
            fetchWorkers(); // Fetch workers when opening modal
          }}
        >
          Assign Workers
        </button>
        <hr />
        <button
          className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
          onClick={() => {
            setSelectedRows([row.id]);
            handleDeleteTasks();
          }}
        >
          Delete
        </button>
      </div>,
      document.body
    );
  };

  // Assignee cell with dropdown functionality
  const AssigneeCell = ({ row }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const cellRef = useRef(null);

    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (cellRef.current && !cellRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // If there are no assignees, just show "N/A"
    if (row.assignee === "N/A") {
      return <div>N/A</div>;
    }

    // Get the count of assignees
    const assigneeCount = Array.isArray(row.assignee) ? row.assignee.length : 0;

    return (
      <div
        ref={cellRef}
        className="relative cursor-pointer"
        onClick={(e) => {
          e.stopPropagation(); // Prevent row selection
          setShowDropdown(!showDropdown);
        }}
      >
        <div className="flex items-center">
          <span>
            {assigneeCount} Assignee{assigneeCount !== 1 ? "s" : ""}
          </span>
          <svg
            className={`ml-1 w-4 h-4 transition-transform ${
              showDropdown ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </div>

        {showDropdown && Array.isArray(row.assignee) && (
          <div className="absolute z-50 bg-white shadow-lg rounded p-2 border border-gray-200 w-48 mt-1 left-0">
            <h4 className="font-semibold text-sm mb-1">Assigned Workers:</h4>
            <ul className="text-sm">
              {row.assignee.map((assignee, index) => (
                <li
                  key={index}
                  className="py-1 border-b border-gray-100 last:border-0"
                >
                  {assignee.displayText}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Columns definition
  const columns = [
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
          onChange={(e) => {
            e.stopPropagation(); // Prevent row click event
            handleRowSelect(row.id);
          }}
        />
      ),
      width: "50px",
    },
    { name: "Date", selector: (row) => row.date, sortable: true },
    { name: "Description", selector: (row) => row.description, sortable: true },
    {
      name: "Status",
      cell: (row) => (
        <span className={`flex items-center`}>
          {row.status === "In Progress" && (
            <span className="mr-2 w-2 h-2 bg-green-500 rounded-full"></span>
          )}
          {row.status === "Complete" && (
            <span className="mr-2 w-2 h-2 bg-gray-500 rounded-full"></span>
          )}
          {row.status === "Pending" && (
            <span className="mr-2 w-2 h-2 bg-yellow-500 rounded-full"></span>
          )}
          <span className="text-black">{row.status}</span>
        </span>
      ),
      sortable: true,
    },
    {
      name: "Priority",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(
            row.priority
          )}`}
        >
          {row.priority}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Assignee",
      cell: (row) => <AssigneeCell row={row} />,
      sortable: true,
    },
    { name: "Location", selector: (row) => row.location, sortable: true },
    {
      name: "Last Updated",
      selector: (row) => row.lastUpdated,
      sortable: true,
    },
    {
      name: "",
      cell: (row) => (
        <div className="p-2 rounded-full" onClick={(e) => e.stopPropagation()}>
          <div
            ref={(el) => (menuButtonRefs.current[row.id] = el)}
            className={`cursor-pointer p-1 rounded-full ${
              menuOpen === row.id ? "bg-[#C9C9C9] opacity-85" : ""
            } menu-button`}
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
    <div className="w-full relative overflow-hidden">
      <div className="px-4 flex flex-row items-center justify-between gap-4 h-[74px] w-full border-t border-b border-gray-300">
        <div className="flex flex-row w-auto gap-4">
          <div className="relative w-[285px]">
            <Search className="absolute mb-0.5 right-2 bottom-[3px] w-[20px]" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-4 rounded-[10px] h-[31px] w-[285px] outline-none bg-white"
            />
          </div>
          <div className="flex gap-4 h-[31px]">
            {/* Single All button */}
            <button
              onClick={() => {
                setFilterPriority("All");
              }}
              className={`flex items-center p-2 rounded-[7px] ${
                filterPriority === "All"
                  ? "bg-black text-white"
                  : "bg-gray-200"
              } h-[31px] cursor-pointer`}
            >
              All
            </button>

            {/* Priority Filters */}
            {["High", "Medium", "Low"].map((priority) => (
              <button
                key={priority}
                onClick={() => {
                  setFilterPriority(priority);
                }}
                className={`flex items-center p-2 rounded-[7px] ${
                  filterPriority === priority
                    ? "bg-black text-white"
                    : "bg-gray-200"
                } h-[31px] cursor-pointer`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        <button className="bg-[#0060B4] text-white p-3 rounded-[15px] h-[31px] w-[150px] flex items-center justify-around font-outfit font-normal cursor-pointer">
          <span className="text-[20px]">+</span> <span>Add Task</span>
        </button>
      </div>

      <div className="table-container relative overflow-x-auto">
        {selectedRows.length > 0 && (
          <div className="Clickables h-[29px] bg-gray-100 absolute top-0 left-8 right-0 z-40 flex flex-row items-center px-4 gap-6 text-sm font-outfit text-[#757575]">
            <button
              className="cursor-pointer"
              onClick={handleDeleteTasks}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
            <span>|</span>
            <button
              className="cursor-pointer"
              onClick={() => setPriorityModalOpen(true)}
            >
              Set Priority
            </button>
            <button
              className="cursor-pointer"
              onClick={() => {
                setAssignWorkerModalOpen(true);
                fetchWorkers(); // Fetch workers when opening modal
              }}
            >
              Assign Workers
            </button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={8}
          paginationRowsPerPageOptions={[8]}
          highlightOnHover
          progressPending={loading}
          onRowClicked={handleRowClick}
          selectableRowsNoSelectAll
          pointerOnHover
          responsive
          fixedHeader
          fixedHeaderScrollHeight="calc(100vh - 250px)"
          customStyles={{
            table: {
              style: {
                borderSpacing: "0px",
                marginTop: "0px",
                minWidth: "100%",
              },
            },
            tableWrapper: {
              style: {
                overflowX: "auto",
                maxWidth: "100%",
              },
            },
            headRow: {
              style: {
                minHeight: "30px",
                padding: "0px",
                margin: "0px",
              },
            },
            headCells: {
              style: {
                backgroundColor: "#f3f4f6",
                fontFamily: "outfit",
                color: "#757575",
                height: "30px",
                borderBottom: "1px solid #D1D5DB",
              },
            },
            rows: {
              style: {
                margin: "0px",
                minHeight: "50px",
                cursor: "pointer",
                backgroundColor: (row, i) => {
                  const id = row?.id || null;
                  return selectedRows.includes(id) ? "#EFF6FF" : "inherit";
                },
              },
            },
          }}
        />
      </div>

      {/* Priority Modal with blurred background */}
      {priorityModalOpen &&
        createPortal(
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h2 className="text-lg font-semibold mb-4">Change Priority</h2>
              <div className="space-y-2">
                {["High", "Medium", "Low"].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => handlePriorityChange(priority)}
                    className="w-full p-2 text-left hover:bg-gray-100 rounded"
                  >
                    {priority}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPriorityModalOpen(false)}
                className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Assign Workers Modal with blurred background */}
      {assignWorkerModalOpen &&
        createPortal(
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-auto">
              <h2 className="text-lg font-semibold mb-4">Assign Workers</h2>
              <p className="text-sm text-gray-500 mb-4">
                Select multiple workers to assign to selected tasks
              </p>

              <div className="mb-4 relative">
                <Search
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search workers..."
                  className="w-full p-2 pl-8 border rounded"
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                />
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto">
                {loadingWorkers ? (
                  <div className="text-center py-4">Loading workers...</div>
                ) : filteredWorkers.length === 0 ? (
                  <div className="text-center py-4">No workers found</div>
                ) : (
                  // In the Assign Workers Modal rendering section
                  filteredWorkers.map((worker, index) => {
                    return (
                      <div
                        key={index}
                        className={`flex items-center p-2 rounded cursor-pointer ${
                          selectedWorkers.includes(worker.id)
                            ? "bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => toggleWorkerSelection(worker.id)}
                      >
                        <div
                          className={`w-5 h-5 mr-2 flex items-center justify-center rounded border ${
                            selectedWorkers.includes(worker.id)
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedWorkers.includes(worker.id) && (
                            <Check size={14} color="white" />
                          )}
                        </div>
                        <span>{worker.displayText}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setAssignWorkerModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignWorkers}
                  className={`px-4 py-2 rounded text-white ${
                    selectedWorkers.length === 0
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  disabled={selectedWorkers.length === 0}
                >
                  Assign{" "}
                  {selectedWorkers.length > 0
                    ? `(${selectedWorkers.length})`
                    : ""}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}