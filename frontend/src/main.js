import axios from "axios";
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import EditComponent from "./components/Edit/EditComponent.vue";
import LoginComponent from "./components/Login/LoginComponent.vue";

import "./styles/main.scss";

// // Set base URL for API requests
axios.defaults.baseURL = "http://localhost:5000";

// Axios interceptor for handling token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const newAccessToken = await refreshToken();
      if (newAccessToken) {
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "Login", component: LoginComponent },
    {
      path: "/edit",
      name: "Edit",
      component: EditComponent,
      beforeEnter: (to, from, next) => {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        const hasTokensInUrl =
          to.hash.includes("access_token=") &&
          to.hash.includes("refresh_token=");

        if (!accessToken || !refreshToken || !hasTokensInUrl) {
          // Tokens or tokens in URL are missing, redirect to login
          next({ name: "Login" });
        } else {
          next();
        }
      },
    },
  ],
});

async function refreshToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    // Handle case where refresh token is not available
    return null;
  }

  try {
    const response = await axios.post("/api/refresh_token", {
      refresh_token: refreshToken,
    });
    const { access_token } = response.data;

    // Update the stored access token
    localStorage.setItem("accessToken", access_token);

    return access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

createApp(App).use(router).mount("#app");
