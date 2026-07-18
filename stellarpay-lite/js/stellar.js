let server;

export function getStellarServer() {
  if (!server) {
    server = new window.StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
  }
  return server;
}

export async function fetchAccountBalance(address) {
  try {
    const server = getStellarServer();
    const account = await server.loadAccount(address);
    const nativeBalance = account.balances.find((b) => b.asset_type === "native");
    return nativeBalance ? nativeBalance.balance : "0.000";
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return "0.000 (Unfunded)";
    }
    console.error("Error fetching balance:", error);
    throw new Error("Network error while fetching balance.");
  }
}

export function isValidAddress(address) {
  try {
    return window.StellarSdk.StrKey.isValidEd25519PublicKey(address);
  } catch (e) {
    return false;
  }
}

const TESTNET_PASSPHRASE = window.StellarSdk.Networks.TESTNET;

export async function buildPaymentTransaction(senderAddress, recipientAddress, amount) {
  const server = getStellarServer();
  const account = await server.loadAccount(senderAddress);
  const fee = await server.fetchBaseFee();

  const transaction = new window.StellarSdk.TransactionBuilder(account, {
    fee,
    networkPassphrase: TESTNET_PASSPHRASE,
  })
    .addOperation(
      window.StellarSdk.Operation.payment({
        destination: recipientAddress,
        asset: window.StellarSdk.Asset.native(),
        amount: amount.toString(),
      })
    )
    .setTimeout(100)
    .build();

  return transaction.toXDR();
}

export async function submitTransaction(signedXdr) {
  const server = getStellarServer();
  const transaction = window.StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    TESTNET_PASSPHRASE
  );
  return await server.submitTransaction(transaction);
}
