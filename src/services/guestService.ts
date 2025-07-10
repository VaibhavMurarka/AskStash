import { Document, ChatMessage } from './api';

// Guest document interface with offline storage
export interface GuestDocument extends Omit<Document, 'id'> {
  id: string; // Use string IDs for guest mode
  content: string;
}

export interface GuestChatMessage extends Omit<ChatMessage, 'id' | 'user_id'> {
  id: string;
  context_documents?: string;
}

class GuestService {
  private documentsKey = 'guestDocuments';
  private chatHistoryKey = 'guestChatHistory';

  // Document operations
  getDocuments(): GuestDocument[] {
    try {
      const stored = localStorage.getItem(this.documentsKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading guest documents:', error);
      return [];
    }
  }

  saveDocument(document: Omit<GuestDocument, 'id' | 'created_at'>): GuestDocument {
    const documents = this.getDocuments();
    const newDocument: GuestDocument = {
      ...document,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    
    documents.push(newDocument);
    localStorage.setItem(this.documentsKey, JSON.stringify(documents));
    return newDocument;
  }

  deleteDocument(documentId: string): boolean {
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

  getDocument(documentId: string): GuestDocument | null {
    const documents = this.getDocuments();
    return documents.find(doc => doc.id === documentId) || null;
  }

  // Chat operations
  getChatHistory(): GuestChatMessage[] {
    try {
      const stored = localStorage.getItem(this.chatHistoryKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading guest chat history:', error);
      return [];
    }
  }

  saveChatMessage(message: Omit<GuestChatMessage, 'id' | 'created_at'>): GuestChatMessage {
    const history = this.getChatHistory();
    const newMessage: GuestChatMessage = {
      ...message,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    
    history.push(newMessage);
    localStorage.setItem(this.chatHistoryKey, JSON.stringify(history));
    return newMessage;
  }

  // AI chat with full Gemini integration
  async generateAIResponse(message: string, selectedDocuments?: string[], useAllDocuments?: boolean): Promise<{
    response: string;
    context_used: boolean;
    context_sources: Array<{ id: string; filename: string }>;
  }> {
    try {
      let context = '';
      let contextSources: Array<{ id: string; filename: string }> = [];

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

      const response = await fetch('https://vaibhavmurarka14.pythonanywhere.com/api/guest/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          context_sources: contextSources,
        }),
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

  // Text extraction with full backend API capabilities
  async extractTextFromFile(file: File): Promise<string> {
    try {
      // Use the same backend API for text extraction
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://vaibhavmurarka14.pythonanywhere.com/api/guest/extract-text', {
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
      
      // Fallback to basic text extraction for text files
      if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read text file'));
          reader.readAsText(file);
        });
      }
      
      return `[Error extracting text from ${file.name}]: ${error}`;
    }
  }

  // Cleanup function - called when user leaves or closes browser
  clearAllData(): void {
    localStorage.removeItem(this.documentsKey);
    localStorage.removeItem(this.chatHistoryKey);
    localStorage.removeItem('guestMode');
  }

  // Get storage usage info
  getStorageInfo(): { documentsCount: number; chatMessagesCount: number; estimatedSize: string } {
    const documents = this.getDocuments();
    const chatHistory = this.getChatHistory();
    
    const documentsSize = JSON.stringify(documents).length;
    const chatSize = JSON.stringify(chatHistory).length;
    const totalBytes = documentsSize + chatSize;
    
    const estimatedSize = totalBytes < 1024 
      ? `${totalBytes} bytes`
      : totalBytes < 1024 * 1024
      ? `${(totalBytes / 1024).toFixed(1)} KB`
      : `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;

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
  const isGuestMode = localStorage.getItem('guestMode') === 'true';
  if (isGuestMode) {
    guestService.clearAllData();
  }
});

// Setup visibility change handler to detect when user switches tabs/minimizes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    const isGuestMode = localStorage.getItem('guestMode') === 'true';
    if (isGuestMode) {
      // Set a timestamp when user hides the page
      localStorage.setItem('guestModeLastActive', Date.now().toString());
    }
  } else if (document.visibilityState === 'visible') {
    const isGuestMode = localStorage.getItem('guestMode') === 'true';
    const lastActive = localStorage.getItem('guestModeLastActive');
    
    if (isGuestMode && lastActive) {
      const timeDiff = Date.now() - parseInt(lastActive);
      // If user was away for more than 30 minutes, clear guest data
      if (timeDiff > 30 * 60 * 1000) {
        guestService.clearAllData();
        window.location.reload();
      }
    }
  }
}); 