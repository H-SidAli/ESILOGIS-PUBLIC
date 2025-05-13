'use client';

import React, { useState, useEffect, useRef } from 'react';
import DataTable from 'react-data-table-component';
import { Search, MoreVertical, Loader } from 'lucide-react';
import { createPortal } from "react-dom";

export default function DepartmentsTable({ 
  onAddDepartment, 
  departments, 
  onDeleteDepartment, 
  onEditDepartment 
}) {
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef({});
  const [firstVisibleRowId, setFirstVisibleRowId] = useState(null);
  const windowSize = useWindowSize();
  const [editMode, setEditMode] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState({ delete: false, edit: false });

  // Add useWindowSize hook
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

  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      setFirstVisibleRowId(filteredData[0].id);
    }
  }, [filteredData]);

  useEffect(() => {
    const lower = search.toLowerCase();
    setFilteredData(
      departments
        .filter(department => department && typeof department === 'object') // Ensure department is valid
        .filter(department => 
          department.name && // Check that name exists
          typeof department.name === 'string' && // Make sure name is a string
          department.name.toLowerCase().includes(lower)
        )
    );
  }, [search, departments]);

  // Handle edit department functionality
  const handleEdit = (row) => {
    setEditMode(row.id);
    setEditValue(row.name);
    setMenuOpen(null);
  };

  // Handle save edit
  const handleSaveEdit = async (id) => {
    if (editValue.trim() === '') return;
    
    setIsLoading(prev => ({ ...prev, edit: true }));
    try {
      await onEditDepartment(id, editValue);
      setEditMode(null);
    } catch (error) {
      console.error("Error saving edit:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, edit: false }));
    }
  };

  // Handle delete department
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      setIsLoading(prev => ({ ...prev, delete: true }));
      try {
        await onDeleteDepartment(id);
        setMenuOpen(null);
      } catch (error) {
        console.error("Error deleting department:", error);
      } finally {
        setIsLoading(prev => ({ ...prev, delete: false }));
      }
    }
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
      const dropdownWidth = 240;
      const isMobile = window.innerWidth < 768;
  
      setMenuPosition({
        top: spaceBelow < 150 ? rect.top - 120 : rect.bottom + 5,
        left: isMobile ? '50%' : rect.right - dropdownWidth,
        transform: isMobile ? 'translateX(-50%)' : 'none',
      });
    }
    setMenuOpen(id);
  };
  
  // Update the DropdownMenu component with API actions
  const DropdownMenu = ({ row }) => createPortal(
    <div
      className="fixed bg-white shadow-2xl rounded-md z-40 border border-gray-200 w-60 menu-dropdown"
      style={{
        top: `${menuPosition.top}px`,
        left: menuPosition.left,
        transform: menuPosition.transform,
      }}
    >
      <button 
        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
        onClick={() => handleEdit(row)}
        disabled={isLoading.edit || isLoading.delete}
      >
        Edit
      </button>
      <hr />
      <button 
        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center"
        onClick={() => handleDelete(row.id)}
        disabled={isLoading.delete}
      >
        {isLoading.delete ? (
          <>
            <Loader size={16} className="animate-spin mr-2" />
            Deleting...
          </>
        ) : (
          'Delete'
        )}
      </button>
    </div>,
    document.body
  );

  const columns = [
    { 
      name: "Department",
      selector: row => {
        if (editMode === row.id) {
          return (
            <div className="flex items-center w-full py-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className=" focus:outline-none  rounded-lg px-3 py-2 w-full   transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(row.id);
                  if (e.key === 'Escape') setEditMode(null);
                }}
              />
              <div className="flex ml-3">
                <button 
                  onClick={() => handleSaveEdit(row.id)}
                  className="text-white bg-[#0060B4] hover:bg-[#004A8C] px-3 py-2 rounded-lg text-sm transition-colors mr-2"
                  disabled={isLoading.edit}
                >
                  {isLoading.edit ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    'Save'
                  )}
                </button>
                <button 
                  onClick={() => setEditMode(null)}
                  className="text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        }
        return row.name;
      },
      grow: 2,
    },
    {
      name: "",
      cell: (row) => (
        <div className="p-1 rounded-full">
          {editMode !== row.id && (
            <div
              ref={(el) => (menuButtonRefs.current[row.id] = el)}
              className={`cursor-pointer p-1 rounded-full ${
                menuOpen === row.id ? "bg-[#C9C9C9] opacity-85" : ""
              }`}
              onClick={(e) => toggleMenu(row.id, e)}
            >
              <MoreVertical size={18} />
            </div>
          )}
          {menuOpen === row.id && <DropdownMenu row={row} />}
        </div>
      ),
      width: "50px",
    },
  ];

  useEffect(() => {
    const onClick = e => {
      if (menuOpen !== null && !e.target.closest(".menu-dropdown")) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  // Cancel edit mode when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editMode !== null && 
          !e.target.closest('input') && 
          !e.target.closest('button')) {
        setEditMode(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editMode]);

  return (
    <div className="w-full relative font-outfit">
      {/* Header - Desktop */}
      <div className="hidden md:flex px-6 py-4 items-center justify-between border-t border-b border-gray-300">
        <div className="flex space-x-3 items-center">
          <div className="relative w-[285px]">
            <Search className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-[10px] h-[31px] outline-none bg-white text-sm"
            />
          </div>
        </div>
        <button
          onClick={onAddDepartment}
          className="px-4 py-2 bg-[#0060B4] text-white text-sm rounded-[10px] h-[31px] flex items-center"
        >
          + Add Department
        </button>
      </div>

      {/* Mobile header */}
      <div className="md:hidden border-t border-b border-gray-300 px-4 py-3">
        <div className="flex items-center space-x-2  py-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute top-1/2 -translate-y-1/2 left-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-[10px] h-[40px] outline-none bg-white text-sm"
            />
          </div>
          <button
            onClick={onAddDepartment}
            className="shrink-0 px-3 py-2 bg-[#0060B4] text-white text-sm rounded-[10px] whitespace-nowrap hover:bg-blue-700"
          >
            + Add
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
                minHeight: windowSize.width < 768 ? "60px" : "60px",
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
      
      {filteredData.length === 0 && !search && (
        <div className="w-full py-8 flex items-center justify-center text-gray-500">
          No departments found. Add a new department to get started.
        </div>
      )}
      
      {filteredData.length === 0 && search && (
        <div className="w-full py-8 flex items-center justify-center text-gray-500">
          No departments matching "{search}".
        </div>
      )}
    </div>
  );
}