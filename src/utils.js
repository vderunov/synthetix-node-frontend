export function getApiUrl() {
  return window.localStorage.getItem('API_URL') ?? process.env.API_URL;
}

export function getIpfsUrl() {
  const IPFS_HOST = process.env.IPFS_HOST || '127.0.0.1';
  const IPFS_PORT = process.env.IPFS_PORT || '5001';
  return `http://${IPFS_HOST}:${IPFS_PORT}/`;
}

export function restoreToken({ walletAddress }) {
  try {
    const tokens = window.localStorage.getItem('tokens')
      ? JSON.parse(window.localStorage.getItem('tokens'))
      : {};
    return tokens[walletAddress];
  } catch (e) {
    return undefined;
  }
}

export function saveToken({ walletAddress, token }) {
  try {
    const tokens = window.localStorage.getItem('tokens')
      ? JSON.parse(window.localStorage.getItem('tokens'))
      : {};
    tokens[walletAddress] = token;
    window.localStorage.setItem('tokens', JSON.stringify(tokens));
  } catch (e) {
    console.error('Error saving token:', e);
  }
}
