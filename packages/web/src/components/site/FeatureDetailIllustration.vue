<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <svg v-if="name === 'tree'" data-scene="tree" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-tree-bg" x1="24" y1="18" x2="300" y2="228" gradientUnits="userSpaceOnUse">
        <stop stop-color="#7CCBFF" />
        <stop offset="1" stop-color="#007AFF" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-tree-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="white" fill-opacity="0.96" />
    <rect x="24" y="24" width="92" height="192" rx="16" fill="#EFF5FF" />
    <rect x="38" y="44" width="64" height="9" rx="4.5" fill="#007AFF" fill-opacity="0.16" />
    <rect x="38" y="64" width="50" height="8" rx="4" fill="#007AFF" fill-opacity="0.14" />
    <rect x="38" y="88" width="66" height="22" rx="8" fill="#007AFF" fill-opacity="0.2" class="scene-pulse" />
    <circle cx="50" cy="99" r="3.2" fill="#007AFF" fill-opacity="0.45" />
    <rect x="58" y="95" width="38" height="7" rx="3.5" fill="#007AFF" fill-opacity="0.32" />
    <rect x="52" y="124" width="46" height="7" rx="3.5" fill="#007AFF" fill-opacity="0.18" />
    <rect x="58" y="140" width="40" height="7" rx="3.5" fill="#007AFF" fill-opacity="0.14" />
    <path d="M48 98V126H52" stroke="#007AFF" stroke-opacity="0.22" stroke-width="1.8" stroke-linecap="round" />
    <path d="M48 98V142H58" stroke="#007AFF" stroke-opacity="0.18" stroke-width="1.8" stroke-linecap="round" />
    <rect x="130" y="44" width="150" height="154" rx="12" fill="#F7FAFF" />
    <rect x="146" y="64" width="70" height="10" rx="5" fill="#007AFF" fill-opacity="0.2" />
    <rect x="146" y="84" width="116" height="7" rx="3.5" fill="#007AFF" fill-opacity="0.16" />
    <rect x="146" y="98" width="104" height="7" rx="3.5" fill="#007AFF" fill-opacity="0.13" />
    <rect x="146" y="121" width="122" height="46" rx="9" fill="white" />
    <rect x="156" y="132" width="85" height="7" rx="3.5" fill="#007AFF" fill-opacity="0.16" />
    <rect x="156" y="146" width="62" height="7" rx="3.5" fill="#007AFF" fill-opacity="0.12" />
    <rect x="222" y="131" width="2.5" height="22" rx="1.25" fill="#007AFF" fill-opacity="0.6" class="scene-blink" />
    <rect x="244" y="176" width="36" height="8" rx="4" fill="#007AFF" fill-opacity="0.2" />
  </svg>

  <svg v-else-if="name === 'variable'" data-scene="variable" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-var-bg" x1="16" y1="12" x2="302" y2="230" gradientUnits="userSpaceOnUse">
        <stop stop-color="#E2A8FF" />
        <stop offset="1" stop-color="#AF52DE" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-var-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="white" fill-opacity="0.94" />
    <rect x="36" y="38" width="162" height="164" rx="12" fill="#F8F1FF" />
    <rect x="48" y="56" width="96" height="8" rx="4" fill="#AF52DE" fill-opacity="0.22" />
    <rect x="48" y="72" width="136" height="7" rx="3.5" fill="#AF52DE" fill-opacity="0.14" />
    <rect x="48" y="96" width="90" height="28" rx="8" fill="white" />
    <text x="57" y="114" fill="#7F42A0" font-size="11" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">&#123;&#123;topic&#125;&#125;</text>
    <rect x="146" y="96" width="34" height="28" rx="8" fill="#AF52DE" fill-opacity="0.24" class="scene-pulse" />
    <text x="151" y="114" fill="#7F42A0" font-size="11" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">&#123;&#123;tone&#125;&#125;</text>
    <rect x="48" y="136" width="136" height="7" rx="3.5" fill="#AF52DE" fill-opacity="0.14" />
    <rect x="48" y="150" width="120" height="7" rx="3.5" fill="#AF52DE" fill-opacity="0.12" />
    <rect x="210" y="38" width="74" height="164" rx="12" fill="#F4E8FF" />
    <rect x="222" y="54" width="50" height="8" rx="4" fill="#AF52DE" fill-opacity="0.22" />
    <rect x="222" y="74" width="50" height="26" rx="7" fill="white" />
    <rect x="227" y="83" width="30" height="7" rx="3.5" fill="#AF52DE" fill-opacity="0.22" />
    <rect x="222" y="110" width="50" height="26" rx="7" fill="white" />
    <rect x="227" y="119" width="24" height="7" rx="3.5" fill="#AF52DE" fill-opacity="0.22" />
    <rect x="249" y="118" width="2.2" height="9" rx="1.1" fill="#AF52DE" fill-opacity="0.56" class="scene-blink" />
    <rect x="222" y="148" width="50" height="22" rx="7" fill="#AF52DE" fill-opacity="0.28" />
    <path d="M180 110H209" stroke="#AF52DE" stroke-width="2" stroke-linecap="round" class="scene-slide" />
    <path d="M202 104L209 110L202 116" stroke="#AF52DE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="scene-slide" />
  </svg>

  <svg v-else-if="name === 'offline'" data-scene="offline" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-off-bg" x1="20" y1="14" x2="300" y2="228" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FFE07A" />
        <stop offset="1" stop-color="#FF9F0A" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-off-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="white" fill-opacity="0.94" />
    <rect x="42" y="52" width="168" height="112" rx="10" fill="#FFF7E8" />
    <rect x="52" y="62" width="148" height="82" rx="8" fill="white" />
    <rect x="48" y="164" width="156" height="8" rx="4" fill="#FF9F0A" fill-opacity="0.26" />
    <ellipse cx="248" cy="154" rx="28" ry="8" fill="#FF9F0A" fill-opacity="0.22" />
    <rect x="220" y="118" width="56" height="36" rx="8" fill="#FFF4DF" />
    <ellipse cx="248" cy="118" rx="28" ry="8" fill="#FFD79A" />
    <ellipse cx="248" cy="136" rx="28" ry="8" fill="#FFE6BD" />
    <ellipse cx="248" cy="154" rx="28" ry="8" fill="#FFF0D6" />
    <path d="M94 96C94 81 106 70 121 70C130 70 138 74 143 81C147 77 153 74 160 74C172 74 182 84 182 96C182 108 172 118 160 118H121C106 118 94 108 94 96Z" fill="#FF9F0A" fill-opacity="0.18" />
    <line x1="102" y1="112" x2="174" y2="80" stroke="#FF6F00" stroke-width="4" stroke-linecap="round" />
    <rect x="120" y="186" width="84" height="18" rx="9" fill="#FF3B30" fill-opacity="0.2" class="scene-pulse" />
    <text x="136" y="199" fill="#C9342C" font-size="10" font-family="Inter, -apple-system, sans-serif">OFFLINE MODE</text>
  </svg>

  <svg v-else-if="name === 'sync'" data-scene="sync" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-sync-bg" x1="16" y1="12" x2="304" y2="232" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9FF3CB" />
        <stop offset="1" stop-color="#34C759" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-sync-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="white" fill-opacity="0.94" />
    <rect x="36" y="58" width="124" height="84" rx="10" fill="#ECFFF2" />
    <rect x="44" y="66" width="108" height="62" rx="7" fill="white" />
    <rect x="30" y="144" width="136" height="8" rx="4" fill="#34C759" fill-opacity="0.24" />
    <rect x="196" y="52" width="62" height="120" rx="12" fill="#ECFFF2" />
    <rect x="204" y="64" width="46" height="84" rx="8" fill="white" />
    <circle cx="227" cy="158" r="3" fill="#34C759" fill-opacity="0.38" />
    <rect x="262" y="78" width="22" height="72" rx="6" fill="#ECFFF2" />
    <rect x="267" y="88" width="12" height="26" rx="4" fill="white" />
    <rect x="267" y="122" width="12" height="22" rx="4" fill="white" />
    <path d="M154 92H188" stroke="#34C759" stroke-width="3" stroke-linecap="round" class="scene-slide" />
    <path d="M181 84L188 92L181 100" stroke="#34C759" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="scene-slide" />
    <path d="M188 122H154" stroke="#2AA44A" stroke-width="3" stroke-linecap="round" class="scene-slide-reverse" />
    <path d="M161 114L154 122L161 130" stroke="#2AA44A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="scene-slide-reverse" />
    <circle cx="104" cy="179" r="5" fill="#34C759" fill-opacity="0.34" class="scene-pulse" />
    <circle cx="168" cy="179" r="5" fill="#34C759" fill-opacity="0.34" class="scene-pulse scene-delay-1" />
    <circle cx="232" cy="179" r="5" fill="#34C759" fill-opacity="0.34" class="scene-pulse scene-delay-2" />
  </svg>

  <svg v-else-if="name === 'extension'" data-scene="extension" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-ext-bg" x1="18" y1="12" x2="302" y2="230" gradientUnits="userSpaceOnUse">
        <stop stop-color="#9EE8FF" />
        <stop offset="1" stop-color="#32B9FF" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-ext-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="white" fill-opacity="0.95" />
    <rect x="36" y="42" width="248" height="160" rx="12" fill="#EAF7FF" />
    <rect x="36" y="42" width="248" height="26" rx="12" fill="#DDF2FF" />
    <circle cx="52" cy="55" r="4" fill="#FF5F57" fill-opacity="0.7" />
    <circle cx="66" cy="55" r="4" fill="#FEBC2E" fill-opacity="0.7" />
    <circle cx="80" cy="55" r="4" fill="#28C840" fill-opacity="0.7" />
    <rect x="52" y="80" width="128" height="18" rx="9" fill="white" />
    <rect x="58" y="86" width="92" height="6" rx="3" fill="#0097E6" fill-opacity="0.24" />
    <rect x="52" y="108" width="128" height="18" rx="9" fill="white" />
    <rect x="58" y="114" width="76" height="6" rx="3" fill="#0097E6" fill-opacity="0.2" />
    <rect x="52" y="136" width="128" height="18" rx="9" fill="white" />
    <rect x="58" y="142" width="84" height="6" rx="3" fill="#0097E6" fill-opacity="0.18" />
    <rect x="194" y="80" width="78" height="98" rx="10" fill="white" />
    <rect x="204" y="94" width="48" height="8" rx="4" fill="#0097E6" fill-opacity="0.2" />
    <rect x="204" y="110" width="56" height="8" rx="4" fill="#0097E6" fill-opacity="0.15" />
    <rect x="204" y="126" width="44" height="8" rx="4" fill="#0097E6" fill-opacity="0.15" />
    <rect x="204" y="146" width="52" height="18" rx="7" fill="#0097E6" fill-opacity="0.2" />
    <path d="M178 116H194" stroke="#0097E6" stroke-width="2.4" stroke-linecap="round" />
    <path d="M188 110L194 116L188 122" stroke="#0097E6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    <rect x="130" y="170" width="52" height="16" rx="8" fill="#0097E6" fill-opacity="0.2" class="scene-slide" />
  </svg>

  <svg v-else-if="name === 'share'" data-scene="share" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-share-bg" x1="16" y1="10" x2="304" y2="232" gradientUnits="userSpaceOnUse">
        <stop stop-color="#87D5FF" />
        <stop offset="1" stop-color="#007AFF" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-share-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="white" fill-opacity="0.95" />
    <rect x="38" y="56" width="116" height="126" rx="12" fill="#ECF4FF" />
    <rect x="50" y="74" width="78" height="26" rx="8" fill="white" />
    <rect x="56" y="84" width="44" height="7" rx="3.5" fill="#007AFF" fill-opacity="0.25" />
    <rect x="50" y="112" width="88" height="12" rx="6" fill="white" />
    <rect x="50" y="130" width="74" height="12" rx="6" fill="white" />
    <rect x="50" y="148" width="82" height="12" rx="6" fill="white" />
    <rect x="170" y="68" width="112" height="74" rx="12" fill="#F2F8FF" />
    <rect x="182" y="84" width="88" height="18" rx="9" fill="white" />
    <rect x="188" y="90" width="54" height="7" rx="3.5" fill="#007AFF" fill-opacity="0.22" />
    <rect x="182" y="110" width="66" height="10" rx="5" fill="#007AFF" fill-opacity="0.14" />
    <line x1="146" y1="92" x2="170" y2="92" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" />
    <line x1="146" y1="118" x2="170" y2="118" stroke="#007AFF" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="230" cy="174" r="18" fill="#007AFF" fill-opacity="0.2" class="scene-pulse" />
    <circle cx="198" cy="174" r="12" fill="#007AFF" fill-opacity="0.18" class="scene-float" />
    <circle cx="262" cy="174" r="12" fill="#007AFF" fill-opacity="0.18" class="scene-float scene-delay-1" />
    <path d="M222 171h16" stroke="#007AFF" stroke-width="3" stroke-linecap="round" />
    <path d="M230 163l8 8-8 8" stroke="#007AFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  </svg>

  <svg v-else-if="name === 'api'" data-scene="api" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-api-bg" x1="16" y1="14" x2="302" y2="230" gradientUnits="userSpaceOnUse">
        <stop stop-color="#A0F6D1" />
        <stop offset="1" stop-color="#34C759" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-api-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="#0F172A" fill-opacity="0.94" />
    <rect x="36" y="38" width="248" height="22" rx="8" fill="#1E293B" />
    <circle cx="50" cy="49" r="3.2" fill="#EF4444" />
    <circle cx="62" cy="49" r="3.2" fill="#F59E0B" />
    <circle cx="74" cy="49" r="3.2" fill="#22C55E" />
    <text x="48" y="88" fill="#A7F3D0" font-size="12" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">POST /api/sync</text>
    <text x="48" y="110" fill="#86EFAC" font-size="11" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">Authorization: Bearer sk_live_****</text>
    <text x="48" y="132" fill="#6EE7B7" font-size="11" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">{ changes: [...] }</text>
    <rect x="48" y="150" width="192" height="20" rx="6" fill="#22C55E" fill-opacity="0.18" />
    <text x="56" y="164" fill="#A7F3D0" font-size="10" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">200 OK   synced: 12 nodes</text>
    <rect x="252" y="84" width="28" height="68" rx="8" fill="#22C55E" fill-opacity="0.22" class="scene-glow" />
    <circle cx="266" cy="118" r="9" fill="#A7F3D0" fill-opacity="0.4" />
    <rect x="92" y="172" width="2.5" height="12" rx="1.25" fill="#A7F3D0" class="scene-blink" />
  </svg>

  <svg v-else-if="name === 'mindmap'" data-scene="mindmap" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-mm-bg" x1="14" y1="10" x2="306" y2="230" gradientUnits="userSpaceOnUse">
        <stop stop-color="#C1B9FF" />
        <stop offset="1" stop-color="#5856D6" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-mm-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="white" fill-opacity="0.95" />
    <line x1="160" y1="120" x2="96" y2="72" stroke="#5856D6" stroke-opacity="0.26" stroke-width="2.4" />
    <line x1="160" y1="120" x2="100" y2="164" stroke="#5856D6" stroke-opacity="0.26" stroke-width="2.4" />
    <line x1="160" y1="120" x2="220" y2="74" stroke="#5856D6" stroke-opacity="0.26" stroke-width="2.4" />
    <line x1="160" y1="120" x2="230" y2="166" stroke="#5856D6" stroke-opacity="0.26" stroke-width="2.4" />
    <line x1="160" y1="120" x2="158" y2="54" stroke="#5856D6" stroke-opacity="0.24" stroke-width="2.4" />
    <line x1="160" y1="120" x2="160" y2="186" stroke="#5856D6" stroke-opacity="0.24" stroke-width="2.4" />
    <circle cx="160" cy="120" r="24" fill="#5856D6" fill-opacity="0.2" class="scene-pulse" />
    <circle cx="160" cy="120" r="12" fill="#5856D6" fill-opacity="0.36" />
    <circle cx="94" cy="70" r="12" fill="#5856D6" fill-opacity="0.2" class="scene-float" />
    <circle cx="98" cy="168" r="12" fill="#5856D6" fill-opacity="0.2" class="scene-float scene-delay-1" />
    <circle cx="224" cy="72" r="12" fill="#5856D6" fill-opacity="0.2" class="scene-float scene-delay-2" />
    <circle cx="232" cy="168" r="12" fill="#5856D6" fill-opacity="0.2" class="scene-float" />
    <circle cx="158" cy="52" r="10" fill="#5856D6" fill-opacity="0.18" class="scene-float scene-delay-1" />
    <circle cx="160" cy="188" r="10" fill="#5856D6" fill-opacity="0.18" class="scene-float scene-delay-2" />
  </svg>

  <svg v-else-if="name === 'outline'" data-scene="outline" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-outline-bg" x1="16" y1="14" x2="304" y2="232" gradientUnits="userSpaceOnUse">
        <stop stop-color="#8FD9FF" />
        <stop offset="1" stop-color="#4E9BFF" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-outline-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="white" fill-opacity="0.95" />
    <rect x="38" y="42" width="244" height="24" rx="10" fill="#EEF5FF" />
    <rect x="50" y="50" width="86" height="8" rx="4" fill="#4E9BFF" fill-opacity="0.22" />
    <rect x="144" y="48" width="56" height="12" rx="6" fill="#4E9BFF" fill-opacity="0.12" />
    <rect x="206" y="48" width="64" height="12" rx="6" fill="#4E9BFF" fill-opacity="0.12" />
    <rect x="38" y="78" width="244" height="118" rx="12" fill="#F6FAFF" />
    <rect x="52" y="92" width="216" height="12" rx="6" fill="white" />
    <rect x="58" y="96" width="106" height="5" rx="2.5" fill="#4E9BFF" fill-opacity="0.2" />
    <rect x="52" y="110" width="216" height="12" rx="6" fill="white" />
    <rect x="58" y="114" width="128" height="5" rx="2.5" fill="#4E9BFF" fill-opacity="0.18" />
    <rect x="52" y="128" width="216" height="12" rx="6" fill="white" />
    <rect x="58" y="132" width="94" height="5" rx="2.5" fill="#4E9BFF" fill-opacity="0.18" />
    <rect x="52" y="146" width="216" height="12" rx="6" fill="white" />
    <rect x="58" y="150" width="116" height="5" rx="2.5" fill="#4E9BFF" fill-opacity="0.18" />
    <rect x="52" y="164" width="216" height="12" rx="6" fill="white" />
    <rect x="58" y="168" width="88" height="5" rx="2.5" fill="#4E9BFF" fill-opacity="0.18" />
    <rect x="46" y="90" width="228" height="14" rx="7" fill="#4E9BFF" fill-opacity="0.14" class="scene-scan" />
  </svg>

  <svg v-else-if="name === 'dark'" data-scene="dark" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-dark-bg" x1="16" y1="12" x2="304" y2="230" gradientUnits="userSpaceOnUse">
        <stop stop-color="#8A8DFF" />
        <stop offset="1" stop-color="#31334A" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-dark-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="white" fill-opacity="0.94" />
    <rect x="38" y="44" width="244" height="136" rx="12" fill="#EEF2FF" />
    <rect x="38" y="44" width="122" height="136" rx="12" fill="#F7FAFF" />
    <rect x="160" y="44" width="122" height="136" rx="12" fill="#111827" />
    <rect x="52" y="66" width="94" height="10" rx="5" fill="#007AFF" fill-opacity="0.18" />
    <rect x="52" y="84" width="76" height="8" rx="4" fill="#007AFF" fill-opacity="0.12" />
    <rect x="174" y="66" width="90" height="10" rx="5" fill="#A5B4FC" fill-opacity="0.28" />
    <rect x="174" y="84" width="68" height="8" rx="4" fill="#A5B4FC" fill-opacity="0.18" />
    <rect x="110" y="188" width="100" height="20" rx="10" fill="#1F2937" fill-opacity="0.2" />
    <rect x="114" y="192" width="92" height="12" rx="6" fill="#1F2937" fill-opacity="0.45" />
    <circle cx="126" cy="198" r="8" fill="#FDE68A" class="scene-toggle" />
    <circle cx="82" cy="102" r="8" fill="#FDBA74" fill-opacity="0.55" />
    <path d="M222 100c0 7-6 13-13 13 5-2 8-7 8-13 0-6-3-11-8-13 7 0 13 6 13 13Z" fill="#E0E7FF" class="scene-pulse" />
  </svg>

  <svg v-else-if="name === 'keyboard'" data-scene="keyboard" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fd-key-bg" x1="14" y1="10" x2="304" y2="230" gradientUnits="userSpaceOnUse">
        <stop stop-color="#A9F4D4" />
        <stop offset="1" stop-color="#34C759" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="304" height="224" rx="26" fill="url(#fd-key-bg)" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="white" fill-opacity="0.95" />
    <rect x="42" y="42" width="236" height="30" rx="10" fill="#EBFFF3" />
    <rect x="52" y="52" width="104" height="10" rx="5" fill="#34C759" fill-opacity="0.2" />
    <rect x="42" y="84" width="236" height="108" rx="12" fill="#F3FFF7" />
    <rect x="52" y="96" width="36" height="20" rx="6" fill="white" />
    <rect x="94" y="96" width="36" height="20" rx="6" fill="white" />
    <rect x="136" y="96" width="36" height="20" rx="6" fill="white" />
    <rect x="178" y="96" width="36" height="20" rx="6" fill="white" />
    <rect x="220" y="96" width="48" height="20" rx="6" fill="white" />
    <rect x="52" y="122" width="50" height="20" rx="6" fill="white" />
    <rect x="108" y="122" width="50" height="20" rx="6" fill="white" />
    <rect x="164" y="122" width="50" height="20" rx="6" fill="white" />
    <rect x="220" y="122" width="48" height="20" rx="6" fill="white" />
    <rect x="52" y="148" width="70" height="20" rx="6" fill="white" />
    <rect x="128" y="148" width="90" height="20" rx="6" fill="white" />
    <rect x="224" y="148" width="44" height="20" rx="6" fill="white" />
    <rect x="108" y="122" width="50" height="20" rx="6" fill="#34C759" fill-opacity="0.26" class="scene-press-a" />
    <rect x="220" y="122" width="48" height="20" rx="6" fill="#34C759" fill-opacity="0.24" class="scene-press-b" />
    <text x="116" y="136" fill="#228A3D" font-size="11" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">⌘</text>
    <text x="238" y="136" fill="#228A3D" font-size="11" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">K</text>
  </svg>

  <svg v-else data-scene="fallback" class="feature-detail-scene" viewBox="0 0 320 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="304" height="224" rx="26" fill="#8E8E93" />
    <rect x="24" y="24" width="272" height="192" rx="16" fill="#F5F5F7" />
    <circle cx="160" cy="120" r="48" fill="#8E8E93" fill-opacity="0.25" />
    <rect x="124" y="114" width="72" height="12" rx="6" fill="#8E8E93" fill-opacity="0.4" />
  </svg>
</template>

<style scoped>
.feature-detail-scene {
  width: 100%;
  height: 100%;
  display: block;
}

.scene-pulse,
.scene-float,
.scene-slide,
.scene-slide-reverse,
.scene-scan,
.scene-toggle,
.scene-press-a,
.scene-press-b,
.scene-glow {
  transform-box: fill-box;
  transform-origin: center;
}

.scene-pulse {
  animation: scene-pulse 2.2s ease-in-out infinite;
}

.scene-blink {
  animation: scene-blink 1.1s steps(1, end) infinite;
}

.scene-float {
  animation: scene-float 3.6s ease-in-out infinite;
}

.scene-slide {
  animation: scene-slide 2.6s ease-in-out infinite;
}

.scene-slide-reverse {
  animation: scene-slide-reverse 2.6s ease-in-out infinite;
}

.scene-scan {
  animation: scene-scan 2.8s ease-in-out infinite;
}

.scene-toggle {
  animation: scene-toggle 2.8s ease-in-out infinite;
}

.scene-press-a {
  animation: scene-press 2.4s ease-in-out infinite;
}

.scene-press-b {
  animation: scene-press 2.4s ease-in-out infinite;
  animation-delay: 1.1s;
}

.scene-glow {
  animation: scene-glow 2.6s ease-in-out infinite;
}

.scene-delay-1 {
  animation-delay: 0.6s;
}

.scene-delay-2 {
  animation-delay: 1.2s;
}

@keyframes scene-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.76;
    transform: scale(0.97);
  }
}

@keyframes scene-blink {
  0%, 45% { opacity: 1; }
  46%, 100% { opacity: 0; }
}

@keyframes scene-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes scene-slide {
  0%, 100% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(8px); opacity: 0.7; }
}

@keyframes scene-slide-reverse {
  0%, 100% { transform: translateX(0); opacity: 1; }
  50% { transform: translateX(-8px); opacity: 0.7; }
}

@keyframes scene-scan {
  0%, 100% { transform: translateY(0); opacity: 0.55; }
  50% { transform: translateY(54px); opacity: 0.25; }
}

@keyframes scene-toggle {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(60px); }
}

@keyframes scene-press {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(2px); opacity: 0.68; }
}

@keyframes scene-glow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}

@media (prefers-reduced-motion: reduce) {
  .scene-pulse,
  .scene-blink,
  .scene-float,
  .scene-slide,
  .scene-slide-reverse,
  .scene-scan,
  .scene-toggle,
  .scene-press-a,
  .scene-press-b,
  .scene-glow,
  .scene-delay-1,
  .scene-delay-2 {
    animation: none !important;
    transform: none !important;
  }
}
</style>
