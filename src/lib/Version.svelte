<script>
  import version from "../../package.json";
  import { onMount } from 'svelte';

  let hue = 0;
  let styleString = '';

  function animateColor() {
    styleString = `
      color: hsl(${hue}, 100%, 70%);
    `;
    hue = (hue + 1) % 360;
    requestAnimationFrame(animateColor);
  }

  onMount(() => {
    animateColor();
  });
</script>

<div class="version" style={styleString}>
  v{version.version}
</div>

<style>
  .version {
    font-size: 24px;
    display: block;
    position: absolute;
    z-index: 9999;
    margin-top: 10px;
    left: 1%;
    top: 94.5%;
    font-weight: bold;
    color: #e5e5e5;
    transition: color 0.2s ease;
  }
</style>
