<script>

    import Router from 'svelte-spa-router';
    import routes from './routes.js';
    import { auth } from './store.js';
    
    auth.init();
</script>

  <Router routes={routes} />

<style>
</style>

