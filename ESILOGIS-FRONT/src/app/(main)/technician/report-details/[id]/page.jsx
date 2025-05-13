"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Side from "@/app/components/sidebar/Sidebar";
import Nav from "@/app/components/NavBar/Nav";
import ReportedIssueDetails from "@/app/components/work-orders-detail/reported-issue-details";
import arrows from "../../../../../../public/Images/arrows.svg";
import Image from "next/image";
import Link from "next/link";
import { Loader, AlertCircle } from 'lucide-react';
import Breadcrumb from "@/app/components/bread-crumb-nav/Bread-crumb-nav";

export default function ReportIssueDetailsPage() {
 const router = useRouter();
 const params = useParams();
 const { id } = params;

 const [isMobile, setIsMobile] = useState(false);
 const [workOrder, setWorkOrder] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [currentWorker, setCurrentWorker] = useState({
 id: "",
 name: "Loading...",
 avatar: "?",
 role: "Technician"
 });

 // Check for responsive layout
 useEffect(() => {
 if (typeof window !== "undefined") {
 setIsMobile(window.innerWidth < 640);

 const handleResize = () => {
 setIsMobile(window.innerWidth < 640);
 };

 window.addEventListener("resize", handleResize);
 return () => window.removeEventListener("resize", handleResize);
 }
 }, []);

 // Get token function
 const getToken = () => {
 if (typeof window !== "undefined") {
 const token = sessionStorage.getItem("token");
 if (!token) {
 router.push('/login');
 return null;
 }
 return token;
 }
 return null;
 };
 
 // Fetch user profile
 useEffect(() => {
 const fetchUserProfile = async () => {
 try {
 const token = getToken();
 if (!token) return;
 
 const response = await fetch("http://localhost:3001/api/auth/me", {
 headers: {
 "Authorization": `Bearer ${token}`
 }
 });
 
 if (!response.ok) {
 throw new Error("Failed to fetch user profile");
 }
 
 const data = await response.json();
 
 setCurrentWorker({
 id: data.id,
 name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
 avatar: `${data.firstName?.[0] || ''}${data.lastName?.[0] || ''}` || "?",
 role: data.role?.name || "Technician"
 });
 } catch (error) {
 console.error("Error fetching user profile:", error);
 // Fallback to placeholder data for development
 if (process.env.NODE_ENV === 'development') {
 setCurrentWorker({
 id: "dev-user",
 name: "Dev User",
 avatar: "DU",
 role: "Technician"
 });
 }
 }
 };
 
 fetchUserProfile();
 }, [router]);

 // Fetch work order details
 useEffect(() => {
 if (!id) {
 setError("Missing work order ID. Please select a valid work order.");
 setLoading(false);
 return;
 }
 
 const fetchWorkOrderDetails = async () => {
 try {
 setLoading(true);
 setError(null);
 
 const token = getToken();
 if (!token) return;

 const response = await fetch(
 `http://localhost:3001/api/intervention/${id}`,
 {
 method: "GET",
 headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${token}`,
 },
 }
 );

 if (!response.ok) {
 throw new Error(`Failed to fetch details: ${response.status}`);
 }

 const result = await response.json();
 const data = result.data || result;
 
 // Format the data
 setWorkOrder({
 id: data.id,
 location: data.location?.name || "Not specified",
 description: data.description || "No description provided",
 equipment: data.equipment?.inventoryCode 
 ? `${data.equipment.inventoryCode} - ${data.equipment.type?.name || 'Unknown'} - ${data.equipment.model || 'Unknown'}`
 : "Not specified",
 priority: mapPriorityFromAPI(data.priority),
 pictures: data.attachments?.map(a => a.filename) || [],
 status: mapStatusFromAPI(data.status),
 assignees: formatAssignees(data.assignees || []),
 technicianActions: data.action || "",
 partsUsed: data.partsUsed || "",
 notes: data.notes || "",
 timer: data.timeSpent ? formatTimeSpent(data.timeSpent) : "00:00:00",
 createdAt: new Date(data.createdAt).toLocaleDateString(),
 raw: data
 });
 } catch (error) {
 console.error("Error fetching work order details:", error);
 setError(error.message);
 
 // For demo purposes in development - provide sample data
 if (process.env.NODE_ENV === 'development') {
 setWorkOrder(getSampleWorkOrder(id));
 }
 } finally {
 setLoading(false);
 }
 };

 fetchWorkOrderDetails();
 }, [id, router]);

 // Sample data for development
 const getSampleWorkOrder = (id) => {
 return {
 id: id,
 location: "S7",
 description: "test",
 equipment: "13398 - Unknown - Unknown",
 priority: "High",
 pictures: [],
 status: "In Progress",
 assignees: [
 { id: 1, name: "A", avatar: "A" },
 { id: 2, name: "B", avatar: "B" },
 { id: 3, name: "C", avatar: "T" }
 ],
 technicianActions: "",
 partsUsed: "",
 notes: "",
 timer: "00:12:12",
 createdAt: "13/05/2025"
 };
 };

 // Format assignees from API response
 const formatAssignees = (assignees) => {
 return assignees.map(assignment => {
 const person = assignment.person || {};
 const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email || 'Unknown';
 const initials = name.charAt(0).toUpperCase();
 
 return {
 id: person.id,
 name,
 avatar: initials,
 email: person.email
 };
 });
 };

 // Format time spent (seconds to HH:MM:SS)
 const formatTimeSpent = (seconds) => {
 const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
 const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
 const secs = (seconds % 60).toString().padStart(2, '0');
 return `${hours}:${minutes}:${secs}`;
 };

 // Map API status to UI status
 const mapStatusFromAPI = (apiStatus) => {
 if (!apiStatus) return "Pending";
 const statusMap = {
 "IN_PROGRESS": "In Progress",
 "COMPLETED": "Complete",
 "PENDING": "Pending", 
 "CANCELLED": "Cancelled",
 "DENIED": "Denied",
 "PAUSED": "Paused"
 };
 return statusMap[apiStatus] || apiStatus;
 };

 // Map API priority to UI priority
 const mapPriorityFromAPI = (apiPriority) => {
 if (!apiPriority) return "Low";
 const priorityMap = {
 "HIGH": "High",
 "MEDIUM": "Medium",
 "MED": "Medium",
 "LOW": "Low"
 };
 return priorityMap[apiPriority] || apiPriority;
 };

 // Handle begin work order
 const handleBeginTask = async () => {
 if (isSubmitting) return;
 
 try {
 setIsSubmitting(true);
 const token = getToken();
 if (!token) return;
 
 const response = await fetch(
 `http://localhost:3001/api/intervention/${id}`,
 {
 method: "PUT",
 headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${token}`,
 },
 body: JSON.stringify({ status: "IN_PROGRESS" }),
 }
 );
 
 if (!response.ok) {
 throw new Error(`Server error: ${response.status}`);
 }
 
 // Update local state
 setWorkOrder(prev => ({
 ...prev,
 status: "In Progress"
 }));
 
 // Navigate back to work orders list
 router.push("/technician/workOrders");
 } catch (error) {
 console.error("Error beginning task:", error);
 
 // For demo purposes - update status locally anyway
 if (process.env.NODE_ENV === 'development') {
 setWorkOrder(prev => ({
 ...prev,
 status: "In Progress"
 }));
 setTimeout(() => router.push("/technician/workOrders"), 500);
 }
 } finally {
 setIsSubmitting(false);
 }
 };
 
 // Handle pause work order
 const handlePauseTask = async () => {
 if (isSubmitting) return;
 
 try {
 setIsSubmitting(true);
 const token = getToken();
 if (!token) return;
 
 const response = await fetch(
 `http://localhost:3001/api/intervention/${id}/pause`,
 {
 method: "PUT",
 headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${token}`,
 }
 }
 );
 
 if (!response.ok) {
 throw new Error(`Server error: ${response.status}`);
 }
 
 // Update local state & navigate back
 setWorkOrder(prev => ({
 ...prev,
 status: "Paused"
 }));
 router.push("/technician/workOrders");
 
 } catch (error) {
 console.error("Error pausing task:", error);
 
 // For demo purposes - update status locally anyway
 if (process.env.NODE_ENV === 'development') {
 setWorkOrder(prev => ({
 ...prev,
 status: "Paused"
 }));
 setTimeout(() => router.push("/technician/workOrders"), 500);
 }
 } finally {
 setIsSubmitting(false);
 }
 };

 // Handle resume work order
 const handleResumeTask = async () => {
 if (isSubmitting) return;
 
 try {
 setIsSubmitting(true);
 const token = getToken();
 if (!token) return;
 
 const response = await fetch(
 `http://localhost:3001/api/intervention/${id}/resume`,
 {
 method: "PUT",
 headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${token}`,
 }
 }
 );
 
 if (!response.ok) {
 throw new Error(`Server error: ${response.status}`);
 }
 
 // Update local state & navigate back
 setWorkOrder(prev => ({
 ...prev,
 status: "In Progress"
 }));
 router.push("/technician/workOrders");
 
 } catch (error) {
 console.error("Error resuming task:", error);
 
 // For development
 if (process.env.NODE_ENV === 'development') {
 setWorkOrder(prev => ({
 ...prev,
 status: "In Progress"
 }));
 setTimeout(() => router.push("/technician/workOrders"), 500);
 }
 } finally {
 setIsSubmitting(false);
 }
 };

 const breadcrumbItems = [
 { label: 'Work Orders', href: "/technician/workOrders" },
 { label: 'Details', href: "#" }
 ];

 return (
 <section className="w-full min-h-screen flex flex-col sm:flex-row items-start justify-center bg-gray-100 relative overflow-x-hidden">
 {/* Arrow decoration */}
 <div className="hidden sm:block absolute top-0 right-0 z-10">
 <Image src={arrows} alt="" width={212} />
 </div>

 <div className={`w-full z-30 ${isMobile ? '' : 'ml-[120px]'}`}>
 {/* Header area with breadcrumb navigation */}
 <div className="mb-3">
 <h1 className="font-oxanium p-3 sm:p-6 font-semibold text-base sm:text-[26.07px] border-b">
 <Breadcrumb items={breadcrumbItems} />
 </h1>
 </div>

 {/* Main content area */}
 <div className="p-2 sm:p-4 flex justify-center">
 {/* Error message */}
 {error && (
 <div className="my-4 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm w-full max-w-6xl mx-auto">
 <div className="flex items-center mb-2">
 <AlertCircle className="h-5 w-5 mr-2" />
 <strong className="font-bold">Error loading details</strong>
 </div>
 <p>{error}</p>
 <div className="mt-4 flex justify-end">
 <button 
 onClick={() => router.push('/technician/workOrders')}
 className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md"
 >
 Back to Work Orders
 </button>
 </div>
 </div>
 )}

 {/* Loading state */}
 {loading && !error && (
 <div className="flex items-center justify-center w-full h-64">
 <div className="flex flex-col items-center">
 <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
 <p className="mt-4 text-gray-600">Loading work order details...</p>
 </div>
 </div>
 )}

 {/* Details content */}
 {!loading && !error && workOrder && (
 <ReportedIssueDetails 
 workOrder={workOrder}
 onBeginTask={handleBeginTask}
 onPauseTask={handlePauseTask}
 onResumeTask={handleResumeTask}
 isSubmitting={isSubmitting}
 />
 )}
 </div>
 </div>
 </section>
 );
}