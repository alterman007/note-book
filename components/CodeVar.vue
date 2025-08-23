<template>
  <code class="code-var">
    <slot />
  </code>
</template>

<script setup lang="ts">
const props = defineProps({
  // color: {
  //   type: String,
  //   default: 'var(--vp-c-red-2)',
  // },
});
</script>
<style scoped lang="scss">
.code-var {
  color: var(--vp-c-red-2);
}
</style>
