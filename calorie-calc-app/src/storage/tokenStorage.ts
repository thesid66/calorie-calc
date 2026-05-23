import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'calorie_calc_auth_token'

function getWebStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    const storage = getWebStorage()

    if (storage) {
      storage.setItem(TOKEN_KEY, token)
    }

    return
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    const storage = getWebStorage()

    return storage?.getItem(TOKEN_KEY) ?? null
  }

  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    const storage = getWebStorage()

    if (storage) {
      storage.removeItem(TOKEN_KEY)
    }

    return
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
