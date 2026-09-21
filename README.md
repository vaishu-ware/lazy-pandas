# LazyPandas 🐼

A real-time chat application built with Node.js/Express (backend) and React (frontend).

## Features

- **User Authentication** — Register and login with JWT-based auth
- **One-on-One Chats** — Private messaging between any two users
- **Group Chats** — Create groups with multiple members
- **Real-Time Messaging** — Socket.IO for live message delivery
- **Unread Notifications** — Bell icon badge showing unread message count
- **Notification Popup** — Click the bell to see all chats with unread messages and jump directly into any conversation
- **Message Read Receipts** — Tracks which messages have been read by each user

## Tech Stack

### Backend
- **Node.js + Express** — REST API server
- **MongoDB (Mongoose)** — Data persistence
- **Socket.IO** — Real-time WebSocket communication
- **JWT** — Authentication

### Frontend
- **React + Vite** — Component-based UI
- **Socket.IO Client** — Real-time client
- **CSS** — Styling

## Project Structure

```
Lazy-Pandas/
├── backend/
│   ├── server.js              # Express server + Socket.IO initialization
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── messageController.js  # Message & notification logic
│   │   ├── chatController.js     # Chat creation & group logic
│   │   └── userController.js     # User auth & profile
│   ├── models/
│   │   ├── messageModel.js       # Message schema (with readBy array)
│   │   ├── chatModel.js          # Chat schema (1-on-1 or group)
│   │   └── userModel.js          # User schema
│   ├── routes/
│   │   ├── messageRoutes.js      # /api/message endpoints
│   │   └── chatRoutes.js         # /api/chat endpoints
│   └── sockets/
│       └── socket.js             # Socket.IO event handlers
└── frontend/
    ├── src/
    │   ├── App.jsx               # Root component
    │   ├── main.jsx              # Entry point
    │   ├── socket.js             # Socket.IO client instance
    │   └── pages/
    │       ├── Home.jsx          # Main chat interface
    │       ├── login.jsx         # Login page
    │       ├── Register.jsx      # Registration page
    │       └── Welcome.jsx       # Landing page
    └── ...
```

## API Endpoints

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/message` | Send a message |
| GET | `/api/message/:chatId` | Get messages for a chat |
| GET | `/api/message/unread/count` | Get total unread message count |
| GET | `/api/message/notifications` | Get all chats with unread messages (for popup) |
| PUT | `/api/message/read/:chatId` | Mark all messages in a chat as read |

### Chats
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Create or get a 1-on-1 chat |
| POST | `/api/chat/group` | Create a group chat |
| GET | `/api/chat/groups` | Get all groups for the logged-in user |

## Running the Project

### Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Dev server runs on http://localhost:5173
```

## Notification System

The notification feature works as follows:

1. When a user receives a new message via Socket.IO, the `notificationUpdate` event fires
2. The frontend calls `GET /api/message/notifications` which returns all chats with unread messages, including the latest message preview and unread count per chat
3. The bell icon badge shows the total unread count
4. Clicking the bell opens a popup listing each unread chat
5. Clicking any notification marks that chat's messages as read and opens the chat directly