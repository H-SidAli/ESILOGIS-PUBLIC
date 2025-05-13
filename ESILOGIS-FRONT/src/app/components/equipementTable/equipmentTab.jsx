import React, { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import { Search, MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";
import Agenda from "@/app/components/agenda/agenda"

export default function EquipmentTable() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://run.mocky.io/v3/2a30c0df-ca79-48e7-bfde-998a21e53180");
        const result = await response.json();
        const formattedData = result.map(equipment => ({
          id: equipment.id,
          inventoryCode: equipment.inventoryCode || "N/A",
          type: equipment.type || "N/A",
          category: equipment.category || "N/A",
          status: equipment.status || "N/A",
          acquisitionDate: equipment.acquisitionDate || "N/A",
          commissionDate: equipment.commissionDate|| "N/A",
          location: equipment.location || "N/A",
        }));
        setData(formattedData);
        setFilteredData(formattedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtering effect
  useEffect(() => {
    let filtered = data;
    // General search across all fields
    if (search) {
      filtered = filtered.filter(equipment =>
        Object.values(equipment).some(value =>
          value.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
    }
    // Filter by status
    if (filterStatus !== "All") {
      filtered = filtered.filter(equipment =>
        equipment.status === filterStatus
      );
    }
    setFilteredData(filtered);
  }, [search, filterStatus, data]);

  // Outside click handler for dropdown
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

  // Row selection handler
  const handleRowSelect = (id) => {
    setSelectedRows(prevSelected =>
      prevSelected.includes(id) 
        ? prevSelected.filter(rowId => rowId !== id) 
        : [...prevSelected, id]
    );
  };

  // Select all rows handler
  const handleSelectAll = () => {
    setSelectedRows(
      selectedRows.length === filteredData.length 
        ? [] 
        : filteredData.map(row => row.id)
    );
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
      const spaceBelow = viewportHeight - rect.bottom;
      const dropdownWidth = 240;
     
      // Positioning logic
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

  // Dropdown Menu Component
  const DropdownMenu = ({ row }) => {
    return createPortal(
      <div
        className="fixed bg-white shadow-2xl rounded-md z-[1000] border border-gray-200 w-60 menu-dropdown"
        style={{
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`
        }}
      >
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => alert(`Viewing ${row.inventoryCode}`)}>View</button>
        <hr />
        <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => alert(`Editing ${row.inventoryCode}`)}>Edit</button>
        <hr />
        <button className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600" onClick={() => alert(`Deleting ${row.inventoryCode}`)}>Delete</button>
      </div>,
      document.body
    );
  };

  // Columns definition
  const columns = [
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
        />
      ),
      width: "50px",
    },
    {
      name: "Inventory Code",
      selector: (row) => row.inventoryCode,
      sortable: true
    },
    {
      name: "Type",
      selector: (row) => row.type,
      sortable: true
    },
    {
      name: "Category",
      selector: (row) => row.category,
      sortable: true
    },
    {
      name: "Status",
      cell: (row) => (
        <span className={`flex items-center`}>
          {row.status === 'In Service' && <span className="mr-2 w-2 h-2 bg-green-500 rounded-full"></span>}
          {row.status === 'Out of Service' && <span className="mr-2 w-2 h-2 bg-red-500 rounded-full"></span>}
          {row.status === 'Under Maintenance' && <span className="mr-2 w-2 h-2 bg-yellow-500 rounded-full"></span>}
          <span className="text-black">{row.status}</span>
        </span>
      ),
      sortable: true
    },
    {
      name: "Acquisition Date",
      selector: (row) => row.acquisitionDate,
      sortable: true
    },
    {
      name: "Commission Date",
      selector: (row) => row.commissionDate,
      sortable: true
    },
    {
      name: "Location",
      selector: (row) => row.location,
      sortable: true
    },
    {
      name: "",
      cell: (row) => (
        <div className="p-2 rounded-full">
          <div
            ref={el => menuButtonRefs.current[row.id] = el}
            className={`cursor-pointer p-1 rounded-full ${menuOpen === row.id ? 'bg-[#C9C9C9] opacity-85' : ''}`}
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
    <div className="w-full relative">
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
            {["All", "In Service", "Out of Service", "Under Maintenance"].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex items-center p-2 rounded-[7px] ${filterStatus === status ? "bg-black text-white" : "bg-gray-200"} h-[31px] cursor-pointer`}
              >
                {status}
              </button>
            ))}
            
          </div>
        </div>
       
        <button className="bg-[#0060B4] text-white p-3 rounded-[15px] h-[31px] w-[150px] flex items-center justify-around font-outfit font-normal cursor-pointer">
          <span className="text-[20px]">+</span> <span>Add Equipment</span>
        </button>
      </div>

      <div className="table-container  relative"> 
        {selectedRows.length > 0 && (
          <div className="Clickables w-[1350px] h-[29px] bg-gray-100 absolute top-0 right-0 z-40 flex flex-row items-center justify-start gap-6 text-sm font-outfit text-[#757575] ">
            <button className="cursor-pointer"> Delete Equipement</button>
            <span>|</span>
            <button className="cursor-pointer"> Set Status</button>
          </div>
        )}
        
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          paginationPerPage={9}
          paginationRowsPerPageOptions={[9, 15, 20]}
          highlightOnHover
          progressPending={loading}
          customStyles={{
            table: {
              style: {
                borderSpacing: "0px",
                marginTop: "0px",
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
              },
            },
          }}
        />
      </div>

      

      

     
    </div>
  );
}