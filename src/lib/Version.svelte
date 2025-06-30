<script>
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  let version = writable("...");

  onMount(async () => {
    // @ts-ignore
    const v = await window.electronAPI.getAppVersion();
    version.set(v);
  });
</script>

<div class="version">v {$version}</div>

<style>
  .version {
    display: block;
    margin-top: 4px;
    color: #e5e5e5;
  }
</style>
