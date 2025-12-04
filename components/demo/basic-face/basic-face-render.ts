
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
type BasicFaceProps = {
  ctx: CanvasRenderingContext2D;
  mouthScale: number;
  eyeScale: number;
  color?: string;
};

export function renderBasicFace(props: BasicFaceProps) {
  const {
    ctx,
    eyeScale,
    mouthScale,
  } = props;
  const { width, height } = ctx.canvas;

  const cx = width / 2;
  const cy = height / 2;
  
  // Colors
  const skinColor = '#88CCFF'; // Light Smurf Blue
  const noseColor = '#5BA8E0'; // Slightly darker blue for nose
  const hatColor = '#FFFFFF';
  
  // Clear the canvas
  ctx.clearRect(0, 0, width, height);

  // --- Ears ---
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  // Left Ear
  ctx.ellipse(cx - width * 0.35, cy + height * 0.05, width * 0.08, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right Ear
  ctx.beginPath();
  ctx.ellipse(cx + width * 0.35, cy + height * 0.05, width * 0.08, height * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Head ---
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(cx, cy + height * 0.05, width * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // --- Hat ---
  ctx.fillStyle = hatColor;
  ctx.beginPath();
  // Brim curve
  ctx.moveTo(cx - width * 0.4, cy - height * 0.1);
  ctx.quadraticCurveTo(cx, cy - height * 0.25, cx + width * 0.4, cy - height * 0.1);
  // Top curve (floppy part)
  ctx.bezierCurveTo(
    cx + width * 0.5, cy - height * 0.6, 
    cx + width * 0.1, cy - height * 0.9, 
    cx - width * 0.1, cy - height * 0.7
  );
  // Back/Left curve
  ctx.bezierCurveTo(
    cx - width * 0.4, cy - height * 0.6,
    cx - width * 0.5, cy - height * 0.3,
    cx - width * 0.4, cy - height * 0.1
  );
  ctx.fill();

  // --- Base Logo on Hat (Blocky Design) ---
  const logoW = width * 0.22;
  const logoH = logoW * 0.6; 
  const logoX = cx - logoW / 2;
  // Adjusted Y to center the logo better on the hat (was 0.55)
  const logoY = cy - height * 0.48;
  const r = logoH * 0.1; // border radius for blue box

  // Blue Background Box
  ctx.fillStyle = '#0052FF'; // Base Blue
  ctx.beginPath();
  ctx.moveTo(logoX + r, logoY);
  ctx.lineTo(logoX + logoW - r, logoY);
  ctx.quadraticCurveTo(logoX + logoW, logoY, logoX + logoW, logoY + r);
  ctx.lineTo(logoX + logoW, logoY + logoH - r);
  ctx.quadraticCurveTo(logoX + logoW, logoY + logoH, logoX + logoW - r, logoY + logoH);
  ctx.lineTo(logoX + r, logoY + logoH);
  ctx.quadraticCurveTo(logoX, logoY + logoH, logoX, logoY + logoH - r);
  ctx.lineTo(logoX, logoY + r);
  ctx.quadraticCurveTo(logoX, logoY, logoX + r, logoY);
  ctx.fill();

  // Draw the White Shapes: [b] [ ] [ ] [ ]
  ctx.fillStyle = 'white';
  
  const padding = logoW * 0.1;
  const availableWidth = logoW - (padding * 2);
  const gap = availableWidth * 0.05;
  const blockCount = 4;
  const blockSize = (availableWidth - (gap * (blockCount - 1))) / blockCount;
  
  // Center the blocks vertically in the blue box
  // The 'b' ascender goes higher, but the squares sit lower.
  // Let's define a baseline.
  const baselineY = logoY + logoH - padding;
  const blockY = baselineY - blockSize; // Top of the square blocks
  const startX = logoX + padding;

  // 1. Draw 'b' shape
  // Vertical stick
  const stickWidth = blockSize * 0.4;
  const stickHeight = blockSize * 1.6; // Stick goes up
  ctx.fillRect(startX, baselineY - stickHeight, stickWidth, stickHeight);
  // Bowl (Square part)
  ctx.fillRect(startX, blockY, blockSize, blockSize); // Full square for simplicity matching block style

  // 2. Draw 2nd Block
  ctx.fillRect(startX + blockSize + gap, blockY, blockSize, blockSize);

  // 3. Draw 3rd Block
  ctx.fillRect(startX + (blockSize + gap) * 2, blockY, blockSize, blockSize);

  // 4. Draw 4th Block
  ctx.fillRect(startX + (blockSize + gap) * 3, blockY, blockSize, blockSize);


  // --- Eyes ---
  const eyeRadiusX = width * 0.13;
  const eyeRadiusY = height * 0.15 * eyeScale; // Blinking
  const eyeOffsetX = width * 0.16;
  const eyeY = cy - height * 0.05;

  // Eye Whites
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.ellipse(cx - eyeOffsetX, eyeY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(cx + eyeOffsetX, eyeY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils (Black)
  const pupilRadius = width * 0.05;
  ctx.fillStyle = 'black';
  
  ctx.beginPath();
  ctx.arc(cx - eyeOffsetX + (width * 0.02), eyeY, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx + eyeOffsetX - (width * 0.02), eyeY, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  // Eye Highlights (White dots)
  ctx.fillStyle = 'white';
  const highlightRadius = width * 0.015;
  if (eyeScale > 0.5) {
      ctx.beginPath();
      ctx.arc(cx - eyeOffsetX + (width * 0.03), eyeY - (height * 0.03), highlightRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx + eyeOffsetX - (width * 0.01), eyeY - (height * 0.03), highlightRadius, 0, Math.PI * 2);
      ctx.fill();
  }

  // --- Nose ---
  ctx.fillStyle = noseColor;
  ctx.beginPath();
  ctx.ellipse(cx, cy + height * 0.12, width * 0.1, height * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Mouth ---
  // Opens based on volume
  const mouthY = cy + height * 0.25;
  const mouthW = width * 0.12;
  const mouthOpenAmount = (height * 0.15) * mouthScale;
  
  ctx.fillStyle = '#440000'; // Dark mouth interior
  ctx.beginPath();
  ctx.moveTo(cx - mouthW, mouthY);
  // Bottom lip curves down with volume
  ctx.quadraticCurveTo(cx, mouthY + mouthOpenAmount + (height * 0.05), cx + mouthW, mouthY);
  // Top lip is flatter
  ctx.quadraticCurveTo(cx, mouthY + (mouthOpenAmount * 0.1), cx - mouthW, mouthY);
  ctx.fill();

  // Tongue (visible when mouth is open)
  if (mouthScale > 0.1) {
    ctx.fillStyle = '#FF6666';
    ctx.beginPath();
    const tongueY = mouthY + mouthOpenAmount * 0.8;
    ctx.ellipse(cx, tongueY, mouthW * 0.5, mouthOpenAmount * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
