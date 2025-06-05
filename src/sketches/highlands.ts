import p5 from 'p5';

interface Mountain {
  x: number;
  y: number;
  width: number;
  height: number;
  color: p5.Color;
  shadowPhase: number;
}

interface Caravan {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: p5.Color;
  trail: { x: number; y: number; alpha: number }[];
  phase: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinklePhase: number;
}

interface Storm {
  x: number;
  y: number;
  size: number;
  intensity: number;
  phase: number;
}

const sketch = (p: p5) => {
  let mountains: Mountain[] = [];
  let caravans: Caravan[] = [];
  let stars: Star[] = [];
  let storms: Storm[] = [];
  let time = 0;
  let dawnPhase = 0;
  let isDawnBreaking = false;
  let canvasWidth: number;
  let canvasHeight: number;
  let baseHeight: number;
  let skyGradient: p5.Graphics;
  let mountainBuffer: p5.Graphics;

  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('sketch-container');
    p.colorMode(p.HSB, 360, 100, 100, 1);
    
    canvasWidth = p.width;
    canvasHeight = p.height;
    baseHeight = canvasHeight * 0.7;
    
    // Create off-screen buffers
    skyGradient = p.createGraphics(canvasWidth, canvasHeight);
    mountainBuffer = p.createGraphics(canvasWidth, canvasHeight);
    skyGradient.colorMode(p.HSB, 360, 100, 100, 1);
    mountainBuffer.colorMode(p.HSB, 360, 100, 100, 1);
    
    initializeMountains();
    initializeCaravans();
    initializeStars();
    initializeStorms();
  };

  function initializeMountains() {
    mountains = [];
    const mountainCount = 15;
    const baseWidth = canvasWidth / mountainCount;
    
    for (let i = 0; i < mountainCount; i++) {
      const x = i * baseWidth;
      const width = baseWidth * (0.8 + p.random(0.4));
      const height = canvasHeight * (0.3 + p.random(0.2));
      const hue = 200 + p.random(20); // Blue-gray tones
      
      mountains.push({
        x,
        y: baseHeight - height,
        width,
        height,
        color: p.color(hue, 40, 60, 0.8),
        shadowPhase: p.random(p.TWO_PI)
      });
    }
  }

  function initializeCaravans() {
    caravans = [];
    const caravanCount = 3;
    
    for (let i = 0; i < caravanCount; i++) {
      const x = p.random(canvasWidth * 0.2, canvasWidth * 0.8);
      const y = baseHeight - p.random(50, 150);
      
      caravans.push({
        x,
        y,
        vx: p.random(-0.5, 0.5),
        vy: p.random(-0.2, 0.2),
        size: p.random(20, 30),
        color: p.color(30, 70, 90, 0.8), // Warm brown
        trail: [],
        phase: p.random(p.TWO_PI)
      });
    }
  }

  function initializeStars() {
    stars = [];
    const starCount = 100;
    
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: p.random(canvasWidth),
        y: p.random(baseHeight * 0.5),
        size: p.random(1, 3),
        brightness: p.random(0.5, 1),
        twinklePhase: p.random(p.TWO_PI)
      });
    }
  }

  function initializeStorms() {
    storms = [];
    const stormCount = 2;
    
    for (let i = 0; i < stormCount; i++) {
      storms.push({
        x: p.random(canvasWidth),
        y: p.random(baseHeight * 0.3, baseHeight * 0.6),
        size: canvasWidth * (0.2 + p.random(0.3)),
        intensity: 0,
        phase: p.random(p.TWO_PI)
      });
    }
  }

  p.draw = () => {
    time += 0.01;
    
    // Update sky gradient
    updateSkyGradient();
    
    // Draw background
    p.background(0, 0, 5);
    p.image(skyGradient, 0, 0);
    
    // Update and draw elements
    updateAndDrawStars();
    updateAndDrawStorms();
    updateAndDrawMountains();
    updateAndDrawCaravans();
    
    // Handle dawn effect
    if (isDawnBreaking) {
      updateDawn();
    }
  };

  function updateSkyGradient() {
    skyGradient.clear();
    const gradient = skyGradient.drawingContext.createLinearGradient(
      0, 0,
      0, baseHeight
    );
    
    // Base night colors
    let topHue = 240; // Deep blue
    let topSat = 30;
    let topBright = 10;
    let bottomHue = 220;
    let bottomSat = 40;
    let bottomBright = 20;
    
    // Add dawn effect
    if (isDawnBreaking) {
      const dawnProgress = p.sin(dawnPhase) * 0.5 + 0.5;
      topHue = p.lerp(240, 30, dawnProgress); // Blue to orange
      topSat = p.lerp(30, 80, dawnProgress);
      topBright = p.lerp(10, 60, dawnProgress);
      bottomHue = p.lerp(220, 40, dawnProgress);
      bottomSat = p.lerp(40, 90, dawnProgress);
      bottomBright = p.lerp(20, 70, dawnProgress);
    }
    
    gradient.addColorStop(0, p.color(topHue, topSat, topBright, 1));
    gradient.addColorStop(1, p.color(bottomHue, bottomSat, bottomBright, 1));
    
    skyGradient.drawingContext.fillStyle = gradient;
    skyGradient.drawingContext.fillRect(0, 0, canvasWidth, baseHeight);
  }

  function updateAndDrawStars() {
    p.push();
    p.blendMode(p.ADD);
    
    stars.forEach(star => {
      star.twinklePhase += 0.02;
      const twinkle = p.sin(star.twinklePhase) * 0.3 + 0.7;
      const alpha = star.brightness * twinkle * (isDawnBreaking ? (1 - dawnPhase / p.PI) : 1);
      
      p.fill(60, 20, 100, alpha);
      p.noStroke();
      p.ellipse(star.x, star.y, star.size);
    });
    
    p.pop();
  }

  function updateAndDrawStorms() {
    storms.forEach(storm => {
      storm.phase += 0.01;
      storm.intensity = p.sin(storm.phase) * 0.5 + 0.5;
      
      // Draw storm cloud
      p.push();
      p.noStroke();
      for (let i = 0; i < 5; i++) {
        const alpha = (1 - i / 5) * 0.3 * storm.intensity;
        p.fill(240, 30, 20, alpha);
        p.ellipse(
          storm.x + p.sin(time + i) * 20,
          storm.y + p.cos(time + i) * 10,
          storm.size * (1 - i * 0.1)
        );
      }
      p.pop();
    });
  }

  function updateAndDrawMountains() {
    mountainBuffer.clear();
    mountainBuffer.push();
    
    // Draw mountains with shadows
    mountains.forEach(mountain => {
      mountain.shadowPhase += 0.005;
      const shadowOffset = p.sin(mountain.shadowPhase) * 10;
      
      // Draw mountain shadow
      mountainBuffer.fill(240, 40, 20, 0.3);
      mountainBuffer.noStroke();
      mountainBuffer.beginShape();
      mountainBuffer.vertex(mountain.x, baseHeight);
      mountainBuffer.vertex(mountain.x + mountain.width, baseHeight);
      mountainBuffer.vertex(mountain.x + mountain.width/2 + shadowOffset, mountain.y);
      mountainBuffer.endShape(p.CLOSE);
      
      // Draw mountain
      mountainBuffer.fill(mountain.color);
      mountainBuffer.beginShape();
      mountainBuffer.vertex(mountain.x, baseHeight);
      mountainBuffer.vertex(mountain.x + mountain.width, baseHeight);
      mountainBuffer.vertex(mountain.x + mountain.width/2, mountain.y);
      mountainBuffer.endShape(p.CLOSE);
    });
    
    mountainBuffer.pop();
    p.image(mountainBuffer, 0, 0);
  }

  function updateAndDrawCaravans() {
    caravans.forEach(caravan => {
      // Update position
      caravan.x += caravan.vx;
      caravan.y += caravan.vy;
      caravan.phase += 0.05;
      
      // Keep caravans within bounds
      if (caravan.x < 0) caravan.x = canvasWidth;
      if (caravan.x > canvasWidth) caravan.x = 0;
      if (caravan.y < baseHeight * 0.3) caravan.y = baseHeight * 0.3;
      if (caravan.y > baseHeight - 50) caravan.y = baseHeight - 50;
      
      // Update trail
      caravan.trail.unshift({ x: caravan.x, y: caravan.y, alpha: 1 });
      if (caravan.trail.length > 20) caravan.trail.pop();
      
      // Draw trail
      p.push();
      p.noStroke();
      caravan.trail.forEach((point, i) => {
        const alpha = (1 - i / caravan.trail.length) * 0.3;
        p.fill(30, 70, 90, alpha);
        p.ellipse(point.x, point.y, caravan.size * (1 - i / caravan.trail.length));
      });
      
      // Draw caravan
      p.fill(caravan.color);
      p.ellipse(caravan.x, caravan.y, caravan.size);
      
      // Add movement effect
      const wobble = p.sin(caravan.phase) * 2;
      p.fill(30, 70, 90, 0.5);
      p.ellipse(caravan.x + wobble, caravan.y + wobble, caravan.size * 0.8);
      
      p.pop();
    });
  }

  function updateDawn() {
    dawnPhase += 0.01;
    if (dawnPhase >= p.PI) {
      isDawnBreaking = false;
      dawnPhase = 0;
    }
  }

  p.mousePressed = () => {
    // Toggle dawn effect
    isDawnBreaking = true;
    dawnPhase = 0;
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    canvasWidth = p.width;
    canvasHeight = p.height;
    baseHeight = canvasHeight * 0.7;
    
    // Resize buffers
    skyGradient.resizeCanvas(canvasWidth, canvasHeight);
    mountainBuffer.resizeCanvas(canvasWidth, canvasHeight);
    
    // Reinitialize elements
    initializeMountains();
    initializeCaravans();
    initializeStars();
    initializeStorms();
  };
};

new p5(sketch);