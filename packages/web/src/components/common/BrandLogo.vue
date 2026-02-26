<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    :width="size || 24"
    :height="size || 24"
    class="brand-logo"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="brand-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#007AFF"/>
        <stop offset="100%" stop-color="#5856D6"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="108" ry="108" fill="url(#brand-bg)"/>
    <path d="M176 140 L176 388 M176 192 L232 192 M176 280 L232 280 M176 368 L232 368"
          stroke="white" stroke-opacity="0.9" stroke-width="26" stroke-linecap="round" fill="none"/>
    <circle cx="176" cy="140" r="22" fill="#ffffff"/>
    <rect x="240" y="168" width="152" height="48" rx="10" fill="#ffffff" fill-opacity="0.92"/>
    <rect x="254" y="181" width="24" height="18" rx="3" fill="#007AFF" fill-opacity="0.6"/>
    <rect x="254" y="178" width="12" height="6" rx="2" fill="#007AFF" fill-opacity="0.6"/>
    <rect x="240" y="256" width="192" height="48" rx="10" fill="#ffffff"/>
    <text x="260" y="289" font-family="SF Mono, Menlo, monospace" font-size="24" font-weight="600" fill="#5856D6" letter-spacing="-1" v-text="'{{ P }}'"></text>
    <rect x="240" y="344" width="136" height="48" rx="10" fill="#ffffff" fill-opacity="0.92"/>
    <line x1="258" y1="360" x2="354" y2="360" stroke="#007AFF" stroke-opacity="0.4" stroke-width="6" stroke-linecap="round"/>
    <line x1="258" y1="376" x2="326" y2="376" stroke="#007AFF" stroke-opacity="0.3" stroke-width="6" stroke-linecap="round"/>
  </svg>
</template>

<style scoped>
.brand-logo {
  flex-shrink: 0;
}
</style>
