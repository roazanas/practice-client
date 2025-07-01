<script>
    import BrowserInfo from "./lib/BrowserInfo.svelte";
    import Update from "./lib/Update.svelte";
    import Login from "./lib/Login.svelte";

    let isLoggedIn = false;

    function onLoginSuccess() {
        isLoggedIn = true;
    }
</script>

{#if !isLoggedIn}
  <Login on:LoginSuccess={onLoginSuccess}/>
{:else}
  <BrowserInfo />
  <Update />
{/if}

<style>
    
</style>