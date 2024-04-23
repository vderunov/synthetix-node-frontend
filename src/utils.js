export function getApiUrl() {
  return window.localStorage.getItem('API_URL') ?? process.env.API_URL;
}

export function restoreToken({ walletAddress }) {
  try {
    const tokens = window.localStorage.getItem('tokens')
      ? JSON.parse(window.localStorage.getItem('tokens'))
      : {};
    return tokens[walletAddress];
  } catch (e) {
    console.error('Restore token error:', e);
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

export function downloadFile(data, filename = 'file') {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.style.display = 'none';
  a.href = downloadUrl;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
