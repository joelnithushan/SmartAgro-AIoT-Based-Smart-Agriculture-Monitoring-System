import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../../services/firebase/firebase';
import { validateFertilizerData } from '../../../components/common/validations/validation';
import toast from 'react-hot-toast';

const FertilizerSchedule = ({ crops }) => {
  const { user } = useAuth();
  const [fertilizers, setFertilizers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFertilizer, setEditingFertilizer] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const [formData, setFormData] = useState({
    cropId: '',
    fertilizerName: '',
    applicationDate: '',
    recurrence: {
      type: 'none',
      n: 1
    },
    notes: '',
    reminders: {
      email: false,
      sms: false
    }
  });

  // Load fertilizer schedules
  useEffect(() => {
    if (!user?.uid) return;

    const fertilizersRef = collection(db, 'users', user.uid, 'fertilizers');
    const q = query(fertilizersRef, orderBy('applicationDate', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fertilizerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFertilizers(fertilizerData);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const resetForm = () => {
    setFormData({
      cropId: '',
      fertilizerName: '',
      applicationDate: '',
      recurrence: {
        type: 'none',
        n: 1
      },
      notes: '',
      reminders: {
        email: false,
        sms: false
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    // Validate fertilizer data
    const validation = validateFertilizerData({
      fertilizerName: formData.fertilizerName,
      applicationDate: formData.applicationDate,
      quantity: formData.quantity
    });
    
    if (!validation.isValid) {
      toast.error('Please fix validation errors: ' + Object.values(validation.errors).join(', '));
      return;
    }

    try {
      const fertilizerData = {
        ...formData,
        applicationDate: new Date(formData.applicationDate),
        createdAt: new Date(),
        userId: user.uid
      };

      if (editingFertilizer) {
        await updateDoc(doc(db, 'users', user.uid, 'fertilizers', editingFertilizer.id), {
          ...fertilizerData,
          updatedAt: new Date()
        });
        toast.success('Fertilizer schedule updated!');
      } else {
        await addDoc(collection(db, 'users', user.uid, 'fertilizers'), fertilizerData);
        toast.success('Fertilizer schedule added!');
      }

      setShowModal(false);
      setEditingFertilizer(null);
      resetForm();
    } catch (error) {
      console.error('Error saving fertilizer schedule:', error);
      toast.error('Failed to save fertilizer schedule');
    }
  };

  const handleEdit = (fertilizer) => {
    setEditingFertilizer(fertilizer);
    setFormData({
      cropId: fertilizer.cropId || '',
      fertilizerName: fertilizer.fertilizerName || '',
      applicationDate: fertilizer.applicationDate?.toDate?.()?.toISOString().split('T')[0] || '',
      recurrence: fertilizer.recurrence || { type: 'none', n: 1 },
      notes: fertilizer.notes || '',
      reminders: fertilizer.reminders || { email: false, sms: false }
    });
    setShowModal(true);
  };

  const handleDelete = async (fertilizerId) => {
    if (!user?.uid || !window.confirm('Are you sure you want to delete this fertilizer schedule?')) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'fertilizers', fertilizerId));
      toast.success('Fertilizer schedule deleted!');
    } catch (error) {
      console.error('Error deleting fertilizer schedule:', error);
      toast.error('Failed to delete fertilizer schedule');
    }
  };

  const getCropName = (cropId) => {
    const crop = crops.find(c => c.id === cropId);
    return crop ? `${crop.cropName} ${crop.variety ? `(${crop.variety})` : ''}`.trim() : 'Unknown Crop';
  };

  const getRecurrenceText = (recurrence) => {
    switch (recurrence.type) {
      case 'every_n_days':
        return `Every ${recurrence.n} day${recurrence.n > 1 ? 's' : ''}`;
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return 'One-time';
    }
  };

  const isUpcoming = (date) => {
    const today = new Date();
    const appDate = date.toDate ? date.toDate() : new Date(date);
    const diffTime = appDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7; // Upcoming within 7 days
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fertilizer Schedule</h3>
          <p className="text-gray-600">Manage fertilizer applications for your crops</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'list' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === 'calendar' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Schedule
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {fertilizers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🌱</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No fertilizer schedules</h4>
              <p className="text-gray-600 mb-4">
                Create your first fertilizer schedule to keep track of applications
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crop
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fertilizer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recurrence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fertilizers.map((fertilizer) => (
                    <tr key={fertilizer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getCropName(fertilizer.cropId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fertilizer.fertilizerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fertilizer.applicationDate?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getRecurrenceText(fertilizer.recurrence)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isUpcoming(fertilizer.applicationDate) ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Upcoming
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            Scheduled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(fertilizer)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(fertilizer.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h4>
            <p className="text-gray-600">View your fertilizer schedules on a calendar</p>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Calendar Header */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date();
              const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
              const startDate = new Date(firstDay);
              startDate.setDate(startDate.getDate() - firstDay.getDay());
              const currentDate = new Date(startDate);
              currentDate.setDate(startDate.getDate() + i);
              
              const isCurrentMonth = currentDate.getMonth() === date.getMonth();
              const isToday = currentDate.toDateString() === new Date().toDateString();
              
              // Find fertilizers for this date
              const dayFertilizers = fertilizers.filter(fertilizer => {
                const fertilizerDate = fertilizer.applicationDate?.toDate?.() || new Date(fertilizer.applicationDate);
                return fertilizerDate.toDateString() === currentDate.toDateString();
              });
              
              return (
                <div
                  key={i}
                  className={`min-h-[80px] p-1 border border-gray-200 ${
                    dayFertilizers.length > 0 
                      ? 'bg-green-100 border-green-400' 
                      : isCurrentMonth 
                        ? 'bg-white' 
                        : 'bg-gray-50'
                  } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                >
                  <div className={`text-sm ${
                    dayFertilizers.length > 0 
                      ? 'text-green-800 font-bold' 
                      : isCurrentMonth 
                        ? 'text-gray-900' 
                        : 'text-gray-400'
                  } ${isToday ? 'font-bold text-blue-600' : ''}`}>
                    {currentDate.getDate()}
                  </div>
                  
                  {/* Fertilizer indicators */}
                  <div className="space-y-1">
                    {dayFertilizers.slice(0, 2).map((fertilizer, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-green-200"
                        title={`${fertilizer.fertilizerName} - ${getCropName(fertilizer.cropId)}`}
                        onClick={() => handleEdit(fertilizer)}
                      >
                        {fertilizer.fertilizerName}
                      </div>
                    ))}
                    {dayFertilizers.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayFertilizers.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                <span>Fertilizer Schedule</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-50 border border-blue-300 rounded mr-2"></div>
                <span>Today</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Click on a fertilizer to edit
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingFertilizer ? 'Edit Fertilizer Schedule' : 'Add Fertilizer Schedule'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingFertilizer(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Crop *
                    </label>
                    <select
                      value={formData.cropId}
                      onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select a crop...</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id}>
                          {getCropName(crop.id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fertilizer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fertilizerName}
                      onChange={(e) => setFormData({ ...formData, fertilizerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., NPK 10-10-10, Urea"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Application Date *
                    </label>
                    <input
                      type="date"
                      value={formData.applicationDate}
                      onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recurrence
                    </label>
                    <select
                      value={formData.recurrence.type}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        recurrence: { ...formData.recurrence, type: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="none">One-time</option>
                      <option value="every_n_days">Every N days</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {formData.recurrence.type === 'every_n_days' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Every N days
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.recurrence.n}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        recurrence: { ...formData.recurrence, n: parseInt(e.target.value) || 1 }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Additional notes about this fertilizer application..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reminders
                  </label>
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.reminders.email}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          reminders: { ...formData.reminders, email: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      Email reminder
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.reminders.sms}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          reminders: { ...formData.reminders, sms: e.target.checked }
                        })}
                        className="mr-2"
                      />
                      SMS reminder
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingFertilizer(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    {editingFertilizer ? 'Update Schedule' : 'Add Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FertilizerSchedule;
