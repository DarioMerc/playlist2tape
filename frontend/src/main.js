import { library } from "@fortawesome/fontawesome-svg-core";
import { faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import axios from "axios";
import Cookies from "js-cookie";
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import App from "./App.vue";
import EditComponent from "./components/EditComponent.vue";
import LoginComponent from "./components/LoginComponent.vue";
import "./styles/main.scss";

library.add(faXmark, faPlus);

axios.defaults.baseURL = "http://localhost:5000";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    { path: "/login", name: "Login", component: LoginComponent },
    {
      path: "/edit",
      name: "Edit",
      component: EditComponent,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth && !Cookies.get("access_token")) {
    const refresh_token = Cookies.get("refresh_token");
    if (refresh_token) {
      try {
        const response = await axios.get("/refresh_token", {
          params: { refresh_token },
        });

        if (response.data && response.data.access_token) {
          // Set new access token
          const expirationTime = new Date();
          expirationTime.setTime(expirationTime.getTime() + 60 * 60 * 1000); // 1 hour expiry
          Cookies.set("access_token", response.data.access_token, {
            expires: expirationTime,
          });
          next();
        } else {
          console.error("Failed to refresh access token");
          next("/login");
        }
      } catch (error) {
        console.error("Error refreshing access token:", error);
        next("/login");
      }
    } else {
      console.error("Refresh token not found");
      next("/login");
    }
  } else {
    next();
  }
});

createApp(App)
  .use(router)
  .use(Toast)
  .component("font-awesome-icon", FontAwesomeIcon)
  .mount("#app");
