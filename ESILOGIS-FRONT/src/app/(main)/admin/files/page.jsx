"use client";

import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import FilesTable from "@/app/components/Tables/FilesTable";
import arrows from "../../../../../public/Images/arrows.svg";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Download, Loader } from 'lucide-react';

export default function FilesPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showAddFilePopup, setShowAddFilePopup] = useState(false);
  const [addFileHandler, setAddFileHandler] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  // Helper function to get the token and handle auth errors
  const getToken = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      alert('Your session has expired. Please login again.');
      setTimeout(() => router.push('/login'), 1500);
      return null;
    }
    return token;
  };

  // Fetch files from backend API
  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = getToken();
        if (!token) return;

        const response = await fetch('http://localhost:3001/api/files/documents', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            alert('Your session has expired. Please login again.');
            setTimeout(() => router.push('/login'), 1500);
            return;
          }
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Handle different response formats (direct array or within data property)
        const filesData = Array.isArray(data) ? data : 
                         (data && Array.isArray(data.data)) ? data.data : [];
        
        // Format the data to match the component's expected structure
        const formattedFiles = filesData.map(file => ({
          id: file.id,
          fileName: file.filename || file.originalName || file.name,
          lastUpdated: formatDate(file.uploadedAt || file.updatedAt),
          size: formatFileSize(file.size),
          date: formatISODate(file.uploadedAt || file.createdAt),
          mimeType: file.mimetype,
          url: file.path,
          originalData: file
        }));
        
        setFiles(formattedFiles);
      } catch (err) {
        console.error("Error fetching files:", err);
        setError(err.message || 'Failed to load files');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFiles();
  }, [router]);

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString;
    }
  };

  // Helper function for ISO date format
  const formatISODate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Helper function to format file sizes
  const formatFileSize = (size) => {
    if (size === undefined || size === null) return 'Unknown';
    
    if (typeof size === 'string' && size.includes('MB')) {
      return size; // Already formatted
    }
    
    // Convert to MB
    try {
      const sizeInMB = (parseInt(size) / (1024 * 1024)).toFixed(1);
      return `${sizeInMB} MB`;
    } catch (e) {
      return `${size} bytes`;
    }
  };

  // Open document viewer
  const handleViewFile = (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setViewerLoading(true);
      setViewingFile(file);
    }
  };

  // Handler for file download
  const handleDownload = async (fileIds) => {
    try {
      const token = getToken();
      if (!token) return;
      
      // Download each file one by one
      const downloadPromises = fileIds.map(async (fileId) => {
        const response = await fetch(`http://localhost:3001/api/files/${fileId}/download`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to download file ID ${fileId}: ${response.status}`);
        }
        
        // Create a blob from the response
        const blob = await response.blob();
        
        // Get file name from the response headers if available
        let fileName = '';
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        }
        
        // Fallback to file name from our file list
        if (!fileName) {
          const file = files.find(f => f.id === fileId);
          fileName = file ? file.fileName : `file-${fileId}`;
        }
        
        // Create a download link and trigger it
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return fileId;
      });
      
      await Promise.all(downloadPromises);
      alert(`Downloaded ${fileIds.length} file(s) successfully`);
    } catch (error) {
      console.error("Error downloading files:", error);
      alert(`Failed to download files: ${error.message}`);
    }
  };
  
  // Handler for file rename
  const handleRename = async (fileId, currentName) => {
    const newName = prompt("Enter new file name:", currentName);
    
    if (!newName || newName === currentName) {
      return;
    }
    
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(`http://localhost:3001/api/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filename: newName })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to rename file: ${response.status}`);
      }
      
      // Update local state
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.id === fileId ? {...file, fileName: newName} : file
        )
      );
      
      alert(`File renamed to "${newName}" successfully`);
    } catch (error) {
      console.error("Error renaming file:", error);
      alert(`Failed to rename file: ${error.message}`);
    }
  };
  
  // Handler for file deletion
  const handleDelete = async (fileIds) => {
    if (!confirm(`Are you sure you want to delete ${fileIds.length} file(s)?`)) {
      return;
    }
    
    try {
      const token = getToken();
      if (!token) return;
      
      // Delete each file one by one
      const deletePromises = fileIds.map(async (fileId) => {
        const response = await fetch(`http://localhost:3001/api/files/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete file ID ${fileId}: ${response.status}`);
        }
        
        return fileId;
      });
      
      await Promise.all(deletePromises);
      
      // Update local state
      setFiles(prevFiles => 
        prevFiles.filter(file => !fileIds.includes(file.id))
      );
      
      alert(`${fileIds.length} file(s) deleted successfully`);
    } catch (error) {
      console.error("Error deleting files:", error);
      alert(`Failed to delete files: ${error.message}`);
    }
  };
  
  // Handler for adding new file
  const handleAddFile = async (file) => {
    try {
      const token = getToken();
      if (!token) return;
      
      // Create FormData object to handle file upload
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:3001/api/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Create a new file object with the response data
      const newFile = {
        id: result.data.id || Date.now(),
        fileName: result.data.filename || result.data.originalName || file.name,
        lastUpdated: formatDate(new Date().toISOString()),
        size: formatFileSize(file.size),
        date: formatISODate(new Date().toISOString()),
        mimeType: file.type,
        url: result.data.path,
        originalData: result.data
      };
      
      // Update local state
      setFiles(prev => [...prev, newFile]);
      alert('File uploaded successfully');
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Failed to upload file: ${error.message}`);
    }
  };

  const handleShowAddFilePopup = (addFileHandler) => {
    setAddFileHandler(() => addFileHandler);
    setShowAddFilePopup(true);
  };

  // Mobile responsiveness detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 640);
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <>
      <section className="w-full min-h-screen flex flex-row items-start justify-center bg-gray-100 relative overflow-hidden">
           <div className="hidden sm:block absolute top-0 right-0 z-40"> 
              <Image src={arrows} alt="" width={212}/>
           </div>



        <div className={`w-full z-30 ${isMobile ? 'mt-10' : 'ml-[129px]'}`}>
          <div className="">
            <h1 className="font-oxanium p-6 font-semibold text-[26.07px]">
              Files
            </h1>
          </div>

          {error && (
            <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-bold text-lg mb-1">Error</p>
              <p>{error}</p>
            </div>
          )}

          <div className="">
            <FilesTable 
              files={files}
              loading={loading}
              onDownload={handleDownload}
              onRename={handleRename}
              onDelete={handleDelete}
              onAddFile={handleAddFile}
              onScanClick={handleShowAddFilePopup}
              onViewFile={handleViewFile}
            />
          </div>
        </div>
      </section>

      {showAddFilePopup && (
        <AddFilePopup 
          onClose={() => setShowAddFilePopup(false)}
          onFileAdded={(file) => addFileHandler && addFileHandler(file)}
        />
      )}

      {/* Document Viewer Modal */}
      {viewingFile && (
        <DocumentViewer 
          file={viewingFile}
          onClose={() => setViewingFile(null)}
          onDownload={() => handleDownload([viewingFile.id])}
          loading={viewerLoading}
          setLoading={setViewerLoading}
        />
      )}
    </>
  );
}

const DocumentViewer = ({ file, onClose, onDownload, loading, setLoading }) => {
  const isPDF = file.mimeType === 'application/pdf';
  const isImage = file.mimeType?.startsWith('image/');
  const fileUrl = file.url || '';
  
  const handleLoad = () => {
    setLoading(false);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col overflow-hidden">
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-medium truncate flex-1">{file.fileName}</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onDownload}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            title="Download file"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            title="Close viewer"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-900 flex items-center justify-center overflow-auto p-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        
        {isPDF && (
          <iframe 
            src={`${fileUrl}#toolbar=0&view=FitH`}
            className="w-full h-full bg-white rounded shadow-lg"
            onLoad={handleLoad}
            title={file.fileName}
          />
        )}
        
        {isImage && (
          <div className="relative flex items-center justify-center max-w-full max-h-full">
            <img 
              src={fileUrl} 
              alt={file.fileName}
              className="max-w-full max-h-full object-contain"
              onLoad={handleLoad}
            />
          </div>
        )}
        
        {!isPDF && !isImage && (
          <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-lg">
            <div className="mb-4">
              <Image 
                src="/Images/file.svg" 
                alt="Document" 
                width={100} 
                height={100}
                className="mx-auto"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{file.fileName}</h3>
            <p className="text-gray-600 mb-4">
              This file type ({file.mimeType || 'unknown'}) cannot be previewed directly in the browser. 
              Please download the file to view its contents.
            </p>
            <button 
              onClick={onDownload}
              className="px-4 py-2 bg-[#0060B4] text-white rounded-lg hover:bg-[#0056A4] transition-colors"
            >
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AddFilePopup = ({ onClose, onFileAdded }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadFromDevice = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setIsUploading(true);
      
      // Pass the file to the parent component for upload
      onFileAdded(selectedFile);
      
      // Close the popup after a short delay to show uploading state
      setTimeout(() => {
        setIsUploading(false);
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 font-outfit flex justify-center items-center backdrop-blur-sm bg-black/30 z-50">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-[400px] mx-4 h-auto text-center relative">
        <button 
          className="absolute top-4 right-4 text-black text-xl flex items-center" 
          onClick={onClose}
          disabled={isUploading}
        >
          &#8592; Cancel
        </button>

        <div className="mt-10 p-4 border-2 border-dashed sm:p-6 rounded-lg flex justify-center items-center w-full h-auto mx-auto">
          <Image 
            src="/Images/file.svg" 
            alt="File Upload" 
            width={100} 
            height={100}
            priority
            className="w-full h-auto"
          />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls,.txt"
        />

        <div className="flex flex-col space-y-4 px-4 sm:px-0">
          <button 
            onClick={handleUploadFromDevice}
            className="w-full max-w-[300px] bg-[#EA8B00] text-white font-semibold py-3 rounded-full mt-2 mx-auto"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload from Device'}
          </button>
          <button 
            className="w-full max-w-[300px] bg-[#0060B4] text-white font-semibold py-3 rounded-full mx-auto"
            disabled={isUploading}
          >
            Upload File
          </button>
        </div>
      </div>
    </div>
  );
};