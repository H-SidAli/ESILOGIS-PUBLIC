'use client';

import React, { useState, useEffect, useRef } from 'react';
import DataTable from 'react-data-table-component';
import { Search, MoreVertical, Loader , X , Check } from 'lucide-react';
import { createPortal } from "react-dom";
//save
export default function EquipmentTypesTable({ onAddEquipmentType, equipmentTypes, setEquipmentTypes }) {
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuButtonRefs = useRef({});
  const [firstVisibleRowId, setFirstVisibleRowId] = useState(null);
  const windowSize = useWindowSize();
  const [editMode, setEditMode] = useState(null);
  const [editValues, setEditValues] = useState({ name: '', category: '' });
  const [isLoading, setIsLoading] = useState({ delete: false, edit: false });

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
      equipmentTypes.filter(item => 
        item.name.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
      )
    );
  }, [search, equipmentTypes]);

  // Handle edit equipment type
  const handleEdit = (row) => {
    setEditMode(row.id);
    setEditValues({ name: row.name, category: row.category });
    setMenuOpen(null);
  };

  // Handle save edit
  const handleSaveEdit = async (id) => {
    if (editValues.name.trim() === '' || editValues.category.trim() === '') return;
    
    setIsLoading(prev => ({ ...prev, edit: true }));
    try {
      // Update equipment type in the list
      setEquipmentTypes(prev => 
        prev.map(item => 
          item.id === id ? { ...item, name: editValues.name, category: editValues.category } : item
        )
      );
      setEditMode(null);
    } catch (error) {
      console.error("Error saving edit:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, edit: false }));
    }
  };

  // Handle delete equipment type
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this equipment type?')) {
      setIsLoading(prev => ({ ...prev, delete: true }));
      try {
        setEquipmentTypes(prev => prev.filter(item => item.id !== id));
        setMenuOpen(null);
      } catch (error) {
        console.error("Error deleting equipment type:", error);
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
      const dropdownWidth = 240;
      const isMobile = window.innerWidth < 768;

      setMenuPosition({
        top: viewportHeight - rect.bottom < 150 ? rect.top - 120 : rect.bottom + 5,
        left: isMobile ? '50%' : rect.right - dropdownWidth,
        transform: isMobile ? 'translateX(-50%)' : 'none',
      });
    }
    setMenuOpen(id);
  };

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
  
  // Edit column with save/cancel buttons
  const EditButtons = row => {
    return (
      <div className="flex flex-row items-center justify-end space-x-2 w-full">
        <button 
          onClick={() => handleSaveEdit(row.id)}
          className="text-white bg-[#0060B4] hover:bg-[#004A8C] px-2 py-1 rounded-lg text-xs transition-colors"
          disabled={isLoading.edit}
        >
          {isLoading.edit ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
        </button>
        <button 
          onClick={() => setEditMode(null)}
          className="text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg text-xs transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  };

  // Action menu column
  const ActionMenu = row => {
    return (
      <div className="p-1 rounded-full flex justify-end">
        <div
          ref={(el) => (menuButtonRefs.current[row.id] = el)}
          className={`cursor-pointer p-1 rounded-full ${
            menuOpen === row.id ? "bg-[#C9C9C9] opacity-85" : ""
          }`}
          onClick={(e) => toggleMenu(row.id, e)}
        >
          <MoreVertical size={18} />
        </div>
        {menuOpen === row.id && <DropdownMenu row={row} />}
      </div>
    );
  };

  const columns = [
    { 
      name: "Name",
      selector: row => {
        if (editMode === row.id) {
          return (
            <div className="flex flex-col w-full py-1">
              <div className="flex items-center">
                <input
                  type="text"
                  value={editValues.name}
                  onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                  className="rounded-lg px-3 py-2 w-full focus:outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(row.id);
                    if (e.key === 'Escape') setEditMode(null);
                  }}
                  placeholder="Equipment type name"
                />
              </div>
            </div>
          );
        }
        return row.name;
      },
      grow: 1,
    },
    { 
      name: "Category",
      selector: row => {
        if (editMode === row.id) {
          return (
            <div className="flex flex-col w-full py-1">
              <div className="flex items-center">
                <input
                  type="text"
                  value={editValues.category}
                  onChange={(e) => setEditValues({...editValues, category: e.target.value})}
                  className="rounded-lg px-3 py-2 w-full focus:outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(row.id);
                    if (e.key === 'Escape') setEditMode(null);
                  }}
                  placeholder="Category"
                />
              </div>
            </div>
          );
        }
        return row.category;
      },
      grow: 1,
    },
    {
      name: "",
      cell: row => editMode === row.id ? EditButtons(row) : ActionMenu(row),
      width: "100px",
      right: true,
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
          onClick={onAddEquipmentType}
          className="px-4 py-2 bg-[#0060B4] text-white text-sm rounded-[10px] h-[31px] flex items-center"
        >
          + Add Equipment Type
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
            onClick={onAddEquipmentType}
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
          No equipment types found. Add a new equipment type to get started.
        </div>
      )}
      
      {filteredData.length === 0 && search && (
        <div className="w-full py-8 flex items-center justify-center text-gray-500">
          No equipment types matching "{search}".
        </div>
      )}
    </div>
  );
} 

//Save