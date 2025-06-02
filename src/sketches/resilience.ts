import p5 from 'p5';

interface Particle {
  position: p5.Vector;
  velocity: p5.Vector;
  acceleration: p5.Vector;
  color: number[];
  size: number;
  maxSpeed: number;
  innerStrength: number;  // How strongly it resists external forces
  originalPosition: p5.Vector;
  connectionRadius: number;
}

const sketch = (p: p5) => {
  let particles: Particle[] = [];
  let mouseForce: p5.Vector;
  let isPaused = false;
  let showInstructions = true;
  let time = 0;
  
  // Theme colors representing different aspects of the poem
  const themeColors = {
    composure: [255, 255, 255, 150],    // White - purity and clarity
    resilience: [0, 150, 255, 150],     // Blue - stability and depth
    strength: [255, 100, 0, 150],       // Orange - energy and determination
    wisdom: [150, 0, 255, 150],         // Purple - knowledge and understanding
    balance: [0, 255, 150, 150]         // Green - growth and harmony
  };

  const createParticle = (x: number, y: number, theme: keyof typeof themeColors): Particle => ({
    position: p.createVector(x, y),
    velocity: p.createVector(0, 0),
    acceleration: p.createVector(0, 0),
    color: themeColors[theme],
    size: p.random(3, 8),
    maxSpeed: p.random(2, 4),
    innerStrength: p.random(0.8, 0.95),  // How strongly it resists external forces
    originalPosition: p.createVector(x, y),
    connectionRadius: p.random(50, 100)
  });

  p.setup = () => {
    // Get the container element
    const container = document.getElementById('sketch-container');
    if (!container) {
      console.error('Sketch container not found');
      return;
    }

    // Create canvas with container's dimensions
    const canvas = p.createCanvas(
      container.clientWidth,
      container.clientHeight
    );
    
    // Set canvas as child of container
    canvas.parent('sketch-container');
    
    // Initialize sketch
    p.background(0);
    
    // Create particles in a circular formation
    const centerX = p.width / 2;
    const centerY = p.height / 2;
    const radius = Math.min(p.width, p.height) * 0.3;
    const particleCount = 200;

    // Create particles representing different themes
    const themes: (keyof typeof themeColors)[] = ['composure', 'resilience', 'strength', 'wisdom', 'balance'];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * p.TWO_PI;
      const x = centerX + p.cos(angle) * radius * p.random(0.8, 1.2);
      const y = centerY + p.sin(angle) * radius * p.random(0.8, 1.2);
      const theme = themes[Math.floor(p.random(themes.length))];
      particles.push(createParticle(x, y, theme));
    }

    mouseForce = p.createVector(0, 0);
    
    // Display instructions
    console.log("Welcome to 'Resilience' - An abstract visualization of Kipling's 'If—'");
    console.log("Controls:");
    console.log("- Move mouse to interact with particles");
    console.log("- Press 'p' to pause/resume");
    console.log("- Press 'r' to reset");
    console.log("- Press 'i' to toggle instructions");
  };

  p.draw = () => {
    if (isPaused) return;

    p.background(0, 0, 0, 0.1); 
    time += 0.01;
    
    // Update mouse force
    const mousePos = p.createVector(p.mouseX, p.mouseY);
    
    // Update and draw particles
    particles.forEach((particle, i) => {
      // Calculate force from mouse
      const d = p5.Vector.dist(mousePos, particle.position);
      if (d < 150) {
        const force = p5.Vector.sub(particle.position, mousePos);
        force.normalize();
        force.mult(2 * (1 - particle.innerStrength)); // Stronger particles resist more
        particle.acceleration.add(force);
      }

      // Apply return force to original position
      const returnForce = p5.Vector.sub(particle.originalPosition, particle.position);
      returnForce.mult(0.05 * particle.innerStrength);
      particle.acceleration.add(returnForce);

      // Add some organic movement
      const noise = p.noise(
        particle.position.x * 0.01,
        particle.position.y * 0.01,
        time
      ) * p.TWO_PI;
      const organicForce = p.createVector(p.cos(noise), p.sin(noise));
      organicForce.mult(0.2);
      particle.acceleration.add(organicForce);

      // Update velocity and position
      particle.velocity.add(particle.acceleration);
      particle.velocity.limit(particle.maxSpeed);
      particle.position.add(particle.velocity);
      particle.acceleration.mult(0);

      // Draw particle
      p.fill(particle.color);
      p.noStroke();
      p.circle(particle.position.x, particle.position.y, particle.size);

      // Draw connections to nearby particles
      particles.slice(i + 1).forEach(otherParticle => {
        const distance = p5.Vector.dist(particle.position, otherParticle.position);
        if (distance < particle.connectionRadius) {
          const alpha = p.map(distance, 0, particle.connectionRadius, 100, 0);
          p.stroke(particle.color[0], particle.color[1], particle.color[2], alpha);
          p.line(
            particle.position.x,
            particle.position.y,
            otherParticle.position.x,
            otherParticle.position.y
          );
        }
      });
    });

    // Draw instructions if enabled
    if (showInstructions) {
      p.fill(255, 200);
      p.noStroke();
      p.textSize(16);
      p.textAlign(p.LEFT);
      p.text("Move mouse to interact with particles", 20, p.height - 60);
      p.text("Press 'p' to pause/resume", 20, p.height - 40);
      p.text("Press 'r' to reset", 20, p.height - 20);
    }
  };

  p.keyPressed = () => {
    if (p.key === 'p' || p.key === 'P') {
      isPaused = !isPaused;
    } else if (p.key === 'r' || p.key === 'R') {
      // Reset particles to original positions
      particles.forEach(particle => {
        particle.position = particle.originalPosition.copy();
        particle.velocity.mult(0);
        particle.acceleration.mult(0);
      });
    } else if (p.key === 'i' || p.key === 'I') {
      showInstructions = !showInstructions;
    }
  };

  p.windowResized = () => {
    const container = document.getElementById('sketch-container');
    if (!container) return;

    // Resize canvas to container dimensions
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    
    // Recalculate particle positions for new canvas size
    const centerX = p.width / 2;
    const centerY = p.height / 2;
    const radius = Math.min(p.width, p.height) * 0.3;
    
    particles.forEach((particle, i) => {
      const angle = (i / particles.length) * p.TWO_PI;
      const x = centerX + p.cos(angle) * radius * p.random(0.8, 1.2);
      const y = centerY + p.sin(angle) * radius * p.random(0.8, 1.2);
      particle.originalPosition = p.createVector(x, y);
      particle.position = particle.originalPosition.copy();
      particle.velocity.mult(0);
      particle.acceleration.mult(0);
    });
  };
};

// Create a new p5 instance with the sketch
const p5Instance = new p5(sketch); 