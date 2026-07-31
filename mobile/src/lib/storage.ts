import * as SecureStore from "expo-secure-store";

export const saveToken = (token: string) => SecureStore.setItemAsync("token", token);
export const getToken = () => SecureStore.getItemAsync("token");
export const removeToken = () => SecureStore.deleteItemAsync("token");
export const saveUser = (user: object) => SecureStore.setItemAsync("user", JSON.stringify(user));
export const getUser = async () => {
  const raw = await SecureStore.getItemAsync("user");
  return raw ? JSON.parse(raw) : null;
};
export const removeUser = () => SecureStore.deleteItemAsync("user");
