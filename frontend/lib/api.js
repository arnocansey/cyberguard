import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL,
  withCredentials: true
});

let csrfTokenPromise = null;

const fetchCsrfToken = async () => {
  try {
    const { data } = await axios.get(`${baseURL}/auth/csrf-token`, { withCredentials: true });
    return data.csrfToken;
  } catch (err) {
    console.error("Failed to fetch CSRF token", err);
    return null;
  }
};

api.interceptors.request.use(async (config) => {
  // Ensure cookies are sent on all requests
  config.withCredentials = true;

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const tenantId = localStorage.getItem("tenantId") || "default";
    config.headers["x-tenant-id"] = tenantId;

    // Fetch CSRF token for mutating requests
    const method = config.method?.toLowerCase();
    if (["post", "put", "delete", "patch"].includes(method)) {
      if (!csrfTokenPromise) {
        csrfTokenPromise = fetchCsrfToken();
      }
      const csrfToken = await csrfTokenPromise;
      if (csrfToken) {
        config.headers["x-csrf-token"] = csrfToken;
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If request fails due to invalid/expired CSRF token, clear cache and retry once
    if (
      error?.response?.status === 403 &&
      error?.response?.data?.code === "EBADCSRFTOKEN" &&
      !originalRequest?._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      csrfTokenPromise = fetchCsrfToken(); // fetch a fresh one
      const csrfToken = await csrfTokenPromise;
      if (csrfToken) {
        originalRequest.headers["x-csrf-token"] = csrfToken;
        return api(originalRequest);
      }
    }

    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/login") &&
      !originalRequest?.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await api.post("/auth/refresh", { refreshToken });
        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
