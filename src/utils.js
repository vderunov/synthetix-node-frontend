export function getApiUrl() {
  return window.localStorage.getItem('API_URL') ?? process.env.API_URL;
}

export function getTokensFromLocalStorage() {
  return JSON.parse(window.localStorage.getItem('tokens') ?? '{}');
}
