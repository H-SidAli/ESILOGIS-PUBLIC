"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Download, Edit, X, Loader, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const EquipmentDetails = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const equipmentId = searchParams.get("id");

    const [equipment, setEquipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Status mapping functions
    const mapBackendToFrontendStatus = (backendStatus) => {
        const statusMap = {
            IN_SERVICE: "In Service",
            OUT_OF_SERVICE: "Out of Service",
            UNDER_MAINTENANCE: "Under Maintenance",
            RETIRED: "Retired",
        };
        return statusMap[backendStatus] || backendStatus;
    };

    // Get status color based on status
    const getStatusColor = (status) => {
        const colorMap = {
            IN_SERVICE: "green",
            OUT_OF_SERVICE: "red",
            UNDER_MAINTENANCE: "orange",
            RETIRED: "gray",
        };
        return colorMap[status] || "gray";
    };

    // Fetch equipment details
    useEffect(() => {
        const fetchEquipmentDetails = async () => {
            if (!equipmentId) {
                setError("No equipment ID provided");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                console.log("Fetching equipment details for ID:", equipmentId);
                console.log(
                    "Using token:",
                    sessionStorage.getItem("token")
                        ? "Token exists"
                        : "No token found"
                );

                const response = await fetch(
                    `http://localhost:3001/api/equipment/${equipmentId}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${sessionStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                );

                console.log("Response status:", response.status);

                if (!response.ok) {
                    throw new Error(
                        `Error: ${response.status} ${response.statusText}`
                    );
                }

                const responseText = await response.text();
                console.log("Raw response:", responseText);

                let responseData;
                try {
                    responseData = JSON.parse(responseText);
                } catch (parseError) {
                    console.error("Error parsing JSON:", parseError);
                    throw new Error("Failed to parse server response");
                }

                console.log("Parsed equipment details:", responseData);

                // Check if response contains data property, otherwise use the whole response
                const equipmentData = responseData.data || responseData;

                if (!equipmentData) {
                    throw new Error("No equipment data received from server");
                }

                setEquipment(equipmentData);
            } catch (err) {
                console.error("Error fetching equipment details:", err);
                setError(err.message || "Failed to load equipment details");
            } finally {
                setLoading(false);
            }
        };

        fetchEquipmentDetails();
    }, [equipmentId]);

    const handleCancel = () => {
        router.push("/admin/equipments");
    };

    const handleEdit = () => {
        router.push(`/admin/equipments/edit-equipment?id=${equipmentId}`);
    };

    const handleDownload = () => {
        // Logic to handle download action
        if (equipment?.attachedFiles?.length > 0) {
            // Implement file download logic
            console.log("Downloading files:", equipment.attachedFiles);
        }
    };

    // Format date string (YYYY-MM-DD to DD/MM/YYYY)
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        try {
            const date = new Date(dateString);
            return `${date.getDate().toString().padStart(2, "0")}/${(
                date.getMonth() + 1
            )
                .toString()
                .padStart(2, "0")}/${date.getFullYear()}`;
        } catch (err) {
            console.error("Error formatting date:", err);
            return dateString;
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex w-full justify-center items-center bg-white py-8 md:py-12 mb-10 px-4 sm:px-6 rounded-3xl shadow-md">
                <div className="w-full max-w-3xl flex flex-col items-center justify-center py-12">
                    <Loader className="h-8 w-8 text-[#0060B4] animate-spin mb-4" />
                    <p className="text-gray-600">
                        Loading equipment details...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex w-full justify-center items-center bg-white py-8 md:py-12 mb-10 px-4 sm:px-6 rounded-3xl shadow-md">
                <div className="w-full max-w-3xl">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        <div className="flex items-center mb-2">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <p className="font-bold">
                                Error Loading Equipment Details
                            </p>
                        </div>
                        <p>{error}</p>
                        <p className="mt-2 text-sm">
                            Please check your network connection and make sure
                            you're logged in.
                        </p>
                    </div>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={handleCancel}
                            className="px-6 py-1.5 border-2 border-black rounded-lg sm:rounded-xl text-center"
                        >
                            Back to Equipment List
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If no data yet (should be covered by loading, but just in case)
    if (!equipment) {
        return (
            <div className="flex w-full justify-center items-center bg-white py-8 md:py-12 mb-10 px-4 sm:px-6 rounded-3xl shadow-md">
                <div className="w-full max-w-3xl">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
                        <p className="font-bold">No Data Available</p>
                        <p>
                            Could not retrieve equipment details. The equipment
                            may have been deleted or you may not have permission
                            to view it.
                        </p>
                    </div>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={handleCancel}
                            className="px-6 py-1.5 border-2 border-black rounded-lg sm:rounded-xl text-center"
                        >
                            Back to Equipment List
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Rest of your component remains the same
    // ...

    // Get color for status
    const statusColor = getStatusColor(equipment.status);

    return (
        <div className="flex w-full justify-center items-center bg-white py-8 md:py-12 mb-10 px-4 sm:px-6 rounded-3xl shadow-md">
            {/* Your existing JSX for displaying equipment data */}
            <div className="w-full max-w-3xl">
                <h1 className="text-xl md:text-2xl font-bold text-black mb-8 md:mb-10">
                    Equipment Details
                </h1>

                {/* Info rows */}
                <div className="space-y-4 md:space-y-6 text-sm md:text-[15px] text-black">
                    {/* Rest of your component... */}

                    {/* Mobile version stacks vertically */}
                    <div className="sm:hidden space-y-6">
                        <MobileInfoRow
                            label="Inventory Code"
                            value={equipment.inventoryCode || "N/A"}
                        />
                        <MobileInfoRow
                            label="Name"
                            value={equipment.type?.name || "N/A"}
                        />
                        <MobileInfoRow
                            label="Category"
                            value={equipment.type?.category || "N/A"}
                        />
                        <MobileInfoRow
                            label="Location"
                            value={equipment.location?.name || "N/A"}
                        />
                        <MobileInfoRow
                            label="Status"
                            value={
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                statusColor === "green"
                                                    ? "#16a34a"
                                                    : statusColor === "red"
                                                    ? "#dc2626"
                                                    : statusColor === "orange"
                                                    ? "#f97316"
                                                    : "#6b7280",
                                        }}
                                    ></span>
                                    <span className="text-black">
                                        {mapBackendToFrontendStatus(
                                            equipment.status
                                        )}
                                    </span>
                                </div>
                            }
                        />
                        <MobileInfoRow
                            label="Acquisition Date"
                            value={formatDate(equipment.acquisitionDate)}
                        />
                        <MobileInfoRow
                            label="Commission Date"
                            value={formatDate(equipment.commissionDate)}
                        />
                        <MobileInfoRow
                            label="Created At"
                            value={formatDate(equipment.createdAt)}
                        />
                        <MobileInfoRow
                            label="Last Updated"
                            value={formatDate(equipment.updatedAt)}
                        />
                        {equipment.nextScheduledMaintenance && (
                            <MobileInfoRow
                                label="Next Maintenance"
                                value={formatDate(
                                    equipment.nextScheduledMaintenance
                                )}
                            />
                        )}
                        {equipment.attachedFiles &&
                            equipment.attachedFiles.length > 0 && (
                                <MobileInfoRow
                                    label="Attached Files"
                                    value={
                                        <div className="space-y-1">
                                            {equipment.attachedFiles.map(
                                                (file, index) => (
                                                    <span
                                                        key={index}
                                                        className="text-black underline block"
                                                    >
                                                        {file.name}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    }
                                />
                            )}
                        <MobileInfoRow
                            label="Maintenance History"
                            value={
                                <Link
                                    href={`/admin/maintenance-history/${equipmentId}`}
                                    className="text-black underline"
                                >
                                    Go to Page →
                                </Link>
                            }
                        />
                    </div>

                    {/* Desktop version */}
                    <div className="hidden sm:block space-y-7">
                        <InfoRow
                            label="Inventory Code"
                            value={equipment.inventoryCode || "N/A"}
                        />
                        <InfoRow
                            label="Name"
                            value={equipment.type?.name || "N/A"}
                        />
                        <InfoRow
                            label="Category"
                            value={equipment.type?.category || "N/A"}
                        />
                        <InfoRow
                            label="Location"
                            value={equipment.location?.name || "N/A"}
                        />
                        <InfoRow
                            label="Status"
                            value={
                                <span
                                    className="flex items-center gap-2 font-medium"
                                    style={{
                                        color:
                                            statusColor === "green"
                                                ? "#16a34a"
                                                : statusColor === "red"
                                                ? "#dc2626"
                                                : statusColor === "orange"
                                                ? "#f97316"
                                                : "#6b7280",
                                    }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                statusColor === "green"
                                                    ? "#16a34a"
                                                    : statusColor === "red"
                                                    ? "#dc2626"
                                                    : statusColor === "orange"
                                                    ? "#f97316"
                                                    : "#6b7280",
                                        }}
                                    ></span>
                                    {mapBackendToFrontendStatus(
                                        equipment.status
                                    )}
                                </span>
                            }
                        />
                        <InfoRow
                            label="Acquisition Date"
                            value={formatDate(equipment.acquisitionDate)}
                        />
                        <InfoRow
                            label="Commission Date"
                            value={formatDate(equipment.commissionDate)}
                        />
                        <InfoRow
                            label="Created At"
                            value={formatDate(equipment.createdAt)}
                        />
                        <InfoRow
                            label="Last Updated"
                            value={formatDate(equipment.updatedAt)}
                        />
                        {equipment.nextScheduledMaintenance && (
                            <InfoRow
                                label="Next Maintenance"
                                value={formatDate(
                                    equipment.nextScheduledMaintenance
                                )}
                            />
                        )}
                        {equipment.attachedFiles &&
                            equipment.attachedFiles.length > 0 && (
                                <InfoRow
                                    label="Attached Files"
                                    value={
                                        <div className="space-y-1">
                                            {equipment.attachedFiles.map(
                                                (file, index) => (
                                                    <a
                                                        key={index}
                                                        href="#"
                                                        className="underline text-black block"
                                                    >
                                                        {file.name}
                                                    </a>
                                                )
                                            )}
                                        </div>
                                    }
                                />
                            )}
                        <InfoRow
                            label="Maintenance History"
                            value={
                                <Link
                                    href={`/admin/maintenance-history/${equipmentId}`}
                                    className="underline text-black flex items-center"
                                >
                                    Go to Page <span className="ml-1">→</span>
                                </Link>
                            }
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex sm:flex-row flex-col gap-3 mt-8 sm:mt-14 sm:justify-end">
                    <button
                        onClick={handleEdit}
                        className="w-full sm:w-auto px-6 py-1.5 bg-[#0060B4] text-white rounded-lg sm:rounded-xl text-center"
                    >
                        Edit Equipment
                    </button>
                    {equipment.attachedFiles &&
                        equipment.attachedFiles.length > 0 && (
                            <button
                                onClick={handleDownload}
                                className="w-full sm:w-auto p-1.5 bg-[#757575] text-white rounded-lg sm:rounded-xl text-center"
                            >
                                Download File
                            </button>
                        )}
                    <button
                        onClick={handleCancel}
                        className="w-full sm:w-auto px-6 py-1.5 border-2 border-black rounded-lg sm:rounded-xl text-center"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// InfoRow components remain the same
const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <span className="font-semibold">{label}</span>
        <span>{value}</span>
    </div>
);

const MobileInfoRow = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-sm font-semibold text-black">{label}</span>
        <span className="text-sm text-black">{value}</span>
    </div>
);

export default EquipmentDetails;
