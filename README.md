# StellarPay Lite

StellarPay Lite is a modern, lightweight, and beginner-friendly decentralized application (dApp) built on the Stellar Testnet. It provides a polished and seamless user interface for connecting to the Freighter wallet, checking account balances, and executing XLM testnet payments. Designed as a foundational project for the "Rise In Stellar Journey to Mastery: White Belt Level 1" challenge, it emphasizes robust error handling, responsive design, and clean Vanilla JavaScript architecture.

## Features

- **Wallet Integration**: Seamlessly connect and disconnect using the Freighter browser extension.
- **Live Balance Tracking**: Fetch and display the current Stellar Testnet XLM balance of the connected wallet.
- **Testnet Payments**: Construct, sign (via Freighter), and submit transactions directly to the Stellar Testnet.
- **Real-Time Form Validation**: Prevents sending to invalid public keys, negative amounts, or amounts exceeding the current wallet balance.
- **Robust Error Handling**: Gracefully catches and displays human-readable errors for locked wallets, rejected signatures, network timeouts, and insufficient funds.
- **Modern UI/UX**: Features a highly polished, fully responsive dashboard with smooth CSS transitions, toast notifications, hover effects, and modern Google typography (Outfit & Inter).
- **No Heavy Frameworks**: Built using pure HTML, CSS, and Vanilla JavaScript to maintain a minimal footprint and easy learning curve.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6 Modules)
- **Stellar Integration**: `@stellar/stellar-sdk`
- **Wallet Provider**: `@stellar/freighter-api`
- **Local Server**: Node.js & Python (`http.server`)

## Folder Structure

```text
stellarpay-lite/
│
├── assets/                  # Images, icons, and logos
│   ├── logo.svg
│   └── favicon.ico
│
├── css/                     # Stylesheets
│   └── style.css            # Main application styles (responsive & animations)
│
├── js/                      # Application Logic (ES6 Modules)
│   ├── app.js               # Entry point and initialization
│   ├── freighter.js         # Freighter wallet connection and UI state management
│   └── stellar.js           # Stellar SDK logic (balances, transactions, validation)
│
├── package.json             # Project metadata, scripts, and dependencies
├── index.html               # Main application markup
└── README.md                # Project documentation
```

## Installation

1. **Clone the repository** (or download the source code):
   ```bash
   git clone https://github.com/your-username/stellarpay-lite.git
   cd stellarpay-lite
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Install Freighter Wallet**:
   Make sure you have the [Freighter browser extension](https://www.freighter.app/) installed and set to the **Testnet** network. You will also need to fund your testnet account using the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#create-account).

## How to Run

1. **Start the local development server**:
   ```bash
   npm start
   ```
   *(This script runs a lightweight HTTP server on port 3000)*

2. **Open the application**:
   Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

## Dependencies

- **`@stellar/freighter-api`**: Used to prompt the user's Freighter extension for access and transaction signatures.
- **`@stellar/stellar-sdk`**: Used to communicate with the Horizon Testnet server, check balances, and build/submit XDR transactions.

## Screenshots


- **Dashboard View**:<img width="1209" height="605" alt="image" src="https://github.com/user-attachments/assets/821ec9a2-a1ec-40ff-a9a4-e4d8b3cbcff5" />

`
- **Transaction Success**: <img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/bceb2947-36e2-4bcd-9061-f2a3ebd8927a" />


- **Mobile Responsive Layout**: <img width="738" height="1600" alt="WhatsApp Image 2026-07-19 at 00 46 40 (1)" src="https://github.com/user-attachments/assets/94504b26-f4a5-4727-a0ca-69fa6056b526" />
<img width="738" height="1600" alt="WhatsApp Image 2026-07-19 at 00 46 40" src="https://github.com/user-attachments/assets/317bc790-6851-4bde-88e8-1b89da9b8283" />

## Future Improvements

- **Transaction History**: Fetch and display a localized list of the user's past transactions using Horizon's `/payments` endpoint.
- **Multiple Assets**: Expand beyond XLM to allow users to add trustlines and send custom Testnet assets (e.g., USDC test tokens).
- **Address Book**: Allow users to save frequently used public keys with aliases.
- **Dark/Light Mode Toggle**: Implement a theme switcher to respect system preferences.

