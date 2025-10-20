import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { setupGlobalErrorHandlers, createErrorBoundary } from './components/common/ui/errorHandler';

// Setup global error handlers
setupGlobalErrorHandlers();

// Create error boundary
const ErrorBoundary = createErrorBoundary(App);

// Initialize app with error boundary
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ErrorBoundary />
  </React.StrictMode>
);
