<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <!-- 树形结构管理 -->
  <svg v-if="name === 'tree'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gt" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#64D2FF"/><stop offset="1" stop-color="#007AFF"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#gt)"/>
    <!-- 根文件夹 -->
    <path d="M22 12h-3a2 2 0 0 0-2 2v1h14v-1a2 2 0 0 0-2-2h-3l-1.5-1.5h-1L22 12z" fill="#fff" opacity=".9"/>
    <rect x="17" y="15" width="14" height="8" rx="1.5" fill="#fff" opacity=".9"/>
    <!-- 分支线 -->
    <line x1="24" y1="23" x2="16" y2="30" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>
    <line x1="24" y1="23" x2="32" y2="30" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>
    <!-- 子文档 -->
    <rect x="10" y="30" width="12" height="14" rx="2.5" fill="#fff" opacity=".75"/>
    <rect x="13" y="34" width="6" height="1.5" rx=".75" fill="#007AFF" opacity=".35"/>
    <rect x="13" y="37" width="5" height="1.5" rx=".75" fill="#007AFF" opacity=".25"/>
    <rect x="13" y="40" width="4" height="1.5" rx=".75" fill="#007AFF" opacity=".15"/>
    <rect x="26" y="30" width="12" height="14" rx="2.5" fill="#fff" opacity=".75"/>
    <rect x="29" y="34" width="6" height="1.5" rx=".75" fill="#007AFF" opacity=".35"/>
    <rect x="29" y="37" width="5" height="1.5" rx=".75" fill="#007AFF" opacity=".25"/>
    <rect x="29" y="40" width="4" height="1.5" rx=".75" fill="#007AFF" opacity=".15"/>
    <!-- 装饰原点 -->
    <circle cx="43" cy="14" r="3.5" fill="#fff" opacity=".15"/>
    <circle cx="44" cy="38" r="2" fill="#fff" opacity=".1"/>
  </svg>

  <!-- 变量填充 -->
  <svg v-else-if="name === 'variable'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gvar" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#DA8FFF"/><stop offset="1" stop-color="#AF52DE"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#gvar)"/>
    <!-- 代码卡片 -->
    <rect x="8" y="11" width="40" height="34" rx="5" fill="#fff" opacity=".12"/>
    <!-- 左花括号 { -->
    <path d="M19 15c-3.5 0-4.5 2-4.5 4.5v4c0 2-1.5 3-3 3.5 1.5.5 3 1.5 3 3.5v4c0 2.5 1 4.5 4.5 4.5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>
    <!-- 右花括号 } -->
    <path d="M37 15c3.5 0 4.5 2 4.5 4.5v4c0 2 1.5 3 3 3.5-1.5.5-3 1.5-3 3.5v4c0 2.5-1 4.5-4.5 4.5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".9"/>
    <!-- 变量占位符（高亮块） -->
    <rect x="23" y="22" width="10" height="12" rx="3" fill="#fff" opacity=".2"/>
    <rect x="25" y="24.5" width="6" height="7" rx="2" fill="#fff" opacity=".55"/>
    <!-- 光标闪烁 -->
    <rect x="27.5" y="25.5" width="1.5" height="5" rx=".75" fill="#fff" opacity=".85"/>
  </svg>

  <!-- 离线优先 -->
  <svg v-else-if="name === 'offline'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goff" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#FFD60A"/><stop offset="1" stop-color="#FF9500"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#goff)"/>
    <!-- 云朵（组合圆形） -->
    <ellipse cx="28" cy="22" rx="11" ry="7" fill="#fff" opacity=".8"/>
    <circle cx="19" cy="22" r="6" fill="#fff" opacity=".8"/>
    <circle cx="37" cy="22" r="5.5" fill="#fff" opacity=".8"/>
    <circle cx="25" cy="16.5" r="5" fill="#fff" opacity=".8"/>
    <circle cx="33" cy="17" r="4" fill="#fff" opacity=".8"/>
    <!-- 盾牌 -->
    <path d="M28 28l-8 3.5v6c0 4.5 3.5 8 8 9.5 4.5-1.5 8-5 8-9.5v-6L28 28z" fill="#fff" opacity=".35"/>
    <!-- ✓ -->
    <polyline points="24,37 27,40 32.5,34.5" stroke="#FF9500" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>

  <!-- 多端同步 -->
  <svg v-else-if="name === 'sync'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gsync" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#8EEFC1"/><stop offset="1" stop-color="#34C759"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#gsync)"/>
    <!-- 笔记本电脑 -->
    <rect x="6" y="16" width="24" height="16" rx="2.5" fill="#fff" opacity=".85"/>
    <rect x="8" y="18" width="20" height="11" rx="1.5" fill="#34C759" opacity=".2"/>
    <rect x="3" y="32" width="30" height="2.5" rx="1.2" fill="#fff" opacity=".6"/>
    <!-- 手机 -->
    <rect x="35" y="18" width="13" height="22" rx="3" fill="#fff" opacity=".9"/>
    <rect x="37" y="21" width="9" height="14" rx="1.5" fill="#34C759" opacity=".2"/>
    <circle cx="41.5" cy="38" r="1" fill="#fff" opacity=".4"/>
    <!-- 同步箭头 → -->
    <path d="M31.5 23h3" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M33.5 21.5l2 1.5-2 1.5" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>
    <!-- 同步箭头 ← -->
    <path d="M35 29h-3" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".5"/>
    <path d="M33 27.5l-2 1.5 2 1.5" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>
    <!-- 装饰 Wi-Fi 弧线 -->
    <path d="M15 40a4 4 0 0 1 6 0" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".3"/>
    <path d="M16.5 42a2 2 0 0 1 3 0" stroke="#fff" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".25"/>
    <circle cx="18" cy="43.5" r=".8" fill="#fff" opacity=".3"/>
  </svg>

  <!-- 浏览器插件 -->
  <svg v-else-if="name === 'extension'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gext" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#70D7FF"/><stop offset="1" stop-color="#5AC8FA"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#gext)"/>
    <!-- 浏览器窗口 -->
    <rect x="5" y="12" width="32" height="26" rx="3.5" fill="#fff" opacity=".85"/>
    <!-- 标题栏 -->
    <rect x="5" y="12" width="32" height="7" rx="3.5" fill="#fff"/>
    <circle cx="9.5" cy="15.5" r="1.3" fill="#FF5F57" opacity=".65"/>
    <circle cx="13.5" cy="15.5" r="1.3" fill="#FEBC2E" opacity=".65"/>
    <circle cx="17.5" cy="15.5" r="1.3" fill="#28C840" opacity=".65"/>
    <!-- 浏览器内容行 -->
    <rect x="8.5" y="22" width="16" height="1.8" rx=".9" fill="#5AC8FA" opacity=".3"/>
    <rect x="8.5" y="26" width="24" height="1.8" rx=".9" fill="#5AC8FA" opacity=".2"/>
    <rect x="8.5" y="30" width="12" height="1.8" rx=".9" fill="#5AC8FA" opacity=".15"/>
    <rect x="8.5" y="34" width="18" height="1.8" rx=".9" fill="#5AC8FA" opacity=".1"/>
    <!-- 拼图拼块 -->
    <rect x="39" y="23" width="10" height="12" rx="2.5" fill="#fff" opacity=".9"/>
    <circle cx="39" cy="29" r="2.8" fill="#fff" opacity=".85"/>
    <circle cx="44" cy="23" r="2.8" fill="#fff" opacity=".85"/>
    <!-- 插件闪光 -->
    <path d="M48 20l.7-2 .7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="#fff" opacity=".45"/>
  </svg>

  <!-- 可分享 -->
  <svg v-else-if="name === 'share'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gshare" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#64D2FF"/><stop offset="1" stop-color="#007AFF"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#gshare)"/>
    <line x1="18" y1="21" x2="36" y2="14" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    <line x1="18" y1="35" x2="36" y2="42" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    <circle cx="18" cy="28" r="6.5" fill="#fff" opacity=".92"/>
    <circle cx="39" cy="13" r="6" fill="#fff" opacity=".78"/>
    <circle cx="39" cy="43" r="6" fill="#fff" opacity=".78"/>
    <circle cx="18" cy="28" r="2.2" fill="#007AFF" opacity=".35"/>
    <circle cx="39" cy="13" r="2" fill="#007AFF" opacity=".28"/>
    <circle cx="39" cy="43" r="2" fill="#007AFF" opacity=".28"/>
  </svg>

  <!-- API Key 访问 -->
  <svg v-else-if="name === 'api'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gapi" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#8EEFC1"/><stop offset="1" stop-color="#34C759"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#gapi)"/>
    <path d="M13.5 18.5l-4 4 4 4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
    <path d="M42.5 18.5l4 4-4 4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
    <circle cx="26" cy="32" r="5.5" fill="#fff" opacity=".9"/>
    <path d="M31.5 32h10.5v3h-3v3h-3v-2.2h-2.8V33h-1.7z" fill="#fff" opacity=".9"/>
    <circle cx="26" cy="32" r="2" fill="#34C759" opacity=".35"/>
  </svg>

  <!-- 思维导图 -->
  <svg v-else-if="name === 'mindmap'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gmm" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#B8B0FF"/><stop offset="1" stop-color="#5856D6"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#gmm)"/>
    <!-- 辐射连线 -->
    <line x1="28" y1="22" x2="28" y2="10" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".45"/>
    <line x1="33.5" y1="24" x2="44" y2="14" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".4"/>
    <line x1="34" y1="28" x2="48" y2="28" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".35"/>
    <line x1="33.5" y1="32" x2="44" y2="42" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".3"/>
    <line x1="28" y1="34" x2="28" y2="46" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".3"/>
    <line x1="22.5" y1="32" x2="12" y2="42" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".3"/>
    <line x1="22" y1="28" x2="8" y2="28" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".35"/>
    <line x1="22.5" y1="24" x2="12" y2="14" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".4"/>
    <!-- 中心节点 -->
    <circle cx="28" cy="28" r="6.5" fill="#fff" opacity=".95"/>
    <circle cx="28" cy="28" r="3" fill="#5856D6" opacity=".3"/>
    <!-- 外围节点 -->
    <circle cx="28" cy="8.5" r="3" fill="#fff" opacity=".7"/>
    <circle cx="45.5" cy="13" r="2.5" fill="#fff" opacity=".6"/>
    <circle cx="49.5" cy="28" r="2.5" fill="#fff" opacity=".55"/>
    <circle cx="45.5" cy="43" r="2.5" fill="#fff" opacity=".5"/>
    <circle cx="28" cy="47.5" r="2.5" fill="#fff" opacity=".5"/>
    <circle cx="10.5" cy="43" r="2.5" fill="#fff" opacity=".5"/>
    <circle cx="6.5" cy="28" r="2.5" fill="#fff" opacity=".55"/>
    <circle cx="10.5" cy="13" r="2.5" fill="#fff" opacity=".6"/>
  </svg>

  <!-- 内容创作者 -->
  <svg v-else-if="name === 'creator'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gcr" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#64D2FF"/><stop offset="1" stop-color="#007AFF"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#gcr)"/>
    <!-- 文档 -->
    <rect x="12" y="10" width="22" height="30" rx="3.5" fill="#fff" opacity=".85"/>
    <!-- 文字行 -->
    <rect x="16" y="16" width="14" height="2" rx="1" fill="#007AFF" opacity=".3"/>
    <rect x="16" y="21" width="11" height="2" rx="1" fill="#007AFF" opacity=".22"/>
    <rect x="16" y="26" width="8" height="2" rx="1" fill="#007AFF" opacity=".15"/>
    <rect x="16" y="31" width="12" height="2" rx="1" fill="#007AFF" opacity=".22"/>
    <!-- 钢笔（斜线） -->
    <line x1="40" y1="14" x2="32" y2="38" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>
    <line x1="40" y1="14" x2="38.5" y2="18" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>
    <circle cx="32" cy="38" r="1.8" fill="#fff" opacity=".9"/>
    <!-- 闪光 ✦ -->
    <path d="M44 30l.8-2.5.8 2.5 2.5.8-2.5.8-.8 2.5-.8-2.5-2.5-.8 2.5-.8z" fill="#fff" opacity=".4"/>
    <path d="M42 22l.5-1.5.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" fill="#fff" opacity=".25"/>
  </svg>

  <!-- 开发者 -->
  <svg v-else-if="name === 'developer'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gdev" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#8EEFC1"/><stop offset="1" stop-color="#34C759"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#gdev)"/>
    <!-- 终端窗口 -->
    <rect x="7" y="10" width="42" height="36" rx="4.5" fill="#fff" opacity=".13"/>
    <!-- 标题栏 -->
    <rect x="7" y="10" width="42" height="9" rx="4.5" fill="#fff" opacity=".22"/>
    <circle cx="12.5" cy="14.5" r="1.5" fill="#fff" opacity=".55"/>
    <circle cx="17.5" cy="14.5" r="1.5" fill="#fff" opacity=".4"/>
    <circle cx="22.5" cy="14.5" r="1.5" fill="#fff" opacity=".25"/>
    <!-- 命令提示 > -->
    <path d="M13 25l4.5 3.5-4.5 3.5" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
    <!-- 命令文本 -->
    <rect x="22" y="27" width="18" height="2.2" rx="1.1" fill="#fff" opacity=".65"/>
    <!-- 输出行 -->
    <rect x="13" y="35" width="22" height="2" rx="1" fill="#fff" opacity=".35"/>
    <rect x="13" y="39.5" width="16" height="2" rx="1" fill="#fff" opacity=".25"/>
  </svg>

  <!-- AI 研究者 -->
  <svg v-else-if="name === 'researcher'" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gres" x1="0" y1="0" x2="56" y2="56">
        <stop stop-color="#DA8FFF"/><stop offset="1" stop-color="#AF52DE"/>
      </linearGradient>
    </defs>
    <rect width="56" height="56" rx="14" fill="url(#gres)"/>
    <!-- 图表区域 -->
    <rect x="8" y="10" width="40" height="32" rx="3.5" fill="#fff" opacity=".1"/>
    <!-- 坐标轴 -->
    <line x1="14" y1="12" x2="14" y2="40" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".45"/>
    <line x1="14" y1="40" x2="46" y2="40" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".45"/>
    <!-- 数据柱 -->
    <rect x="18" y="30" width="5" height="10" rx="1.5" fill="#fff" opacity=".35"/>
    <rect x="25" y="24" width="5" height="16" rx="1.5" fill="#fff" opacity=".5"/>
    <rect x="32" y="19" width="5" height="21" rx="1.5" fill="#fff" opacity=".65"/>
    <rect x="39" y="14" width="5" height="26" rx="1.5" fill="#fff" opacity=".8"/>
    <!-- 趋势线 -->
    <polyline points="20.5,28 27.5,22 34.5,17 41.5,12" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>
    <!-- 数据点 -->
    <circle cx="20.5" cy="28" r="2.2" fill="#fff" opacity=".8"/>
    <circle cx="27.5" cy="22" r="2.2" fill="#fff" opacity=".8"/>
    <circle cx="34.5" cy="17" r="2.2" fill="#fff" opacity=".8"/>
    <circle cx="41.5" cy="12" r="2.2" fill="#fff" opacity=".8"/>
  </svg>

  <!-- 兜底 -->
  <svg v-else viewBox="0 0 56 56" fill="none">
    <rect width="56" height="56" rx="14" fill="#8E8E93"/>
    <circle cx="28" cy="28" r="10" fill="#fff" opacity=".3"/>
  </svg>
</template>
