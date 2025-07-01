<script>
  import { auth } from '../store.js';
  import { push } from 'svelte-spa-router';
  import { onDestroy } from 'svelte';

  let isLoggedIn;

  const unsubscribe = auth.subscribe(value => {
    isLoggedIn = value;
  });

  function logout() {
    auth.logout();
    push('/login');
  }

  // если пользователь не залогинен — редирект на /login
  if (isLoggedIn === false) {
    push('/login');
  }
  
  onDestroy(() => {
    unsubscribe();
  });

  let browserInfo = navigator.userAgent;
</script>

<div class="info">
  <h1>Welcome!</h1>
  <h1>{browserInfo}</h1>
  <button onclick={logout} id="logout-button">Logout</button>
</div>

<style>
  .info {
    color: rgb(200, 141, 255);
    user-select: none;
    transition:
      color 0.5s ease,
      text-shadow 0.8s ease;
  }

  .info:hover {
    color: rgb(156, 255, 141);
  }

  .info:hover {
    text-shadow: 0px 0px 5px rgb(105, 255, 82);
  }
</style>
