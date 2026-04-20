# SplitPay AZ

A modern restaurant bill splitting app designed for Azerbaijani cafes and restaurants. It enables cashiers to manage tables, assign orders to customers, generate QR payment links, and integrate with ABB Bank's B2B API for seamless payments.

## Features

- **Restaurant Configuration**: Set up tables and menu items via a dedicated config page
- **Visual Table Management**: Click on table images to select and manage orders
- **Customer & Order Assignment**: Add customers and assign menu items to them
- **Payment Splitting**: Automatically calculate per-customer totals
- **QR Code Generation**: Create scannable payment links for customers
- **ABB Bank Integration**: Submit payment batches to ABB's test environment
- **Mobile-Responsive UI**: Modern, animated interface optimized for all devices
- **Branding Support**: Placeholder for logos and custom styling

## Architecture Overview

See `architecture.md` for detailed technical documentation.

## Setup

1. **Clone or navigate to the project**:
   ```bash
   cd payment  # Assuming you're in the split folder
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

4. **Access the app**:
   - Main dashboard: `http://localhost:4000`
   - Config page: `http://localhost:4000/config.html`

## Usage Guide

### Initial Setup
1. Visit `/config.html` to configure your restaurant:
   - Set the number of tables
   - Add menu items with names and prices

### Managing Orders
1. On the main dashboard, click on a table image to load it
2. Add customers to the table
3. Select items from the menu dropdown and assign to customers
4. View per-customer totals and unassigned items

### Generating Payments
1. Click "Generate Payment Links" to create QR codes
2. Customers scan the QR to pay their share
3. Optionally submit the batch to ABB for processing

### ABB Integration
- Enter test credentials in the bank panel
- Use "Submit to ABB" for batch payments
- Supports OTP verification

## Project Structure

```
payment/
├── index.js              # Express server and API routes
├── abbService.js         # ABB API integration (token, payments)
├── dataStore.js          # In-memory data models and payment generation
├── frontend/
│   ├── index.html        # Main dashboard UI
│   ├── config.html       # Restaurant setup page
│   ├── pay.html          # Customer payment page
│   ├── style.css         # Modern CSS with animations
│   ├── app.js            # Dashboard logic
│   └── config.js         # Config page logic
├── package.json          # Dependencies and scripts
├── README.md             # This file
└── architecture.md       # Technical documentation
```

## Dependencies

- **Backend**: Node.js, Express, Axios, UUID
- **Frontend**: Vanilla HTML/CSS/JS with modern ES6 features
- **External**: QR code generation via API

## Notes

- Uses in-memory storage for demo; implement database for production
- ABB integration uses test environment; update URLs for production
- Payment files are base64-encoded XML; verify schema with ABB docs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## License

See LICENSE file.

## Notes

- This implementation uses an in-memory store for demo purposes. For production, replace it with a database.
- The ABB payment file is serialized as an XML-style document and base64-encoded. Adjust the payload structure to match ABB's exact production schema if needed.

## Development

To add persistence or connect a production ABB flow:

- Replace `dataStore.js` with a database-backed model
- Add real merchant account and payment file format validation
- Secure credential handling and deploy on HTTPS
