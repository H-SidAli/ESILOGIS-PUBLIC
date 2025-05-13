import Link from "next/link";


function ReportDetailsView({
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
    type,
    CancelUrl, 
    id
  
  }) { 

    console.log("ReportDetailsView props:", {
      location,description,equipment,priority,pictures,status,assignees,technicianActions,partsUsed,notes,type,CancelUrl
    });
  return (
      <div className="w-full mx-auto bg-white font-oxanium p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg mt-4 sm:mt-10 border max-w-7xl">
        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">{type}</h2>
        
        <div className="space-y-4 sm:space-y-6 w-full">
          {/* Location display */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
            <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Location</label>
            <div className="w-full sm:col-span-10">
              <div className="p-2 border-2 border-gray-200 rounded-xl text-gray-700 bg-gray-50">
                {location || "Not specified"}
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-2">
            <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Description</label>
            <div className="border-2 border-gray-200 px-3 py-2 rounded-xl w-full min-h-[6rem] sm:min-h-[8rem] bg-gray-50 text-gray-700 sm:col-span-10">
              {description || "No description provided."}
            </div>
          </div>
          
          {/* Equipment */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
            <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Equipment</label>
            <div className="p-2 border-2 border-gray-200 rounded-xl w-full bg-gray-50 text-gray-700 sm:col-span-10">
              {equipment || "Not specified"}
            </div>
          </div>
          
          {/* Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
            <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Priority</label>
            <div className="sm:col-span-10">
              <div className={`inline-block px-4 py-1 rounded-full text-white text-sm ${
                priority === "High" ? "bg-red-100 text-red-600 border border-red-300" :
                priority === "Medium" ? "bg-yellow-100 text-yellow-700 border border-yellow-300" :
                "bg-blue-100 text-blue-600 border border-blue-300"
              }`}>
                {priority}
              </div>
            </div>
          </div>
          
          {/* Pictures */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
            <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Pictures</label>
            <div className="flex flex-wrap gap-2 items-center sm:col-span-10">
              {pictures && pictures.length > 0 ? (
                pictures.map((pic, index) => (
                  <div key={index} className="text-black text-xs sm:text-sm bg-gray-100 px-3 py-1 rounded">
                    {pic}
                  </div>
                ))
              ) : (
                <span className="text-gray-500">No pictures attached</span>
              )}
            </div>
          </div>
          
          {/* Assignees */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
            <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Assignees</label>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-10">
              {assignees && assignees.length > 0 ? (
                assignees.map((assignee) => (
                  <div key={assignee.id} className="flex items-center bg-gray-100 rounded-full pr-3">
                    <img
                      src={assignee.avatar}
                      alt={assignee.name}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                    <span className="ml-1 text-xs">{assignee.name}</span>
                  </div>
                ))
              ) : (
                <span className="text-gray-500">No assignees</span>
              )}
            </div>
          </div>
          
          {/* Status */}
          <div className="grid grid-cols-1 sm:grid-cols-12 items-start sm:items-center gap-2">
            <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Status</label>
            <div className="sm:col-span-10">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  status === "PENDING" ? "bg-yellow-400" :
                  status === "IN_PROGRESS" ? "bg-green-500" :
                  status === "COMPLETED" ? "bg-blue-500" :
                  status === "CANCELLED" ? "bg-red-500" :
                  status === "DENIED" ? "bg-red-500" :
                  status === "POSTPONED" ? "bg-orange-400" : 
                  status === "APPROVED" ? "bg-gray-500" :"bg-gray-500" 
                }`}></div>
                <span className="capitalize">{status}</span>
              </div>
            </div>
          </div>
  
          {/* Technician Section - only show if not pending */}
          {status !== "pending" && (
            <div className="flex flex-col space-y-4 pt-4 border-t mt-6">
              <h3 className="text-md sm:text-lg font-bold">Technician Section</h3>
              
              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-2">
                <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Actions</label>
                <div className="border-2 border-gray-200 p-3 rounded-xl w-full min-h-[5rem] sm:min-h-[6rem] bg-gray-50 text-gray-700 sm:col-span-10">
                  {technicianActions || "No actions recorded"}
                </div>
              </div>
              
              {/* Parts Used */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-2">
                <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Parts Used</label>
                <div className="border-2 border-gray-200 p-3 rounded-xl w-full min-h-[5rem] sm:min-h-[6rem] bg-gray-50 text-gray-700 sm:col-span-10">
                  {partsUsed || "No parts used"}
                </div>
              </div>
              
              {/* Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-12 items-start gap-2">
                <label className="text-gray-700 font-medium sm:col-span-2 mb-1 sm:mb-0">Notes</label>
                <div className="border-2 border-gray-200 p-3 rounded-xl w-full min-h-[5rem] sm:min-h-[6rem] bg-gray-50 text-gray-700 sm:col-span-10">
                  {notes || "No notes"}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Action buttons - different buttons for pending status */}
        {status === "PENDING" ? (
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8">
            <Link href={`../../${CancelUrl}`}  className="w-full sm:w-auto"> 
              <button
                type="button"
                className="w-full sm:w-auto px-6 sm:px-10 lg:px-14 py-2 sm:py-1 rounded-xl border-2 border-black bg-white text-black mb-3 sm:mb-0"
              >
                Cancel
              </button>
            </Link> 
            
            <button
              type="button"
              className="w-full sm:w-auto px-6 sm:px-10 lg:px-20 py-2 sm:py-1 rounded-xl bg-[#C90000] text-white"
            >
              Deny
            </button>
            
            <button
              type="button"
              className="w-full sm:w-auto px-6 sm:px-10 lg:px-20 py-2 sm:py-1 rounded-xl bg-[#0060B4] text-white"
            >
              Approve
            </button>
          </div>
        ) : (
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8">
            <Link href={`../../${CancelUrl}`} className="w-full sm:w-auto"> 
              <button
                type="button"
                className="w-full sm:w-auto px-6 sm:px-10 lg:px-14 py-2 sm:py-1 rounded-xl border-2 border-black bg-white text-black mb-3 sm:mb-0"
              >
                Cancel
              </button>
            </Link> 
            
            <button
              type="button"
              className="w-full sm:w-auto px-6 sm:px-10 lg:px-24 py-2 sm:py-1 rounded-xl bg-[#474747] text-white"
            >
              Download as pdf 
            </button>
            
            <Link href={`../../reported-issues/report-details-edit/${id}`}>
              <button
                type="button"
                className="w-full sm:w-auto px-6 sm:px-10 lg:px-24 py-2 sm:py-1 rounded-xl bg-[#0060B4] text-white"
              >
                Edit Report
              </button>
            </Link>
          </div>
        )}
      </div>
    );
  }

export default ReportDetailsView;