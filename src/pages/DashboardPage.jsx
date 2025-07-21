import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatAPI, documentAPI } from '../services/api';
import { guestService } from '../services/guestService';
import ConfirmationModal from '../components/ConfirmationModal';

const DashboardPage = () => {
  const { user, logout, isGuestMode } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [contextMode, setContextMode] = useState('none');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const messagesEndRef = useRef(null);

  const loadChatHistory = useCallback(async () => {
    try {
      if (isGuestMode) {
        const guestHistory = guestService.getChatHistory();
        const convertedMessages = guestHistory.map(msg => ({
          id: parseInt(msg.id),
          user_id: -1,
          message: msg.message,
          response: msg.response,
          context_documents: msg.context_documents,
          created_at: msg.created_at,
        }));
        setMessages(convertedMessages);
      } else {
        const response = await chatAPI.getChatHistory();
        setMessages(response.history); 
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [isGuestMode]);

  const loadDocuments = useCallback(async () => {
    try {
      if (isGuestMode) {
        const guestDocs = guestService.getDocuments();
        const convertedDocs = guestDocs.map(doc => ({
          id: parseInt(doc.id),
          filename: doc.filename,
          file_type: doc.file_type,
          created_at: doc.created_at,
          content_length: doc.content.length,
        }));
        setDocuments(convertedDocs);
      } else {
        const response = await documentAPI.getDocuments();
        setDocuments(response.documents);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }, [isGuestMode]);

  useEffect(() => {
    loadChatHistory();
    loadDocuments();
  }, [loadChatHistory, loadDocuments]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    const newUserMessage = {
      id: Date.now(),
      user_id: user?.id || 0,
      message: userMessage,
      response: '',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      if (isGuestMode) {
        const useSelectedDocs = contextMode === 'selected' ? selectedDocuments.map(id => id.toString()) : undefined;
        const useAllDocs = contextMode === 'all';
        
        const response = await guestService.generateAIResponse(userMessage, useSelectedDocs, useAllDocs);
        
        const guestMessage = guestService.saveChatMessage({
          message: userMessage,
          response: response.response,
          context_documents: response.context_sources.length > 0 ? JSON.stringify(response.context_sources) : undefined,
        });

        const assistantMessage = {
          id: parseInt(guestMessage.id),
          user_id: -1,
          message: userMessage,
          response: response.response,
          context_documents: guestMessage.context_documents,
          created_at: guestMessage.created_at,
        };

        setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
      } else {
        const useSelectedDocs = contextMode === 'selected' ? selectedDocuments : undefined;
        const useAllDocs = contextMode === 'all';
        
        const response = await chatAPI.sendMessage(userMessage, useSelectedDocs, useAllDocs);
        
        const assistantMessage = {
          id: Date.now() + 1,
          user_id: user?.id || 0,
          message: userMessage,
          response: response.response,
          context_documents: JSON.stringify(response.context_sources),
          created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev.slice(0, -1), {
        ...newUserMessage,
        response: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      if (isGuestMode) {
        const extractedText = await guestService.extractTextFromFile(file);
        
        guestService.saveDocument({
          filename: file.name,
          content: extractedText,
          file_type: file.type || 'unknown',
        });

        loadDocuments();
        
        const systemMessage = {
          id: Date.now(),
          user_id: -1,
          message: `Uploaded document: ${file.name}`,
          response: `Successfully uploaded "${file.name}". You can now ask questions about this document.`,
          created_at: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, systemMessage]);
      } else {
        await documentAPI.upload(file);
        loadDocuments();
        
        const systemMessage = {
          id: Date.now(),
          user_id: user?.id || 0,
          message: `Uploaded document: ${file.name}`,
          response: `Successfully uploaded "${file.name}". You can now ask questions about this document.`,
          created_at: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleDocumentSelect = (documentId) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  const handleDeleteDocument = (documentId) => {
    setDocumentToDelete(documentId);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      if (isGuestMode) {
        const success = guestService.deleteDocument(documentToDelete.toString());
        if (success) {
          setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete));
          setSelectedDocuments(prev => prev.filter(id => id !== documentToDelete));
        }
      } else {
        await documentAPI.deleteDocument(documentToDelete);
        setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete));
        setSelectedDocuments(prev => prev.filter(id => id !== documentToDelete));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setDocumentToDelete(null);
      setIsModalOpen(false);
    }
  };

  const handleContextModeChange = (mode) => {
    setContextMode(mode);
    if (mode === 'none' || mode === 'all') {
      setSelectedDocuments([]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-primary-600 text-white flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold">AskStash</h1>
            {isGuestMode && (
              <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full">Guest Mode</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {isGuestMode && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-4 h-4 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-amber-800">Guest Mode Active</span>
              </div>
              <p className="text-xs text-amber-700">
                Full functionality available! Your data is stored locally and will be cleared when you close the browser. 
                <span className="block mt-1 font-medium">Register for permanent storage across devices!</span>
              </p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="file-upload" className="btn-primary block text-center cursor-pointer">
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md,.csv,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Context Mode</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contextMode"
                  value="none"
                  checked={contextMode === 'none'}
                  onChange={() => handleContextModeChange('none')}
                  className="mr-2"
                />
                <span className="text-sm">No context (General AI)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contextMode"
                  value="selected"
                  checked={contextMode === 'selected'}
                  onChange={() => handleContextModeChange('selected')}
                  className="mr-2"
                />
                <span className="text-sm">Selected documents</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="contextMode"
                  value="all"
                  checked={contextMode === 'all'}
                  onChange={() => handleContextModeChange('all')}
                  className="mr-2"
                />
                <span className="text-sm">All documents</span>
              </label>
            </div>
            
            {contextMode === 'selected' && (
              <div className="mt-2 text-xs text-blue-600">
                {selectedDocuments.length} document(s) selected
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Your Documents ({documents.length})
            </h3>
            <div className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No documents uploaded yet</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className={`text-sm p-3 border rounded-lg transition-colors ${
                    selectedDocuments.includes(doc.id) && contextMode === 'selected'
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          {contextMode === 'selected' && (
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc.id)}
                              onChange={() => handleDocumentSelect(doc.id)}
                              className="mr-2 mt-0.5"
                            />
                          )}
                          <div className="font-medium text-gray-900 truncate">{doc.filename}</div>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>{new Date(doc.created_at).toLocaleDateString()}</div>
                          {doc.content_length && (
                            <div>{doc.content_length.toLocaleString()} characters</div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* User/logout section */}
        <div className="border-t p-4 flex-shrink-0">
          {isGuestMode ? (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/register')}
                className="w-full btn-primary text-center"
              >
                Create Account
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full btn-secondary text-center"
              >
                Sign In
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-sm text-gray-600 hover:text-gray-800 text-center"
              >
                Exit Guest Mode
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.full_name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full btn-secondary text-left"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>Welcome! Upload a document and start chatting.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="chat-message user max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                    <p className="text-sm text-gray-800 break-words">{message.message}</p>
                  </div>
                </div>
                
                {/* Assistant Response */}
                {message.response && (
                  <div className="flex justify-start">
                    <div className="chat-message assistant max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                      {/* Context indicator */}
                      {message.context_documents && JSON.parse(message.context_documents).length > 0 && (
                        <div className="mb-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded break-all">
                          📄 Using context from: {
                            JSON.parse(message.context_documents).map((doc) => doc.filename).join(', ')
                          }
                        </div>
                      )}
                      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{message.response}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="chat-message assistant max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t p-4 flex-shrink-0">
          {/* Context status indicator */}
          {(contextMode === 'selected' && selectedDocuments.length > 0) || contextMode === 'all' ? (
            <div className="mb-3 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              💬 Context: {
                contextMode === 'all' 
                  ? `Using all ${documents.length} document(s) as context`
                  : `Using ${selectedDocuments.length} selected document(s) as context`
              }
            </div>
          ) : contextMode === 'selected' && selectedDocuments.length === 0 ? (
            <div className="mb-3 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              ⚠️ No documents selected. Select documents in the sidebar or switch to "All documents" mode.
            </div>
          ) : (
            <div className="mb-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              🤖 General AI mode - no document context
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                contextMode === 'none' 
                  ? "Ask me anything..." 
                  : "Ask questions about your documents..."
              }
              className="flex-1 input-field"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim() || (contextMode === 'selected' && selectedDocuments.length === 0)}
              className="btn-primary disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Document"
        message="Are you sure you want to permanently delete this document? This action cannot be undone."
      />
    </div>
  );
};

export default DashboardPage;