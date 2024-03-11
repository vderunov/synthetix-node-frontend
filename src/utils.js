export function getApiUrl() {
  return window.localStorage.getItem('API_URL') ?? process.env.API_URL;
}
