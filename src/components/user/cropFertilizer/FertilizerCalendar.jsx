import React, { useState } from 'react';

const FertilizerCalendar = ({ fertilizers, onAddFertilizer, onEditFertilizer, onDeleteFertilizer }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const hasFertilizerOnDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return fertilizers.some(fert => {
      const fertDate = new Date(fert.applicationDate);
      const fertDateStr = `${fertDate.getFullYear()}-${String(fertDate.getMonth() + 1).padStart(2, '0')}-${String(fertDate.getDate()).padStart(2, '0')}`;
      return fertDateStr === dateStr;
    });
  };
  
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasFertilizer = hasFertilizerOnDate(day);
      days.push(
        <div
          key={day}
          className={`h-12 border border-gray-200 flex items-center justify-center relative ${
            hasFertilizer ? 'bg-green-100' : 'hover:bg-gray-50'
          }`}
        >
          <span className="text-sm">{day}</span>
          {hasFertilizer && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
          )}
        </div>
      );
    }
    
    return days;
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Fertilizer Schedule</h3>
        <button
          onClick={onAddFertilizer}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Add Schedule
        </button>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <h4 className="text-lg font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h4>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>
      
      {fertilizers.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Upcoming Applications</h4>
          <div className="space-y-2">
            {fertilizers.slice(0, 3).map((fert) => (
              <div key={fert.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{fert.fertilizerName}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {new Date(fert.applicationDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEditFertilizer(fert)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteFertilizer(fert.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FertilizerCalendar;