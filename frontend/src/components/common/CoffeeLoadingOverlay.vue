<script setup lang="ts">
// Cute Coffee Pouring Loading Overlay Component
</script>

<template>
  <div class="coffee-loading-overlay">
    <div class="loading-card shadow-2xl">
      <!-- Cute Coffee Pouring SVG Illustration & Animation -->
      <div class="coffee-animation-box">
        <svg viewBox="0 0 160 160" class="coffee-svg">
          <!-- Steam Lines -->
          <g class="steam-group">
            <path d="M 65 42 Q 60 32, 65 22 T 65 10" class="steam-line steam-1" />
            <path d="M 80 40 Q 85 30, 80 20 T 80 8" class="steam-line steam-2" />
            <path d="M 95 42 Q 90 32, 95 22 T 95 10" class="steam-line steam-3" />
          </g>

          <!-- Coffee Filter / Dripper Pot at top -->
          <g class="dripper-pot">
            <path d="M 50 14 L 110 14 L 92 36 L 68 36 Z" fill="#8E3E2F" rx="3" />
            <rect x="73" y="36" width="14" height="4" fill="#6E281C" rx="1" />
          </g>

          <!-- Animated Pouring Stream -->
          <line x1="80" y1="40" x2="80" y2="105" class="coffee-stream" />

          <!-- Cup Body Mask & Fill Layer -->
          <defs>
            <clipPath id="cup-inner-clip">
              <path d="M 50 72 Q 50 122 80 122 Q 110 122 110 72 Z" />
            </clipPath>
          </defs>

          <!-- Cup Background -->
          <path d="M 50 70 Q 50 124 80 124 Q 110 124 110 70 Z" fill="#F9F6F0" stroke="#8E3E2F" stroke-width="4" />

          <!-- Cup Handle -->
          <path d="M 110 78 C 126 78, 126 106, 110 108" fill="none" stroke="#8E3E2F" stroke-width="4" stroke-linecap="round" />

          <!-- Rising Liquid Layer inside Cup -->
          <g clip-path="url(#cup-inner-clip)">
            <!-- Dark Coffee Liquid -->
            <rect class="rising-coffee-fill" x="40" y="70" width="80" height="60" fill="#5D4037" />
            <!-- Foam / Cream Layer on Top -->
            <rect class="rising-foam-fill" x="40" y="66" width="80" height="8" fill="#FFE0B2" />
          </g>

          <!-- Cup Rim Base Accent -->
          <ellipse cx="80" cy="124" rx="20" ry="3" fill="#E2D7CC" />
        </svg>
      </div>

      <!-- Text Indicator -->
      <div class="loading-text-box">
        <h3 class="title">Đang tải dữ liệu...</h3>
        <p class="subtitle">Mì Trộn Cô Xi • Vui lòng chờ trong giây lát</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.coffee-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 900000;
  background-color: rgba(30, 27, 27, 0.45);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  user-select: none;
  animation: fadeIn 0.25s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-card {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #E2D7CC;
  border-radius: 1.5rem;
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 280px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(30, 27, 27, 0.2);
}

.coffee-animation-box {
  width: 140px;
  height: 140px;
}

.coffee-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Steam Animation */
.steam-line {
  fill: none;
  stroke: #8E3E2F;
  stroke-width: 2.5;
  stroke-linecap: round;
  opacity: 0;
  animation: steamRise 2s infinite ease-out;
}

.steam-1 {
  animation-delay: 0s;
}
.steam-2 {
  animation-delay: 0.6s;
}
.steam-3 {
  animation-delay: 1.2s;
}

@keyframes steamRise {
  0% {
    transform: translateY(10px) scaleX(0.8);
    opacity: 0;
  }
  30% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(-16px) scaleX(1.3);
    opacity: 0;
  }
}

/* Coffee Stream Animation */
.coffee-stream {
  stroke: #5D4037;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 6 3;
  animation: streamFlow 0.6s infinite linear;
}

@keyframes streamFlow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -18;
  }
}

/* Rising Liquid & Foam Animation */
.rising-coffee-fill {
  animation: coffeeFill 2.2s infinite ease-in-out;
}

.rising-foam-fill {
  animation: foamFill 2.2s infinite ease-in-out;
}

@keyframes coffeeFill {
  0% {
    transform: translateY(45px);
  }
  70% {
    transform: translateY(6px);
  }
  100% {
    transform: translateY(6px);
  }
}

@keyframes foamFill {
  0% {
    transform: translateY(45px);
  }
  70% {
    transform: translateY(6px);
  }
  100% {
    transform: translateY(6px);
  }
}

/* Text Styling */
.loading-text-box {
  .title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e1b1b;
    margin: 0;
    font-family: inherit;
    animation: textPulse 1.5s infinite ease-in-out;
  }

  .subtitle {
    font-size: 0.75rem;
    font-weight: 500;
    color: #72796c;
    margin-top: 0.25rem;
  }
}

@keyframes textPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
