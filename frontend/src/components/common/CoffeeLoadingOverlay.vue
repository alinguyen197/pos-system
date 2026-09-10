<script setup lang="ts">
// Cute Noodle Plate Loading Overlay Component for Mì Trộn Cô Xi
</script>

<template>
  <div class="noodle-loading-overlay">
    <div class="loading-card shadow-2xl">
      <!-- Cute Noodle Plate SVG Illustration & Animation -->
      <div class="noodle-animation-box">
        <svg viewBox="0 0 160 160" class="noodle-svg">
          <!-- Hot Steam Rising Lines -->
          <g class="steam-group">
            <path d="M 60 52 Q 54 36, 62 26 T 60 12" class="steam-line steam-1" />
            <path d="M 80 48 Q 86 34, 78 22 T 82 8" class="steam-line steam-2" />
            <path d="M 100 52 Q 94 36, 102 26 T 98 12" class="steam-line steam-3" />
          </g>

          <!-- Plate Drop Shadow -->
          <ellipse cx="80" cy="132" rx="56" ry="8" fill="#E2D7CC" opacity="0.75" />

          <!-- Ceramic Plate Body (Wide Noodle Bowl/Plate) -->
          <path
            d="M 22 96 Q 22 128, 80 128 Q 138 128, 138 96 Q 138 90, 80 90 Q 22 90, 22 96 Z"
            fill="#FFFFFF"
            stroke="#8E3E2F"
            stroke-width="3.5"
          />

          <!-- Inner Plate Rim & Glaze -->
          <ellipse cx="80" cy="95" rx="54" ry="16" fill="#F2ECE4" />

          <!-- Golden Noodle Mound -->
          <ellipse cx="80" cy="94" rx="46" ry="14" fill="#F5B041" />

          <!-- Tangled Delicious Noodle Strands -->
          <path d="M 38 94 Q 52 82, 68 94 Q 84 104, 100 92 Q 112 84, 122 94" fill="none" stroke="#D68910" stroke-width="3" stroke-linecap="round" />
          <path d="M 44 98 Q 62 88, 80 98 Q 98 106, 116 96" fill="none" stroke="#F8C471" stroke-width="2.5" stroke-linecap="round" />
          <path d="M 48 90 Q 66 78, 86 90 Q 104 100, 118 88" fill="none" stroke="#D68910" stroke-width="2" stroke-linecap="round" />
          <path d="M 58 102 Q 78 92, 98 102" fill="none" stroke="#F39C12" stroke-width="2.5" stroke-linecap="round" />

          <!-- Topping 1: Sunny-side up Fried Egg -->
          <g class="topping-egg">
            <!-- Egg White -->
            <ellipse cx="62" cy="89" rx="14" ry="9" fill="#FFFFFF" stroke="#E2D7CC" stroke-width="1.5" />
            <!-- Golden Egg Yolk -->
            <circle cx="61" cy="88" r="5.5" fill="#F39C12" />
            <!-- Yolk Glistening Shine -->
            <circle cx="59.5" cy="86.5" r="1.5" fill="#FFFFFF" opacity="0.8" />
          </g>

          <!-- Topping 2: Green Bok Choy & Scallions -->
          <g class="topping-greens">
            <path d="M 96 84 Q 106 78, 115 84 Q 110 92, 96 89 Z" fill="#27AE60" />
            <path d="M 100 86 Q 108 81, 114 85" stroke="#2ECC71" stroke-width="1.2" fill="none" />
            <!-- Scallion Rings -->
            <circle cx="82" cy="85" r="2.2" fill="#2ECC71" stroke="#27AE60" stroke-width="0.8" />
            <circle cx="88" cy="88" r="2.2" fill="#2ECC71" stroke="#27AE60" stroke-width="0.8" />
          </g>

          <!-- Topping 3: Spicy Red Chili Slices -->
          <g class="topping-chili">
            <path d="M 72 82 Q 78 79, 82 83" stroke="#C0392B" stroke-width="2.5" stroke-linecap="round" fill="none" />
            <circle cx="75" cy="81" r="0.8" fill="#F1C40F" />
          </g>

          <!-- Animated Wooden Chopsticks Lifting Noodles -->
          <g class="chopsticks-animated-group">
            <!-- Chopstick 1 -->
            <line x1="58" y1="18" x2="88" y2="78" stroke="#8D5B4C" stroke-width="3.5" stroke-linecap="round" />
            <!-- Chopstick 2 -->
            <line x1="68" y1="18" x2="94" y2="80" stroke="#6D4337" stroke-width="3" stroke-linecap="round" />

            <!-- Lifted Noodles hanging on chopsticks -->
            <path d="M 87 78 Q 82 86, 80 94" fill="none" stroke="#F5B041" stroke-width="2.5" stroke-linecap="round" />
            <path d="M 90 79 Q 95 87, 92 95" fill="none" stroke="#D68910" stroke-width="2" stroke-linecap="round" />
            <path d="M 93 80 Q 98 88, 96 95" fill="none" stroke="#F8C471" stroke-width="2" stroke-linecap="round" />
          </g>
        </svg>
      </div>

      <!-- Text Indicator -->
      <div class="loading-text-box">
        <h3 class="title">Đang trộn mì... 🍜</h3>
        <p class="subtitle">Mì Trộn Cô Xi • Vui lòng chờ trong giây lát</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.noodle-loading-overlay {
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
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid #E2D7CC;
  border-radius: 1.5rem;
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 290px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(30, 27, 27, 0.22);
}

.noodle-animation-box {
  width: 140px;
  height: 140px;
}

.noodle-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Chopsticks Lifting Animation */
.chopsticks-animated-group {
  animation: noodleLift 2s infinite ease-in-out;
  transform-origin: 65px 20px;
}

@keyframes noodleLift {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(-2.5deg);
  }
}

/* Steam Animation */
.steam-line {
  fill: none;
  stroke: #8E3E2F;
  stroke-width: 2.2;
  stroke-linecap: round;
  opacity: 0;
  animation: steamRise 2.2s infinite ease-out;
}

.steam-1 {
  animation-delay: 0s;
}
.steam-2 {
  animation-delay: 0.7s;
}
.steam-3 {
  animation-delay: 1.4s;
}

@keyframes steamRise {
  0% {
    transform: translateY(6px) scaleX(0.8);
    opacity: 0;
  }
  35% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(-16px) scaleX(1.3);
    opacity: 0;
  }
}

/* Text Styling */
.loading-text-box {
  .title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e1b1b;
    margin: 0;
    font-family: inherit;
    animation: textPulse 1.6s infinite ease-in-out;
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
    opacity: 0.65;
  }
}
</style>
