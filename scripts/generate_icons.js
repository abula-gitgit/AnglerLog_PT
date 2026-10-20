import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Outer Gradients -->
    <radialGradient id="bgAmbient" cx="45%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="35%" stop-color="#c2410c"/>
      <stop offset="70%" stop-color="#7c2d12"/>
      <stop offset="100%" stop-color="#3b1104"/>
    </radialGradient>

    <!-- Top Right Specular Sheen on Squircle -->
    <linearGradient id="cornerSheen" x1="100%" y1="0%" x2="40%" y2="60%">
      <stop offset="0%" stop-color="#ffedd5" stop-opacity="0.35"/>
      <stop offset="40%" stop-color="#fdba74" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#ea580c" stop-opacity="0"/>
    </linearGradient>

    <!-- Pin Outer Bevel Gradient -->
    <linearGradient id="pinGoldGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="25%" stop-color="#facc15"/>
      <stop offset="55%" stop-color="#eab308"/>
      <stop offset="80%" stop-color="#ca8a04"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </linearGradient>

    <!-- Pin Left/Right Shading -->
    <linearGradient id="pinShadowGrad" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#78350f" stop-opacity="0.5"/>
      <stop offset="45%" stop-color="#78350f" stop-opacity="0.2"/>
      <stop offset="50%" stop-color="#fef08a" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#78350f" stop-opacity="0.4"/>
    </linearGradient>

    <!-- Pin Inner Recessed Background -->
    <radialGradient id="pinCoreBg" cx="48%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#5a1e05"/>
      <stop offset="70%" stop-color="#3b1104"/>
      <stop offset="100%" stop-color="#230801"/>
    </radialGradient>

    <!-- Fish Body Metallic Gradient -->
    <linearGradient id="fishBodyGrad" x1="20%" y1="10%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#fef9c3"/>
      <stop offset="60%" stop-color="#fde047"/>
      <stop offset="85%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#a16207"/>
    </linearGradient>

    <!-- Fish Shading Underbody -->
    <linearGradient id="fishShadeGrad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#451a03"/>
    </linearGradient>

    <!-- Water Ripples Gradients -->
    <linearGradient id="rippleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ca8a04" stop-opacity="0.4"/>
      <stop offset="25%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#fef08a"/>
      <stop offset="75%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#ca8a04" stop-opacity="0.4"/>
    </linearGradient>

    <linearGradient id="innerRippleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#eab308" stop-opacity="0.3"/>
      <stop offset="30%" stop-color="#fef08a"/>
      <stop offset="70%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#eab308" stop-opacity="0.3"/>
    </linearGradient>

    <!-- Drop Shadows and Filters -->
    <filter id="pinShadow" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#1c0701" flood-opacity="0.85"/>
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.5"/>
    </filter>

    <filter id="splashGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#78350f" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Base App Squircle with Rich Warm Amber Gradient -->
  <rect x="24" y="24" width="464" height="464" rx="104" fill="url(#bgAmbient)"/>

  <!-- Inner Stroke Rim for Squircle Depth -->
  <rect x="25" y="25" width="462" height="462" rx="103" fill="none" stroke="#fdba74" stroke-width="2.5" stroke-opacity="0.35"/>
  <rect x="28" y="28" width="456" height="456" rx="100" fill="none" stroke="#2e0a01" stroke-width="3" stroke-opacity="0.6"/>

  <!-- Glossy Corner Sheen / 3D Specular Highlight -->
  <path d="M 280 24 L 384 24 C 441 24 488 71 488 128 L 488 232 C 430 190 350 140 280 24 Z" fill="url(#cornerSheen)"/>

  <!-- Water Ripple Radar Base at Bottom -->
  <g transform="translate(0, 10)">
    <!-- Deep Water Pool Shadow -->
    <ellipse cx="256" cy="388" rx="142" ry="42" fill="#240801" opacity="0.85"/>

    <!-- Outer Ripple Ring -->
    <ellipse cx="256" cy="388" rx="134" ry="37" fill="none" stroke="url(#rippleGrad)" stroke-width="7" opacity="0.95"/>
    <ellipse cx="256" cy="388" rx="134" ry="37" fill="none" stroke="#3b1104" stroke-width="1.5" opacity="0.8"/>

    <!-- Middle Ripple Ring -->
    <ellipse cx="256" cy="388" rx="98" ry="26" fill="none" stroke="url(#innerRippleGrad)" stroke-width="6"/>

    <!-- Inner Core Ripple Ring -->
    <ellipse cx="256" cy="388" rx="58" ry="15" fill="none" stroke="#fef08a" stroke-width="4.5" opacity="0.9"/>
  </g>

  <!-- Water Droplets / Splashes around the Pin -->
  <g filter="url(#splashGlow)">
    <!-- Left Droplet -->
    <path d="M 166 314 C 158 300 152 292 165 290 C 178 288 184 304 175 316 C 171 321 167 319 166 314 Z" fill="#facc15"/>
    <path d="M 168 312 C 163 303 160 297 167 295 C 172 294 176 304 172 312 Z" fill="#fef9c3" opacity="0.7"/>

    <!-- Right Upper Droplet -->
    <path d="M 368 282 C 374 270 384 266 384 276 C 384 286 374 294 366 288 C 364 286 366 284 368 282 Z" fill="#facc15"/>

    <!-- Right Lower Droplet -->
    <path d="M 374 316 C 380 306 390 304 388 312 C 386 320 376 324 372 320 C 370 318 372 317 374 316 Z" fill="#f59e0b"/>
  </g>

  <!-- Central Golden Location Pin with Leaping Fish -->
  <g filter="url(#pinShadow)">
    
    <!-- Pin Outer Beveled Structure -->
    <!-- Teardrop shape pointing down to (256, 396) -->
    <path d="M 256 96
             C 186 96 132 150 132 222
             C 132 278 186 342 250 395
             C 253.5 398 258.5 398 262 395
             C 326 342 380 278 380 222
             C 380 150 326 96 256 96 Z"
          fill="url(#pinGoldGrad)"
          stroke="#78350f"
          stroke-width="5"/>

    <!-- 3D Bevel Dark Trim -->
    <path d="M 256 102
             C 190 102 140 154 140 222
             C 140 274 192 336 252 387
             L 256 391
             L 260 387
             C 320 336 372 274 372 222
             C 372 154 322 102 256 102 Z"
          fill="none"
          stroke="#fef08a"
          stroke-width="3.5"
          opacity="0.8"/>

    <!-- Subtle Center Split-Shading (gives 3D relief like a minted medal) -->
    <path d="M 256 96
             C 186 96 132 150 132 222
             C 132 278 186 342 250 395
             L 256 398
             L 256 96 Z"
          fill="#78350f"
          opacity="0.18"/>

    <!-- Lower Tip Shadowing -->
    <path d="M 230 336 L 256 396 L 282 336 C 270 348 242 348 230 336 Z" fill="#451a03" opacity="0.35"/>

    <!-- Recessed Inner Dark Chamber -->
    <circle cx="256" cy="222" r="82" fill="url(#pinCoreBg)" stroke="#854d0e" stroke-width="6"/>
    <circle cx="256" cy="222" r="80" fill="none" stroke="#1c0701" stroke-width="3" opacity="0.7"/>

    <!-- Inner Golden Rim Ring -->
    <circle cx="256" cy="222" r="85" fill="none" stroke="#fef08a" stroke-width="2.5" opacity="0.6"/>

    <!-- ============================================== -->
    <!-- LEAPING FISH & EMBEDDED WATER SPRAY -->
    <!-- ============================================== -->

    <!-- Tail Splash Wave Wrap -->
    <path d="M 250 252
             C 260 262 278 266 288 252
             C 294 244 290 234 298 226
             C 292 232 284 238 274 240
             C 264 242 254 246 250 252 Z"
          fill="#facc15"
          opacity="0.95"/>
    <path d="M 288 238 C 294 232 304 236 302 244 C 300 252 292 256 284 252 Z" fill="#fde047"/>

    <!-- Fish Silhouette Dark Shadow / Bevel Base -->
    <path d="M 314 184
             C 316 178 310 172 298 170
             C 284 168 262 170 242 180
             C 222 190 206 206 202 226
             C 198 242 204 258 214 268
             C 216 266 218 260 216 254
             C 210 242 210 228 218 218
             C 224 210 234 204 246 198
             C 236 204 228 212 226 222
             C 224 234 230 248 242 256
             C 248 260 254 268 250 276
             C 244 284 232 284 226 280
             C 234 286 248 288 258 282
             C 266 276 268 268 264 258
             C 260 248 252 242 248 236
             C 242 228 240 220 246 214
             C 256 204 274 200 288 206
             C 298 210 304 218 302 224
             C 308 218 316 206 316 198
             C 316 192 312 188 314 184 Z"
          fill="#3b1104"
          opacity="0.6"/>

    <!-- Main Fish Body (Dynamic Leap) -->
    <path d="M 312 186
             C 315 180 308 174 296 172
             C 280 170 258 174 238 184
             C 218 194 204 210 200 228
             C 198 238 200 248 206 256
             C 208 246 212 234 220 224
             C 230 212 244 204 260 198
             C 278 192 298 194 310 204
             C 314 202 316 198 318 192
             C 320 186 316 182 312 186 Z"
          fill="url(#fishBodyGrad)"/>

    <!-- Fish Head Detail & Open Jaws -->
    <!-- Upper Jaw & Snout -->
    <path d="M 306 175
             C 314 177 320 181 322 185
             C 318 188 312 188 308 186
             C 304 184 300 180 306 175 Z"
          fill="#ffffff"/>
    <!-- Lower Jaw -->
    <path d="M 314 192
             C 318 192 322 196 320 199
             C 314 201 310 198 310 194 Z"
          fill="#fef08a"/>

    <!-- Fish Eye -->
    <circle cx="298" cy="182" r="4.2" fill="#240801"/>
    <circle cx="299" cy="181" r="1.5" fill="#ffffff"/>

    <!-- Dorsal Fin Crest -->
    <path d="M 252 174
             C 244 164 230 162 222 168
             C 226 176 234 180 242 182 Z"
          fill="#fde047"/>
    <path d="M 248 174 C 242 168 234 166 228 170 Z" fill="#ffffff" opacity="0.6"/>

    <!-- Pectoral Fin -->
    <path d="M 266 212
             C 278 214 290 222 292 228
             C 282 228 272 222 264 216 Z"
          fill="#fef9c3"/>

    <!-- Caudal Tail Fin (Graceful Powerful Swish) -->
    <!-- Tail Upper Lobe -->
    <path d="M 242 248
             C 248 258 258 272 254 286
             C 248 290 238 288 230 280
             C 238 276 244 268 242 260
             C 240 254 238 250 242 248 Z"
          fill="url(#fishBodyGrad)"/>
    <!-- Tail Lower Lobe -->
    <path d="M 240 252
             C 232 258 218 266 208 264
             C 214 256 224 252 232 248 Z"
          fill="#fde047"/>

    <!-- Lateral Line and Highlight Shimmer -->
    <path d="M 288 192
             C 272 194 254 200 240 210
             C 230 218 222 228 216 240"
          fill="none"
          stroke="#ffffff"
          stroke-width="2.5"
          stroke-linecap="round"
          opacity="0.85"/>

    <!-- Belly Depth Shadow Curve -->
    <path d="M 222 230
             C 226 238 234 246 246 250
             C 238 246 230 238 226 230 Z"
          fill="#78350f"
          opacity="0.7"/>

  </g>
</svg>`;

// Safe-padded version for Android maskable icons (80% safe zone)
const maskableSvg = svgContent.replace(
  '<rect x="24" y="24" width="464" height="464" rx="104"',
  '<rect x="0" y="0" width="512" height="512" rx="0"'
);

async function generateAllIcons() {
  const publicDir = path.join(process.cwd(), 'public');
  
  // 1. Write SVGs
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSvg, 'utf8');
  console.log('✓ Wrote icon.svg and icon-maskable.svg');

  const svgBuffer = Buffer.from(svgContent);
  const maskableBuffer = Buffer.from(maskableSvg);

  // 2. Generate PNGs using Sharp
  // 512x512 PWA
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Generated pwa-512x512.png (512x512)');

  // 512x512 PWA Maskable
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Generated pwa-maskable-512x512.png (512x512)');

  // 192x192 PWA
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Generated pwa-192x192.png (192x192)');

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png (180x180)');

  // 64x64 Favicon PNG
  await sharp(svgBuffer)
    .resize(64, 64)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Generated favicon.png (64x64)');

  console.log('All icons generated successfully!');
}

generateAllIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
