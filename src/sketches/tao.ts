import p5 from 'p5';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: p5.Color;
  type: 'void' | 'form';
  phase: number;
  connectionStrength: number;
}

interface Gate {
  x: number;
  y: number;
  size: number;
  rotation: number;
  pulsePhase: number;
}

const sketch = (p: p5) => {
  let particles: Particle[] = [];
  let gate: Gate;
  let time = 0;
  let isStormActive = false;
  let stormPhase = 0;
  let voidParticles: p5.Graphics;
  let formParticles: p5.Graphics;
  let centerX: number;
  let centerY: number;
  let canvasSize: number;

  p.setup = () => {
    const container = document.getElementById('sketch-container');
    if (!container) {
      console.error('Sketch container not found');
      return;
    }

    const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
    canvas.parent('sketch-container');
    p.colorMode(p.HSB, 360, 100, 100, 1);
    
    centerX = p.width / 2;
    centerY = p.height / 2;
    canvasSize = p.min(p.width, p.height);
    
    // Create off-screen buffers for void and form particles
    voidParticles = p.createGraphics(p.width, p.height);
    formParticles = p.createGraphics(p.width, p.height);
    voidParticles.colorMode(p.HSB, 360, 100, 100, 1);
    formParticles.colorMode(p.HSB, 360, 100, 100, 1);
    
    // Initialize gate
    gate = {
      x: centerX,
      y: centerY,
      size: canvasSize * 0.3,
      rotation: 0,
      pulsePhase: 0
    };
    
    // Initialize particles
    initializeParticles();
    
    p.background(0, 0, 5);
  };

  function initializeParticles() {
    particles = [];
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * p.TWO_PI;
      const radius = p.random(canvasSize * 0.1, canvasSize * 0.4);
      const x = centerX + p.cos(angle) * radius;
      const y = centerY + p.sin(angle) * radius;
      
      const type = i % 2 === 0 ? 'void' : 'form';
      const hue = type === 'void' ? 240 : 60;  // Blue for void, yellow for form
      
      particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        size: p.random(2, 6),
        color: p.color(hue, 70, 90, 0.6),
        type,
        phase: p.random(p.TWO_PI),
        connectionStrength: p.random(0.3, 0.7)
      });
    }
  }

  p.draw = () => {
    time += 0.01;
    gate.pulsePhase += 0.02;
    gate.rotation += 0.001;
    
    // Update background with subtle gradient
    p.background(0, 0, 5);
    drawBackground();
    
    // Update and draw particles
    updateParticles();
    drawParticles();
    
    // Draw the gate
    drawGate();
    
    // Draw connections between particles
    drawConnections();
    
    // Handle storm effect
    if (isStormActive) {
      updateStorm();
    }
  };

  function drawBackground() {
    const gradient = p.drawingContext.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, canvasSize * 0.8
    );
    
    gradient.addColorStop(0, p.color(240, 30, 10, 0.3));
    gradient.addColorStop(0.5, p.color(240, 20, 5, 0.1));
    gradient.addColorStop(1, p.color(240, 10, 5, 0));
    
    p.drawingContext.fillStyle = gradient;
    p.drawingContext.fillRect(0, 0, p.width, p.height);
  }

  function updateParticles() {
    particles.forEach(particle => {
      // Calculate distance from center
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const dist = p.sqrt(dx * dx + dy * dy);
      
      // Create orbital motion
      const angle = p.atan2(dy, dx);
      const targetDist = canvasSize * (0.2 + p.sin(time + particle.phase) * 0.1);
      const force = (targetDist - dist) * 0.001;
      
      particle.vx += p.cos(angle) * force;
      particle.vy += p.sin(angle) * force;
      
      // Add some randomness
      particle.vx += p.random(-0.1, 0.1);
      particle.vy += p.random(-0.1, 0.1);
      
      // Apply friction
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Update color based on type and phase
      const hue = particle.type === 'void' ? 240 : 60;
      const saturation = 70 + p.sin(time + particle.phase) * 20;
      const brightness = 80 + p.sin(time * 1.5 + particle.phase) * 10;
      particle.color = p.color(hue, saturation, brightness, 0.6);
    });
  }

  function drawParticles() {
    // Clear buffers
    voidParticles.clear();
    formParticles.clear();
    
    // Draw particles to their respective buffers
    particles.forEach(particle => {
      const buffer = particle.type === 'void' ? voidParticles : formParticles;
      buffer.push();
      buffer.translate(particle.x, particle.y);
      buffer.rotate(time + particle.phase);
      
      // Draw particle with glow effect
      buffer.noStroke();
      for (let i = 3; i > 0; i--) {
        const alpha = 0.2 / i;
        buffer.fill(particle.type === 'void' ? 240 : 60, 70, 90, alpha);
        buffer.ellipse(0, 0, particle.size * i * 2);
      }
      
      buffer.pop();
    });
    
    // Draw buffers to main canvas
    p.blendMode(p.ADD);
    p.image(voidParticles, 0, 0);
    p.image(formParticles, 0, 0);
    p.blendMode(p.BLEND);
  }

  function drawGate() {
    p.push();
    p.translate(gate.x, gate.y);
    p.rotate(gate.rotation);
    
    // Draw outer ring
    p.noFill();
    p.stroke(240, 50, 90, 0.3);
    p.strokeWeight(2);
    p.ellipse(0, 0, gate.size * 2);
    
    // Draw inner structure
    const pulse = p.sin(gate.pulsePhase) * 0.1 + 0.9;
    p.stroke(240, 70, 90, 0.5);
    p.strokeWeight(3);
    
    // Draw the gate's structure
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * p.TWO_PI;
      const x1 = p.cos(angle) * gate.size * 0.3;
      const y1 = p.sin(angle) * gate.size * 0.3;
      const x2 = p.cos(angle) * gate.size * pulse;
      const y2 = p.sin(angle) * gate.size * pulse;
      
      p.line(x1, y1, x2, y2);
    }
    
    // Draw connecting arcs
    p.stroke(240, 50, 90, 0.3);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * p.TWO_PI;
      p.arc(0, 0, gate.size * 1.5, gate.size * 1.5, 
            angle, angle + p.PI/2);
    }
    
    p.pop();
  }

  function drawConnections() {
    p.stroke(240, 30, 90, 0.1);
    p.strokeWeight(1);
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        
        // Only connect particles of different types
        if (p1.type !== p2.type) {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = p.sqrt(dx * dx + dy * dy);
          
          if (dist < canvasSize * 0.2) {
            const strength = (1 - dist / (canvasSize * 0.2)) * 
                           p1.connectionStrength * p2.connectionStrength;
            p.stroke(240, 30, 90, strength * 0.2);
            p.line(p1.x, p1.y, p2.x, p2.y);
          }
        }
      }
    }
  }

  function updateStorm() {
    stormPhase += 0.1;
    
    // Add turbulence to particles
    particles.forEach(particle => {
      const angle = p.noise(particle.x * 0.01, particle.y * 0.01, stormPhase) * p.TWO_PI;
      const force = p.noise(particle.x * 0.02, particle.y * 0.02, stormPhase) * 2;
      
      particle.vx += p.cos(angle) * force;
      particle.vy += p.sin(angle) * force;
    });
    
    // Gradually decrease storm intensity
    if (p.frameCount % 60 === 0) {
      isStormActive = false;
    }
  }

  p.mousePressed = () => {
    // Toggle storm effect
    isStormActive = true;
    stormPhase = 0;
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    centerX = p.width / 2;
    centerY = p.height / 2;
    canvasSize = p.min(p.width, p.height);
    
    // Resize buffers
    voidParticles.resizeCanvas(p.width, p.height);
    formParticles.resizeCanvas(p.width, p.height);
    
    // Update gate size
    gate.size = canvasSize * 0.3;
    
    // Reinitialize particles
    initializeParticles();
  };
};


new p5(sketch); 