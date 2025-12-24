# Serendib Hotels - Quick Start Guide

**Get the application running in 5 minutes!**

> For detailed project information, features, and documentation, see `README.md`

---

## Prerequisites

- **Python 3.8+** installed
- **Node.js 16+** and npm installed
- **MySQL** (XAMPP recommended for Windows)
- **Git Bash** (for Windows) or Terminal

---

## Quick Setup (3 Steps)

### Step 1: Database Setup

**Option A: Using XAMPP (Recommended for Windows)**
1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin: http://localhost/phpmyadmin
3. Click "New", then enter database name: `serendib_hotels`, then click Create
4. Select `serendib_hotels` database
5. Click "Import" tab, choose file: `database/schema.sql`, then click Go

**Option B: Command Line**
```bash
cd database
mysql -u root -p < schema.sql
# Enter MySQL password when prompted (or press Enter for XAMPP default)
```

**Important: After importing schema, fix passwords (see below)**

### Step 1.5: Fix Passwords (Required After Schema Import)

#### Why is this needed?

The `schema.sql` file contains pre-hashed passwords (bcrypt hashes) that were generated when the schema was created. However, these pre-hashed passwords may not be compatible with your specific Flask-Bcrypt installation due to:

1. **Bcrypt version differences**: Different versions of bcrypt can produce different hash formats
2. **Salt generation**: Each bcrypt implementation generates unique salts, making pre-generated hashes incompatible
3. **Encoding differences**: Hash encoding can vary between systems (UTF-8, ASCII, etc.)
4. **Library compatibility**: Flask-Bcrypt may use a different bcrypt library version than what was used to generate the original hashes

**Solution**: The `fix_passwords.py` script regenerates all password hashes using the **exact same bcrypt implementation** that your Flask application uses, ensuring 100% compatibility.

#### How to run:

Run this script to regenerate all password hashes with correct bcrypt format:

```bash
cd serendib-backend

# Activate virtual environment (if not already active)
source venv/Scripts/activate  # Windows Git Bash
# OR
source venv/bin/activate      # Linux/Mac

# Run password fix script
python fix_passwords.py
```

This will update all passwords with correct bcrypt hashes:
- **Admin:** `admin123`
- **Staff:** `Test@1234`
- **Guest:** `guest123`

### Step 2: Backend Setup

```bash
cd serendib-backend

# Create virtual environment (Windows Git Bash)
python -m venv venv
source venv/Scripts/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp env.example .env

# Edit .env file - Set database password
# For XAMPP: DB_PASSWORD= (leave empty)
# For other MySQL: DB_PASSWORD=your_password

# Configure Email (see Email Configuration section below)

# Start backend server
python run.py
```

Backend should be running on: **http://localhost:5000**

### Step 3: Frontend Setup

**Open a NEW terminal window** (keep backend running):

```bash
cd serendib-frontend

# Install dependencies (first time only)
npm install

# Start frontend dev server
npm run dev
```

Frontend should be running on: **http://localhost:5173**

---

## Email Configuration (Required for Password Reset & Verification)

The application requires SMTP configuration to send password reset and email verification emails.

### Option A: Mailtrap (Recommended for Testing/Development)

1. Sign up at [mailtrap.io](https://mailtrap.io) (free tier available)
2. Go to Email Testing → Inboxes → SMTP Settings
3. Update `.env` file with your Mailtrap credentials:

```env
MAIL_SERVER=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password
MAIL_DEFAULT_SENDER=noreply@serendibhotels.lk
```

> **Note:** Mailtrap catches all outgoing emails in a sandbox inbox. Emails won't reach real recipients but you can view them in the Mailtrap dashboard.

### Option B: Gmail (For Production/Demo with Real Emails)

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Update `.env` file:

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-gmail@gmail.com
```

> **Important:** Use an App Password, not your regular Gmail password.

---

## Stripe Payment Configuration (Required for Bookings)

The application uses Stripe for secure payment processing. You need sandbox API keys for development.

### Getting Stripe Sandbox Keys

1. Sign up at [stripe.com](https://stripe.com) (free to create account)
2. Toggle to **Sandbox Mode** (top-right of dashboard) to see your API keys
3. Copy your API keys and update `.env`:

```env
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

> **Note:** Sandbox keys start with `sk_test_` and `pk_test_`. These allow testing without real charges.

### Test Card Numbers

Use these test cards during checkout:
| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |

Use any future expiry date (e.g., 12/34) and any 3-digit CVC.

---

## Verify It Works

1. **Check Backend Health:**
   - Visit: http://localhost:5000/api/health
   - Should see: `{"service": "Serendib Hotels API", "status": "healthy"}`

2. **Check Frontend:**
   - Visit: http://localhost:5173
   - Should see the beautiful homepage

3. **Test Login:**
   - Click "Login" or visit: http://localhost:5173/login
   - Use test credentials (after running `fix_passwords.py`):
     - **Admin:** `admin@serendibhotels.lk` / `admin123`
     - **Staff:** `staff@serendibhotels.lk` / `Test@1234`
     - **Guest:** `john.doe@example.com` / `guest123`
   
   **If login fails:** Make sure you ran `python fix_passwords.py` after importing the schema!

---

## Troubleshooting

### Password/Login Issues

**Problem:** Cannot login with test credentials after importing schema

**Solution:**
1. Make sure you ran `python fix_passwords.py` after importing schema.sql
2. Activate virtual environment first:
   ```bash
   cd serendib-backend
   source venv/Scripts/activate  # Windows Git Bash
   python fix_passwords.py
   ```
3. Verify passwords were updated (you should see success messages)
4. Try logging in again

**If still not working:**
- Check that MySQL is running
- Verify database connection in `.env` file
- Check backend logs for errors

### Backend Issues

**Error: "Module not found"**
```bash
# Make sure virtual environment is activated
source venv/Scripts/activate  # Windows Git Bash
# or
venv\Scripts\activate  # Windows CMD
```

**Error: "Can't connect to MySQL"**
- Check XAMPP MySQL is running (green in XAMPP Control Panel)
- Verify database name: `serendib_hotels`
- Check `.env` file has correct `DB_PASSWORD` (empty for XAMPP)

**Error: "Port 5000 already in use"**
```bash
# Kill process using port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Issues

**Error: "Cannot find module"**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: "CORS policy"**
- Make sure backend is running
- Check backend terminal for errors
- Restart backend after any `.env` changes

---

## Quick Reference

### Start Commands (Remember These!)

**Terminal 1 - Backend:**
```bash
cd serendib-backend
source venv/Scripts/activate  # Windows Git Bash
python run.py
```

**Terminal 2 - Frontend:**
```bash
cd serendib-frontend
npm run dev
```

### Stop Commands

- **Backend:** Press `Ctrl + C` in backend terminal
- **Frontend:** Press `Ctrl + C` in frontend terminal

---

## What's Next?

Once the application is running:

1. **Explore the Application:**
   - Browse rooms and make a booking
   - Test different user roles (admin, staff, guest)
   - Check out the navigation bar (role-based menus)

2. **Read Full Documentation:**
   - See `PROJECT_COMPLETE.md` for:
     - Complete feature list
     - API documentation
     - Design system reference
     - Development roadmap

3. **Start Developing:**
   - All pages are functional
   - Backend APIs are ready
   - Design system is in place

---

## Need Help?

1. **Check Backend Logs** - Look at the terminal running `python run.py`
2. **Check Browser Console** - Press F12 in browser
3. **Verify Database** - Check phpMyAdmin for `serendib_hotels` database
4. **Read Documentation** - See `PROJECT_COMPLETE.md` for detailed info

---

**You're all set! The application should be running now.**

Visit http://localhost:5173 and start exploring!

