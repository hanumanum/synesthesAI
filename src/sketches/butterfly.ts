import p5 from 'p5';

interface Particle {
  position: p5.Vector;
  velocity: p5.Vector;
  acceleration: p5.Vector;
  color: number[];
  size: number;
  maxSpeed: number;
  originalPosition: p5.Vector;
  connectionRadius: number;
  type: 'wing' | 'trail' | 'sparkle';
  phase: number;
  life: number;
  maxLife: number;
  opacity: number;
  targetOpacity: number;
  wingAngle: number;
  wingSpeed: number;
}

const sketch = (p: p5) => {
  let particles: Particle[] = [];
  let mouseForce: p5.Vector;
  let isPaused = false;
  let showInstructions = true;
  let time = 0;
  let butterflyPhase = 0;
  let journeyProgress = 0;
  
  // Theme colors for different particle types
  const themeColors = {
    wing: [255, 255, 255, 200],     // White - purity and lightness
    trail: [200, 230, 255, 150],    // Light blue - ethereal trail
    sparkle: [255, 255, 200, 180]   // Soft yellow - morning light
  };

  const createParticle = (x: number, y: number, type: Particle['type']): Particle => ({
    position: p.createVector(x, y),
    velocity: p.createVector(0, 0),
    acceleration: p.createVector(0, 0),
    color: themeColors[type],
    size: type === 'wing' ? 8 : // Increased from 6
          type === 'sparkle' ? 4 : // Increased from 3
          5, // Increased from 4
    maxSpeed: type === 'wing' ? 2.5 : // Increased from 2
              type === 'sparkle' ? 2 : // Increased from 1.5
              1.5, // Increased from 1
    originalPosition: p.createVector(x, y),
    connectionRadius: type === 'wing' ? 120 : // Increased from 90
                     type === 'sparkle' ? 80 : // Increased from 60
                     60, // Increased from 45
    type,
    phase: p.random(p.TWO_PI),
    life: 0,
    maxLife: type === 'sparkle' ? 150 : Infinity, // Increased from 120
    opacity: 0,
    targetOpacity: type === 'wing' ? 1 :
                   type === 'sparkle' ? 0.8 :
                   0.6,
    wingAngle: 0,
    wingSpeed: p.random(0.02, 0.05)
  });

  const createButterfly = (x: number, y: number) => {
    // Create wing particles
    const wingCount = 10; // Increased from 8
    for (let i = 0; i < wingCount; i++) {
      const angle = (i / wingCount) * p.TWO_PI;
      const radius = 40; // Increased from 30
      const wingX = x + p.cos(angle) * radius;
      const wingY = y + p.sin(angle) * radius;
      particles.push(createParticle(wingX, wingY, 'wing'));
    }

    // Create trail particles
    const trailCount = 15; // Increased from 12
    for (let i = 0; i < trailCount; i++) {
      const angle = p.random(p.TWO_PI);
      const radius = p.random(60, 90); // Increased from 45,75
      const trailX = x + p.cos(angle) * radius;
      const trailY = y + p.sin(angle) * radius;
      particles.push(createParticle(trailX, trailY, 'trail'));
    }
  };

  const createSparkles = (x: number, y: number) => {
    const sparkleCount = 7; // Increased from 5
    for (let i = 0; i < sparkleCount; i++) {
      const angle = p.random(p.TWO_PI);
      const radius = p.random(40, 80); // Increased from 30,60
      const sparkleX = x + p.cos(angle) * radius;
      const sparkleY = y + p.sin(angle) * radius;
      particles.push(createParticle(sparkleX, sparkleY, 'sparkle'));
    }
  };

  p.setup = () => {
    const container = document.getElementById('sketch-container');
    if (!container) {
      console.error('Sketch container not found');
      return;
    }

    const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
    canvas.parent('sketch-container');
    p.background(0);
    p.colorMode(p.RGB, 255, 255, 255, 255);

    mouseForce = p.createVector(0, 0);
    
    // Create initial butterfly in center
    createButterfly(p.width * 0.5, p.height * 0.5);
    
    console.log("Welcome to 'Butterfly' - A visualization of Bashō's haiku");
    console.log("Controls:");
    console.log("- Move mouse to interact with the butterfly");
    console.log("- Press 'p' to pause/resume");
    console.log("- Press 'r' to reset");
    console.log("- Press 'i' to toggle instructions");
  };

  p.draw = () => {
    p.background(0, 0, 0);
    if (isPaused) return;

    time += 0.01;
    butterflyPhase = (butterflyPhase + 0.01) % p.TWO_PI;
    journeyProgress = (journeyProgress + 0.001) % 1;
    
    // Create subtle gradient background
    
    p.noStroke();
    for (let y = 0; y < p.height; y += 2) {
      const alpha = p.map(y, 0, p.height, 40, 10);
      p.fill(0, 0, 20, alpha);
      p.rect(0, y, p.width, 2);
    }

    // Update and draw particles
    particles = particles.filter(particle => {
      // Update particle life
      if (particle.type === 'sparkle') {
        particle.life += 1;
        if (particle.life > particle.maxLife) return false;
      }

      // Update wing movement
      if (particle.type === 'wing') {
        particle.wingAngle += particle.wingSpeed;
        const wingOffset = p.sin(particle.wingAngle) * 30; // Increased from 22
        particle.position.x = particle.originalPosition.x + wingOffset;
        particle.position.y = particle.originalPosition.y + p.cos(particle.wingAngle) * 10; // Increased from 7
      }

      // Update trail movement
      if (particle.type === 'trail') {
        const trailForce = p5.Vector.sub(particle.originalPosition, particle.position);
        trailForce.mult(0.01);
        particle.acceleration.add(trailForce);
      }

      // Add gentle floating movement
      const floatForce = p.createVector(
        p.sin(time + particle.phase) * 0.3, // Increased from 0.2
        p.cos(time + particle.phase) * 0.3  // Increased from 0.2
      );
      particle.acceleration.add(floatForce);

      // Apply mouse force
      if (p.mouseX > 0 && p.mouseY > 0) {
        const dx = particle.position.x - p.mouseX;
        const dy = particle.position.y - p.mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 200) { // Increased from 150
          const force = (1 - distance / 200) * 0.15; // Increased from 0.1
          particle.acceleration.add(dx * force, dy * force);
        }
      }

      // Update physics
      particle.velocity.add(particle.acceleration);
      particle.velocity.mult(0.98);
      particle.velocity.limit(particle.maxSpeed);
      particle.position.add(particle.velocity);
      particle.acceleration.mult(0);

      // Update opacity
      particle.opacity = p.lerp(particle.opacity, particle.targetOpacity, 0.05);

      // Draw particle
      p.noStroke();
      const alpha = particle.opacity * 255;
      p.fill(particle.color[0], particle.color[1], particle.color[2], alpha);
      
      if (particle.type === 'sparkle') {
        p.drawingContext.shadowBlur = 15; // Increased from 10
        p.drawingContext.shadowColor = p.color(
          particle.color[0],
          particle.color[1],
          particle.color[2],
          alpha * 0.5
        );
      }

      p.ellipse(particle.position.x, particle.position.y, particle.size);
      p.drawingContext.shadowBlur = 0;

      // Draw connections
      particles.forEach(other => {
        if (other !== particle) {
          const distance = p5.Vector.dist(particle.position, other.position);
          if (distance < particle.connectionRadius) {
            const connectionStrength = 1 - distance / particle.connectionRadius;
            const connectionAlpha = connectionStrength * 120 * particle.opacity; // Increased from 100
            
            if (particle.type === 'wing' && other.type === 'wing') {
              p.stroke(particle.color[0], particle.color[1], particle.color[2], connectionAlpha * 0.8);
              p.strokeWeight(2); // Increased from 1.5
            } else if (particle.type === 'trail' || other.type === 'trail') {
              p.stroke(particle.color[0], particle.color[1], particle.color[2], connectionAlpha * 0.4);
              p.strokeWeight(1.5); // Increased from 1
            } else {
              p.stroke(particle.color[0], particle.color[1], particle.color[2], connectionAlpha * 0.6);
              p.strokeWeight(1.5); // Increased from 1
            }
            
            p.line(
              particle.position.x,
              particle.position.y,
              other.position.x,
              other.position.y
            );
          }
        }
      });

      // Create sparkles occasionally
      if (particle.type === 'wing' && p.random() < 0.015) { // Increased from 0.01
        createSparkles(particle.position.x, particle.position.y);
      }

      return true;
    });

    // Draw instructions if enabled
    if (showInstructions) {
      p.fill(255, 200);
      p.noStroke();
      p.textSize(18); // Increased from 16
      p.textAlign(p.LEFT);
      p.text("Move mouse to interact with the butterfly", 20, p.height - 60);
      p.text("Press 'p' to pause/resume", 20, p.height - 40);
      p.text("Press 'r' to reset", 20, p.height - 20);
    }
  };

  p.keyPressed = () => {
    if (p.key === 'p' || p.key === 'P') {
      isPaused = !isPaused;
    } else if (p.key === 'r' || p.key === 'R') {
      particles = [];
      createButterfly(p.width * 0.5, p.height * 0.5);
    } else if (p.key === 'i' || p.key === 'I') {
      showInstructions = !showInstructions;
    }
  };

  p.windowResized = () => {
    const container = document.getElementById('sketch-container');
    if (!container) return;
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    particles = [];
    createButterfly(p.width * 0.5, p.height * 0.5);
  };
};

// Create a new p5 instance with the sketch
const p5Instance = new p5(sketch); 