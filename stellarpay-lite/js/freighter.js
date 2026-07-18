import { fetchAccountBalance, isValidAddress, buildPaymentTransaction, submitTransaction } from "./stellar.js";

// Helper for toast notifications
function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  // Remove after animation
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3500);
}

// Helper for friendly error messages
function getFriendlyErrorMessage(error) {
  const msg = (error.message || error || "").toString().toLowerCase();
  
  if (msg.includes("user declined") || msg.includes("rejected") || msg.includes("cancelled")) {
    return "Action was cancelled in your wallet.";
  }
  if (msg.includes("not set up") || msg.includes("locked")) {
    return "Your Freighter wallet is locked. Please open the extension and unlock it.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("timeout")) {
    return "Network error. Please check your connection to the Stellar network.";
  }
  if (msg.includes("op_underfunded") || msg.includes("insufficient balance")) {
    return "Insufficient XLM balance to complete this transaction.";
  }
  if (msg.includes("invalid address") || msg.includes("op_no_destination")) {
    return "The recipient address is invalid or does not exist.";
  }
  if (msg.includes("tx_bad_seq")) {
    return "Wallet out of sync. Please refresh the page and try again.";
  }
  
  return error.message || error || "An unexpected error occurred. Please try again.";
}

let walletAddress = "";
let isConnected = false;
let currentBalance = 0;

function getFreighterApi() {
  if (typeof window === "undefined") {
    return null;
  }

  const api = window.freighterApi || window.freighter;

  if (api && typeof api.isConnected === "function") {
    return api;
  }

  return null;
}

function updateWalletUI({ address, status, message, connected }) {
  const badge = document.getElementById("wallet-status-badge");
  const addressEl = document.getElementById("wallet-address");
  const messageEl = document.getElementById("wallet-message");
  const connectBtn = document.getElementById("connect-wallet-btn");
  const disconnectBtn = document.getElementById("disconnect-wallet-btn");

  if (!badge || !addressEl || !messageEl || !connectBtn || !disconnectBtn) {
    return;
  }

  badge.textContent = status;
  badge.classList.toggle("is-connected", connected);

  if (address) {
    addressEl.textContent = address;
  } else {
    addressEl.textContent = "Not connected";
  }

  messageEl.textContent = message;
  messageEl.classList.toggle("success", connected);

  connectBtn.disabled = connected;
  disconnectBtn.disabled = !connected;

  if (!connected) {
    const balanceAmountEl = document.querySelector(".balance-amount");
    if (balanceAmountEl) {
      balanceAmountEl.innerHTML = '0.000 <span>XLM</span>';
    }

    const txStatusTextEl = document.querySelector(".transaction-status p");
    if (txStatusTextEl) {
      txStatusTextEl.textContent = 'Waiting for connection';
    }

    const txHashCodeEl = document.querySelector(".transaction-card .address-row code");
    if (txHashCodeEl) {
      txHashCodeEl.textContent = 'None';
    }
    const txStatusDot = document.getElementById("tx-status-dot");
    if (txStatusDot) {
      txStatusDot.className = "status-dot";
    }
    const txTimestampEl = document.getElementById("tx-timestamp");
    if (txTimestampEl) {
      txTimestampEl.textContent = "";
    }
    
    currentBalance = 0;
    const recipientInput = document.getElementById("recipient-address");
    const amountInput = document.getElementById("send-amount");
    const recipientError = document.getElementById("recipient-error");
    const amountError = document.getElementById("amount-error");
    if (recipientInput) recipientInput.value = "";
    if (amountInput) amountInput.value = "";
    if (recipientError) recipientError.style.display = "none";
    if (amountError) amountError.style.display = "none";
  }

  const sendBtn = document.getElementById("send-btn");
  if (sendBtn) {
    sendBtn.disabled = true; // Handled by validation when connected
  }

  const refreshBtn = document.querySelector(".balance-card .link-btn");
  if (refreshBtn) {
    refreshBtn.disabled = !connected;
  }
}

export async function connectFreighter() {
  const FreighterApi = getFreighterApi();

  if (!FreighterApi) {
    updateWalletUI({
      address: "",
      status: "Unavailable",
      message:
        "Freighter is not installed. Please install the browser extension and try again.",
      connected: false,
    });
    return;
  }

  try {
    const connectedResult = await FreighterApi.isConnected();

    if (!connectedResult.isConnected) {
      throw new Error("Your Freighter wallet is locked. Please open the extension and unlock it.");
    }

    const accessResult = await FreighterApi.requestAccess();
    
    if (accessResult.error) {
      throw new Error(accessResult.error.message || accessResult.error);
    }

    walletAddress = accessResult.address;
    isConnected = true;
    updateWalletUI({
      address: walletAddress,
      status: "Connected",
      message: "Wallet connected successfully.",
      connected: true,
    });
    
    await refreshBalanceUI();
  } catch (error) {
    walletAddress = "";
    isConnected = false;
    const friendlyMessage = getFriendlyErrorMessage(error);
    updateWalletUI({
      address: "",
      status: "Disconnected",
      message: friendlyMessage,
      connected: false,
    });
  }
}

export async function refreshBalanceUI() {
  if (!isConnected || !walletAddress) return;
  
  const balanceDisplay = document.getElementById("balance-display");
  if (!balanceDisplay) return;

  try {
    balanceDisplay.innerHTML = '<span class="loading-spinner">⏳ Loading...</span>';
    const balance = await fetchAccountBalance(walletAddress);
    balanceDisplay.innerHTML = `${balance} <span>XLM</span>`;
    currentBalance = parseFloat(balance) || 0;
    validatePaymentForm();
  } catch (error) {
    balanceDisplay.innerHTML = `<span class="error-text">Error fetching</span>`;
    currentBalance = 0;
    const friendlyMessage = getFriendlyErrorMessage(error);
    showToast(`Balance Error: ${friendlyMessage}`, "error");
    console.error(error);
  }
}

export function validatePaymentForm() {
  if (!isConnected) return;
  const recipientInput = document.getElementById("recipient-address");
  const amountInput = document.getElementById("send-amount");
  const sendBtn = document.getElementById("send-btn");
  const recipientError = document.getElementById("recipient-error");
  const amountError = document.getElementById("amount-error");

  if (!recipientInput || !amountInput || !sendBtn) return;

  let isValid = true;

  // Validate Address
  if (!recipientInput.value) {
    recipientError.style.display = "none";
    isValid = false;
  } else if (!isValidAddress(recipientInput.value)) {
    recipientError.textContent = "Invalid Stellar public key.";
    recipientError.style.display = "block";
    isValid = false;
  } else {
    recipientError.style.display = "none";
  }

  // Validate Amount
  const amount = parseFloat(amountInput.value);
  if (!amountInput.value) {
    amountError.style.display = "none";
    isValid = false;
  } else if (isNaN(amount) || amount <= 0) {
    amountError.textContent = "Amount must be greater than zero.";
    amountError.style.display = "block";
    isValid = false;
  } else if (amount > currentBalance) {
    amountError.textContent = "Insufficient balance.";
    amountError.style.display = "block";
    isValid = false;
  } else {
    amountError.style.display = "none";
  }

  sendBtn.disabled = !isValid;
}

export async function submitPayment() {
  if (!isConnected || !walletAddress) return;
  
  const recipientInput = document.getElementById("recipient-address");
  const amountInput = document.getElementById("send-amount");
  const sendBtn = document.getElementById("send-btn");
  const txStatusTextEl = document.getElementById("tx-status-text") || document.querySelector(".transaction-status p");
  const txHashCodeEl = document.getElementById("tx-hash-code") || document.querySelector(".transaction-card .address-row code");
  const txStatusDot = document.getElementById("tx-status-dot");
  const txTimestampEl = document.getElementById("tx-timestamp");
  
  if (!recipientInput || !amountInput || !sendBtn || !txStatusTextEl || !txHashCodeEl) return;
  
  const recipient = recipientInput.value;
  const amount = amountInput.value;
  
  try {
    sendBtn.disabled = true;
    sendBtn.textContent = "Building transaction...";
    txStatusTextEl.textContent = "Building transaction...";
    txHashCodeEl.textContent = "Pending...";
    
    if (txStatusDot) txStatusDot.className = "status-dot pending";
    if (txTimestampEl) txTimestampEl.textContent = "";
    
    const xdr = await buildPaymentTransaction(walletAddress, recipient, amount);
    
    sendBtn.textContent = "Waiting for signature...";
    txStatusTextEl.textContent = "Please sign in Freighter...";
    
    const FreighterApi = getFreighterApi();
    const signResult = await FreighterApi.signTransaction(xdr, { 
      networkPassphrase: "Test SDF Network ; September 2015" 
    });
    
    let signedXdr = "";
    if (typeof signResult === "string") {
      signedXdr = signResult;
    } else if (signResult && signResult.error) {
      throw new Error(signResult.error.message || signResult.error || "Signature rejected");
    } else if (signResult && signResult.signedTxXdr) {
      signedXdr = signResult.signedTxXdr;
    } else {
      throw new Error("Invalid signature result");
    }
    
    sendBtn.textContent = "Submitting to network...";
    txStatusTextEl.textContent = "Submitting to Stellar Testnet...";
    
    const response = await submitTransaction(signedXdr);
    
    txStatusTextEl.textContent = "Payment successful!";
    txHashCodeEl.textContent = response.hash || "Success";
    if (txTimestampEl) txTimestampEl.textContent = new Date().toLocaleString();
    if (txStatusDot) txStatusDot.className = "status-dot success";
    showToast("Payment successfully sent!", "success");
    
    // Reset form
    recipientInput.value = "";
    amountInput.value = "";
    await refreshBalanceUI();
  } catch (error) {
    console.error(error);
    const friendlyMessage = getFriendlyErrorMessage(error);
    txStatusTextEl.textContent = `${friendlyMessage}`;
    txHashCodeEl.textContent = "Failed";
    if (txStatusDot) txStatusDot.className = "status-dot error";
    showToast(`Payment failed: ${friendlyMessage}`, "error");
  } finally {
    sendBtn.textContent = "Send XLM";
    sendBtn.disabled = true; // Wait for validation to re-enable
    validatePaymentForm();
  }
}

export function disconnectFreighter() {
  walletAddress = "";
  isConnected = false;
  updateWalletUI({
    address: "",
    status: "Disconnected",
    message: "Wallet disconnected.",
    connected: false,
  });
}

export function initFreighterWallet() {
  const connectBtn = document.getElementById("connect-wallet-btn");
  const disconnectBtn = document.getElementById("disconnect-wallet-btn");

  if (!connectBtn || !disconnectBtn) {
    return;
  }

  connectBtn.addEventListener("click", connectFreighter);
  disconnectBtn.addEventListener("click", disconnectFreighter);
  
  const refreshBtn = document.querySelector(".balance-card .link-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshBalanceUI);
  }

  const recipientInput = document.getElementById("recipient-address");
  const amountInput = document.getElementById("send-amount");
  if (recipientInput) recipientInput.addEventListener("input", validatePaymentForm);
  if (amountInput) amountInput.addEventListener("input", validatePaymentForm);

  const sendBtn = document.getElementById("send-btn");
  if (sendBtn) {
    sendBtn.addEventListener("click", submitPayment);
  }

  const copyBtn = document.getElementById("copy-tx-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const hashEl = document.getElementById("tx-hash-code");
      if (hashEl && hashEl.textContent && hashEl.textContent !== "None" && hashEl.textContent !== "Pending..." && hashEl.textContent !== "Failed") {
        navigator.clipboard.writeText(hashEl.textContent)
          .then(() => showToast("Transaction hash copied!", "success"))
          .catch(() => showToast("Failed to copy hash", "error"));
      } else {
        showToast("No valid hash to copy", "error");
      }
    });
  }

  updateWalletUI({
    address: "",
    status: "Disconnected",
    message: "Connect your wallet to begin.",
    connected: false,
  });
}
