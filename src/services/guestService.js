/**
 * JSDoc for Guest Service data structures.
 *
 * @typedef {object} GuestDocument
 * @property {string} id - Unique ID for the guest document.
 * @property {string} filename
 * @property {string} file_type
 * @property {string} created_at - ISO string format.
 * @property {string} content - The extracted text content of the document.
 *
 * @typedef {object} GuestChatMessage
 * @property {string} id - Unique ID for the guest chat message.
 * @property {string} message - The user's message.
 * @property {string} response - The AI's response.
 * @property {string} [context_documents] - JSON string of context sources.
 * @property {string} created_at - ISO string format.
 */

class GuestService {
  constructor() {
    this.documentsKey = 'guestDocuments';
    this.chatHistoryKey = 'guestChatHistory';
  }

  /**
   * Retrieves guest documents from local storage.
   * @returns {GuestDocument[]} An array of guest documents.
   */
  getDocuments() {
    try {
      const stored = localStorage.getItem(this.documentsKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading guest documents:', error);
      return [];
    }
  }

  /**
   * Saves a new document to guest storage.
   * @param {object} documentData - The document data to save.
   * @param {string} documentData.filename
   * @param {string} documentData.file_type
   * @param {string} documentData.content
   * @returns {GuestDocument} The newly created guest document.
   */
  saveDocument(documentData) {
    const documents = this.getDocuments();
    const newDocument = {
      ...documentData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    
    documents.push(newDocument);
    localStorage.setItem(this.documentsKey, JSON.stringify(documents));
    return newDocument;
  }

  /**
   * Deletes a document from guest storage by its ID.
   * @param {string} documentId - The ID of the document to delete.
   * @returns {boolean} True if deletion was successful, false otherwise.
   */
  deleteDocument(documentId) {
    try {
      const documents = this.getDocuments();
      const filteredDocuments = documents.filter(doc => doc.id !== documentId);
      localStorage.setItem(this.documentsKey, JSON.stringify(filteredDocuments));
      return true;
    } catch (error) {
      console.error('Error deleting guest document:', error);
      return false;
    }
  }

  /**
   * Retrieves a single guest document by its ID.
   * @param {string} documentId - The ID of the document to retrieve.
   * @returns {GuestDocument | null} The document or null if not found.
   */
  getDocument(documentId) {
    const documents = this.getDocuments();
    return documents.find(doc => doc.id === documentId) || null;
  }

  /**
   * Retrieves the guest chat history from local storage.
   * @returns {GuestChatMessage[]} An array of guest chat messages.
   */
  getChatHistory() {
    try {
      const stored = localStorage.getItem(this.chatHistoryKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error)      {
      console.error('Error loading guest chat history:', error);
      return [];
    }
  }

  /**
   * Saves a new chat message to guest history.
   * @param {object} messageData - The chat message data.
   * @param {string} messageData.message
   * @param {string} messageData.response
   * @param {string} [messageData.context_documents]
   * @returns {GuestChatMessage} The newly created chat message.
   */
  saveChatMessage(messageData) {
    const history = this.getChatHistory();
    const newMessage = {
      ...messageData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    
    history.push(newMessage);
    localStorage.setItem(this.chatHistoryKey, JSON.stringify(history));
    return newMessage;
  }

  /**
   * Generates an AI response using the backend, providing document context if specified.
   * @param {string} message - The user's message.
   * @param {string[]} [selectedDocuments] - An array of selected document IDs for context.
   * @param {boolean} [useAllDocuments] - Flag to use all documents as context.
   * @returns {Promise<{response: string, context_used: boolean, context_sources: Array<{id: string, filename: string}>}>}
   */
  async generateAIResponse(message, selectedDocuments, useAllDocuments) {
    try {
      let context = '';
      let contextSources = [];

      if (useAllDocuments) {
        const allDocs = this.getDocuments();
        context = allDocs.map(doc => `--- Document: ${doc.filename} ---\n${doc.content}`).join('\n\n');
        contextSources = allDocs.map(doc => ({ id: doc.id, filename: doc.filename }));
      } else if (selectedDocuments && selectedDocuments.length > 0) {
        const allDocs = this.getDocuments();
        const selectedDocs = allDocs.filter(doc => selectedDocuments.includes(doc.id));
        context = selectedDocs.map(doc => `--- Document: ${doc.filename} ---\n${doc.content}`).join('\n\n');
        contextSources = selectedDocs.map(doc => ({ id: doc.id, filename: doc.filename }));
      }
      
      const response = await fetch('https://vaibhavmurarka2.pythonanywhere.com/api/guest/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, context_sources: contextSources }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return {
        response: data.response,
        context_used: contextSources.length > 0,
        context_sources: contextSources,
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        response: `I apologize, but I encountered an error while processing your request: ${error}`,
        context_used: false,
        context_sources: [],
      };
    }
  }

  /**
   * Extracts text from a file using a backend API, with a local fallback for text files.
   * @param {File} file - The file to process.
   * @returns {Promise<string>} The extracted text or an error message.
   */
  async extractTextFromFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://vaibhavmurarka2.pythonanywhere.com/api/guest/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from file');
      }

      const data = await response.json();
      return data.extracted_text;
    } catch (error) {
      console.error('Error extracting text:', error);
      
      if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result);
          reader.onerror = () => reject(new Error('Failed to read text file'));
          reader.readAsText(file);
        });
      }
      
      return `[Error extracting text from ${file.name}]: ${error}`;
    }
  }

  /**
   * Clears all guest-related data from local storage.
   */
  clearAllData() {
    localStorage.removeItem(this.documentsKey);
    localStorage.removeItem(this.chatHistoryKey);
    localStorage.removeItem('guestMode');
  }

  /**
   * Provides information about the storage usage for guest data.
   * @returns {{documentsCount: number, chatMessagesCount: number, estimatedSize: string}}
   */
  getStorageInfo() {
    const documents = this.getDocuments();
    const chatHistory = this.getChatHistory();
    
    const totalBytes = JSON.stringify(documents).length + JSON.stringify(chatHistory).length;
    
    let estimatedSize;
    if (totalBytes < 1024) {
      estimatedSize = `${totalBytes} bytes`;
    } else if (totalBytes < 1024 * 1024) {
      estimatedSize = `${(totalBytes / 1024).toFixed(1)} KB`;
    } else {
      estimatedSize = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return {
      documentsCount: documents.length,
      chatMessagesCount: chatHistory.length,
      estimatedSize
    };
  }
}

export const guestService = new GuestService();

// Setup cleanup when user closes browser/tab
window.addEventListener('beforeunload', () => {
  if (localStorage.getItem('guestMode') === 'true') {
    guestService.clearAllData();
  }
});

// Setup visibility change handler to clear data after a period of inactivity.
document.addEventListener('visibilitychange', () => {
  const isGuestMode = localStorage.getItem('guestMode') === 'true';
  if (document.visibilityState === 'hidden') {
    if (isGuestMode) {
      localStorage.setItem('guestModeLastActive', Date.now().toString());
    }
  } else if (document.visibilityState === 'visible') {
    const lastActive = localStorage.getItem('guestModeLastActive');
    
    if (isGuestMode && lastActive) {
      const timeDiff = Date.now() - parseInt(lastActive, 10);
      // If user was away for more than 30 minutes, clear guest data and reload.
      if (timeDiff > 30 * 60 * 1000) {
        guestService.clearAllData();
        window.location.reload();
      }
    }
  }
});