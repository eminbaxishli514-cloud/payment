# SplitPay AZ Architecture

## Overview

SplitPay AZ is a full-stack web application for restaurant bill splitting with ABB bank integration. It consists of a Node.js/Express backend serving a static frontend, using in-memory data storage for demonstration purposes.

## System Architecture

### High-Level Components

1. **Frontend (Client-Side)**
   - Single-page application built with vanilla HTML/CSS/JavaScript
   - Responsive design with modern UI elements and animations
   - Handles user interactions and API calls via fetch

2. **Backend (Server-Side)**
   - Express.js server providing REST API endpoints
   - Static file serving for frontend assets
   - Integration with ABB B2B API for payment processing

3. **Data Layer**
   - In-memory data structures using JavaScript Maps
   - Models for tables, customers, items, and restaurant config
   - Payment document generation in XML format

4. **External Integrations**
   - ABB Bank B2B API for token retrieval and payment submission
   - QR code generation via external service

## Detailed Component Breakdown

### Backend (`index.js`)

**Responsibilities:**
- Serve static frontend files
- Handle API requests for CRUD operations on tables/customers/items
- Manage restaurant configuration
- Proxy ABB API calls for payment processing

**Key Routes:**
- `GET /api/config` - Retrieve restaurant settings
- `POST /api/config` - Update restaurant configuration
- `GET /api/tables` - List all tables with summary
- `POST /api/tables` - Create new table
- `GET /api/tables/:id` - Get table details
- `POST /api/tables/:id/customers` - Add customer to table
- `POST /api/tables/:id/items` - Add item to table
- `GET /api/tables/:id/summary` - Get payment details
- `POST /api/abb/token` - Get ABB access token
- `POST /api/abb/pay` - Submit payment to ABB
- `POST /api/abb/otp` - Verify OTP for payment

**Static Serving:**
- Serves `frontend/index.html` for root and unknown paths
- Special handling for `/config.html` to serve config page

### ABB Service (`abbService.js`)

**Functions:**
- `getToken()` - Authenticates with ABB API using client credentials
- `sendPayments()` - Submits payment batch with base64-encoded XML
- `verifyOtp()` - Confirms payment with OTP

**API Details:**
- Base URL: `http://api-test-c2b.abb-bank.az`
- Authentication: OAuth2 client credentials flow
- Payment Format: XML document base64-encoded in request body

### Data Store (`dataStore.js`)

**Data Models:**
- **Restaurant Config**: Tables count, menu items (id, name, price)
- **Table**: ID, number, creation date, note, customers array, items array
- **Customer**: ID, name
- **Item**: ID, name, price, customer assignment, description

**Key Functions:**
- `createTable()` - Creates new table with UUID
- `getTables()` - Returns table summaries with computed totals
- `addCustomer()` / `addItem()` - Adds entities to tables
- `computePaymentDetails()` - Calculates totals, customer shares, generates payment XML
- `buildPaymentFile()` - Creates base64-encoded XML payment document
- `generateCustomerLinks()` - Creates payment URLs for QR codes

**Storage:**
- Uses JavaScript Maps for O(1) lookups
- In-memory only (not persistent across restarts)

### Frontend Structure

#### Main Dashboard (`frontend/index.html`, `app.js`)

**Features:**
- Table grid with clickable images
- Customer and item management panels
- Payment link generation with QR codes
- ABB integration panel

**JavaScript Logic (`app.js`):**
- Loads restaurant config on startup
- Renders table grid dynamically
- Handles form submissions for customers/items
- Generates QR codes using external API
- Manages UI state and animations

#### Config Page (`frontend/config.html`, `config.js`)

**Features:**
- Form to set number of tables
- Dynamic menu item management
- Save/load configuration

**JavaScript Logic (`config.js`):**
- Loads current config from API
- Adds/removes menu items dynamically
- Saves updates to backend

#### Payment Page (`frontend/pay.html`)

**Features:**
- Displays customer-specific payment details
- QR code for payment link
- Integration with ABB payment flow

#### Styling (`frontend/style.css`)

**Design Principles:**
- Modern gradient backgrounds
- Glass-morphism effects
- Responsive grid layouts
- Fade-in animations
- Mobile-first approach

## Data Flow

1. **Setup**: User configures restaurant via `/config.html`
2. **Order Management**: Cashier selects table, adds customers/items
3. **Payment Generation**: System computes totals, generates QR links
4. **ABB Integration**: Optional batch submission to bank API

## Security Considerations

- No authentication implemented (demo only)
- ABB credentials stored in client (use environment variables in production)
- In-memory storage not secure for production
- HTTPS recommended for payment data

## Scalability Notes

- In-memory store limits concurrent users
- Replace with database (MongoDB/PostgreSQL) for persistence
- Add caching for menu/config data
- Implement session management for multi-user support

## Deployment

- **Development**: `npm start` runs on localhost:4000
- **Production**: Use PM2 or similar for process management
- **Containerization**: Add Dockerfile for Docker deployment
- **Environment**: Set NODE_ENV=production, configure ABB URLs

## Future Enhancements

- Database integration
- User authentication
- Real-time updates (WebSockets)
- Advanced reporting
- Multi-language support
- Custom branding uploads