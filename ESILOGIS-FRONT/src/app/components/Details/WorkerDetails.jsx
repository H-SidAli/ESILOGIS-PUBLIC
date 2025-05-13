import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

function WorkerDetails({ 
  workerId,  
  workerData = null,  
  isEditing = false, 
  onSave = () => {},  
  isLoading: externalLoading = false,  
  role = "admin" // Add role prop, default to admin
}) {
  // Force isEditing to false for technician
  const effectiveIsEditing = role === "technician" ? false : isEditing;

  const [worker, setWorker] = useState(workerData);
  const [loading, setLoading] = useState(externalLoading || !workerData);
  const [error, setError] = useState(null);

  // Mock data fetch function that uses the workerId
  const fetchWorkerData = async (id) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Return mock data based on ID
    return {
      id: id,
      firstName: `John${id}`,
      lastName: "Doe",
      department: id % 2 === 0 ? "Engineering" : "IT Support",
      email: `worker${id}@company.com`,
      phoneNumber: `+123456789${id}`,
      password: "SecurePass123",
      availability: [
        { day: "Monday", hours: "08:00 - 16:30" },
        { day: "Tuesday", hours: "08:00 - 16:30" },
        { day: "Wednesday", hours: "10:00 - 18:30" },
        { day: "Thursday", hours: "08:00 - 16:30" },
        { day: "Friday", hours: "08:00 - 13:00" }
      ],
      profileImage: "/Images/account_circle2.svg"
    };
  };

  useEffect(() => {
    // If data is already provided, use it
    if (workerData) {
      setWorker(workerData);
      setLoading(false);
      return;
    }
    // Otherwise, fetch data if we have a workerId
    if (workerId) {
      const loadWorkerData = async () => {
        try {
          setLoading(true);
          const data = await fetchWorkerData(workerId);
          setWorker(data);
          setError(null);
        } catch (error) {
          setError("Failed to load worker data");
        } finally {
          setLoading(false);
        }
      };
      loadWorkerData();
    }
  }, [workerId, workerData]);
  
  // Update worker state when workerData prop changes
  useEffect(() => {
    if (workerData) {
      setWorker(workerData);
      setLoading(false);
    }
  }, [workerData]);
  
  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-16 sm:py-32 bg-white rounded-3xl shadow-lg">
        <div className="text-lg sm:text-xl font-oxanium">Loading worker details...</div>
      </div>
    );
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="w-full flex justify-center items-center py-16 sm:py-32 bg-white rounded-3xl shadow-lg">
        <div className="text-lg sm:text-xl font-oxanium text-red-600">{error}</div>
      </div>
    );
  }

  // If worker data wasn't found
  if (!worker) {
    return (
      <div className="w-full flex justify-center items-center py-16 sm:py-32 bg-white rounded-3xl shadow-lg">
        <div className="text-lg sm:text-xl font-oxanium text-red-600">Worker data not found</div>
      </div>
    );
  }
  
  return (
    <div className="w-full flex flex-col justify-around h-full bg-white px-4 sm:px-8 md:px-16 lg:px-44 py-6 sm:py-10 lg:py-[50px] rounded-3xl shadow-lg"> 
      <div className='flex flex-col md:flex-row'>
        <div className="flex flex-col gap-6 sm:gap-12 w-full md:w-1/2">
          <div className='w-full flex justify-start'>
            <h2 className="font-oxanium text-xl sm:text-2xl lg:text-3xl font-semibold text-black">
              {effectiveIsEditing ? "Edit Worker Details" : "Worker's Details"}
            </h2>
          </div>
          {/* Profile image for mobile view */}
          <div className="flex justify-center md:hidden mb-4">
            <Image
              src={worker.profileImage}
              alt="Profile"
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
          {/* Left: Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 flex-1">
            <Detail label="First Name" value={worker.firstName} />
            <Detail label="Last Name" value={worker.lastName} />
            <Detail label="Departement" value={worker.department} />
            <Detail label="Email" value={worker.email} isLink />
            <Detail label="Phone Number" value={worker.phoneNumber} isLink />
            <Detail label="Password" value={worker.password} />
            <div className="col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-2">
              <h1 className='pb-2 text-sm sm:text-base font-oxanium font-semibold text-black'>Availability</h1>
              <div className="grid grid-cols-1 gap-1">
                {worker.availability.map((schedule, index) => (
                  <div key={index} className='flex justify-between w-full md:w-[250px] lg:w-[350px]'>
                    <p className="text-sm sm:text-base">{schedule.day}</p> 
                    <p className="text-sm sm:text-base whitespace-nowrap">{schedule.hours}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Right: Icon - hidden on mobile */}
        <div className="hidden md:flex w-full md:w-2/4 flex-col justify-start items-center">
          <div className='pt-10'>
            <Image
              src={worker.profileImage}
              alt="Profile"
              width={100}
              height={100}
            />
          </div>
        </div>
      </div>
      {/* Buttons with dynamic paths */}
      <div className="flex w-full sm:w-5/6 justify-center sm:justify-end mt-8 sm:mt-6 gap-3 sm:gap-2"> 
        {role === "technician" ? (
          <Link href="/technician/technical-staff">
            <button
              className="px-6 sm:px-10 py-1 text-sm sm:text-base text-black border border-black rounded-xl bg-white font-medium hover:bg-gray-100"
            >
              Back
            </button>
          </Link>
        ) : (
          <>
            <Link href="/admin/admin-technical-staff">
              <button
                className="px-6 sm:px-10 py-1 text-sm sm:text-base text-black border border-black rounded-xl bg-white font-medium hover:bg-gray-100"
              >
                Cancel
              </button>
            </Link>
            <Link href={`/admin/edit-worker-detail/${workerId}`}> 
              <button
                className="px-8 sm:px-16 py-1 text-sm sm:text-base text-white bg-[#0060B4] rounded-xl font-medium"
              >
                Edit Staff
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default WorkerDetails;

function Detail({ label, value, isLink }) {
  return (
    <>
      <div className="text-sm sm:text-base font-oxanium font-semibold text-black">{label}</div>
      {isLink ? (
        <a
          href={label === 'Email' ? `mailto:${value}` : `tel:${value}`}
          className="text-sm sm:text-base text-[#2f2f2f] underline hover:text-blue-700 transition-colors break-all"
        >
          {value}
        </a>
      ) : (
        <div className="text-sm sm:text-base text-[#2f2f2f] break-words">{value}</div>
      )}
    </>
  );
}