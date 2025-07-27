# InKveiL API Documentation

A comprehensive guide to the InKveiL dating platform API endpoints.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [User Management](#user-management)
- [Connection System](#connection-system)
- [Messaging](#messaging)
- [Premium Rooms](#premium-rooms)
- [Data Models](#data-models)

## Overview

The InKveiL API is a RESTful API that powers the intent-driven dating and connection platform. It features:

- JWT-based authentication
- Request-based connections (no swiping)
- 24-hour chat windows
- Premium room functionality
- End-to-end message encryption
- Geolocation-based discovery

### Base URL
- Development: `http://localhost:8080/api`
- Production: `https://your-domain.com/api`

### Content Type
All requests should use `Content-Type: application/json`

## Authentication

### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "gender": "male",
  "age": 25,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city": "New York",
    "country": "USA"
  },
  "intent": "dating",
  "bio": "Looking for meaningful connections",
  "interests": ["travel", "books", "hiking"],
  "isAnonymous": false,
  "authType": "email"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": { /* user object without password */ },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

### POST /auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { /* user object */ },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### POST /auth/logout
Logout user (requires authentication).

### POST /auth/forgot-password
Initiate password reset process.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### POST /auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123"
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error description",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Authentication endpoints: 10 requests per 15 minutes per IP

## User Management

All user routes require authentication (`Authorization: Bearer <token>`).

### GET /users/profile
Get current user's profile.

### PUT /users/profile
Update user profile.

**Request Body:**
```json
{
  "name": "Updated Name",
  "bio": "Updated bio",
  "interests": ["new", "interests"],
  "photoURL": "https://example.com/photo.jpg",
  "isAnonymous": true,
  "intent": "both"
}
```

### PUT /users/preferences
Update user preferences.

**Request Body:**
```json
{
  "ageRange": {
    "min": 22,
    "max": 35
  },
  "maxDistance": 50,
  "genderPreference": "both",
  "intentPreference": "dating"
}
```

### GET /users/discover
Discover potential connections.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 50)
- `minAge` (optional): Minimum age filter
- `maxAge` (optional): Maximum age filter
- `gender` (optional): Gender filter
- `intent` (optional): Intent filter
- `maxDistance` (optional): Maximum distance in km

**Response:**
```json
{
  "message": "Users discovered successfully",
  "users": [
    {
      "_id": "user_id",
      "name": "Jane Doe",
      "age": 26,
      "bio": "Love hiking and books",
      "distance": 15,
      "photoURL": "https://example.com/photo.jpg"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### GET /users/:userId
Get specific user's public profile.

### DELETE /users/profile
Delete user account (soft delete).

## Connection System

### POST /connections/request
Send a connection request.

**Request Body:**
```json
{
  "receiverId": "user_id_here",
  "message": "I'd love to connect with you!"
}
```

**Response:**
```json
{
  "message": "Connection request sent successfully",
  "connection": {
    "_id": "connection_id",
    "requesterId": { /* requester user object */ },
    "receiverId": { /* receiver user object */ },
    "status": "pending",
    "message": "I'd love to connect with you!",
    "timestamp": "2024-01-15T10:00:00.000Z",
    "expiresAt": "2024-01-22T10:00:00.000Z"
  }
}
```

### GET /connections
Get user's connections.

**Query Parameters:**
- `status` (optional): Filter by status (pending, accepted, rejected, expired)
- `type` (optional): Filter by type (sent, received, all) - default: all
- `page` (optional): Page number
- `limit` (optional): Results per page

### PUT /connections/:connectionId/status
Update connection status (accept/reject).

**Request Body:**
```json
{
  "status": "accepted"
}
```

### GET /connections/active-chats
Get all active chat connections.

**Response:**
```json
{
  "message": "Active chats retrieved successfully",
  "activeChats": [
    {
      "connectionId": "connection_id",
      "otherUser": { /* user object */ },
      "chatExpiresAt": "2024-01-16T10:00:00.000Z",
      "timeLeft": 82800000,
      "timeLeftFormatted": "23h 0m"
    }
  ]
}
```

### DELETE /connections/:connectionId
Delete a connection.

## Messaging

### POST /messages/:connectionId
Send a message in a connection.

**Request Body:**
```json
{
  "content": "Hello! Nice to meet you.",
  "isMedia": false
}
```

For media messages:
```json
{
  "content": "Check out this photo!",
  "isMedia": true,
  "mediaURL": "https://example.com/image.jpg",
  "mediaType": "image"
}
```

### GET /messages/:connectionId
Get messages for a connection.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Messages per page (max: 100)
- `before` (optional): Get messages before this message ID
- `after` (optional): Get messages after this message ID

**Response:**
```json
{
  "message": "Messages retrieved successfully",
  "messages": [
    {
      "_id": "message_id",
      "senderId": { /* sender user object */ },
      "content": "Hello!",
      "timestamp": "2024-01-15T10:00:00.000Z",
      "isRead": false,
      "isMedia": false
    }
  ],
  "unreadCount": 5,
  "chatExpiresAt": "2024-01-16T10:00:00.000Z",
  "timeLeft": 82800000,
  "timeLeftFormatted": "23h 0m"
}
```

### PUT /messages/:connectionId/read
Mark messages as read.

**Request Body:**
```json
{
  "messageIds": ["message_id_1", "message_id_2"]
}
```

### DELETE /messages/:messageId
Delete a message (soft delete).

### GET /messages/chat-summary
Get chat summary for all active connections.

## Premium Rooms

All room endpoints require premium subscription.

### POST /rooms
Create a new room.

**Request Body:**
```json
{
  "roomName": "Book Lovers Discussion",
  "description": "A place for book enthusiasts to discuss their favorite reads",
  "roomType": "discussion",
  "tags": ["books", "literature", "discussion"],
  "maxParticipants": 8,
  "isPrivate": false,
  "scheduledFor": "2024-01-20T19:00:00.000Z",
  "duration": 90
}
```

### GET /rooms
Get available rooms.

**Query Parameters:**
- `roomType` (optional): Filter by room type
- `tags` (optional): Filter by tags (comma-separated)
- `isPrivate` (optional): Filter by privacy (true/false)
- `scheduled` (optional): Filter by schedule (upcoming, live, past)
- `page` (optional): Page number
- `limit` (optional): Results per page

### GET /rooms/my-rooms
Get rooms created by or joined by the user.

### GET /rooms/:roomId
Get specific room details.

### POST /rooms/:roomId/join
Join a room.

### POST /rooms/:roomId/leave
Leave a room.

### PUT /rooms/:roomId
Update room details (creator only).

### DELETE /rooms/:roomId
Delete/deactivate room (creator only).

## Data Models

### User
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "gender": "male|female|non-binary|prefer-not-to-say",
  "age": "number",
  "location": {
    "latitude": "number",
    "longitude": "number",
    "city": "string",
    "country": "string"
  },
  "isPremium": "boolean",
  "bio": "string",
  "interests": ["string"],
  "photoURL": "string",
  "isAnonymous": "boolean",
  "authType": "email|google|phone",
  "intent": "dating|friendship|both",
  "preferences": {
    "ageRange": {
      "min": "number",
      "max": "number"
    },
    "maxDistance": "number",
    "genderPreference": "male|female|both|non-binary",
    "intentPreference": "dating|friendship|both"
  },
  "isVerified": "boolean",
  "lastActive": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Connection
```json
{
  "_id": "ObjectId",
  "requesterId": "ObjectId",
  "receiverId": "ObjectId",
  "status": "pending|accepted|rejected|expired",
  "message": "string",
  "timestamp": "Date",
  "expiresAt": "Date",
  "chatExpiresAt": "Date",
  "isActive": "boolean"
}
```

### Message
```json
{
  "_id": "ObjectId",
  "senderId": "ObjectId",
  "receiverId": "ObjectId",
  "connectionId": "ObjectId",
  "content": "string",
  "isMedia": "boolean",
  "mediaURL": "string",
  "mediaType": "image|video|audio|file",
  "timestamp": "Date",
  "isDeleted": "boolean",
  "isRead": "boolean",
  "readAt": "Date",
  "isEncrypted": "boolean"
}
```

### Room
```json
{
  "_id": "ObjectId",
  "roomName": "string",
  "description": "string",
  "createdBy": "ObjectId",
  "participantIds": ["ObjectId"],
  "maxParticipants": "number",
  "roomType": "discussion|event|meetup|hobby",
  "tags": ["string"],
  "isPrivate": "boolean",
  "subscriptionRequired": "boolean",
  "scheduledFor": "Date",
  "duration": "number",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt (12 rounds)
- Rate limiting on all endpoints
- Input validation with Zod schemas
- CORS protection
- Helmet security headers
- End-to-end message encryption
- Geolocation privacy controls
- Anonymous profile options

## Environment Variables

```env
NODE_ENV=development
PORT=8080
MONGODB_URI=mongodb://localhost:27017/inkveil
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

## Development Setup

1. Install dependencies: `npm install`
2. Set up MongoDB Atlas or local MongoDB
3. Configure environment variables
4. Run development server: `npm run dev`
5. API will be available at `http://localhost:8080/api`

## Support

For API support and questions, please contact the development team or refer to the project documentation.
