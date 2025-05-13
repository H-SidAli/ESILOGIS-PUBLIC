import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { Search, MoreVertical, Check, Calendar, ChevronDown, X } from "lucide-react";
import { createPortal } from "react-dom";
import { format } from "date-fns"; 
import Link from "next/link"; 
//add task
//ChevronDown 
//Edit
export default function TaskTable({ 
  // Data props
  interventions = [],
  technicians = [],
  // Handler props
  onPriorityChange = async (ids, priority) => console.log("Priority change:", ids, priority),
  onAssignWorkers = async (interventionIds, technicianIds) => console.log("Assign workers:", interventionIds, technicianIds),
  onCancelIntervention = async (ids) => console.log("Cancel interventions:", ids),
  onDeleteIntervention = async (ids) => console.log("Delete interventions:", ids),
  // Optional customization props
  addTaskLink = "../../admin/assigne-intervention",
  loadingData = false
}) {
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
  const [firstVisibleRowId, setFirstVisibleRowId] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingInterventions, setCancellingInterventions] = useState(false);

  // Date filter states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateInput, setDateInput] = useState('');
  const datePickerRef = useRef(null);

  const windowSize = useWindowSize();
  
  // Initialize data state from props
  useEffect(() => {
    setData(interventions);
    setFilteredData(interventions);
    setLoading(loadingData);
  }, [interventions, loadingData]);

  // Initialize workers from props
  useEffect(() => {
    setAvailableWorkers(technicians);
    setFilteredWorkers(technicians);
  }, [technicians]);
  
  // Set dateInput to the current date when opened
  useEffect(() => {
    if (showDatePicker && !dateInput) {
      // Set to today's date in YYYY-MM-DD format
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      setDateInput(formattedDate);
    }
  }, [showDatePicker, dateInput]);
  
  // Handle date input change
  const handleDateInputChange = (e) => {
    setDateInput(e.target.value);
  };

  // Handle date input submission
  const handleDateInputSubmit = () => {
    if (!dateInput) return;
    
    try {
      const date = new Date(dateInput);
      
      // Check if valid date
      if (!isNaN(date.getTime())) {
        // Set the selected date
        setSelectedDate(date);
        setShowDatePicker(false);
      }
    } catch (error) {
      console.error("Invalid date format", error);
    }
  };
  
  // Clear date filter
  const handleClearDate = () => {
    setSelectedDate(null);
    setDateInput('');
    setShowDatePicker(false);
  };
  
  // Check if any selected row is cancelled - still useful for other functions
  const hasSelectedCancelledItems = () => {
    return selectedRows.some(rowId => {
      const item = data.find(row => row.id === rowId);
      return item && item.status === "Cancelled";
    });
  };
  
  // Update the firstVisibleRowId whenever filteredData changes
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

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
  };

  // Get date label for button
  const getDateLabel = () => {
    return selectedDate ? formatDate(selectedDate) : "Date";
  };
  
  // Reset date filter
  const resetDateFilter = () => {
    setSelectedDate(null);
    setDateInput('');
  };

  // Status color mapping (kept for display purposes only)
  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-green-500";
      case "Complete":
      case "Completed":
        return "bg-gray-500";
      case "Pending":
        return "bg-yellow-500";
      case "Cancelled":
        return "bg-red-500";
      case "Postponed":
        return "bg-orange-500";
      case "Denied":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Cancel intervention handler
  const handleCancelInterventions = async () => {
    if (selectedRows.length === 0) {
      alert("No interventions selected for cancellation.");
      return;
    }
    
    setCancellingInterventions(true);
    try {
      // Call the prop handler
      await onCancelIntervention(selectedRows);
      
      // Update local state
      setData((prevData) =>
        prevData.map((intervention) =>
          selectedRows.includes(intervention.id)
            ? { ...intervention, status: "Cancelled" }
            : intervention
        )
      );
      
      // Close modal and reset state
      setCancelModalOpen(false);
      
      // Show success message
      alert(`Successfully cancelled ${selectedRows.length} intervention(s).`);
    } catch (error) {
      console.error("Error cancelling interventions:", error);
      alert("Failed to cancel one or more interventions. Please try again.");
    } finally {
      setCancellingInterventions(false);
    }
  };

  // Priority change handler
  const handlePriorityChange = async (newPriority) => {
    try {
      // Check if any selected items are cancelled
      if (hasSelectedCancelledItems()) {
        alert("Cannot change priority of cancelled interventions.");
        setPriorityModalOpen(false);
        return;
      }

      // Call the prop handler
      await onPriorityChange(selectedRows, newPriority);

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
  const handleDeleteTasks = async () => {
    try {
      if (selectedRows.length === 0) {
        alert("No tasks selected for deletion.");
        return;
      }

      // Confirm deletion
      if (!confirm(`Are you sure you want to delete ${selectedRows.length} task(s)?`)) {
        return;
      }

      setIsDeleting(true);

      // Call the prop handler
      await onDeleteIntervention(selectedRows);

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
  const toggleWorkerSelection = (workerId) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((w) => w !== workerId)
        : [...prev, workerId]
    );
  };

  // Handle worker search
  useEffect(() => {
    if (availableWorkers.length > 0) {
      const filtered = availableWorkers.filter((worker) => {
        return worker.name.toLowerCase().includes(workerSearch.toLowerCase());
      });
      setFilteredWorkers(filtered);
    }
  }, [workerSearch, availableWorkers]);

  // Assign workers handler
  const handleAssignWorkers = async () => {
    try {
      // Check if any selected items are cancelled
      if (hasSelectedCancelledItems()) {
        alert("Cannot assign workers to cancelled interventions.");
        setAssignWorkerModalOpen(false);
        return;
      }
      
      // Call the prop handler
      await onAssignWorkers(selectedRows, selectedWorkers);

      // Update local data state
      setData((prevData) =>
        prevData.map((task) => {
          if (selectedRows.includes(task.id)) {
            // Get the worker objects for the selected IDs
            const newAssigneesToAdd = selectedWorkers.map(workerId => {
              const worker = availableWorkers.find(w => w.id === workerId);
              return worker ? worker : null;
            }).filter(Boolean);
            
            // Create a set of existing assignee IDs to avoid duplicates
            const existingAssigneeIds = new Set((task.assignees || []).map(a => a.id));
            
            // Filter out any new assignees that already exist
            const filteredNewAssignees = newAssigneesToAdd.filter(worker => !existingAssigneeIds.has(worker.id));
            
            // Combine existing and new assignees
            const updatedAssignees = [...(task.assignees || []), ...filteredNewAssignees];
            
            return {
              ...task,
              assignees: updatedAssignees
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

  // Filtering effect - removed status filtering
  useEffect(() => {
    let filtered = data;

    // General search across all fields
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          item.description.toLowerCase().includes(searchLower) ||
          item.location.toLowerCase().includes(searchLower) ||
          item.status.toLowerCase().includes(searchLower) ||
          item.dateTime.toLowerCase().includes(searchLower) ||
          (item.assignees && item.assignees.some(assignee => 
            assignee.name.toLowerCase().includes(searchLower)
          ))
        );
      });
    }

    // Filter by selected date
    if (selectedDate) {
      const selectedDayName = format(selectedDate, 'EEEE');
      filtered = filtered.filter((item) => {
        // Extract day from dateTime (e.g., "Wednesday" from "Wednesday, 12:45")
        const itemDay = item.dateTime.split(',')[0].trim();
        return itemDay.toLowerCase() === selectedDayName.toLowerCase();
      });
    }

    // Apply priority filter if not "All"
    if (filterPriority !== "All") {
      filtered = filtered.filter((item) => item.priority === filterPriority);
    }

    setFilteredData(filtered);
  }, [search, filterPriority, data, selectedDate]);

  // Click outside handler for date picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    
    const isCancelled = row.status === "Cancelled";

    return createPortal(
      <div
        className={`absolute bg-white shadow-2xl rounded-md z-[1000] border border-gray-200 w-60 menu-dropdown font-outfit`}
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
        }}
      > 
      <Link href={`../../admin/preventive-interventions/show-details/${row.id}`}> 
       <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={() => alert(`Viewing ${row.description}`)}
        >
          Show Details
        </button>
      </Link>
       
        <hr /> 
        <Link href={`../../admin/preventive-interventions/edit/${row.id}`}>
          <button
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${isCancelled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => isCancelled ? alert("Cannot edit cancelled interventions") : alert(`Editing ${row.description}`)}
          disabled={isCancelled}
        >
          Edit
        </button>
        </Link>
      
        <hr />
        <button
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${isCancelled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => {
            if (isCancelled) {
              alert("This intervention is already cancelled");
              return;
            }
            setSelectedRows([row.id]);
            setCancelModalOpen(true);
          }}
          disabled={isCancelled}
        >
          Cancel Intervention
        </button>
        <hr />
      </div>,
      document.body
    );
  };

  // Assignee cell with stacked avatars and dropdown functionality
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

    // If there are no assignees
    if (!row.assignees || row.assignees.length === 0) {
      return <div className="font-outfit">N/A</div>;
    }

    // Get the count of assignees
    const assigneeCount = row.assignees.length;
    // Limit the displayed avatars to 3 (or however many you want to show)
    const displayLimit = 3;
    const displayedAssignees = row.assignees.slice(0, displayLimit);
    const remainingCount = Math.max(0, assigneeCount - displayLimit);

    return (
      <div
        ref={cellRef}
        className="relative cursor-pointer z-0 font-outfit"
        onClick={(e) => {
          e.stopPropagation(); // Prevent row selection
          setShowDropdown(!showDropdown);
        }}
      >
        <div className="flex items-center">
          {/* Stacked avatars */}
          <div className="flex -space-x-2 mr-2">
            {displayedAssignees.map((assignee, index) => (
              <img 
                key={index}
                src={assignee.avatar} 
                alt={assignee.name}
                className="w-8 h-8 z-0 rounded-full border-2 border-white object-cover"
                style={{ zIndex: displayLimit - index }} // Higher z-index for earlier items
              />
            ))}
            {remainingCount > 0 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600" style={{ zIndex: 0 }}>
                +{remainingCount}
              </div>
            )}
          </div>
          
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

        {showDropdown && (
          <div className="absolute z-50 bg-white shadow-lg rounded p-2 border border-gray-200 w-48 mt-1 left-0 font-outfit">
            <h4 className="font-semibold text-sm mb-1">Assigned Technicians:</h4>
            <ul className="text-sm">
              {row.assignees.map((assignee, index) => (
                <li
                  key={index}
                  className="py-1 border-b border-gray-100 last:border-0 flex items-center"
                >
                  <img 
                    src={assignee.avatar} 
                    alt={assignee.name}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <span>{assignee.name}</span>
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
    { 
      name: "Date", 
      selector: (row) => row.dateTime, 
      sortable: true 
    },
    { 
      name: "Description", 
      selector: (row) => row.description, 
      sortable: true 
    },
    {
      name: "Planned At",
      cell: (row) => {
        const plannedDate = row.plannedAt ? formatDate(row.plannedAt) : "Not scheduled";

        return (
          <span className={`flex items-center font-outfit`}>
            <span className={`mr-2 w-2 h-2 bg-blue-500 rounded-full`}></span>
            <span className="text-black">{plannedDate}</span>
          </span>
        );
      },
      sortable: true,
      sortFunction: (rowA, rowB) => {
        if (!rowA.plannedAt && !rowB.plannedAt) return 0;
        if (!rowA.plannedAt) return 1; // Place non-scheduled items at the end in ascending order
        if (!rowB.plannedAt) return -1;

        const dateA = new Date(rowA.plannedAt);
        const dateB = new Date(rowB.plannedAt);
        
        return dateA.getTime() - dateB.getTime();
      },
    },
    {
      name: "Priority",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(row.priority)} font-outfit`}
        >
          {row.priority}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Assignee",
      cell: (row) => <AssigneeCell row={row} />,
      sortable: false,
    },
    { 
      name: "Location", 
      selector: (row) => row.location, 
      sortable: true 
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
    <div className="w-full relative font-outfit">
      <div className="px-4 flex flex-row items-center justify-between gap-4 h-[74px] w-full border-t border-b border-gray-300">
        <div className="flex flex-row w-auto gap-4">
          <div className="relative w-[285px]">
            <Search className="absolute mb-0.5 right-2 bottom-[3px] w-[20px]" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-4 rounded-[10px] h-[31px] w-[285px] outline-none bg-white font-outfit"
            />
          </div>

          {/* Updated Date Filter Button */}
          <div className="relative mr-4 font-outfit" ref={datePickerRef}>
            <button 
              className={`flex items-center border border-gray-300 rounded-md px-3 py-2 ${selectedDate ? "bg-black text-white" : "bg-gray-200"} h-[31px] cursor-pointer`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <span className="mr-2">{getDateLabel()}</span>
              <ChevronDown size={16} />
            </button>
            
            {/* X icon to clear date filter - only shown when a date is selected */}
            {selectedDate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetDateFilter();
                }}
                className="absolute -right-1 -top-1 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs"
                title="Clear date filter"
              >
                <X size={12} />
              </button>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {/* All button */}
            <button
              onClick={() => {
                setFilterPriority("All");
              }}
              className={`flex items-center px-3 rounded-[7px] ${
                filterPriority === "All"
                  ? "bg-black text-white"
                  : "bg-gray-200"
              } text-sm cursor-pointer`}
            >
              All
            </button>

            {/* Priority Filters */}
            {["High", "Medium", "Low"].map((priority) => (
              <button
                key={priority}
                onClick={() => setFilterPriority(priority === filterPriority ? "All" : priority)}
                className={` text-sm font-outfit px-4 rounded-md ${
                  filterPriority === priority
                    ? "bg-black text-white"
                    : "bg-gray-200"
                } cursor-pointer`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
        <Link href="../../admin/preventive-interventions/add-task"> 
            <button className="bg-[#0060B4] text-white rounded-lg px-5 py-1.5 flex items-center justify-around font-outfit font-normal cursor-pointer">
               <span> + Add Task</span>
            </button>
        </Link>
       
      </div>

      <div className="table-container relative overflow-x-auto">
        {selectedRows.length > 0 && (
          <div className="Clickables h-[50px] bg-gray-100 absolute top-0 left-8 right-0 z-40 flex flex-row items-center px-4 gap-6 text-sm font-outfit text-[#757575]">
            <button
              className="cursor-pointer"
              onClick={() => setCancelModalOpen(true)}
            >
              Cancel PI 
            </button>
            <span>|</span>
            <button
              className={`cursor-pointer ${hasSelectedCancelledItems() ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => {
                if (hasSelectedCancelledItems()) {
                  alert("Cannot change priority of cancelled interventions.");
                } else {
                  setPriorityModalOpen(true);
                }
              }}
              disabled={hasSelectedCancelledItems()}
            >
              Set Priority
            </button>
          </div>
        )}

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
                minWidth: '100%',
                marginTop: "0px",
                backgroundColor:"#f3f4f6",  
                padding: windowSize.width < 768 ? "0px 0px" : "0px 8px",
                fontFamily: "Outfit, sans-serif",
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
            headRow: {
              style: {
                minHeight: windowSize.width < 768 ? "10px" : "30px",
                paddingLeft: windowSize.width < 768 ? '5px': "0x",
                // marginBottom:"10px", 
                fontSize: windowSize.width < 768 ? "0.85rem" : "1rem",
                width: '100%',  
       
                fontFamily: "Outfit, sans-serif",  
            
              },
            },
            headCells: {
              style: {
                backgroundColor: "#f3f4f6",
                fontFamily: "Outfit, sans-serif",
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
                paddingRight:'10px',
                fontFamily: "Outfit, sans-serif",
              },
            },
            cells: {
              style: {
                padding: windowSize.width < 768 ? "0px 10px" : "0px 10px",
                fontFamily: "Outfit, sans-serif",
              }, 
            },
          }}
        />
      </div>

      {/* Updated Date Picker Modal with backdrop */}
      {showDatePicker && (
        <div 
          ref={datePickerRef}
          className="fixed inset-0 z-50 flex items-start justify-center pt-32 font-outfit"
          style={{
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDatePicker(false);
            }
          }}
        >
          <div className="bg-white shadow-lg rounded-md border border-gray-200 p-6 w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-medium text-gray-800 flex items-center">
                <Calendar size={20} className="mr-2" />
                Enter Date Filter
              </h4>
              <button 
                onClick={() => setShowDatePicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-5">
              <input
                type="date"
                value={dateInput}
                onChange={handleDateInputChange}
                className="border border-gray-300 rounded-md px-4 py-3 w-full text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-outfit"
              />
              <div className="text-xs text-gray-500 mt-1">
                Format: YYYY-MM-DD
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded text-sm hover:bg-gray-300 transition-colors font-outfit"
                onClick={handleClearDate}
              >
                Clear
              </button>
              
              <button 
                className="bg-[#0060B4] text-white px-5 py-2.5 rounded text-sm hover:bg-blue-700 transition-colors font-outfit"
                onClick={handleDateInputSubmit}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Modal with blurred background */}
      {priorityModalOpen &&
        createPortal(
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999] font-outfit">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <h2 className="text-lg font-semibold mb-4">Change Priority</h2>
              <div className="space-y-1">
                {["High", "Medium", "Low"].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => handlePriorityChange(priority)}
                    className="w-full p-3 text-left hover:bg-gray-100 rounded border-gray-100 font-outfit"
                  >
                    {priority}
                  </button>
                ))}
              </div>
              <div className="w-full flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setPriorityModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-outfit"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setPriorityModalOpen(false)}
                  className="px-4 py-2 bg-[#0060B4] text-white rounded hover:bg-blue-700 font-outfit"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Cancel confirmation modal */}
      {cancelModalOpen &&
        createPortal(
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999] font-outfit">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96 mx-4">
              <h2 className="text-lg font-semibold mb-2">Cancel Intervention{selectedRows.length > 1 ? 's' : ''}</h2>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel {selectedRows.length} selected intervention{selectedRows.length > 1 ? 's' : ''}? 
                This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 order-2 sm:order-1 font-outfit"
                  disabled={cancellingInterventions}
                >
                  No, Keep
                </button>
                <button
                  onClick={handleCancelInterventions}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 order-1 sm:order-2 font-outfit"
                  disabled={cancellingInterventions}
                >
                  {cancellingInterventions ? 
                    "Cancelling..." : 
                    `Yes, Cancel ${selectedRows.length > 1 ? 'All' : ''}`
                  }
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Assign Workers Modal */}
      {assignWorkerModalOpen &&
        createPortal(
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999] font-outfit">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-auto">
              <h2 className="text-lg font-semibold mb-4">Assign Workers</h2>
              {hasSelectedCancelledItems() ? (
                <div className="text-red-500 mb-4">
                  Cannot assign workers to cancelled interventions. Please deselect them to proceed.
                </div>
              ) : (
                <>
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
                      className="w-full p-2 pl-8 border rounded font-outfit"
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
                      filteredWorkers.map((worker) => (
                        <div
                          key={worker.id}
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
                          <img 
                            src={worker.avatar}
                            alt={worker.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <span>{worker.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setAssignWorkerModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-outfit"
                >
                  Cancel
                </button>
                {!hasSelectedCancelledItems() && (
                  <button
                    onClick={handleAssignWorkers}
                    className={`px-4 py-2 rounded text-white font-outfit ${
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
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}