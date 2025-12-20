# Serendib Hotels - Frontend

Modern React frontend for the Serendib Smart Hotel Management System.

**Last Updated:** December 2024

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Frontend runs at: **http://localhost:5173**

## Tech Stack

- **React 18** with Vite
- **Tailwind CSS** with custom design system
- **Framer Motion** for animations
- **Recharts** for analytics charts
- **React Router** for navigation
- **Axios** for API calls

## Design System

### Colors
- **Primary (Sky Blue)**: Brand color
- **Peach**: Highlights and features
- **Mint**: Success states
- **Lavender**: Premium features

### Components
- `.btn` / `.btn-primary` / `.btn-secondary` - Buttons
- `.glass` - Glass-morphism effect
- `.card` / `.card-hover` - Cards
- `.badge-*` - Status badges
- `.input` - Form inputs

## Project Structure

```
src/
├── components/      # Reusable UI components
│   ├── Modal.jsx
│   ├── StatCard.jsx
│   ├── EmptyState.jsx
│   └── ...
├── pages/
│   ├── auth/        # Login, Register
│   ├── guest/       # Room search, Bookings
│   ├── staff/       # Check-in, Room status
│   └── admin/       # Dashboard, Analytics
├── context/         # Auth context
├── services/        # API layer
└── App.jsx
```

## Pages

### Guest Portal
- `/` - Homepage
- `/rooms` - Room search
- `/booking/:id` - Booking flow
- `/my-bookings` - View bookings
- `/loyalty` - Loyalty program

### Staff Portal
- `/staff` - Dashboard with Quick Actions
- `/staff/check-in-out` - Process arrivals
- `/staff/room-status` - Room overview
- `/staff/services` - Service requests

### Admin Portal
- `/admin` - Dashboard
- `/admin/users` - User management (CRUD)
- `/admin/rooms` - Room management
- `/admin/branches` - Branch management
- `/admin/analytics` - Charts & reports
- `/admin/audit-logs` - Audit trail

## Features

### Recent Additions (Dec 2024)
- ✅ User CRUD (Create/Edit/Delete)
- ✅ Branch Management with Edit modal
- ✅ Staff Dashboard Quick Actions
- ✅ Modal gradient theme
- ✅ Global button alignment

### Responsive Design
- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px

## License

© 2024 Serendib Hotels
