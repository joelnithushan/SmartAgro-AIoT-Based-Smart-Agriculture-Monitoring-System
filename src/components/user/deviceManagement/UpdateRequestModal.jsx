import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase/firebase';
import toast from 'react-hot-toast';
const UpdateRequestModal = ({ request, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: request?.fullName || '',
    age: request?.age || '',
    nicNumber: request?.nicNumber || '',
    passportNumber: request?.passportNumber || '',
    email: request?.email || currentUser?.email || '',
    mobileNumber: request?.mobileNumber || '',
    address: request?.address || '',
    farmName: request?.farmName || '',
    farmSize: request?.farmSize || '',
    soilType: request?.soilType || '',
    farmLocation: request?.farmLocation || '',
    additionalSandType: request?.additionalSandType || '',
    additionalFarmInfo: request?.additionalFarmInfo || '',
    selectedParameters: request?.selectedParameters || [],
    additionalDeviceInfo: request?.additionalDeviceInfo || ''
  });
  const deviceParameters = [
    { id: 'soilMoisture', label: 'Soil Moisture', description: 'Monitor soil moisture levels' },
    { id: 'airHumidity', label: 'Air Humidity', description: 'Track air humidity percentage' },
    { id: 'airTemperature', label: 'Air Temperature', description: 'Monitor air temperature' },
    { id: 'soilTemperature', label: 'Soil Temperature', description: 'Track soil temperature' },
    { id: 'rainDetection', label: 'Rain Detection', description: 'Detect rainfall and intensity' },
    { id: 'lightLevel', label: 'Light Level (LDR)', description: 'Monitor light intensity' },
    { id: 'airQuality', label: 'Air Quality (MQ135)', description: 'Measure air quality and gas levels' },
    { id: 'waterPumpControl', label: 'Water Pump Relay Control', description: 'Control irrigation system' }
  ];
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
      newErrors.fullName = 'Full name should contain only letters and spaces';
    }
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 0 || age > 100) {
        newErrors.age = 'Age must be between 0 and 100';
      }
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email must contain @ symbol';
    }
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^(\+94|0)[0-9]{9}$/.test(formData.mobileNumber.replace(/\s/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid Sri Lankan mobile number (+94 or 0 format)';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.farmName.trim()) {
      newErrors.farmName = 'Farm name is required';
    }
    if (!formData.farmSize.trim()) {
      newErrors.farmSize = 'Farm size is required';
    } else if (isNaN(parseFloat(formData.farmSize)) || parseFloat(formData.farmSize) <= 0) {
      newErrors.farmSize = 'Farm size must be a valid positive number';
    }
    if (!formData.farmLocation.trim()) {
      newErrors.farmLocation = 'Farm location is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validateStep3 = () => {
    const newErrors = {};
    if (formData.selectedParameters.length === 0) {
      newErrors.selectedParameters = 'Please select at least one device parameter';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  const handleParameterToggle = (parameterId) => {
    setFormData(prev => ({
      ...prev,
      selectedParameters: prev.selectedParameters.includes(parameterId)
        ? prev.selectedParameters.filter(id => id !== parameterId)
        : [...prev.selectedParameters, parameterId]
    }));
    if (errors.selectedParameters) {
      setErrors(prev => ({
        ...prev,
        selectedParameters: ''
      }));
    }
  };
  const handleNext = () => {
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      default:
        isValid = false;
    }
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };
  const handleSubmit = async () => {
    if (!validateStep3()) {
      return;
    }
    setLoading(true);
    try {
      const updatedData = {
        fullName: formData.fullName.trim(),
        age: parseInt(formData.age),
        nicNumber: formData.nicNumber.trim() || null,
        passportNumber: formData.passportNumber.trim() || null,
        email: formData.email.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        address: formData.address.trim(),
        farmName: formData.farmName.trim(),
        farmSize: parseFloat(formData.farmSize),
        soilType: formData.soilType.trim() || null,
        farmLocation: formData.farmLocation.trim(),
        additionalSandType: formData.additionalSandType.trim() || null,
        additionalFarmInfo: formData.additionalFarmInfo.trim() || null,
        selectedParameters: formData.selectedParameters,
        additionalDeviceInfo: formData.additionalDeviceInfo.trim() || null,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: currentUser.uid,
        updateReason: 'User requested update'
      };
      console.log('📝 Updating device request:', request.id, updatedData);
      const requestRef = doc(db, 'deviceRequests', request.id);
      await updateDoc(requestRef, updatedData);
      console.log('✅ Device request updated successfully');
      toast.success('Device request updated successfully!');
      if (onSuccess) {
        onSuccess(request.id);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('❌ Error updating device request:', error);
      let errorMessage = 'Failed to update device request';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (error.message) {
        errorMessage = `Update failed: ${error.message}`;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
        <p className="text-sm text-gray-600">Update your personal information</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.age ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your age"
          />
          {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NIC Number
          </label>
          <input
            type="text"
            value={formData.nicNumber}
            onChange={(e) => handleInputChange('nicNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter your NIC number (optional)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Passport Number
          </label>
          <input
            type="text"
            value={formData.passportNumber}
            onChange={(e) => handleInputChange('passportNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter your passport number (optional)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.mobileNumber}
            onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.mobileNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+94XXXXXXXXX or 0XXXXXXXXX"
          />
          {errors.mobileNumber && <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address (Location) <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your complete address"
          />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
        </div>
      </div>
    </div>
  );
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Farm Details</h3>
        <p className="text-sm text-gray-600">Update information about your farm</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Farm Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.farmName}
            onChange={(e) => handleInputChange('farmName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.farmName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your farm name"
          />
          {errors.farmName && <p className="mt-1 text-sm text-red-600">{errors.farmName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Farm Size <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={formData.farmSize}
            onChange={(e) => handleInputChange('farmSize', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.farmSize ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter farm size in acres"
          />
          {errors.farmSize && <p className="mt-1 text-sm text-red-600">{errors.farmSize}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Soil Type
          </label>
          <select
            value={formData.soilType}
            onChange={(e) => handleInputChange('soilType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select soil type (optional)</option>
            <option value="clay">Clay</option>
            <option value="sandy">Sandy</option>
            <option value="loamy">Loamy</option>
            <option value="silty">Silty</option>
            <option value="peaty">Peaty</option>
            <option value="chalky">Chalky</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Farm Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.farmLocation}
            onChange={(e) => handleInputChange('farmLocation', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.farmLocation ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter farm location"
          />
          {errors.farmLocation && <p className="mt-1 text-sm text-red-600">{errors.farmLocation}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Sand Type
          </label>
          <input
            type="text"
            value={formData.additionalSandType}
            onChange={(e) => handleInputChange('additionalSandType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter additional sand type (optional)"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Information
          </label>
          <textarea
            value={formData.additionalFarmInfo}
            onChange={(e) => handleInputChange('additionalFarmInfo', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Any additional information about your farm (optional)"
          />
        </div>
      </div>
    </div>
  );
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Device Configuration</h3>
        <p className="text-sm text-gray-600">Update the parameters you want to monitor</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Available Parameters <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deviceParameters.map((param) => (
            <div
              key={param.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.selectedParameters.includes(param.id)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleParameterToggle(param.id)}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.selectedParameters.includes(param.id)}
                  onChange={() => handleParameterToggle(param.id)}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{param.label}</h4>
                  <p className="text-xs text-gray-600 mt-1">{param.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {errors.selectedParameters && (
          <p className="mt-2 text-sm text-red-600">{errors.selectedParameters}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Information
        </label>
        <textarea
          value={formData.additionalDeviceInfo}
          onChange={(e) => handleInputChange('additionalDeviceInfo', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Any additional requirements or information (optional)"
        />
      </div>
    </div>
  );
  if (!request) {
    return null;
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Update Device Request #{request.id.slice(-8)}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Step {currentStep} of 3</span>
              <span className="text-sm text-gray-600">{Math.round((currentStep / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        {}
        <div className="px-6 py-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
        {}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={currentStep === 1 ? onClose : handlePrevious}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </button>
            <div className="flex space-x-3">
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Request'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default UpdateRequestModal;