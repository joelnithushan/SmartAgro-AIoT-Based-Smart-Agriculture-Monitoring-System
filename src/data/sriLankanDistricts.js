/**
 * Sri Lankan Districts Data
 * Complete list of all 25 districts in Sri Lanka
 */

export const SRI_LANKAN_DISTRICTS = [
  { value: 'colombo', label: 'Colombo' },
  { value: 'gampaha', label: 'Gampaha' },
  { value: 'kalutara', label: 'Kalutara' },
  { value: 'kandy', label: 'Kandy' },
  { value: 'matale', label: 'Matale' },
  { value: 'nuwara_eliya', label: 'Nuwara Eliya' },
  { value: 'galle', label: 'Galle' },
  { value: 'matara', label: 'Matara' },
  { value: 'hambantota', label: 'Hambantota' },
  { value: 'jaffna', label: 'Jaffna' },
  { value: 'kilinochchi', label: 'Kilinochchi' },
  { value: 'mannar', label: 'Mannar' },
  { value: 'vavuniya', label: 'Vavuniya' },
  { value: 'mullaitivu', label: 'Mullaitivu' },
  { value: 'batticaloa', label: 'Batticaloa' },
  { value: 'ampara', label: 'Ampara' },
  { value: 'trincomalee', label: 'Trincomalee' },
  { value: 'kurunegala', label: 'Kurunegala' },
  { value: 'puttalam', label: 'Puttalam' },
  { value: 'anuradhapura', label: 'Anuradhapura' },
  { value: 'polonnaruwa', label: 'Polonnaruwa' },
  { value: 'badulla', label: 'Badulla' },
  { value: 'moneragala', label: 'Moneragala' },
  { value: 'ratnapura', label: 'Ratnapura' },
  { value: 'kegalle', label: 'Kegalle' }
];

// Group districts by province for better organization
export const DISTRICTS_BY_PROVINCE = {
  'Western Province': [
    { value: 'colombo', label: 'Colombo' },
    { value: 'gampaha', label: 'Gampaha' },
    { value: 'kalutara', label: 'Kalutara' }
  ],
  'Central Province': [
    { value: 'kandy', label: 'Kandy' },
    { value: 'matale', label: 'Matale' },
    { value: 'nuwara_eliya', label: 'Nuwara Eliya' }
  ],
  'Southern Province': [
    { value: 'galle', label: 'Galle' },
    { value: 'matara', label: 'Matara' },
    { value: 'hambantota', label: 'Hambantota' }
  ],
  'Northern Province': [
    { value: 'jaffna', label: 'Jaffna' },
    { value: 'kilinochchi', label: 'Kilinochchi' },
    { value: 'mannar', label: 'Mannar' },
    { value: 'vavuniya', label: 'Vavuniya' },
    { value: 'mullaitivu', label: 'Mullaitivu' }
  ],
  'Eastern Province': [
    { value: 'batticaloa', label: 'Batticaloa' },
    { value: 'ampara', label: 'Ampara' },
    { value: 'trincomalee', label: 'Trincomalee' }
  ],
  'North Western Province': [
    { value: 'kurunegala', label: 'Kurunegala' },
    { value: 'puttalam', label: 'Puttalam' }
  ],
  'North Central Province': [
    { value: 'anuradhapura', label: 'Anuradhapura' },
    { value: 'polonnaruwa', label: 'Polonnaruwa' }
  ],
  'Uva Province': [
    { value: 'badulla', label: 'Badulla' },
    { value: 'moneragala', label: 'Moneragala' }
  ],
  'Sabaragamuwa Province': [
    { value: 'ratnapura', label: 'Ratnapura' },
    { value: 'kegalle', label: 'Kegalle' }
  ]
};

// Helper function to get district by value
export const getDistrictByValue = (value) => {
  return SRI_LANKAN_DISTRICTS.find(district => district.value === value);
};

// Helper function to get district display name
export const getDistrictDisplayName = (value) => {
  const district = getDistrictByValue(value);
  return district ? district.label : value;
};

// Helper function to get districts by province
export const getDistrictsByProvince = (province) => {
  return DISTRICTS_BY_PROVINCE[province] || [];
};

// Helper function to get all provinces
export const getAllProvinces = () => {
  return Object.keys(DISTRICTS_BY_PROVINCE);
};

export default SRI_LANKAN_DISTRICTS;
