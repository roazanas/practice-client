<script>
  let browserInfo = $state(navigator.userAgent);
</script>

<div class="info">
  <h1>Welcome!</h1>
  <h2>{browserInfo}</h2>
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
