import React, { useState, useEffect } from 'react';
import { auth } from '../../../services/firebase/firebase';
import { useAuth } from '../../../context/AuthContext';
import adminApi from '../../../services/api/adminApi';

const AuthDebug = () => {
  const { currentUser } = useAuth();
  const [authStatus, setAuthStatus] = useState({});
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = auth.currentUser;
        const token = user ? await user.getIdToken() : null;
        
        setAuthStatus({
          hasUser: !!user,
          userEmail: user?.email,
          hasToken: !!token,
          tokenLength: token?.length || 0,
          currentUserFromContext: !!currentUser,
          contextUserEmail: currentUser?.email
        });
      } catch (error) {
        setAuthStatus({ error: error.message });
      }
    };

    checkAuth();
  }, [currentUser]);

  const testApiCall = async () => {
    try {
      setTestResult({ loading: true });
      const result = await adminApi.getUsers();
      setTestResult({ success: true, data: result });
    } catch (error) {
      setTestResult({ error: error.message });
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Authentication Debug</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold">Auth Status:</h4>
        <pre className="bg-white p-2 rounded text-sm overflow-auto">
          {JSON.stringify(authStatus, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <button 
          onClick={testApiCall}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test API Call
        </button>
      </div>

      {testResult && (
        <div>
          <h4 className="font-semibold">API Test Result:</h4>
          <pre className="bg-white p-2 rounded text-sm overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;

