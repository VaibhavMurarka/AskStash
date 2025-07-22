# AskStash

AskStash is an intelligent AI-powered chat application that allows you to upload your documents and have conversations with them. Get summaries, find specific information, and ask questions about your PDFs, text files, and more.

## Features

- **Secure User Authentication:** Sign up and log in to have your documents and chat history saved permanently.
- **Full-Featured Guest Mode:** Try out all the features without creating an account. Your data is stored locally in your browser for the session.
- **Document Upload:** Upload various file types, including `.pdf`, `.docx`, `.txt`, and more.
- **AI-Powered Chat:** Have natural conversations with a powerful AI assistant.
- **Context-Aware Conversations:** Choose how the AI uses your documents for context:
    - **General AI Mode:** Chat without using any document context.
    - **Selected Documents Mode:** Select one or more documents for the AI to reference.
    - **All Documents Mode:** The AI will use all of your uploaded documents as context for its responses.
- **Document Management:** Easily view and delete your uploaded documents.

## How to Use the App

### Step 1: Choose Your Path

When you first arrive, you can either sign in, create a new account, or try the app as a guest.

![Login Page](https://github.com/VaibhavMurarka/AskStash/blob/main/readmepictures/signin.png)

![Register Page](https://github.com/VaibhavMurarka/AskStash/blob/main/readmepictures/register.png)

### Step 2: The Dashboard

The main dashboard is split into two sections: the control sidebar on the left and the chat interface on the right.

![Dashboard Overview](https://github.com/VaibhavMurarka/AskStash/blob/main/readmepictures/guestmode.png)

### Step 3: Upload a Document

Click the "Upload Document" button in the sidebar to add a new file. The document will be processed and added to your list.

![Uploading a Document](https://github.com/VaibhavMurarka/AskStash/blob/main/readmepictures/fileupload.png)

### Step 4: Chat with Document Context

Set your context mode and ask questions about the document you uploaded. The AI will read the document to find the answer and indicate which document it used.

![Chatting with Context](https://github.com/VaibhavMurarka/AskStash/blob/main/readmepictures/fileselection.png)

### Step 5: Manage Your Documents

You can delete any document by clicking the trash icon next to its name in the sidebar.

![Deleting a Document](https://github.com/VaibhavMurarka/AskStash/blob/main/readmepictures/filedelete.png)

## Technologies Used

- **Frontend:** React, JavaScript , Tailwind CSS
- **Backend:** FastAPI (Python) , PostgreSQL
- **AI Model:** Google Gemini 
- **API Communication:** Axios
