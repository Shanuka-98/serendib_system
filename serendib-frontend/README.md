# Serendib Hotels - Frontend

Modern, beautiful React frontend for the Serendib Smart Hotel Management System.

## Design System

### Color Palette
- **Primary (Sky Blue)**: `#E0F2FE` to `#0284C7` - Main brand color
- **Peach**: `#FED7AA` to `#FB923C` - Highlights and featured items
- **Mint Green**: `#D1FAE5` to `#10B981` - Success states
- **Lavender**: `#E9D5FF` to `#8B5CF6` - Loyalty and premium features
- **Neutrals**: `#F9FAFB` to `#111827` - Text and backgrounds

### Typography
- **Display**: Poppins (headings)
- **Body**: Plus Jakarta Sans / Inter

### Design Principles
- Glass-morphism effects with backdrop blur
- Soft shadows and rounded corners (xl, 2xl, 4xl)
- Smooth transitions and micro-animations
- Ample white space for breathing room
- Gradient accents for visual interest

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
+-- components/        # Reusable UI components
|   +-- common/       # Buttons, inputs, cards, etc.
|   +-- layout/       # Header, footer, sidebar
|   +-- ProtectedRoute.jsx
+-- pages/            # Page components
|   +-- auth/         # Login, register, password reset
|   +-- guest/        # Guest-facing pages
|   +-- staff/        # Staff dashboard pages
|   +-- admin/        # Admin dashboard pages
+-- context/          # React context (auth, etc.)
+-- services/         # API service layer
+-- hooks/            # Custom React hooks
+-- utils/            # Helper functions
+-- App.jsx           # Main app with routing
+-- main.jsx          # React entry point
+-- index.css         # Global styles + Tailwind
```

## Features

### For Guests
- Beautiful room search with filters
- Interactive booking system
- Loyalty program dashboard
- Service requests
- Booking management

### For Staff
- Check-in/check-out interface
- Service request management
- Room status overview
- Guest management

### For Admins
- Comprehensive dashboard
- User management
- Branch configuration
- Analytics and reports
- Audit logs

## Component Examples

### Button
```jsx
<button className="btn btn-primary">Book Now</button>
<button className="btn btn-secondary">Learn More</button>
<button className="btn btn-ghost">Cancel</button>
```

### Card
```jsx
<div className="card card-hover p-6">
  <h3>Room Title</h3>
  <p>Description</p>
</div>
```

### Glass Effect
```jsx
<div className="glass p-6 rounded-2xl">
  Content with glass-morphism
</div>
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Serendib Hotels
```

## Responsive Design

All components are mobile-first and fully responsive:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Animations

Built-in animations:
- `animate-fade-in` - Fade in
- `animate-slide-up` - Slide from bottom
- `animate-scale-in` - Scale in
- `animate-shimmer` - Loading shimmer
- `animate-float` - Floating effect

## Routing

- `/` - Homepage
- `/login` - Login
- `/register` - Register
- `/rooms` - Browse rooms
- `/my-bookings` - User bookings
- `/loyalty` - Loyalty dashboard
- `/staff` - Staff dashboard
- `/admin` - Admin dashboard

## Tailwind Custom Classes

- `.gradient-text` - Gradient text effect
- `.glass` - Glass-morphism
- `.skeleton` - Loading skeleton
- `.btn-*` - Button variants
- `.card-*` - Card variants
- `.badge-*` - Badge variants

## Dependencies

- React 18
- React Router 6
- Axios
- Framer Motion
- Lucide React (icons)
- React Hook Form
- React Toastify
- Recharts (analytics)
- Zustand (state management)
- date-fns

## Next Steps

1. Complete all page components
2. Add more UI components
3. Implement real-time features
4. Add more animations
5. Improve performance
6. Add tests

## License

Copyright 2024 Serendib Hotels

