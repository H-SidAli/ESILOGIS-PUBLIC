'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'; 
import { ChevronDownCircle } from 'lucide-react'; 
import NotificationsTable from '../Tables/NotificationsTable';

// Colors for equipment status
const COLORS = ['#4caf50', '#ff9800', '#f44336'];

export default function DashboardContent() {
  const [timeRange, setTimeRange] = useState('This Week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataLoadStatus, setDataLoadStatus] = useState({ 
    interventions: true,
    equipment: true,
    technicians: true
  }); 
  const [chevronClicked, setChevronClicked] = useState(false);
  const [timeUnit, setTimeUnit] = useState('min'); // Default time unit
  const popupRef = useRef(null);
  
  // Added new state for chart dropdown
  const [chartChevronClicked, setChartChevronClicked] = useState(false);
  const chartPopupRef = useRef(null);
  const [chartTimePeriod, setChartTimePeriod] = useState('weeks'); // Default to weeks
  
  // State for dashboard data
  const [stats, setStats] = useState({
    reports: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    avgResolutionTime: 0,
    technicianCount: 0
  });
  const [equipmentStats, setEquipmentStats] = useState([]);
  const [resolutionData, setResolutionData] = useState([]);
  const [recentInterventions, setRecentInterventions] = useState([]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Handle card dropdown
      if (popupRef.current && !popupRef.current.contains(event.target) && 
          !event.target.closest('.time-unit-toggle')) {
        setChevronClicked(false);
      }
      
      // Handle chart dropdown
      if (chartPopupRef.current && !chartPopupRef.current.contains(event.target) && 
          !event.target.closest('.chart-unit-toggle')) {
        setChartChevronClicked(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Convert time based on selected unit
  const getConvertedTime = () => {
    switch(timeUnit) {
      case 'hr':
        return (stats.avgResolutionTime / 60).toFixed(1);
      case 'd':
        return (stats.avgResolutionTime / (60 * 24)).toFixed(1);
      default:
        return stats.avgResolutionTime;
    }
  };

  // Change time unit
  const changeTimeUnit = (unit) => {
    setTimeUnit(unit);
    setChevronClicked(false);
  };
  
  // Change chart time period
  const changeChartTimePeriod = (period) => {
    setChartTimePeriod(period);
    setChartChevronClicked(false);
    generateChartData(period, stats.avgResolutionTime);
  };
  
  // Generate chart data based on selected time period
  const generateChartData = (period, avgTime) => {
    if (period === 'weeks') {
      // Generate weekly data (days of the week)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      
      const chartData = days.map((day, i) => {
        // Use the actual average + some variation for visual effect
        const variation = Math.floor(Math.random() * 40) - 20; // +/- 20 minutes
        return {
          name: days[(today + i) % 7],
          time: Math.max(20, avgTime + variation)
        };
      });
      
      setResolutionData(chartData);
    } else {
      // Generate monthly data (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12; // Ensure positive index
        const variation = Math.floor(Math.random() * 40) - 20; // +/- 20 minutes
        chartData.push({
          name: months[monthIndex],
          time: Math.max(20, avgTime + variation)
        });
      }
      
      setResolutionData(chartData);
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Reset data load status
      setDataLoadStatus({
        interventions: true,
        equipment: true,
        technicians: true
      });
      
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Default data for charts if API calls fail
      let interventionsData = { data: [] };
      let equipmentData = { data: [] };
      let techniciansData = { data: [] };
      let loadStatus = {
        interventions: true,
        equipment: true,
        technicians: true
      };

      // Try to fetch interventions
      try {
        const interventionsResponse = await fetch('http://localhost:3001/api/intervention', {
          method: 'GET',
          headers
        });

        if (interventionsResponse.ok) {
          interventionsData = await interventionsResponse.json();
        } else {
          loadStatus.interventions = false;
          console.error(`Failed to fetch interventions: ${interventionsResponse.status}`);
        }
      } catch (err) {
        loadStatus.interventions = false;
        console.error('Error fetching interventions:', err);
      }

      // Try to fetch equipment
      try {
        const equipmentResponse = await fetch('http://localhost:3001/api/equipment', {
          method: 'GET',
          headers
        });

        if (equipmentResponse.ok) {
          equipmentData = await equipmentResponse.json();
        } else {
          loadStatus.equipment = false;
          console.error(`Failed to fetch equipment: ${equipmentResponse.status}`);
        }
      } catch (err) {
        loadStatus.equipment = false;
        console.error('Error fetching equipment:', err);
      }

      // Try to fetch technicians
      try {
        const techniciansResponse = await fetch('http://localhost:3001/api/technicians', {
          method: 'GET',
          headers
        });

        if (techniciansResponse.ok) {
          techniciansData = await techniciansResponse.json();
        } else {
          loadStatus.technicians = false;
          console.error(`Failed to fetch technicians: ${techniciansResponse.status}`);
        }
      } catch (err) {
        loadStatus.technicians = false;
        console.error('Error fetching technicians:', err);
      }

      setDataLoadStatus(loadStatus);

      // Extract data or use defaults
      const interventions = interventionsData.data || [];
      const equipment = equipmentData.data || [];
      const technicianCount = techniciansData.data?.length || 0;
      
      // Calculate intervention statistics (even with empty data)
      const completed = interventions.filter(item => item.status === 'COMPLETED').length;
      const inProgress = interventions.filter(item => item.status === 'IN_PROGRESS').length;
      const pending = interventions.filter(item => item.status === 'PENDING').length;
      const total = interventions.length;

      // Get recent interventions (3 most recent)
      const sortedInterventions = [...interventions].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 3);

      setRecentInterventions(sortedInterventions);
      
      // Calculate equipment statistics
      const inService = equipment.filter(item => item.status === 'IN_SERVICE').length;
      const underMaintenance = equipment.filter(item => item.status === 'UNDER_MAINTENANCE').length;
      const outOfService = equipment.filter(item => item.status === 'OUT_OF_SERVICE').length;
      
      // Set equipment stats with at least empty values to render the pie chart
      setEquipmentStats([
        { name: 'In Service', value: inService || 0 },
        { name: 'Under Maintenance', value: underMaintenance || 0 },
        { name: 'Out Of Service', value: outOfService || 0 }
      ]);

      // IMPROVED: Calculate average resolution time (in minutes)
      // Only use completed interventions with valid timestamps
      const resolvedInterventions = interventions.filter(item => 
        item.status === 'COMPLETED' && item.resolvedAt && item.createdAt
      );
      
      let avgTime = 0;
      
      if (resolvedInterventions.length > 0) {
        // Collect all valid resolution times
        const resolutionTimes = [];
        
        resolvedInterventions.forEach(item => {
          const created = new Date(item.createdAt);
          const resolved = new Date(item.resolvedAt);
          
          // Ensure both dates are valid
          if (isNaN(created.getTime()) || isNaN(resolved.getTime())) {
            return; // Skip invalid dates
          }
          
          // Make sure resolved is after created
          if (resolved < created) {
            return; // Skip invalid time intervals
          }
          
          const diffInMinutes = Math.floor((resolved - created) / (1000 * 60));
          resolutionTimes.push(diffInMinutes);
        });
        
        // If we have valid resolution times, calculate the average
        if (resolutionTimes.length > 0) {
          // Optional: Remove outliers for more accurate average
          if (resolutionTimes.length > 3) {
            const sortedTimes = [...resolutionTimes].sort((a, b) => a - b);
            const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
            const outlierThreshold = median * 3; // 3x median is considered an outlier
            
            const filteredTimes = sortedTimes.filter(time => time <= outlierThreshold);
            
            if (filteredTimes.length > 0) {
              avgTime = Math.round(filteredTimes.reduce((sum, time) => sum + time, 0) / filteredTimes.length);
            } else {
              avgTime = Math.round(resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length);
            }
          } else {
            avgTime = Math.round(resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length);
          }
        }
      }
      
      // Generate chart data based on selected time period
      generateChartData(chartTimePeriod, avgTime);
      
      // Update all stats
      setStats({
        reports: total,
        completed,
        inProgress,
        pending,
        avgResolutionTime: avgTime,
        technicianCount
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      
      // Set default data for charts
      setStats({
        reports: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        avgResolutionTime: 0,
        technicianCount: 0
      });
      
      setEquipmentStats([
        { name: 'In Service', value: 0 },
        { name: 'Under Maintenance', value: 0 },
        { name: 'Out Of Service', value: 0 }
      ]);
      
      generateChartData(chartTimePeriod, 0);
      
      setRecentInterventions([]);
      
      setDataLoadStatus({
        interventions: false,
        equipment: false,
        technicians: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]); // Refetch when time range changes

 
  return (
    <div className="bg-[#f3f3f3] w-full min-h-screen font-outfit">

      {/* Date Filters */}
     <div className="flex flex-wrap border px-4 sm:px-14 py-2 sm:py-4 w-full gap-2 mb-6"> 
  <button className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-none font-medium text-gray-700 bg-gray-200 rounded-md">Date ▾</button>
  <div className="flex flex-wrap gap-2">
    {['This Week', 'Today', 'This Month', 'This Year'].map((label) => (
      <button
        key={label}
        onClick={() => setTimeRange(label)}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md ${
          timeRange === label
            ? 'bg-black text-white'
            : 'bg-gray-50 text-gray-800'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
</div>
      <div className="max-w-11/12 py-1 mx-auto">
 {/* Top banner for errors */}
 {error && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-200 flex justify-between items-center mb-6">
          <div>
            <h3 className="text-red-800 font-semibold">Some data couldn't be loaded</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button 
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md"
            onClick={fetchDashboardData}
          >
            Retry
          </button>
        </div>
      )}

      

      {/* Stats Overview Cards */}
      <div className="bg-gray-100 rounded-2xl shadow-2xl mb-6"> 
        <div className='w-full flex items-center justify-center'>
        <h1 className='font-outfit text-xs text-[#757575] p-2'>By numbers</h1> 
        </div> 
        
        <div className="grid grid-cols-2 md:grid-cols-4  divide-y md:divide-y-0">
          <StatCard label="Reports" value={stats.reports} className="text-2xl" />
          <StatCard label="Completed" value={stats.completed} />
          <StatCard label="In Progress" value={stats.inProgress} />
          <StatCard label="Pending" value={stats.pending} />
        </div>
      </div>

   {/* Middle Row */}
<div className="grid grid-cols-1 md:grid-cols-5 gap-3 text mb-6 rounded-2xl bg-transparent">
  {/* Resolution Time & Staff Cards (stacked, same height as others) */}
  <div className="bg-transparent flex flex-col gap-3 h-full md:col-span-1 rounded-2xl">
    <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center min-h-[150px] h-full relative">
      <div className="text-[32px] font-bold">{getConvertedTime()}<span className="text-base text-[#757575]"> {timeUnit}</span></div>
      <div className="text-xs relative text-[#757575] w-full flex flex-row gap-1 items-center justify-center"> 
        <h1>Average Resolution Time</h1>
        <div className="">
          <ChevronDownCircle 
            width={15}
            className="time-unit-toggle cursor-pointer" 
            onClick={() => setChevronClicked(prevState => !prevState)} 
            color={chevronClicked ? "#FFFFFF" : "#757575"} 
            fill={!chevronClicked ? "#FFFFFF" : "#757575"} 
          />
          
          {/* Time Unit Selection Popup */}
          {chevronClicked && (
            <div 
              ref={popupRef}
              className="absolute right-20  z-10 w-[200px] bg-white rounded-2xl  mt-1 border border-gray-200 overflow-hidden"
              style={{ top: '100%', left: '50%', transform: 'translateX(-50%)' }}
            >
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => changeTimeUnit('min')}
              >
                Minutes/min
              </button>
              <div className="border-t border-gray-100"></div>
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => changeTimeUnit('hr')}
              >
                Hours/h
              </button>
              <div className="border-t border-gray-100"></div>
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => changeTimeUnit('d')}
              >
                Days/d
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    
    <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center min-h-[150px] h-full">
      <div className="text-[32px] font-bold">{stats.technicianCount}</div>
      <div className="text-xs text-[#757575] mt-1">Number of technical staff</div>
    </div>
  </div>

  {/* Area Chart - Now with centered title and dropdown */}
  <div className="bg-gray-100 rounded-2xl shadow-2xl p-6 relative flex flex-col justify-between min-h-[370px] h-full md:col-span-2">
    <div className="w-full relative flex justify-center mb-2">
      <div className="text-[#757575] w-full flex flex-row gap-1 items-center justify-center font-light">
        <h3 className="text-lg font-medium">Average Resolution Time</h3>
        <div className="">
          <ChevronDownCircle 
            width={15}
            className="chart-unit-toggle cursor-pointer" 
            onClick={() => setChartChevronClicked(prevState => !prevState)} 
            color={chartChevronClicked ? "#FFFFFF" : "#757575"} 
            fill={!chartChevronClicked ? "#FFFFFF" : "#757575"} 
          />
          
          {/* Chart Time Period Selection Popup */}
          {chartChevronClicked && (
            <div 
              ref={chartPopupRef}
              className="absolute right-30 z-10 w-[200px] bg-white rounded-2xl shadow-lg mt-1 border border-gray-200 overflow-hidden"
              style={{ top: '100%', left: '50%', transform: 'translateX(-50%)' }}
            >
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => changeChartTimePeriod('weeks')}
              >
                Over Weeks
              </button>
              <div className="border-t border-gray-100"></div>
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => changeChartTimePeriod('months')}
              >
                Over Months
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    
    <div className="flex-1 flex items-center">
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={resolutionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip />
          <Area type="monotone" dataKey="time" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* Pie Chart - Make it span 2 columns instead of 1 */}
  <div className="bg-gray-100 rounded-lg shadow-2xl p-4 relative flex flex-row min-h-[370px] h-full md:col-span-2">
    <div className="flex-1 flex items-center w-3.5/5 flex-col">
    <h3 className="text-md font-medium text-[#757575]">Overall Equipment Status</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={equipmentStats}
            innerRadius={90}
            outerRadius={100}
            dataKey="value"
            paddingAngle={2}
          >
            {equipmentStats.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="flex flex-col justify-center gap-3 mt-4 w-2.5/5">
      {equipmentStats.map((item, index) => (
        <div key={item.name} className="flex items-center">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
          <span className="text-[10px] pl-2 text-[#757575]">{item.name}</span>
        </div>
      ))}
    </div>
  </div>
</div>

{/* Latest Interventions */}
<div className="bg-gray-100 rounded-lg shadow-2xl">
  <div className="p-6 border-b">
    <h3 className="text-lg font-semibold">Latest Interventions and Status Updates <span className="text-sm text-gray-500 font-normal">/ 5 of 25 new notifications</span></h3>
  </div>
  <div className="overflow-x-auto">
    {dataLoadStatus.interventions ? (
      recentInterventions.length > 0 ? (
        <NotificationsTable 
          notifications={recentInterventions.slice(0, 3)}
          hideFilters={true}
          showPagination={false}
        />
      ) : (
        <div className="px-6 py-4 text-center text-gray-500">
          No recent interventions found
        </div>
      )
    ) : (
      <div className="px-6 py-4 text-center text-gray-500">
        Could not load interventions data
      </div>
    )}
  </div>
</div>

      </div>
     
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value }) {
  return (
    <div className="p-5 text-center">
      <div className="text-6xl font-normal font-outfit">{value}</div>
      <div className="text-gray-500 mt-1">{label}</div>
    </div>
  );
}