import BrowserInfo from './lib/BrowserInfo.svelte';
import Login from './lib/Login.svelte';
import Register from './lib/Register.svelte';

export default {
  '/login': Login,
  '/register': Register,
  '/': BrowserInfo
};