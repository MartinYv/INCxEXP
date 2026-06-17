import axios from "axios";
import { useAuth } from "./AuthContext";

const api = axios.create({
  baseURL: "http://localhost:5157/api",
});

export function useApi() {
  const { token } = useAuth();

  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }

  return api;
}
