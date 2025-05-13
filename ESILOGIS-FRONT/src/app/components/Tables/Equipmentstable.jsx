"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import DataTable from "react-data-table-component"
import { Search, MoreVertical, Trash2, X, AlertCircle } from "lucide-react"
import { createPortal } from "react-dom"
import Image from "next/image"
import icon from "../../../../public/Images/Icon.svg"

export default function EquipmentTable() {
  // Status mapping functions
  const mapBackendToFrontendStatus = (backendStatus) => {
    const statusMap = {
      "IN_SERVICE": "In Service",
      "OUT_OF_SERVICE": "Out of Service",
      "UNDER_MAINTENANCE": "Under Maintenance",
      "RETIRED": "Retired"
    }
    return statusMap[backendStatus] || backendStatus
  }

  const mapFrontendToBackendStatus = (frontendStatus) => {
    const statusMap = {
      "In Service": "IN_SERVICE",
      "Out of Service": "OUT_OF_SERVICE",
      "Under Maintenance": "UNDER_MAINTENANCE",
      "Retired": "RETIRED"
    }
    return statusMap[frontendStatus] || frontendStatus
  }

  // Component state
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("All")
  const [menuOpen, setMenuOpen] = useState(null)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [error, setError] = useState(null)
  const [apiErrors, setApiErrors] = useState({
    fetch: null,
    update: null,
    delete: null
  })
  const [apiMessages, setApiMessages] = useState({
    update: null,
    delete: null
  })
  const [isMobile, setIsMobile] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const menuButtonRefs = useRef({})
  const [firstVisibleRowId, setFirstVisibleRowId] = useState(null)
  const tableContainerRef = useRef(null)
  const headerRef = useRef(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const statusButtonRef = useRef(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const router = useRouter()

  // Update the firstVisibleRowId whenever filteredData changes
  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      setFirstVisibleRowId(filteredData[0].id)
    } else {
      setFirstVisibleRowId(null)
    }
  }, [filteredData])

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleAddEquipment = () => {
    router.push("/admin/equipments/add-equipment")
  }

  const showdetails = (id) => {
    router.push(`/admin/equipments/equipment-details?id=${id}`)
  }

  const showedit = (id) => {
    router.push(`/admin/equipments/edit-equipment?id=${id}`)
  }

  // Error display component to use throughout the application
  const ErrorMessage = ({ message }) => {
    if (!message) return null
    
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
    )
  }

  // Success message component
  const SuccessMessage = ({ message }) => {
    if (!message) return null
    
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Success: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
    )
  }

  // Enhanced loading overlay
 //Cancel
  // Initiate delete with validation
  const initiateDelete = () => {
    if (selectedRows.length === 0) {
      setApiErrors(prev => ({ ...prev, delete: "No equipment selected for deletion." }))
      return
    }
    setDeleteConfirmOpen(true)
  }

  // Handle delete equipment
  const handleDeleteEquipment = async () => {
    // Show loading state
    setIsSubmitting(true)
    
    // Clear previous errors and messages
    setApiErrors(prev => ({ ...prev, delete: null }))
    setApiMessages(prev => ({ ...prev, delete: null }))
    
    // Track successful and failed deletions
    const successDeletes = []
    const failedDeletes = []
    
    try {
      // Process each selected row
      for (const id of selectedRows) {
        try {
          const response = await fetch(`http://localhost:3001/api/equipment/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
          })
          
          if (!response.ok) {
            throw new Error(`Failed to delete item ${id}: ${response.statusText}`)
          }
          
          // If successful, add to successful deletes
          successDeletes.push(id)
        } catch (error) {
          console.error(`Error deleting item ${id}:`, error)
          failedDeletes.push(id)
        }
      }
      
      if (successDeletes.length > 0) {
        // Update local state to remove deleted items
        const updatedData = data.filter(item => !successDeletes.includes(item.id))
        setData(updatedData)
        
        // Update filtered data
        setFilteredData(updatedData.filter(item => {
          if (filterStatus !== "All") {
            return item.status === filterStatus
          }
          return true
        }))
      }
      
      // Clear selection
      setSelectedRows([])
      
      // Show appropriate notification
      if (failedDeletes.length === 0) {
        setApiMessages(prev => ({ 
          ...prev, 
          delete: `Successfully deleted ${successDeletes.length} equipment item(s).`
        }))
      } else {
        setApiErrors(prev => ({ 
          ...prev, 
          delete: `Successfully deleted ${successDeletes.length} equipment item(s). Failed to delete ${failedDeletes.length} item(s).`
        }))
      }
      
    } catch (error) {
      console.error("Error during deletion process:", error)
      setApiErrors(prev => ({ ...prev, delete: `Failed to delete equipment: ${error.message}` }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Use this for fallback data if needed
  const mockEquipmentData = [
    {
      id: 1,
      inventoryCode: "EQ001",
      name: "Laptop",
      category: "Electronics",
      status: "In Service",
      acquisitionDate: "2024-01-15",
      commissionDate: "2024-01-20",
    },
    {
      id: 2,
      name: "Printer",
      inventoryCode: "EQ002",
      category: "Office",
      status: "Out of Service",
      acquisitionDate: "2024-02-01",
      commissionDate: "2024-02-05",
    },
    {
      id: 3,
      name: "Monitor",
      inventoryCode: "EQ003",
      category: "Electronics",
      status: "Under Maintenance",
      acquisitionDate: "2024-03-10",
      commissionDate: "2024-03-15",
    },
    {
      id: 4,
      name: "Scanner",
      inventoryCode: "EQ004",
      category: "Office",
      status: "In Service",
      acquisitionDate: "2024-04-01",
      commissionDate: "2024-04-05",
    },
    {
      id: 5,
      name: "Projector",
      inventoryCode: "EQ005",
      category: "Electronics",
      status: "Retired",
      acquisitionDate: "2024-05-01",
      commissionDate: "2024-05-05",
    },
  ]

  // Fetch data from API endpoint
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setApiErrors(prev => ({ ...prev, fetch: null }))
        
        // Make a real API call to the /api/equipment endpoint
        const response = await fetch('http://localhost:3001/api/equipment', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log(result);
        // Process data with status mapping
        const processData = (items) => {
          return items.map(item => {
            // Format dates for display
            const acquisitionDate = item.acquisitionDate ? new Date(item.acquisitionDate).toLocaleDateString() : '';
            const commissionDate = item.commissionDate ? new Date(item.commissionDate).toLocaleDateString() : '';
            const nextMaintenance = item.nextScheduledMaintenance ? new Date(item.nextScheduledMaintenance).toLocaleDateString() : '';
            
            return {
              id: item.id,
              inventoryCode: item.inventoryCode,
              name: item.type?.name || "Unknown Type", // Get name from type object
              category: item.type?.category || "Unknown Category", // Get category from type object
              status: mapBackendToFrontendStatus(item.status),
              acquisitionDate: acquisitionDate,
              commissionDate: commissionDate,
              locationName: item.location?.name || "Unknown Location",
              locationId: item.locationId,
              typeId: item.typeId,
              nextScheduledMaintenance: nextMaintenance,
              // Include original data for use in edit forms
              originalData: item
            }
          })
        }
        
        // Check if the API returns data in the expected format
        if (Array.isArray(result)) {
          const mappedData = processData(result)
          setData(mappedData)
          setFilteredData(mappedData)
        } else if (result.data && Array.isArray(result.data)) {
          // Handle API that returns { data: [...] } format
          const mappedData = processData(result.data)
          setData(mappedData)
          setFilteredData(mappedData)
        } else {
          throw new Error("Invalid data format received from API")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setApiErrors(prev => ({ ...prev, fetch: `Failed to load equipment data: ${error.message}` }))
        
        // Fallback to mock data if API fails (optional - remove in production)
        setData(mockEquipmentData)
        setFilteredData(mockEquipmentData)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update filtered data when search or filters change
  useEffect(() => {
    let filtered = data
    if (search) {
      filtered = filtered.filter((equipment) =>
        Object.values(equipment).some((value) => 
          value !== null && value !== undefined && 
          value.toString().toLowerCase().includes(search.toLowerCase())
        ),
      )
    }
    if (filterStatus !== "All") {
      filtered = filtered.filter((equipment) => equipment.status === filterStatus)
    }
    setFilteredData(filtered)
  }, [search, filterStatus, data])

  // Handle clicks outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest(".menu-dropdown")) {
        setMenuOpen(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuOpen])

  const handleRowSelect = (id) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(id) ? prevSelected.filter((rowId) => rowId !== id) : [...prevSelected, id],
    )
  }

  // Function to handle status change for selected rows
  const handleStatusChange = async (newFrontendStatus) => {
    try {
      // Convert to backend format
      const newBackendStatus = mapFrontendToBackendStatus(newFrontendStatus)
      
      // Validate the status value
      if (!newBackendStatus) {
        setApiErrors(prev => ({ ...prev, update: 'Invalid status value' }))
        return
      }
      
      // Show loading state
      setIsSubmitting(true)
      setApiErrors(prev => ({ ...prev, update: null }))
      setApiMessages(prev => ({ ...prev, update: null }))
      
      // Store successful and failed updates
      const successUpdates = []
      const failedUpdates = []
      
      // Process each selected row one by one
      for (const id of selectedRows) {
        try {
          const response = await fetch(`http://localhost:3001/api/equipment/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newBackendStatus }),
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `Failed to update item ${id}: ${response.statusText}`)
          }
          
          // If successful, add to successful updates
          successUpdates.push(id)
        } catch (error) {
          console.error(`Error updating item ${id}:`, error)
          failedUpdates.push(id)
        }
      }
      
      if (successUpdates.length > 0) {
        // Update local state for successfully updated items
        setData(prevData => prevData.map(item => {
          if (successUpdates.includes(item.id)) {
            return { ...item, status: newFrontendStatus }
          }
          return item
        }))
        
        // Filter the data again to make sure our view reflects updated statuses
        setFilteredData(prevFiltered => {
          const updated = prevFiltered.map(item => {
            if (successUpdates.includes(item.id)) {
              return { ...item, status: newFrontendStatus }
            }
            return item
          })
          
          // If we're filtering by status and it's not "All", we need to reapply the filter
          if (filterStatus !== "All") {
            return updated.filter(item => item.status === filterStatus)
          }
          
          return updated
        })
      }
      
      // Close modal
      setStatusModalOpen(false)
      
      // Show appropriate notification
      if (failedUpdates.length === 0) {
        setApiMessages(prev => ({ 
          ...prev, 
          update: `Status updated to "${newFrontendStatus}" for ${successUpdates.length} item(s)`
        }))
      } else {
        setApiErrors(prev => ({ 
          ...prev, 
          update: `Status updated for ${successUpdates.length} item(s). Failed to update ${failedUpdates.length} item(s).`
        }))
      }
      
    } catch (error) {
      console.error("Error updating statuses:", error)
      setApiErrors(prev => ({ ...prev, update: `Failed to update statuses: ${error.message}` }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMenu = (id, e) => {
    e.stopPropagation()

    if (menuOpen === id) {
      setMenuOpen(null)
      return
    }

    const button = menuButtonRefs.current[id]
    if (button) {
      const rect = button.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const dropdownWidth = 240

      setMenuPosition({
        top: spaceBelow < 150 ? rect.top - 120 : rect.top,
        left: isMobile ? 10 : rect.left - dropdownWidth - 10,
      })
    }

    setMenuOpen(id)
  }

  const DropdownMenu = ({ row }) => {
    return createPortal(
      <div
        className="fixed bg-white shadow-2xl rounded-md z-[1000] border border-gray-200 w-60 menu-dropdown font-outfit"
        style={{
          top: `${menuPosition.top}px`,
          left: isMobile ? "50%" : `${menuPosition.left}px`,
          transform: isMobile ? "translateX(-50%)" : "none",
        }}
      >
        <button onClick={() => showdetails(row.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100">
          View
        </button>
        <hr />
        <button onClick={() => showedit(row.id)} className="w-full text-left px-4 py-2 hover:bg-gray-100">
          Edit
        </button>
        <hr />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(null);
            setSelectedRows([row.id]);
            initiateDelete();
          }} 
          className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
        >
          Delete
        </button>
      </div>,
      document.body,
    )
  }

  // Clear all selected rows
  const clearSelection = () => {
    setSelectedRows([])
  }

  const MobileEquipmentCard = ({ equipment }) => {
    return (
      <div
        className="p-4 border border-gray-200 mb-2 font-outfit"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedRows.includes(equipment.id)}
              onChange={() => handleRowSelect(equipment.id)}
              className="mr-3 h-4 w-4 rounded border-gray-300 text-[#0060B4] focus:ring-[#0060B4]"
            />
            <h3 className="font-medium">
              {equipment.inventoryCode} - {equipment.category} - {equipment.name}
            </h3>
          </div>
          <div
            ref={(el) => (menuButtonRefs.current[equipment.id] = el)}
            className="cursor-pointer p-1 rounded-full"
            onClick={(e) => toggleMenu(equipment.id, e)}
          >
            <MoreVertical size={18} />
          </div>
        </div>

        <div className="grid grid-col gap-2 text-sm text-gray-600">
          <div className="flex gap-2">
            <p className="font-medium"> Acquisition Date </p>
            <p>{equipment.acquisitionDate}</p>
          </div>
          <div className="flex gap-2">
            <p className="font-medium"> Commission Date </p>
            <p>{equipment.commissionDate}</p>
          </div>
        </div>

        <div className="flex flex-row justify-between items-center mt-2">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              equipment.status === "In Service"
                ? "bg-green-100 text-green-800"
                : equipment.status === "Out of Service"
                  ? "bg-red-100 text-red-800"
                  : equipment.status === "Retired"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {equipment.status}
          </span>
        </div>

        {menuOpen === equipment.id && <DropdownMenu row={equipment} />}
      </div>
    )
  }

  const columns = [
    {
      name: (
        <input
          type="checkbox"
          onChange={(e) => setSelectedRows(e.target.checked ? filteredData.map((row) => row.id) : [])}
          checked={selectedRows.length === filteredData.length && filteredData.length > 0}
          className="h-4 w-4 rounded border-gray-300 text-[#0060B4] focus:ring-[#0060B4]"
        />
      ),
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.includes(row.id)}
          onChange={(e) => {
            e.stopPropagation()
            handleRowSelect(row.id)
          }}
          className="h-4 w-4 rounded border-gray-300 text-[#0060B4] focus:ring-[#0060B4]"
        />
      ),
      width: "50px",
    },
    {
      name: "Inventory Code",
      selector: (row) => row.inventoryCode,
      sortable: true,
      minWidth: isMobile ? "150px" : undefined,
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      hide: isMobile ? "sm" : false,
    },
    {
      name: "Category",
      selector: (row) => row.category,
      sortable: true,
      hide: isMobile ? "sm" : false,
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.status === "In Service"
              ? "bg-green-100 text-green-800"
              : row.status === "Out of Service"
                ? "bg-red-100 text-red-800"
                : row.status === "Retired"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {row.status}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Acquisition Date",
      selector: (row) => row.acquisitionDate,
      sortable: true,
      hide: isMobile ? "sm" : false,
    },
    {
      name: "Commission Date",
      selector: (row) => row.commissionDate,
      sortable: true,
      hide: isMobile ? "sm" : false,
    },
    {
      name: "",
      cell: (row) => (
        <div className="p-2 rounded-full">
          <div
            ref={(el) => (menuButtonRefs.current[row.id] = el)}
            className={`cursor-pointer p-1 rounded-full ${menuOpen === row.id ? "bg-[#C9C9C9] opacity-85" : ""}`}
            onClick={(e) => toggleMenu(row.id, e)}
          >
            <MoreVertical size={isMobile ? 14 : 16} />
          </div>
          {menuOpen === row.id && <DropdownMenu row={row} />}
        </div>
      ),
      width: isMobile ? "50px" : "80px",
    },
  ]

  return (
    <div className="flex flex-col h-full w-full font-outfit">
      {/* API Errors & Success Messages Display */}
      {(apiErrors.fetch || apiErrors.update || apiErrors.delete || 
        apiMessages.update || apiMessages.delete) && (
        <div className="px-4 py-2">
          {apiErrors.fetch && <ErrorMessage message={apiErrors.fetch} />}
          {apiErrors.update && <ErrorMessage message={apiErrors.update} />}
          {apiErrors.delete && <ErrorMessage message={apiErrors.delete} />}
          {apiMessages.update && <SuccessMessage message={apiMessages.update} />}
          {apiMessages.delete && <SuccessMessage message={apiMessages.delete} />}
        </div>
      )}

      {/* Fixed header section with search and filters */}
      <div ref={headerRef} className="sticky top-0 z-10 bg-gray-100">
        <div className="px-4 flex flex-row items-center justify-between gap-3 w-full border-t border-b border-gray-300 py-3">
          {/* Search Input - takes remaining space */}
          <div className="relative min-w-[120px]">
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-[20px]" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-3 rounded-[10px] h-[31px] w-full outline-none bg-white font-outfit"
            />
          </div>

          {/* Filter Button (Mobile only) */}
          {isMobile && (
            <div className="relative">
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="flex justify-end p-2 rounded-[7px] bg-gray-200 h-[31px] w-[31px]"
              >
                <Image
                  src={icon || "/placeholder.svg"}
                  alt="Filter"
                  height={20}
                  width={20}
                  className={`transition-transform ${mobileFilterOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileFilterOpen && (
                <div className="absolute top-full right-0 bg-gray-200 shadow-lg rounded-md z-10 mt-1 p-2 min-w-[150px]">
                  {["All", "In Service", "Out of Service", "Under Maintenance", "Retired"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setFilterStatus(status)
                        setMobileFilterOpen(false)
                      }}
                      className={`w-full text-left p-2 rounded ${filterStatus === status ? "bg-black text-white" : "hover:bg-gray-100"}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Desktop Filters */}
          {!isMobile && (
            <div className="flex justify-start w-full gap-2 h-[31px]">
              {["All", "In Service", "Out of Service", "Under Maintenance", "Retired"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`flex items-center px-3 py-1 rounded-[7px] ${filterStatus === status ? "bg-black text-white" : "bg-gray-200"} h-[31px] cursor-pointer text-sm font-outfit`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}

          {/* Add Equipment Button */}
          <button
            onClick={handleAddEquipment}
            className="bg-[#0060B4] text-white rounded-[15px] h-[31px] px-3 flex items-center justify-center whitespace-nowrap font-outfit font-normal cursor-pointer"
          >
            <span className="sm:inline">Add Equipment</span>
          </button>
        </div>
      </div>

      {/* Table container with action bar overlay */}
      <div className="table-container relative overflow-x-auto">
        {/* Action bar - Updated to match the screenshot */}
        {selectedRows.length > 0 && (
          <div className={`bg-gray-100 z-40 border-b border-gray-200 ${
            isMobile ? "sticky top-0 py-3 px-4" : "h-[45px] absolute top-0 left-8 right-0 flex items-center px-4"
          }`}>
            {isMobile ? (
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
                    className="text-gray-600"
                  >
                    Cancel
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    ref={statusButtonRef}
                    onClick={() => setStatusModalOpen(true)}
                    className="text-gray-600"
                  >
                    Set Status
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    onClick={initiateDelete}
                    className="text-gray-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">{selectedRows.length} selected</span>
                  <button 
                    onClick={clearSelection} 
                    className="flex items-center justify-center p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
                <button
                  ref={statusButtonRef}
                  onClick={() => setStatusModalOpen(true)}
                  className="cursor-pointer hover:text-gray-900 text-[#757575]"
                >
                  <span>Set Status</span>
                </button>
                <button
                  onClick={initiateDelete}
                  className="cursor-pointer hover:text-red-700 text-[#757575]"
                >
                  <span>Delete Selected</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen &&
          createPortal(
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-[9999] font-outfit">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
                <p>Are you sure you want to delete {selectedRows.length} selected item(s)?</p>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirmOpen(false)
                      handleDeleteEquipment()
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Status Modal with blurred background */}
        {statusModalOpen &&
          createPortal(
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-[9999] font-outfit">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <h2 className="text-lg font-semibold mb-4">Change Status</h2>
                <div className="space-y-1">
                  <button
                    onClick={() => handleStatusChange("In Service")}
                    className="w-full p-3 text-left hover:bg-gray-100 rounded border-gray-100"
                  >
                    In Service
                  </button>
                  <button
                    onClick={() => handleStatusChange("Out of Service")}
                    className="w-full p-3 text-left hover:bg-gray-100 rounded border-gray-100"
                  >
                    Out of Service
                  </button>
                  <button
                    onClick={() => handleStatusChange("Under Maintenance")}
                    className="w-full p-3 text-left hover:bg-gray-100 rounded border-gray-100"
                  >
                    Under Maintenance
                  </button>
                  <button
                    onClick={() => handleStatusChange("Retired")}
                    className="w-full p-3 text-left hover:bg-gray-100 rounded border-gray-100"
                  >
                    Retired
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

        {/* Scrollable content area */}
        <div className="overflow-auto flex-1" ref={tableContainerRef}>
          {isMobile ? (
            <div className="">
              {filteredData.map((equipment) => (
                <MobileEquipmentCard key={equipment.id} equipment={equipment} />
              ))}
            </div>
          ) : (
            <DataTable
              dense={false}
              columns={columns}
              conditionalRowStyles={[
                {
                  when: (row) => row.id === firstVisibleRowId,
                  style: {
                    borderTopLeftRadius: "40px",
                    borderTopRightRadius: "40px",
                  },
                },
              ]}
              data={filteredData}
              highlightOnHover
              progressPending={loading}
              responsive
              noTableHead={isMobile}
              fixedHeader
              fixedHeaderScrollHeight="100%"
              noDataComponent={
                <div className="p-8 text-center font-outfit text-gray-500">
                  {error ? `Error: ${error}` : loading ? "Loading..." : "No records found"}
                </div>
              }
              customStyles={{
                table: {
                  style: {
                    backgroundColor: "#f3f4f6",
                    borderCollapse: "separate",
                    borderSpacing: "0",
                    minWidth: isMobile ? "600px" : "100%",
                    fontFamily: "Outfit, sans-serif",
                  },
                },
                headRow: {
                  style: {
                    backgroundColor: "#f3f4f6",
                    borderBottom: "1px solid #E5E7EB",
                    minHeight: "40px",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    fontFamily: "Outfit, sans-serif",
                  },
                },
                headCells: {
                  style: {
                    fontFamily: "Outfit, sans-serif",
                    color: "#757575",
                    fontSize: "14px",
                    fontWeight: "500",
                    padding: "12px 16px",
                    borderRight: "none",
                  },
                },
                rows: {
                  style: {
                    minHeight: "52px",
                    fontSize: "14px",
                    backgroundColor: "#FFFFFF",
                    fontFamily: "Outfit, sans-serif",
                    "&:hover": {
                      backgroundColor: "#F9FAFB",
                      cursor: "pointer",
                    },
                  },
                },
                cells: {
                  style: {
                    padding: "12px 16px",
                    borderBottom: "1px solid #E5E7EB",
                    fontFamily: "Outfit, sans-serif",
                  },
                },
              }}
            />
          )}
        </div>
      </div>
      
    
    </div>
  )
}