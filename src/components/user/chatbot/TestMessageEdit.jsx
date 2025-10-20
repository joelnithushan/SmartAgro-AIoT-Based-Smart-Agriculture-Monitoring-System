import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

const TestMessageEdit = () => {
  const { currentUser } = useAuth();
  const [testMessage, setTestMessage] = useState('How to grow rice in Sri Lanka?');
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleEdit = async () => {
    if (!currentUser) {
      setResult('❌ User not authenticated');
      return;
    }

    if (!editContent.trim()) {
      setResult('❌ Please enter new content');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      console.log('🧪 Testing message edit...');
      
      const token = await currentUser.getIdToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/agriculture-chat/messages/test-message-id`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editContent.trim(),
          chatId: 'test-chat-id'
        })
      });

      console.log('🧪 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Edit successful:', data);
        setResult('✅ Message edit test successful!');
        setTestMessage(editContent.trim());
        setIsEditing(false);
        setEditContent('');
      } else {
        const errorData = await response.json();
        console.error('❌ Edit failed:', errorData);
        setResult(`❌ Edit failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      setResult(`❌ Test error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Test Message Edit Functionality</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Message:
          </label>
          <div className="p-3 bg-gray-100 rounded border">
            {testMessage}
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Edit Message
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Content:
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter new message content..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleEdit}
                disabled={loading || !editContent.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Testing...' : 'Test Save'}
              </button>
              
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent('');
                  setResult('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className={`p-3 rounded ${
            result.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {result}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Test Steps:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Click "Edit Message"</li>
            <li>Enter new content</li>
            <li>Click "Test Save"</li>
            <li>Check the result above</li>
          </ol>
        </div>

        <div className="text-sm text-gray-500">
          <p><strong>Debug Info:</strong></p>
          <p>User: {currentUser ? 'Authenticated' : 'Not authenticated'}</p>
          <p>API URL: {process.env.REACT_APP_API_URL || 'http://localhost:5000'}</p>
        </div>
      </div>
    </div>
  );
};

export default TestMessageEdit;

