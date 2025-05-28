# CILIS BOOKING

Online Expert Consultation Booking System

## Overview

Cilis Booking is a platform that connects clients with expert consultants, allowing for scheduling, payment, and participation in online consultation sessions. The system includes both backend (API) and frontend (user interface).

[Preview video](https://youtu.be/T7bAuQs1lxk)

## Key Features

### Authentication & User Management
- **Multi-role System**: Support for three distinct user types (Clients, Experts, Admin)
- **Secure Authentication**: JWT-based authentication with refresh token mechanism
- **Profile Management**: Users can update their profiles, profile pictures, and account settings
- **Verification System**: Expert verification process with document upload and admin approval

### Scalability & Big Data Handling

- **Millions of Records Ready**: The system is engineered to efficiently handle millions of users, bookings, and transactions without performance degradation.
- **Optimized Data Architecture**: Utilizes a well-structured MongoDB schema with advanced indexing strategies to ensure low-latency queries on large datasets.
- **Powerful Search with Elasticsearch**: Integrated with Elasticsearch v8 for blazing-fast 

### Expert Consultation Services
- **Expert Profiles**: Detailed expert profiles with specializations, experience, rates, and reviews
- **Search & Filter**: Advanced search with filters by field, rating, availability, and price
- **Field Categorization**: Organized expert categorization by professional fields

### Booking System
- **Availability Management**: Experts can set their recurring availability patterns and exceptions
- **Real-time Calendar**: Interactive calendar showing available time slots
- **Appointment Scheduling**: Clients can book specific time slots with their preferred experts
- **Document Sharing**: Upload and share relevant documents for consultations
- **Booking Workflow**: Complete booking lifecycle management (pending, confirmed, completed, canceled)
- **Rescheduling & Cancellation**: Flexible options for modifying or canceling appointments

### Payment Processing
- **Secure Payments**: Integration with payment gateway (VNPay)
- **Transaction Records**: Complete history of payments and refunds
- **Payment Status Tracking**: Real-time updates on payment status

### Realtime Communication
- **Live Chat**: Real-time messaging between clients and experts
- **Message Notifications**: Instant notifications for new messages
- **Online Status**: Indicator showing when users are online
- **Read Receipts**: Confirmation when messages have been read
- **Typing Indicators**: Shows when someone is typing a message

### Review & Rating System
- **Post-session Reviews**: Clients can leave reviews after completing sessions
- **Rating System**: Rate experts on a 5-star scale
- **Feedback Management**: Experts can respond to client reviews

### Admin Dashboard
- **User Management**: Comprehensive tools for managing users, experts, and clients
- **Expert Verification**: Process for verifying expert credentials and documents
- **Analytics Dashboard**: Visualizations of key metrics (bookings, revenue, user growth)
- **Content Management**: Tools for managing system content and announcements


## System Requirements

- Node.js
- MongoDB
- Elasticsearch (v8)

## Installation and Running

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```