import React, { useState } from 'react';

const FertilizerCalendar = ({ fertilizers, crops, onEdit, onDelete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showOccurrences, setShowOccurrences] = useState(false);

  const getCropName = (cropId) => {
    const crop = crops.find(c => c.id === cropId);
    return crop ? crop.cropName : 'Unknown Crop';
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateOccurrences = (fertilizer) => {
    const occurrences = [];
    const startDate = new Date(fertilizer.applicationDate);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Show next 3 months

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      occurrences.push(new Date(currentDate));

      // Calculate next occurrence
      switch (fertilizer.recurrence?.type) {
        case 'every_n_days':
          currentDate.setDate(currentDate.getDate() + (fertilizer.recurrence.n || 1));
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          break;
      }

      if (fertilizer.recurrence?.type === 'none') break;
    }

    return occurrences;
  };

  const getOccurrencesForDate = (date) => {
    const occurrences = [];
    
    fertilizers.forEach(fertilizer => {
      const fertilizerOccurrences = generateOccurrences(fertilizer);
      fertilizerOccurrences.forEach(occurrence => {
        if (occurrence.toDateString() === date.toDateString()) {
          occurrences.push({
            ...fertilizer,
            occurrenceDate: occurrence
          });
        }
      });
    });

    return occurrences;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const occurrences = getOccurrencesForDate(date);
      const isCurrentDay = isToday(date);
      const isSelectedDay = isSelected(date);

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 ${
            isCurrentDay ? 'bg-blue-50' : ''
          } ${isSelectedDay ? 'bg-green-100' : ''}`}
          onClick={() => {
            setSelectedDate(date);
            setShowOccurrences(occurrences.length > 0);
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${
              isCurrentDay ? 'text-blue-600' : 'text-gray-900'
            }`}>
              {day}
            </span>
            {occurrences.length > 0 && (
              <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                {occurrences.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {occurrences.slice(0, 2).map((occurrence, index) => (
              <div
                key={index}
                className="text-xs bg-green-200 text-green-800 px-1 rounded truncate"
                title={`${occurrence.fertilizerName} - ${getCropName(occurrence.cropId)}`}
              >
                {occurrence.fertilizerName}
              </div>
            ))}
            {occurrences.length > 2 && (
              <div className="text-xs text-gray-500">
                +{occurrences.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedOccurrences = selectedDate ? getOccurrencesForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {formatDate(currentDate)}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {renderCalendar()}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && selectedOccurrences.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Fertilizer Applications - {selectedDate.toLocaleDateString()}
          </h4>
          <div className="space-y-3">
            {selectedOccurrences.map((occurrence, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div>
                  <h5 className="font-medium text-gray-900">{occurrence.fertilizerName}</h5>
                  <p className="text-sm text-gray-600">{getCropName(occurrence.cropId)}</p>
                  {occurrence.notes && (
                    <p className="text-xs text-gray-500 mt-1">{occurrence.notes}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(occurrence)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(occurrence)}
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

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Legend</h4>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>Fertilizer Application</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FertilizerCalendar;
