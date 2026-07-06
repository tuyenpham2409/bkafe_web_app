import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'bkafe_token';

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function setToken(token) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}
