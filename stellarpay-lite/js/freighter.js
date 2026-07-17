let walletAddress = "";
let isConnected = false;

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
    const result = await FreighterApi.isConnected();

    if (!result.isConnected) {
      const accessResult = await FreighterApi.requestAccess();
      if (accessResult.error) {
        throw new Error(
          accessResult.error.message || "Unable to connect to Freighter.",
        );
      }

      walletAddress = accessResult.address;
      isConnected = true;
      updateWalletUI({
        address: walletAddress,
        status: "Connected",
        message: "Wallet connected successfully.",
        connected: true,
      });
      return;
    }

    const addressResult = await FreighterApi.getAddress();
    if (addressResult.error) {
      throw new Error(
        addressResult.error.message || "Unable to read wallet address.",
      );
    }

    walletAddress = addressResult.address;
    isConnected = true;
    updateWalletUI({
      address: walletAddress,
      status: "Connected",
      message: "Wallet already connected.",
      connected: true,
    });
  } catch (error) {
    walletAddress = "";
    isConnected = false;
    updateWalletUI({
      address: "",
      status: "Disconnected",
      message: error.message || "Unable to connect wallet.",
      connected: false,
    });
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

  updateWalletUI({
    address: "",
    status: "Disconnected",
    message: "Connect your wallet to begin.",
    connected: false,
  });
}
