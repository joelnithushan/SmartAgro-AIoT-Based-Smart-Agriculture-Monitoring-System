import React, { useState, useEffect, useRef } from 'react';
import { 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const EnhancedPromptEdit = ({ 
  message, 
  onSave, 
  onCancel, 
  onReenter,
  isReentering = false 
}) => {
  const [editContent, setEditContent] = useState(message.content);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setEditContent(message.content);
  }, [message.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Select all text for easy editing
      textareaRef.current.setSelectionRange(0, textareaRef.current.value.length);
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editContent.trim() && editContent !== message.content) {
      try {
        await onSave(editContent.trim());
        console.log('✅ Message saved successfully');
      } catch (error) {
        console.error('❌ Error saving message:', error);
        alert('Failed to save message. Please try again.');
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
    onCancel();
  };

  const handleReenter = () => {
    if (editContent.trim()) {
      onReenter(editContent.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleReenter();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        {/* Edit Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">Editing message</span>
          </div>
          <div className="text-xs text-blue-600">
            Ctrl+Enter to re-submit • Esc to cancel
          </div>
        </div>

        {/* Edit Textarea */}
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={Math.max(3, Math.min(editContent.split('\n').length + 1, 8))}
          placeholder="Edit your message..."
        />

        {/* Edit Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={handleReenter}
              disabled={!editContent.trim() || isReentering}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {isReentering ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>Re-submitting...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  <span>Save & Re-submit</span>
                </>
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={!editContent.trim() || editContent === message.content}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              <CheckIcon className="w-4 h-4" />
              <span>Save Only</span>
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 flex items-center space-x-2 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            {editContent.length}/5000 characters
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      {/* Message Content */}
      <div className="prose prose-sm max-w-none text-sm leading-relaxed">
        <div className="whitespace-pre-wrap text-gray-700">
          {message.content}
        </div>
      </div>

      {/* Edit Button - Only for user messages */}
      {message.role === 'user' && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            title="Edit message"
          >
            <PencilIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Edited Indicator */}
      {message.edited && (
        <div className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
          <PencilIcon className="w-3 h-3" />
          <span>Edited</span>
        </div>
      )}
    </div>
  );
};

export default EnhancedPromptEdit;
