import Link from "next/link";

function WorkOrderDetails({
  location,
  description,
  equipment,
  priority,
  pictures,
  status,
  assignees,
  technicianActions,
  partsUsed,
  notes,
  interventionTimeline,
  id,
  role = "technician" // default role
}) {
  return (
    <div className="w-full mx-auto bg-white font-oxanium p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg mt-4 sm:mt-10 border max-w-7xl">
      {/* No header title needed as per screenshot */}
      
      <div className="space-y-4 sm:space-y-6 w-full">
        {/* Location display */}
        <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
          <label className="text-gray-800 font-semibold">Location</label>
          <div>
            {location || "Not specified"}
          </div>
        </div>
        
        {/* Description */}
        <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
          <label className="text-gray-800 font-semibold">Description</label>
          <div className="whitespace-pre-wrap text-sm sm:text-base">
            {description || "No description provided."}
          </div>
        </div>
        
        {/* Equipment */}
        <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
          <label className="text-gray-800 font-semibold">Equipment</label>
          <div>
            {equipment || "Not specified"}
          </div>
        </div>
        
        {/* Priority */}
        <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
          <label className="text-gray-800 font-semibold">Priority</label>
          <div>
            <span className={`${
              priority === "High" ? "text-red-600" :
              priority === "Medium" ? "text-amber-500" :
              "text-blue-600"
            }`}>
              {priority}
            </span>
          </div>
        </div>
        
        {/* Pictures */}
        <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
          <label className="text-gray-800 font-semibold">Pictures</label>
          <div>
            {pictures && pictures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pictures.map((pic, index) => (
                  <div key={index} className="text-blue-600 underline text-sm sm:text-base">
                    {pic}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 text-sm sm:text-base">No pictures attached</span>
            )}
          </div>
        </div>
        
        {/* Assignees */}
        <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
          <label className="text-gray-800 font-semibold">Assignees</label>
          <div>
            {assignees && assignees.length > 0 ? (
              <div className="flex">
                {assignees.map((assignee) => (
                  <div key={assignee.id} className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold -ml-1 first:ml-0 border border-white">
                    {assignee.avatar}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 text-sm sm:text-base">No assignees</span>
            )}
          </div>
        </div>
        
        {/* Status */}
        <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
          <label className="text-gray-800 font-semibold">Status</label>
          <div className="flex items-center">
            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
              status?.toLowerCase() === "in progress" ? "bg-green-500" :
              status?.toLowerCase() === "complete" || status?.toLowerCase() === "completed" ? "bg-blue-500" :
              status?.toLowerCase() === "pending" ? "bg-yellow-400" :
              status?.toLowerCase() === "paused" ? "bg-orange-400" :
              "bg-red-500"
            }`}></div>
            <span className="capitalize text-sm sm:text-base">{status || "Unknown"}</span>
          </div>
        </div>
  
        {/* Technician Section - only show if status is complete or in progress */}
        {(status?.toLowerCase() === "complete" || status?.toLowerCase() === "completed" || status?.toLowerCase() === "in progress") && (
          <>
            <div className="pt-8 pb-2">
              <h3 className="text-lg font-semibold">Technician Section</h3>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
              <label className="text-gray-800 font-semibold">Actions</label>
              <div className="whitespace-pre-wrap text-sm sm:text-base">
                {technicianActions || "No actions recorded"}
              </div>
            </div>
            
            {/* Parts Used */}
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
              <label className="text-gray-800 font-semibold">Parts Used</label>
              <div className="whitespace-pre-wrap text-sm sm:text-base">
                {partsUsed || "No parts used"}
              </div>
            </div>
            
            {/* Notes */}
            <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] md:grid-cols-[180px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
              <label className="text-gray-800 font-semibold">Notes</label>
              <div className="whitespace-pre-wrap text-sm sm:text-base">
                {notes || "No notes"}
              </div>
            </div>
          </>
        )}
        
        {/* Intervention Timeline - as shown in screenshot */}
        {interventionTimeline && interventionTimeline.length > 0 && (
          <>
            <div className="pt-8 pb-2">
              <h3 className="text-lg font-semibold">Intervention Timeline</h3>
            </div>
            
            <div className="space-y-2">
              {interventionTimeline.map((item, index) => (
                <div key={index} className="grid grid-cols-[110px_1fr] sm:grid-cols-[150px_1fr] gap-4 items-start">
                  <div className="text-sm text-gray-600">{item.date} - {item.time}</div>
                  <div className="text-sm">{item.action}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Action button - just Cancel for this view */}
      <div className="flex justify-end pt-8">
        <Link 
          href={role === "admin" ? "/admin/reported-issues" : "/technician/workOrders"} 
          className="w-auto"
        > 
          <button
            type="button"
            className="px-8 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </Link>
      </div>
    </div>
  );
}

export default WorkOrderDetails;