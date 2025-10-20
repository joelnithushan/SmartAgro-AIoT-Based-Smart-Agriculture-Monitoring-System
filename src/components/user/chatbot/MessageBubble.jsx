import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const MessageBubble = ({ 
  message, 
  isEditing, 
  editingContent, 
  onEditStart, 
  onEditCancel, 
  onEditSave, 
  onEditContentChange,
  onDeleteMessage
}) => {
  const [showActions, setShowActions] = useState(false);
  const isUser = message.role === 'user';

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.toDate) {
      // Firestore timestamp
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      // Firestore timestamp object
      date = new Date(timestamp.seconds * 1000);
    } else {
      // Regular date
      date = new Date(timestamp);
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleEdit = () => {
    onEditStart(message.id, message.content);
  };

  const handleSave = () => {
    onEditSave();
  };

  const handleCancel = () => {
    onEditCancel();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDeleteMessage(message.id);
    }
  };

  if (isEditing) {
    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-3xl ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`rounded-lg p-4 ${
            isUser 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            <textarea
              value={editingContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              className="w-full bg-transparent border-none outline-none resize-none"
              rows={Math.min(editingContent.split('\n').length, 10)}
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={handleCancel}
                className="text-sm px-3 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Save & Resend
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-3xl ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`rounded-lg p-4 ${
          isUser 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-gray-800">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-gray-700">{children}</h3>,
                  p: ({ children }) => <p className="mb-2 text-gray-700">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-gray-700">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-gray-700">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                  pre: ({ children }) => <pre className="bg-gray-200 p-2 rounded text-sm font-mono overflow-x-auto mb-2">{children}</pre>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          <div className={`text-xs mt-2 ${
            isUser ? 'text-green-100' : 'text-gray-500'
          }`}>
            {formatTimestamp(message.createdAt)}
          </div>
        </div>
        
        {/* Action buttons for user messages */}
        {isUser && showActions && (
          <div className="flex justify-end mt-1 space-x-2">
            <button
              onClick={handleEdit}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;