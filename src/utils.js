export function getApiUrl() {
  return window.localStorage.getItem('API_URL') ?? process.env.API_URL;
}

export function restoreToken({ walletAddress }) {
  try {
    const tokens = window.localStorage.getItem('tokens')
      ? JSON.parse(window.localStorage.getItem('tokens'))
      : {};
    return tokens[walletAddress];
  } catch {
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
