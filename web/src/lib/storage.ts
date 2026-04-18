const API_KEY_STORAGE_KEY = "browsegraph.web.api_key";

export const getStoredApiKey = (): string | null => {
  const value = window.localStorage.getItem(API_KEY_STORAGE_KEY);

  if (value === null) {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

export const storeApiKey = (apiKey: string): void => {
  window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
};

export const clearStoredApiKey = (): void => {
  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
};
