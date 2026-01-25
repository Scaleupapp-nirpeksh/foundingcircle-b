# FoundingCircle - WebSocket & Chat API Guide

> **For Frontend Developers**
> **Last Updated:** January 2026
> **API Version:** v1

---

## Table of Contents

1. [Overview](#1-overview)
2. [Socket.io Connection](#2-socketio-connection)
3. [Socket Events Reference](#3-socket-events-reference)
4. [HTTP API Endpoints](#4-http-api-endpoints)
5. [Data Models](#5-data-models)
6. [User Flows](#6-user-flows)
7. [Code Examples](#7-code-examples)
8. [Error Handling](#8-error-handling)

---

## 1. Overview

### How Chat Works in FoundingCircle

Chat is unlocked when a **mutual match** is established between a Founder and Builder:

```
Builder expresses interest → Founder shortlists → Chat enabled
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Real-time Messaging** | Instant message delivery via Socket.io |
| **Typing Indicators** | See when the other person is typing |
| **Read Receipts** | Know when messages are read |
| **Ice Breakers** | System-generated conversation starters |
| **Trial Integration** | Trial proposals/updates appear in chat |
| **Multi-device Sync** | Updates sync across all connected devices |
| **Message Types** | Text, attachments, system messages |

### Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐
│   Frontend  │◄──────────────────►│   Server    │
│  (Socket.io)│                    │ (Socket.io) │
└─────────────┘                    └─────────────┘
       │                                  │
       │  HTTP (REST)                     │
       └─────────────────────────────────►│
                                          ▼
                                   ┌─────────────┐
                                   │   MongoDB   │
                                   └─────────────┘
```

---

## 2. Socket.io Connection

### 2.1 Connection Setup

```javascript
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // or your production URL

const socket = io(SOCKET_URL, {
  auth: {
    token: localStorage.getItem('accessToken') // JWT token
  },
  transports: ['websocket', 'polling'], // Prefer WebSocket
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

### 2.2 Alternative Token Methods

The server accepts tokens in three ways:

```javascript
// Method 1: auth object (Recommended)
const socket = io(SOCKET_URL, {
  auth: { token: 'your-jwt-token' }
});

// Method 2: Authorization header
const socket = io(SOCKET_URL, {
  extraHeaders: {
    Authorization: 'Bearer your-jwt-token'
  }
});

// Method 3: Query parameter
const socket = io(`${SOCKET_URL}?token=your-jwt-token`);
```

### 2.3 Connection Events

```javascript
// Connection successful
socket.on('connect', () => {
  console.log('Connected to server');
  console.log('Socket ID:', socket.id);
});

// Connection confirmation with user info
socket.on('connected', ({ userId, socketId }) => {
  console.log('Authenticated as user:', userId);
});

// Disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // reason: 'io server disconnect', 'io client disconnect', 'ping timeout', etc.
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  // Handle token refresh if needed
  if (error.message.includes('expired')) {
    // Refresh token and reconnect
  }
});

// General error
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### 2.4 Reconnection Handling

```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Re-join conversation rooms if needed
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnection attempt:', attemptNumber);
  // Update token if it was refreshed
  socket.auth.token = localStorage.getItem('accessToken');
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect after all attempts');
  // Show error UI, prompt user to refresh
});
```

### 2.5 Health Check

```javascript
// Server pings client automatically
// You can also implement custom ping
socket.emit('ping');
socket.on('pong', () => {
  console.log('Server is alive');
});
```

---

## 3. Socket Events Reference

### 3.1 Events to EMIT (Client → Server)

#### Conversation Room Management

| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `{ conversationId: string }` | Join a conversation room to receive messages |
| `leave_conversation` | `{ conversationId: string }` | Leave a conversation room |

#### Typing Indicators

| Event | Payload | Description |
|-------|---------|-------------|
| `typing_start` | `{ conversationId: string }` | Notify others you're typing |
| `typing_stop` | `{ conversationId: string }` | Notify others you stopped typing |

#### Read Receipts

| Event | Payload | Description |
|-------|---------|-------------|
| `mark_read` | `{ conversationId: string, messageIds?: string[] }` | Mark messages as read (real-time broadcast) |

#### Notifications

| Event | Payload | Description |
|-------|---------|-------------|
| `notification_read` | `{ notificationId: string }` | Mark a notification as read |
| `notifications_read_all` | `{}` | Mark all notifications as read |
| `get_unread_count` | `{}` | Request unread notification count |

---

### 3.2 Events to LISTEN (Server → Client)

#### Connection Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ userId, socketId }` | Connection authenticated |
| `error` | `{ message: string }` | Error occurred |

#### Conversation Room Events

| Event | Payload | Description |
|-------|---------|-------------|
| `joined_conversation` | `{ conversationId }` | Successfully joined room |
| `left_conversation` | `{ conversationId }` | Successfully left room |

#### Messaging Events

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ conversationId, message }` | New message received |
| `message_sent` | `{ conversationId, message }` | Your message was delivered (confirmation) |
| `user_typing` | `{ conversationId, userId, userName }` | Other user is typing |
| `user_stopped_typing` | `{ conversationId, userId }` | Other user stopped typing |
| `messages_read` | `{ conversationId, readByUserId, messageIds }` | Your messages were read |

#### Notification Events

| Event | Payload | Description |
|-------|---------|-------------|
| `new_notification` | `{ notification }` | New notification received |
| `unread_count_updated` | `{ count }` | Unread count changed |
| `notification_marked_read` | `{ notificationId }` | Notification read (other device) |
| `all_notifications_marked_read` | `{}` | All read (other device) |

#### Interest/Match Events

| Event | Payload | Description |
|-------|---------|-------------|
| `new_interest` | `{ interest }` | Builder expressed interest (Founder only) |
| `builder_shortlisted` | `{ interest, opening }` | You were shortlisted (Builder only) |
| `new_match` | `{ match }` | New match created |
| `match_accepted` | `{ interestId, builderId, builderName }` | Builder accepted match proposal |

#### Trial Events

| Event | Payload | Description |
|-------|---------|-------------|
| `trial_proposed` | `{ trial }` | Trial was proposed |
| `trial_accepted` | `{ trial }` | Trial was accepted |
| `trial_update` | `{ trial, updateType }` | Trial status changed |

---

### 3.3 Message Object Structure

When you receive a `new_message` or `message_sent` event:

```typescript
interface Message {
  _id: string;
  conversation: string;           // Conversation ID
  sender: {
    _id: string;
    name: string;
    profilePhoto?: string;
  } | null;                       // null for system messages
  messageType: 'TEXT' | 'SYSTEM' | 'TRIAL_PROPOSAL' | 'TRIAL_UPDATE' | 'ATTACHMENT' | 'ICE_BREAKER';
  content: string;
  isSystemMessage: boolean;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file' | 'document';
  attachmentName?: string;
  attachmentSize?: number;
  readAt?: string;                // ISO date string if read
  metadata?: any;                 // For trial data, etc.
  createdAt: string;              // ISO date string
  updatedAt: string;
}
```

---

## 4. HTTP API Endpoints

**Base URL:** `/api/v1/conversations`
**All endpoints require:** `Authorization: Bearer <token>`

### 4.1 Conversation Management

#### Create Conversation from Match
```http
POST /api/v1/conversations/from-match/:interestId
```

Creates a conversation after shortlisting. Usually called automatically by the system.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "conv_123",
      "participants": ["user_1", "user_2"],
      "founder": "user_1",
      "builder": "user_2",
      "interest": "interest_123",
      "opening": "opening_456",
      "status": "ACTIVE",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  }
}
```

---

#### Get User's Conversations
```http
GET /api/v1/conversations
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | - | Filter: `ACTIVE`, `ARCHIVED` |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "_id": "conv_123",
        "participants": [
          { "_id": "user_1", "name": "John Founder", "profilePhoto": "url" },
          { "_id": "user_2", "name": "Jane Builder", "profilePhoto": "url" }
        ],
        "founder": { "_id": "user_1", "name": "John Founder" },
        "builder": { "_id": "user_2", "name": "Jane Builder" },
        "opening": {
          "_id": "opening_456",
          "title": "Technical Co-founder",
          "roleType": "COFOUNDER"
        },
        "lastMessage": {
          "_id": "msg_789",
          "content": "Looking forward to chatting!",
          "sender": "user_1",
          "createdAt": "2025-01-15T11:00:00.000Z"
        },
        "lastMessageAt": "2025-01-15T11:00:00.000Z",
        "messageCount": 5,
        "unreadCount": 2,
        "status": "ACTIVE",
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

---

#### Get Single Conversation
```http
GET /api/v1/conversations/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "conv_123",
      "participants": [/* populated user objects */],
      "founder": { /* populated */ },
      "builder": { /* populated */ },
      "interest": { /* populated interest */ },
      "opening": { /* populated opening */ },
      "trial": null,
      "status": "ACTIVE",
      "lastMessage": { /* populated message */ },
      "lastMessageAt": "2025-01-15T11:00:00.000Z",
      "messageCount": 5,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  }
}
```

---

#### Archive Conversation
```http
POST /api/v1/conversations/:id/archive
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "conv_123",
      "status": "ARCHIVED",
      "archivedAt": "2025-01-16T10:00:00.000Z",
      "archivedBy": "user_1"
    }
  }
}
```

---

#### Unarchive Conversation
```http
POST /api/v1/conversations/:id/unarchive
```

---

#### Get Conversation Stats
```http
GET /api/v1/conversations/:id/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalMessages": 25,
      "userMessages": 12,
      "otherMessages": 13,
      "unreadCount": 3,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "lastMessageAt": "2025-01-16T14:30:00.000Z"
    }
  }
}
```

---

### 4.2 Messaging

#### Get Messages
```http
GET /api/v1/conversations/:id/messages
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Messages per page |
| `before` | string | - | Cursor: Get messages before this ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "msg_001",
        "conversation": "conv_123",
        "sender": {
          "_id": "user_1",
          "name": "John Founder",
          "profilePhoto": "https://..."
        },
        "messageType": "TEXT",
        "content": "Hi! Thanks for expressing interest.",
        "isSystemMessage": false,
        "readAt": "2025-01-15T10:05:00.000Z",
        "createdAt": "2025-01-15T10:00:00.000Z"
      },
      {
        "_id": "msg_002",
        "conversation": "conv_123",
        "sender": null,
        "messageType": "ICE_BREAKER",
        "content": "What excited you most about the other person's profile?",
        "isSystemMessage": true,
        "createdAt": "2025-01-15T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

**Note:** Messages are returned **oldest first** for easier rendering.

---

#### Send Message
```http
POST /api/v1/conversations/:id/messages
Content-Type: application/json

{
  "content": "Hello! I'm excited to discuss this opportunity.",
  "messageType": "TEXT"
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Message text (max 5000 chars) |
| `messageType` | string | No | Default: `TEXT` |
| `attachmentUrl` | string | No | URL to attachment (if uploading) |

**Message Types:**
- `TEXT` - Regular text message
- `ATTACHMENT` - Message with file attachment
- `ICE_BREAKER` - Ice breaker (system use only)
- `TRIAL_PROPOSAL` - Trial proposal (system use only)
- `TRIAL_UPDATE` - Trial status update (system use only)
- `SYSTEM` - General system message

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "msg_003",
      "conversation": "conv_123",
      "sender": {
        "_id": "user_2",
        "name": "Jane Builder"
      },
      "messageType": "TEXT",
      "content": "Hello! I'm excited to discuss this opportunity.",
      "isSystemMessage": false,
      "createdAt": "2025-01-15T10:10:00.000Z"
    }
  }
}
```

**Real-time Events Triggered:**
- `message_sent` → to sender (confirmation)
- `new_message` → to other participant

---

#### Mark Messages as Read
```http
POST /api/v1/conversations/:id/read
Content-Type: application/json

{
  "upToMessageId": "msg_003"  // Optional
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `upToMessageId` | string | No | Mark all messages up to this ID as read |

If `upToMessageId` is not provided, marks ALL unread messages as read.

**Response:**
```json
{
  "success": true,
  "data": {
    "markedAsRead": 3
  }
}
```

**Real-time Event Triggered:**
- `messages_read` → to other participant

---

### 4.3 Ice Breakers

#### Send New Ice Breaker
```http
POST /api/v1/conversations/:id/ice-breaker
```

Sends a random ice breaker prompt as a system message.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": {
      "_id": "msg_icebreaker",
      "conversation": "conv_123",
      "sender": null,
      "messageType": "ICE_BREAKER",
      "content": "What's one question you'd want answered before working together?",
      "isSystemMessage": true,
      "createdAt": "2025-01-15T10:15:00.000Z"
    }
  }
}
```

---

### 4.4 Unread Counts

#### Get Total Unread Count
```http
GET /api/v1/conversations/unread/count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 7
  }
}
```

---

#### Get Unread Count Per Conversation
```http
GET /api/v1/conversations/unread/per-conversation
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCounts": {
      "conv_123": 3,
      "conv_456": 4
    }
  }
}
```

---

## 5. Data Models

### 5.1 Conversation

```typescript
interface Conversation {
  _id: string;
  participants: User[];              // Both users
  founder: User;                     // Founder user object
  builder: User;                     // Builder user object
  interest: Interest;                // The interest that created this
  opening?: Opening;                 // Related opening
  trial?: Trial;                     // Active trial (if any)
  status: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
  lastMessage?: Message;             // Most recent message
  lastMessageAt?: string;            // ISO date
  messageCount: number;
  archivedAt?: string;               // When archived
  archivedBy?: string;               // Who archived
  createdAt: string;
  updatedAt: string;

  // Added by API (not in DB)
  unreadCount?: number;              // Unread messages for current user
}
```

### 5.2 Message

```typescript
interface Message {
  _id: string;
  conversation: string;              // Conversation ID
  sender: User | null;               // null for system messages
  messageType: MessageType;
  content: string;                   // Max 5000 chars
  isSystemMessage: boolean;

  // Attachments
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file' | 'document';
  attachmentName?: string;
  attachmentSize?: number;           // Bytes

  // Read status
  readAt?: string;                   // ISO date when read

  // Metadata
  metadata?: {
    trialId?: string;
    trialStatus?: string;
    // Other contextual data
  };

  // Moderation
  isDeleted: boolean;
  deletedAt?: string;
  isFlagged: boolean;
  flagReason?: string;

  createdAt: string;
  updatedAt: string;
}

type MessageType =
  | 'TEXT'           // Regular message
  | 'SYSTEM'         // System notification
  | 'TRIAL_PROPOSAL' // Trial was proposed
  | 'TRIAL_UPDATE'   // Trial status changed
  | 'ATTACHMENT'     // File attached
  | 'ICE_BREAKER';   // Conversation starter
```

### 5.3 Conversation Status

```typescript
const CONVERSATION_STATUS = {
  ACTIVE: 'ACTIVE',      // Normal, can send messages
  ARCHIVED: 'ARCHIVED',  // Hidden, cannot send messages
  BLOCKED: 'BLOCKED'     // Blocked by admin/user
};
```

---

## 6. User Flows

### 6.1 Chat Initialization Flow

```
1. Founder shortlists builder
   └── System creates conversation automatically
   └── System sends ice breaker message

2. Frontend receives notification
   └── `builder_shortlisted` event (for builder)
   └── `new_notification` event

3. User opens conversation
   └── GET /conversations/:id
   └── socket.emit('join_conversation', { conversationId })

4. Load messages
   └── GET /conversations/:id/messages

5. Mark messages as read
   └── POST /conversations/:id/read
   └── Socket emits `messages_read` to other user
```

### 6.2 Real-time Message Flow

```
Sender                          Server                         Receiver
  │                               │                               │
  ├─POST /messages────────────────►                               │
  │                               ├─ Save to DB                   │
  │                               ├─ Update conversation          │
  │◄─HTTP 201 + message───────────┤                               │
  │                               │                               │
  │◄──socket: message_sent────────┤                               │
  │                               ├──socket: new_message─────────►│
  │                               ├──socket: new_notification────►│
  │                               │                               │
```

### 6.3 Typing Indicator Flow

```javascript
// User starts typing
inputElement.addEventListener('input', debounce(() => {
  if (!isTyping) {
    socket.emit('typing_start', { conversationId });
    isTyping = true;
  }

  // Stop typing after 2 seconds of inactivity
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', { conversationId });
    isTyping = false;
  }, 2000);
}, 300));
```

### 6.4 Read Receipt Flow

```
1. User opens conversation / scrolls to new messages
2. Mark visible messages as read:
   └── POST /conversations/:id/read

3. Socket broadcasts to other user:
   └── `messages_read` event with messageIds

4. Other user's UI updates:
   └── Show "Read" indicator on those messages
```

### 6.5 Complete Chat Session Flow

```
1. User logs in
   └── Connect socket with JWT token
   └── Listen for events

2. Open conversations list
   └── GET /conversations
   └── Display with unread counts

3. Open specific conversation
   └── socket.emit('join_conversation')
   └── GET /conversations/:id/messages
   └── Mark all as read

4. Chat session
   └── Send messages via HTTP POST
   └── Receive messages via socket
   └── Emit typing indicators
   └── Handle read receipts

5. Leave conversation
   └── socket.emit('leave_conversation')

6. Logout
   └── socket.disconnect()
```

---

## 7. Code Examples

### 7.1 Complete Chat Service (React)

```typescript
// chatService.ts
import { io, Socket } from 'socket.io-client';
import { api } from './api';

class ChatService {
  private socket: Socket | null = null;
  private messageListeners: Map<string, (message: Message) => void> = new Map();
  private typingListeners: Map<string, (data: TypingData) => void> = new Map();
  private readListeners: Map<string, (data: ReadData) => void> = new Map();

  // Connect to socket server
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(process.env.REACT_APP_SOCKET_URL!, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('Connected to chat server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error.message);
        reject(error);
      });

      this.socket.on('connected', ({ userId }) => {
        console.log('Authenticated as:', userId);
      });

      // Global message handler
      this.socket.on('new_message', ({ conversationId, message }) => {
        const listener = this.messageListeners.get(conversationId);
        if (listener) listener(message);
      });

      // Global typing handler
      this.socket.on('user_typing', (data) => {
        const listener = this.typingListeners.get(data.conversationId);
        if (listener) listener({ ...data, isTyping: true });
      });

      this.socket.on('user_stopped_typing', (data) => {
        const listener = this.typingListeners.get(data.conversationId);
        if (listener) listener({ ...data, isTyping: false });
      });

      // Global read receipt handler
      this.socket.on('messages_read', (data) => {
        const listener = this.readListeners.get(data.conversationId);
        if (listener) listener(data);
      });
    });
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a conversation room
  joinConversation(conversationId: string): void {
    this.socket?.emit('join_conversation', { conversationId });
  }

  // Leave a conversation room
  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave_conversation', { conversationId });
    this.messageListeners.delete(conversationId);
    this.typingListeners.delete(conversationId);
    this.readListeners.delete(conversationId);
  }

  // Subscribe to messages for a conversation
  onMessage(conversationId: string, callback: (message: Message) => void): void {
    this.messageListeners.set(conversationId, callback);
  }

  // Subscribe to typing indicators
  onTyping(conversationId: string, callback: (data: TypingData) => void): void {
    this.typingListeners.set(conversationId, callback);
  }

  // Subscribe to read receipts
  onRead(conversationId: string, callback: (data: ReadData) => void): void {
    this.readListeners.set(conversationId, callback);
  }

  // Emit typing start
  startTyping(conversationId: string): void {
    this.socket?.emit('typing_start', { conversationId });
  }

  // Emit typing stop
  stopTyping(conversationId: string): void {
    this.socket?.emit('typing_stop', { conversationId });
  }

  // HTTP: Get conversations
  async getConversations(params?: { status?: string; page?: number; limit?: number }) {
    const response = await api.get('/conversations', { params });
    return response.data.data;
  }

  // HTTP: Get single conversation
  async getConversation(id: string) {
    const response = await api.get(`/conversations/${id}`);
    return response.data.data.conversation;
  }

  // HTTP: Get messages
  async getMessages(conversationId: string, params?: { page?: number; limit?: number; before?: string }) {
    const response = await api.get(`/conversations/${conversationId}/messages`, { params });
    return response.data.data;
  }

  // HTTP: Send message
  async sendMessage(conversationId: string, content: string, messageType = 'TEXT') {
    const response = await api.post(`/conversations/${conversationId}/messages`, {
      content,
      messageType,
    });
    return response.data.data.message;
  }

  // HTTP: Mark messages as read
  async markAsRead(conversationId: string, upToMessageId?: string) {
    const response = await api.post(`/conversations/${conversationId}/read`, {
      upToMessageId,
    });
    return response.data.data.markedAsRead;
  }

  // HTTP: Get unread count
  async getUnreadCount() {
    const response = await api.get('/conversations/unread/count');
    return response.data.data.unreadCount;
  }

  // HTTP: Archive conversation
  async archiveConversation(id: string) {
    const response = await api.post(`/conversations/${id}/archive`);
    return response.data.data.conversation;
  }

  // HTTP: Send ice breaker
  async sendIceBreaker(conversationId: string) {
    const response = await api.post(`/conversations/${conversationId}/ice-breaker`);
    return response.data.data.message;
  }
}

export const chatService = new ChatService();
```

### 7.2 React Chat Component

```tsx
// ChatWindow.tsx
import React, { useState, useEffect, useRef } from 'react';
import { chatService } from './chatService';

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, currentUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const data = await chatService.getMessages(conversationId);
        setMessages(data.messages);
        await chatService.markAsRead(conversationId);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  // Join conversation and set up listeners
  useEffect(() => {
    chatService.joinConversation(conversationId);

    // Listen for new messages
    chatService.onMessage(conversationId, (message) => {
      setMessages((prev) => [...prev, message]);
      // Mark as read immediately if window is focused
      if (document.hasFocus()) {
        chatService.markAsRead(conversationId);
      }
    });

    // Listen for typing indicators
    chatService.onTyping(conversationId, ({ userId, userName, isTyping }) => {
      if (userId !== currentUserId) {
        setIsOtherTyping(isTyping);
        setTypingUser(userName);
      }
    });

    // Listen for read receipts
    chatService.onRead(conversationId, ({ readByUserId, messageIds }) => {
      if (readByUserId !== currentUserId) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg._id)
              ? { ...msg, readAt: new Date().toISOString() }
              : msg
          )
        );
      }
    });

    return () => {
      chatService.leaveConversation(conversationId);
    };
  }, [conversationId, currentUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Emit typing start
    if (!isTypingRef.current && e.target.value) {
      chatService.startTyping(conversationId);
      isTypingRef.current = true;
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        chatService.stopTyping(conversationId);
        isTypingRef.current = false;
      }
    }, 2000);
  };

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    // Stop typing indicator
    if (isTypingRef.current) {
      chatService.stopTyping(conversationId);
      isTypingRef.current = false;
    }

    const content = newMessage;
    setNewMessage('');

    try {
      const message = await chatService.sendMessage(conversationId, content);
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(content); // Restore message on error
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return <div className="chat-loading">Loading messages...</div>;
  }

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.sender?._id === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isOtherTyping && (
        <div className="typing-indicator">
          {typingUser} is typing...
        </div>
      )}

      <div className="message-input-container">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="message-input"
        />
        <button onClick={handleSend} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
};

// Message bubble component
const MessageBubble: React.FC<{ message: Message; isOwn: boolean }> = ({ message, isOwn }) => {
  const isSystem = message.isSystemMessage;

  if (isSystem) {
    return (
      <div className="system-message">
        {message.messageType === 'ICE_BREAKER' && '💡 '}
        {message.content}
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && (
        <div className="sender-name">{message.sender?.name}</div>
      )}
      <div className="message-content">{message.content}</div>
      <div className="message-meta">
        <span className="message-time">
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
        {isOwn && (
          <span className="read-status">
            {message.readAt ? '✓✓' : '✓'}
          </span>
        )}
      </div>
    </div>
  );
};
```

### 7.3 Conversation List Component

```tsx
// ConversationList.tsx
import React, { useState, useEffect } from 'react';
import { chatService } from './chatService';

export const ConversationList: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await chatService.getConversations();
        setConversations(data.conversations);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  return (
    <div className="conversation-list">
      {conversations.map((conv) => (
        <div
          key={conv._id}
          className="conversation-item"
          onClick={() => onSelect(conv._id)}
        >
          <img
            src={conv.builder.profilePhoto || '/default-avatar.png'}
            alt={conv.builder.name}
            className="avatar"
          />
          <div className="conversation-info">
            <div className="participant-name">
              {conv.builder.name}
            </div>
            <div className="last-message">
              {conv.lastMessage?.content || 'No messages yet'}
            </div>
          </div>
          {conv.unreadCount > 0 && (
            <div className="unread-badge">{conv.unreadCount}</div>
          )}
        </div>
      ))}
    </div>
  );
};
```

### 7.4 Socket Connection Provider

```tsx
// SocketProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { chatService } from './chatService';

interface SocketContextType {
  isConnected: boolean;
  unreadCount: number;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  unreadCount: 0,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Connect to socket
    chatService.connect(token)
      .then(() => {
        setIsConnected(true);
        // Get initial unread count
        chatService.getUnreadCount().then(setUnreadCount);
      })
      .catch((error) => {
        console.error('Socket connection failed:', error);
      });

    return () => {
      chatService.disconnect();
      setIsConnected(false);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, unreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};
```

---

## 8. Error Handling

### 8.1 HTTP Error Responses

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | `BAD_REQUEST` | Invalid input, cannot send to archived conversation |
| 401 | `UNAUTHORIZED` | Invalid or expired token |
| 403 | `FORBIDDEN` | Not a participant in conversation |
| 404 | `NOT_FOUND` | Conversation or message not found |
| 429 | `RATE_LIMIT` | Too many requests |
| 500 | `SERVER_ERROR` | Internal server error |

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not a participant in this conversation"
  }
}
```

### 8.2 Socket Error Events

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);

  // Common error messages:
  // - "Authentication required. No token provided."
  // - "Token has expired. Please reconnect."
  // - "Invalid token. Authentication failed."
  // - "User not found."
  // - "Account is not active."
});

socket.on('connect_error', (error) => {
  if (error.message.includes('expired')) {
    // Refresh token and reconnect
    refreshTokenAndReconnect();
  }
});
```

### 8.3 Error Handling Best Practices

```typescript
// Wrapper for API calls with error handling
async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  options?: { showToast?: boolean }
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error: any) {
    const message = error.response?.data?.error?.message || 'An error occurred';

    if (options?.showToast) {
      toast.error(message);
    }

    // Handle specific errors
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }

    console.error('API Error:', error);
    return null;
  }
}

// Usage
const messages = await withErrorHandling(
  () => chatService.getMessages(conversationId),
  { showToast: true }
);
```

---

## Quick Reference

### Socket Events Summary

| Direction | Event | When to Use |
|-----------|-------|-------------|
| Emit | `join_conversation` | When opening a chat |
| Emit | `leave_conversation` | When closing a chat |
| Emit | `typing_start` | When user starts typing |
| Emit | `typing_stop` | After 2s of no typing |
| Listen | `new_message` | Display new message |
| Listen | `user_typing` | Show typing indicator |
| Listen | `messages_read` | Update read receipts |
| Listen | `new_notification` | Show notification badge |

### HTTP Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations` | List conversations |
| GET | `/conversations/:id` | Get single conversation |
| GET | `/conversations/:id/messages` | Get messages |
| POST | `/conversations/:id/messages` | Send message |
| POST | `/conversations/:id/read` | Mark as read |
| GET | `/conversations/unread/count` | Get unread count |
| POST | `/conversations/:id/archive` | Archive |
| POST | `/conversations/:id/ice-breaker` | Send ice breaker |

---

**Questions?** Contact the backend team for API support.
