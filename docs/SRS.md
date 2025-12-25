# System Requirements Specification
## Serendib Smart Hotel Management System

**Version:** 2.0 (Final Implementation)  
**Last Updated:** December 25, 2025

---

## 1.1 System Requirements Analysis

This document describes the System Requirements Specification for the Serendib Smart Hotel Management System. It reflects the actual implementation delivered for the three hotel branches located in Colombo, Mirissa, and Kandy, Sri Lanka.

Serendib operates as a chain of hotels managed under a unified digital platform. Each branch has unique offerings but shares a common infrastructure for bookings, payments, and guest management. The system enhances guest experiences, streamlines hotel operations, and supports data-driven management decisions across all locations.

The system consists of two integrated components:

1. **Back-end Server Application**: Built with Python Flask, providing RESTful APIs for authentication, booking, payments, notifications, and analytics. Uses MySQL for persistent storage.

2. **Front-end Client Application**: Built with React and Vite, offering responsive interfaces customized for guests, staff, and administrators.

---

## 1.2 Functional Requirements

### 1.2.1 Authentication and Access Control

| ID | Requirement | Status |
|----|-------------|--------|
| FR-01 | Multi-property role-based access control (Guest, Staff, Admin) | Implemented |
| FR-02 | Single registration with email verification | Implemented |
| FR-03 | Password reset via email link | Implemented |
| FR-04 | JWT-based session management with refresh tokens | Implemented |
| FR-05 | Branch-specific staff and admin access | Implemented |

### 1.2.2 Room Management

| ID | Requirement | Status |
|----|-------------|--------|
| FR-06 | Room search with filters (dates, type, price, branch) | Implemented |
| FR-07 | Real-time availability checking | Implemented |
| FR-08 | Room status management (Available, Occupied, Maintenance, Reserved, Cleaning) | Implemented |
| FR-09 | Room CRUD operations for administrators | Implemented |
| FR-10 | Image upload for room photos | Implemented |

### 1.2.3 Booking Management

| ID | Requirement | Status |
|----|-------------|--------|
| FR-11 | Complete booking flow (Search, Select, Book, Pay, Confirm) | Implemented |
| FR-12 | Booking history and details view | Implemented |
| FR-13 | Booking modification and cancellation | Implemented |
| FR-14 | Check-in and check-out processing | Implemented |
| FR-15 | Special requests handling | Implemented |

### 1.2.4 Payment Processing

| ID | Requirement | Status |
|----|-------------|--------|
| FR-17 | Secure online payments via Stripe | Implemented |
| FR-18 | Cash payment workflow (staff marks as paid) | Implemented |
| FR-19 | Payment validation before check-in | Implemented |
| FR-20 | Refund processing via Stripe | Implemented |
| FR-21 | Receipt generation and printing | Implemented |

### 1.2.5 Guest Self-Service

| ID | Requirement | Status |
|----|-------------|--------|
| FR-22 | Guest profile management | Implemented |
| FR-23 | View and manage bookings | Implemented |
| FR-24 | Submit service requests | Implemented |
| FR-25 | View loyalty points and history | Implemented |
| FR-26 | Booking cancellation with policy enforcement | Implemented |

### 1.2.6 Staff Operations

| ID | Requirement | Status |
|----|-------------|--------|
| FR-27 | Staff dashboard with quick actions | Implemented |
| FR-28 | Check-in/out workflow with search | Implemented |
| FR-29 | Room status updates | Implemented |
| FR-30 | Service request assignment and tracking | Implemented |
| FR-31 | View all branch bookings | Implemented |

### 1.2.7 Administrative Functions

| ID | Requirement | Status |
|----|-------------|--------|
| FR-32 | Admin dashboard with metrics | Implemented |
| FR-33 | Branch management (tax rates, contact info) | Implemented |
| FR-34 | User management (create, edit, suspend) | Implemented |
| FR-35 | Room management with image uploads | Implemented |
| FR-36 | Audit log viewing | Implemented |
| FR-37 | Analytics dashboards (revenue, occupancy, trends) | Implemented |

### 1.2.8 Notifications

| ID | Requirement | Status |
|----|-------------|--------|
| FR-38 | Email notifications (verification, password reset) | Implemented |
| FR-39 | SMS notifications via Text.lk gateway | Implemented |
| FR-40 | In-app notification system | Implemented |

### 1.2.9 Loyalty Program

| ID | Requirement | Status |
|----|-------------|--------|
| FR-41 | Points earning on bookings | Implemented |
| FR-42 | Tier progression (Bronze, Silver, Gold, Platinum) | Implemented |
| FR-43 | Points history tracking | Implemented |
| FR-44 | Cross-branch loyalty benefits | Implemented |

### 1.2.10 Pending Features

| ID | Requirement | Status |
|----|-------------|--------|
| FR-45 | Event and facilities booking (conference rooms, spa) | Pending |
| FR-46 | Promotions and promo code application at checkout | Pending |
| FR-47 | Staff scheduling and shift management UI | Pending |

---

## 1.3 Non-Functional Requirements

### 1.3.1 Security and Privacy

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-01 | Password hashing with bcrypt | Implemented |
| NFR-02 | JWT token-based authentication | Implemented |
| NFR-03 | CORS configuration for API security | Implemented |
| NFR-04 | Input validation and sanitization | Implemented |
| NFR-05 | Audit logging of sensitive actions | Implemented |

### 1.3.2 Performance and Scalability

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-06 | Database indexing for common queries | Implemented |
| NFR-07 | Efficient API response times | Implemented |
| NFR-08 | Rate limiting on API endpoints | Implemented |

### 1.3.3 Usability and Accessibility

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-09 | Responsive design for all devices | Implemented |
| NFR-10 | Modern UI with smooth animations | Implemented |
| NFR-11 | Clear error messages and feedback | Implemented |
| NFR-12 | Favicon and web app manifest | Implemented |

---

## 1.4 Domain Requirements

### 1.4.1 Multi-Branch Operations

| ID | Requirement | Status |
|----|-------------|--------|
| DR-01 | Three active branches (Colombo, Mirissa, Kandy) | Implemented |
| DR-02 | Branch-specific configurations (tax rates, timings) | Implemented |
| DR-03 | Centralized corporate oversight via admin dashboard | Implemented |
| DR-04 | Branch-level analytics and reporting | Implemented |

### 1.4.2 Room and Service Categorization

| ID | Requirement | Status |
|----|-------------|--------|
| DR-05 | Four room types (Standard, Deluxe, Suite, Penthouse) | Implemented |
| DR-06 | Seven service types (Room Service, Housekeeping, Maintenance, Concierge, Laundry, Spa, Other) | Implemented |
| DR-07 | Priority levels for service requests | Implemented |

### 1.4.3 Financial Compliance

| ID | Requirement | Status |
|----|-------------|--------|
| DR-08 | Branch-level tax rate application | Implemented |
| DR-09 | Payment audit trail | Implemented |
| DR-10 | Refund tracking and documentation | Implemented |

---

## 1.5 Future Enhancements

| ID | Enhancement | Priority |
|----|-------------|----------|
| FE-01 | Data backup and recovery procedures | Medium |
| FE-02 | Multi-language localization | Low |
| FE-03 | Real-time push notifications (WebSocket) | Medium |
| FE-04 | Dark mode theme toggle | Low |
| FE-05 | PDF/Excel export for reports | Medium |

---
