'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Side from '@/app/components/sidebar/Sidebar';
import Nav from '@/app/components/NavBar/Nav';
import Reportedissuestable from "@/app/components/reported-issues-table/reported-issues-table";
import arrows from '../../../../../public/Images/arrows.svg';
import Image from 'next/image';
import { Loader, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ------------------- UTILITY CONSTANTS -------------------

// Status mapping - single source of truth
const STATUS_MAPPINGS = {
  // Backend to frontend
  'PENDING': 'Pending',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
  'CANCELLED': 'Cancelled',
  'POSTPONED': 'Postponed',
  'DENIED': 'Denied',
  'APPROVED': 'Approved',
  // Frontend to backend (reverse mapping - generated automatically)
};

// Priority mapping - single source of truth
const PRIORITY_MAPPINGS = {
  // Backend to frontend
  'HIGH': 'High',
  'MEDIUM': 'Medium',
  'LOW': 'Low',
  // Frontend to backend (reverse mapping - generated automatically)
};

// Generate reverse mappings
Object.entries(STATUS_MAPPINGS).forEach(([key, value]) => {
  STATUS_MAPPINGS[value] = key;
});

Object.entries(PRIORITY_MAPPINGS).forEach(([key, value]) => {
  PRIORITY_MAPPINGS[value] = key;
});

// ------------------- UTILITY FUNCTIONS -------------------

// Format date to MM/DD/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

// Map backend status to frontend format
const mapStatus = (status) => STATUS_MAPPINGS[status] || status;

// Map backend priority to frontend format
const mapPriority = (priority) => PRIORITY_MAPPINGS[priority] || priority;

// Map frontend status back to backend format
const mapStatusToBackend = (status) => STATUS_MAPPINGS[status] || status;

// Map frontend priority back to backend format
const mapPriorityToBackend = (priority) => PRIORITY_MAPPINGS[priority] || priority;

// Custom API request hook
const useApiRequest = () => {
  const router = useRouter();
  
  // Generic API request handler with auth and error handling
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`http://localhost:3001/api/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
    
    // Handle authentication errors
    if (response.status === 401) {
      throw new Error('Session expired');
    }
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }
    
    return response.json();
  }, []);
  
  return { apiRequest };
};

export default function InterventionsPage() {
  const router = useRouter();
  const { apiRequest } = useApiRequest();
  
  // -------------- STATE --------------
  const [uiState, setUiState] = useState({
    isMobile: false,
    loading: true,
    error: null,
    isSubmitting: false,
    toast: { visible: false, message: '', type: '' }
  });
  
  const [data, setData] = useState({
    reports: [],
    staffMembers: []
  });

  // -------------- MEMOIZED VALUES --------------
  // Pre-calculated values that don't need to be recalculated on every render
  const statusOptions = useMemo(() => ["In Progress", "Pending", "Postponed", "Completed", "Cancelled", "Denied"], []);
  const priorityOptions = useMemo(() => ["High", "Medium", "Low"], []);

  // -------------- HELPER FUNCTIONS --------------
  // Toast notification helper
  const showToast = useCallback((message, type = 'success') => {
    setUiState(prev => ({
      ...prev,
      toast: { visible: true, message, type }
    }));
    setTimeout(() => setUiState(prev => ({
      ...prev,
      toast: { visible: false, message: '', type: '' }
    })), 3000);
  }, []);

  // Authentication check helper
  const checkAuth = useCallback(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      showToast('Authentication required. Please login again.', 'error');
      setTimeout(() => router.push('/login'), 2000);
      return false;
    }
    return true;
  }, [router, showToast]);

  // Handle API errors consistently
  const handleApiError = useCallback((error, actionName) => {
    console.error(`Error ${actionName}:`, error);
    
    if (error.message === 'Session expired') {
      showToast('Session expired. Please login again.', 'error');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }
    
    showToast(`${actionName} failed: ${error.message}`, 'error');
  }, [router, showToast]);

  // -------------- RESPONSIVE DESIGN --------------
  // Check for mobile view
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        setUiState(prev => ({ ...prev, isMobile: window.innerWidth < 640 }));
      };
      
      checkMobile(); // Check initially
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }
  }, []);

  // -------------- DATA FETCHING --------------
  // Fetch staff members (technicians)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        if (!checkAuth()) return;
        
        const data = await apiRequest('technicians');
        
        if (data.success && Array.isArray(data.data)) {
          setData(prev => ({
            ...prev,
            staffMembers: data.data.map(user => ({
              id: user.id,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              role: user.role || 'Staff',
              email: user.email
            }))
          }));
        }
      } catch (error) {
        handleApiError(error, 'fetching staff members');
        setUiState(prev => ({ ...prev, error: `Failed to load technicians: ${error.message}` }));
      }
    };
    
    fetchStaff();
  }, [apiRequest, checkAuth, handleApiError]);
  
  // Transform API data to component format
  const transformInterventionData = useCallback((items) => {
    return items.map(item => ({
      id: item.id,
      date: formatDate(item.createdAt),
      description: item.description,
      status: mapStatus(item.status),
      priority: mapPriority(item.priority),
      
      assignees: item.assignees.map(a => ({
        name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email,
        role: a.role || '',
        contact: a.email || '',
        avatarUrl: a.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(a.firstName || '')
      })),
      
      reporter: item.reportedBy ? {
        name: `${item.reportedBy.firstName || ''} ${item.reportedBy.lastName || ''}`.trim() || item.reportedBy.email,
        role: 'Reporter',
        contact: item.reportedBy.email || '',
        avatarUrl: item.reportedBy.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.reportedBy.firstName || 'Unknown')
      } : null,
      
      location: item.location?.name || 'Unknown location',
      equipmentCode: item.equipment?.inventoryCode || 'N/A',
      equipmentType: item.equipment?.type?.name || 'Unknown',
      lastUpdated: formatDate(item.updatedAt),
      _originalData: item
    }));
  }, []);
  
  // Fetch interventions data from API
  const fetchInterventions = useCallback(async () => {
    try {
      setUiState(prev => ({ ...prev, loading: true, error: null }));
      
      if (!checkAuth()) return;

      const result = await apiRequest('intervention');
      
      // Transform API data to match component format
      if (result.success && Array.isArray(result.data)) {
        const transformedData = transformInterventionData(result.data);
        setData(prev => ({ ...prev, reports: transformedData }));
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      handleApiError(error, 'fetching interventions');
      setUiState(prev => ({ ...prev, error: error.message || "Failed to load interventions" }));
    } finally {
      setUiState(prev => ({ ...prev, loading: false }));
    }
  }, [apiRequest, checkAuth, handleApiError, transformInterventionData]);

  // Initial data fetch
  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  // -------------- ACTION HANDLERS --------------
  
  // Reusable function for updating intervention
  const updateIntervention = useCallback(async (ids, updateData, successMessage) => {
    if (uiState.isSubmitting || !ids.length) return false;
    
    try {
      setUiState(prev => ({ ...prev, isSubmitting: true }));
      
      if (!checkAuth()) return false;
      
      let successCount = 0;
      let failedIds = [];
      
      // Process each ID
      for (const id of ids) {
        try {
          await apiRequest(`intervention/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
          });
          successCount++;
        } catch (error) {
          console.error(`Error updating intervention ${id}:`, error);
          failedIds.push(id);
        }
      }
      
      // If any were successful, update UI and refresh data
      if (successCount > 0) {
        if (failedIds.length > 0) {
          showToast(`${successMessage} ${successCount} items, ${failedIds.length} failed`, 'warning');
        } else {
          showToast(`${successMessage} ${successCount} items`, 'success');
        }
        
        // Refresh data from API
        setTimeout(() => fetchInterventions(), 500);
        return true;
      } else {
        showToast('Failed to update any items', 'error');
        return false;
      }
    } catch (error) {
      handleApiError(error, 'updating interventions');
      return false;
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [apiRequest, checkAuth, fetchInterventions, handleApiError, showToast, uiState.isSubmitting]);

  // Handle assignment of technicians to interventions
  const handleAssignment = useCallback(async (ids, assigneeIds) => {
    if (uiState.isSubmitting) return false;
    
    try {
      setUiState(prev => ({ ...prev, isSubmitting: true }));
      
      // Validation checks
      if (!ids.length || !assigneeIds.length) {
        showToast('Please select both interventions and technicians to assign', 'error');
        return false;
      }
      
      if (!checkAuth()) return false;
      
      // Map the frontend parameter names to what the backend expects
      const requestData = {
        interventionIds: ids,
        technicianIds: assigneeIds
      };
      
      await apiRequest('intervention/assign-multiple', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      showToast('Technicians assigned successfully', 'success');
      
      // Update local state immediately for better UX
      setData(prev => ({
        ...prev,
        reports: prev.reports.map(report => {
          if (ids.includes(report.id)) {
            // Find corresponding technicians to add as assignees
            const newAssignees = prev.staffMembers
              .filter(staff => assigneeIds.includes(staff.id))
              .map(staff => ({
                name: staff.name,
                role: staff.role || 'Technician',
                contact: staff.email || '',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}`
              }));
              
            // Combine existing and new assignees, removing duplicates
            const existingAssigneeIds = new Set(report.assignees.map(a => a.name));
            const filteredNewAssignees = newAssignees.filter(a => !existingAssigneeIds.has(a.name));
            
            return {
              ...report,
              status: 'Approved', // Assignment typically moves status to Approved
              assignees: [...report.assignees, ...filteredNewAssignees]
            };
          }
          return report;
        })
      }));
      
      // Refresh data from server after local update
      setTimeout(() => fetchInterventions(), 500);
      return true;
    } catch (error) {
      handleApiError(error, 'assigning technicians');
      return false;
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [apiRequest, checkAuth, fetchInterventions, handleApiError, showToast, uiState.isSubmitting]);

  // Handle status change for interventions
  const handleStatusChange = useCallback(async (ids, status) => {
    const backendStatus = mapStatusToBackend(status);
    return updateIntervention(
      ids, 
      { status: backendStatus }, 
      'Updated status for'
    );
  }, [updateIntervention]);
  
  // Handle priority change for interventions
  const handlePriorityChange = useCallback(async (ids, priority) => {
    const backendPriority = mapPriorityToBackend(priority);
    return updateIntervention(
      ids, 
      { priority: backendPriority }, 
      'Updated priority for'
    );
  }, [updateIntervention]);
  
  // Handle cancellation of interventions
  const handleCancel = useCallback(async (ids) => {
    if (uiState.isSubmitting) return false;
    if (!Array.isArray(ids)) ids = [ids]; // Convert single ID to array
    
    if (!ids.length) {
      showToast('No interventions selected', 'error');
      return false;
    }
    
    // Confirm cancellation with user
    if (!window.confirm(`Are you sure you want to cancel ${ids.length} intervention(s)?`)) {
      return false;
    }
    
    return updateIntervention(
      ids, 
      { status: 'CANCELLED' }, 
      'Cancelled'
    );
  }, [showToast, updateIntervention, uiState.isSubmitting]);
  
  // Handle deletion of an intervention
  const handleDelete = useCallback(async (id) => {
    if (uiState.isSubmitting) return false;
    
    try {
      setUiState(prev => ({ ...prev, isSubmitting: true }));
      
      // Confirm deletion with user
      if (!window.confirm(`Are you sure you want to delete this intervention? This action cannot be undone.`)) {
        return false;
      }
      
      if (!checkAuth()) return false;

      await apiRequest(`intervention/${id}`, {
        method: 'DELETE'
      });

      // Update local state
      setData(prev => ({
        ...prev,
        reports: prev.reports.filter(report => report.id !== id)
      }));
      
      showToast('Intervention deleted successfully', 'success');
      return true;
    } catch (error) {
      handleApiError(error, 'deleting intervention');
      return false;
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [apiRequest, checkAuth, handleApiError, showToast, uiState.isSubmitting]);
  
  // Handle approval of an intervention
  const handleApprove = useCallback(async (id) => {
    return updateIntervention([id], { status: 'APPROVED' }, 'Approved');
  }, [updateIntervention]);
  
  // Handle denial of an intervention
  const handleDeny = useCallback(async (id) => {
    if (uiState.isSubmitting) return false;
    
    // Confirm denial with user
    if (!window.confirm(`Are you sure you want to deny this intervention?`)) {
      return false;
    }
    
    return updateIntervention([id], { status: 'DENIED' }, 'Denied');
  }, [updateIntervention, uiState.isSubmitting]);

  // View details of an intervention
  const handleViewDetails = useCallback((id) => {
    router.push(`/admin/reported-issues/${id}`);
    return true;
  }, [router]);

  // Handle PDF export with lazy-loading
  const handleExportPDF = useCallback(async () => {
    if (uiState.isSubmitting) return;
    
    try {
      setUiState(prev => ({ ...prev, isSubmitting: true }));
      showToast('Generating PDF report...', 'info');
      
      // Create new document
      const doc = new jsPDF();
      
      // Add title and header
      doc.setFontSize(18);
      doc.setTextColor(6, 96, 180); // #0060B4
      doc.text('ESILOGIS Interventions Report', 14, 20);
      
      // Add generation info
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total interventions: ${data.reports.length}`, 14, 35);
      
      // Prepare table data
      const tableColumn = ["ID", "Date", "Description", "Status", "Priority", "Location"];
      const tableRows = data.reports.map(report => [
        report.id,
        report.date,
        report.description?.substring(0, 30) + (report.description?.length > 30 ? '...' : ''),
        report.status,
        report.priority,
        report.location
      ]);
      
      // Create table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [6, 96, 180], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 40 }
      });
      
      // Add summary section
      const lastY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Summary by Status:', 14, lastY);
      
      // Count interventions by status
      const statusCounts = data.reports.reduce((counts, report) => {
        counts[report.status] = (counts[report.status] || 0) + 1;
        return counts;
      }, {});
      
      // Add status summary table
      const statusRows = Object.entries(statusCounts).map(([status, count]) => [
        status, count, `${Math.round((count / data.reports.length) * 100)}%`
      ]);
      
      autoTable(doc, {
        head: [['Status', 'Count', 'Percentage']],
        body: statusRows,
        startY: lastY + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [100, 100, 100] }
      });
      
      // Save PDF
      doc.save(`interventions-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      showToast('PDF report generated successfully', 'success');
    } catch (error) {
      console.error("Error generating PDF:", error);
      showToast(`PDF generation failed: ${error.message}`, 'error');
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [data.reports, showToast, uiState.isSubmitting]);

  // Destructure state for cleaner JSX
  const { isMobile, loading, error, isSubmitting, toast } = uiState;
  const { reports, staffMembers } = data;

  return (
    <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden"> 
      {/* Background decoration */}
      <div className="hidden sm:block absolute top-0 right-0 z-10"> 
        <Image src={arrows} alt="" width={212} priority />
      </div>
      
    
      
      {/* Toast notification */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          toast.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
          {toast.type === 'error' && <AlertCircle className="h-5 w-5 mr-2" />}
          {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 mr-2" />}
          {toast.type === 'info' && <Loader className="h-5 w-5 mr-2 animate-spin" />}
          <span>{toast.message}</span>
        </div>
      )}
      
      {/* Main content */}
      <div className={`w-full z-30 ${isMobile ? 'mt-24' : 'ml-[134px]'}`}>
        <div className="">
          <h1 className="p-6 font-semibold text-[26.07px]">
            Reported Issues
          </h1>
        </div>

        {/* Error message with retry button */}
        {error && (
          <div className="bg-red-50 border-b border-t text-red-700 w-full py-4 flex flex-col">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 mr-2" />
              <strong className="font-bold">Error loading data</strong>
            </div>
            <p className="block mb-4">{error}</p>
            <div className="flex justify-end">
              <button 
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
                disabled={loading}
                onClick={fetchInterventions}
              >
                {loading ? (
                  <span className="flex items-center"><Loader className="h-4 w-4 mr-2 animate-spin" /> Retrying...</span>
                ) : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Loading state - full screen centered spinner */}
        {loading && !error && (
          <div className="flex justify-center items-center py-16">
            <div className="flex flex-col items-center">
              <Loader className="h-10 w-10 text-[#0060B4] animate-spin mb-4" />
              <p className="text-gray-600">Loading interventions...</p>
            </div>
          </div>
        )}

        {/* Table container with dynamic height based on viewport */}
        {!loading && !error && (
          <div className="h-[calc(100vh-180px)] w-full">
            <Reportedissuestable
              reports={reports}
              loading={loading}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onApprove={handleApprove}
              onDeny={handleDeny}
              onAssign={handleAssignment}
              onDetails={handleViewDetails}
              addReportLink="/admin/reported-issues/report-issue-admin"
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
              availableAssignees={staffMembers}
              isProcessing={isSubmitting}
            />
          </div>
        )}
      </div>
      
      {/* PDF Export Button - Fixed position that adapts to viewport */}
      <div className="fixed bottom-5 right-5 z-40"> 
        <button 
          className={`bg-[#474747] px-6 py-2 rounded-xl hover:bg-[#333333] transition-colors text-white flex items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={handleExportPDF}
          disabled={isSubmitting || loading || !!error || reports.length === 0}
        >
          {isSubmitting ? (
            <><Loader className="h-4 w-4 mr-2 animate-spin" /> Generating PDF...</>
          ) : (
            'Download as PDF'
          )}
        </button>
      </div>
    </section>
  );
}