import { writable } from "svelte/store";

function createAuthStore() {
  const { subscribe, set } = writable(false);

  return {
    subscribe,
    init() {
      const stored = localStorage.getItem("isLoggedIn") === "true";
      set(stored);
    },
    login() {
      set(true);
      localStorage.setItem("isLoggedIn", "true");
    },
    logout() {
      set(false);
      localStorage.removeItem("isLoggedIn");
    },
  };
}

export const auth = createAuthStore();

