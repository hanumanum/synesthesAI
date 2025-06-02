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
  type: 'core' | 'shield' | 'flow' | 'wisdom' | 'balance';
  phase: number;         // For oscillating behavior
  life: number;          // For particle lifecycle
  maxLife: number;       // Maximum lifetime
  targetOpacity: number; // For fade effects
  currentOpacity: number;
  // Add spatial hash grid index
  gridX: number;
  gridY: number;
}

const sketch = (p: p5) => {
  let particles: Particle[] = [];
  let mouseForce: p5.Vector;
  let isPaused = false;
  let showInstructions = true;
  let time = 0;
  let centerForce: p5.Vector;
  let globalPhase = 0;
  
  // Add click interaction variables
  let isClicking = false;
  let clickTime = 0;
  let clickPattern = 0;
  const CLICK_PATTERNS = 5; // Number of different click patterns
  
  // Constants for optimization
  const GRID_SIZE = 100; // Size of spatial hash grid cells
  const MAX_PARTICLES = 100; // Reduced total particle count
  const PARTICLE_COUNTS = {
    core: 10,    // Reduced from 20
    shield: 20,  // Reduced from 40
    flow: 15,    // Reduced from 30
    wisdom: 15,  // Reduced from 25
    balance: 20  // Reduced from 35
  };
  
  // Theme colors representing different aspects of resilience
  const themeColors = {
    core: [255, 255, 255, 200],     // White - inner strength and purity
    shield: [0, 150, 255, 180],     // Blue - protection and stability
    flow: [255, 100, 0, 180],       // Orange - adaptability and energy
    wisdom: [150, 0, 255, 180],     // Purple - knowledge and understanding
    balance: [0, 255, 150, 180]     // Green - harmony and growth
  };

  // Spatial hash grid for faster neighbor lookup
  const grid: Map<string, Particle[]> = new Map();
  
  const getGridKey = (x: number, y: number): string => {
    const gridX = Math.floor(x / GRID_SIZE);
    const gridY = Math.floor(y / GRID_SIZE);
    return `${gridX},${gridY}`;
  };

  const updateGrid = () => {
    grid.clear();
    particles.forEach(particle => {
      const key = getGridKey(particle.position.x, particle.position.y);
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(particle);
    });
  };

  const getNeighbors = (particle: Particle): Particle[] => {
    const neighbors: Particle[] = [];
    const gridX = Math.floor(particle.position.x / GRID_SIZE);
    const gridY = Math.floor(particle.position.y / GRID_SIZE);
    
    // Check neighboring cells
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        const key = `${gridX + x},${gridY + y}`;
        const cell = grid.get(key);
        if (cell) {
          neighbors.push(...cell);
        }
      }
    }
    return neighbors;
  };

  const createParticle = (x: number, y: number, type: Particle['type']): Particle => ({
    position: p.createVector(x, y),
    velocity: p.createVector(0, 0),
    acceleration: p.createVector(0, 0),
    color: themeColors[type],
    size: type === 'core' ? 4 : 
          type === 'shield' ? 3 :
          2,
    maxSpeed: type === 'flow' ? 4 :
              type === 'core' ? 1.5 :
              2.5,
    innerStrength: type === 'core' ? 0.95 :
                   type === 'shield' ? 0.9 :
                   0.8,
    originalPosition: p.createVector(x, y),
    connectionRadius: type === 'core' ? 80 :
                     type === 'shield' ? 60 :
                     40,
    type,
    phase: p.random(p.TWO_PI),
    life: 0,
    maxLife: type === 'flow' ? 200 : Infinity,
    targetOpacity: type === 'core' ? 1 :
                   type === 'shield' ? 0.9 :
                   0.8,
    currentOpacity: 0,
    gridX: 0,
    gridY: 0
  });

  const createParticleSystem = () => {
    particles = [];
    const centerX = p.width / 2;
    const centerY = p.height / 2;
    const radius = Math.min(p.width, p.height) * 0.3;

    // Create particles with reduced counts
    Object.entries(PARTICLE_COUNTS).forEach(([type, count]) => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * p.TWO_PI;
        const distance = type === 'core' ? radius * 0.3 :
                        type === 'shield' ? radius * 0.6 :
                        type === 'flow' ? p.random(radius * 0.4, radius * 0.8) :
                        type === 'wisdom' ? p.random(radius * 0.5, radius * 0.9) :
                        p.random(radius * 0.7, radius);
        const x = centerX + p.cos(angle) * distance;
        const y = centerY + p.sin(angle) * distance;
        particles.push(createParticle(x, y, type as Particle['type']));
      }
    });
  };

  // Add new constants for continuous behavior
  const MAX_DISTANCE = 800; // Maximum distance from center before recycling
  const RECYCLE_RATE = 0.02; // Rate at which particles are recycled
  const FLOW_SPAWN_RATE = 0.1; // Rate at which new flow particles spawn

  const recycleParticle = (particle: Particle): Particle => {
    const centerX = p.width / 2;
    const centerY = p.height / 2;
    const radius = Math.min(p.width, p.height) * 0.3;
    
    // Calculate new position based on particle type
    let angle, distance;
    if (particle.type === 'core') {
      angle = p.random(p.TWO_PI);
      distance = radius * 0.3;
    } else if (particle.type === 'shield') {
      angle = p.random(p.TWO_PI);
      distance = radius * 0.6;
    } else if (particle.type === 'flow') {
      angle = p.random(p.TWO_PI);
      distance = p.random(radius * 0.4, radius * 0.8);
    } else if (particle.type === 'wisdom') {
      angle = p.random(p.TWO_PI);
      distance = p.random(radius * 0.5, radius * 0.9);
    } else {
      angle = p.random(p.TWO_PI);
      distance = p.random(radius * 0.7, radius);
    }

    const x = centerX + p.cos(angle) * distance;
    const y = centerY + p.sin(angle) * distance;

    // Create new particle with same type but reset properties
    return createParticle(x, y, particle.type);
  };

  const spawnFlowParticle = () => {
    const centerX = p.width / 2;
    const centerY = p.height / 2;
    const radius = Math.min(p.width, p.height) * 0.3;
    
    // Spawn from the edges
    const angle = p.random(p.TWO_PI);
    const distance = radius * 1.2; // Slightly outside the main system
    const x = centerX + p.cos(angle) * distance;
    const y = centerY + p.sin(angle) * distance;
    
    const particle = createParticle(x, y, 'flow');
    // Give it initial velocity towards the center
    const dx = centerX - x;
    const dy = centerY - y;
    const length = Math.sqrt(dx * dx + dy * dy);
    particle.velocity = p.createVector(
      (dx / length) * particle.maxSpeed * 0.5,
      (dy / length) * particle.maxSpeed * 0.5
    );
    return particle;
  };

  // Modify constants for continuous cycling
  const CYCLE_DURATION = 1000; // Duration of one complete cycle
  const PHASE_SPEED = 0.001; // Speed of the global phase
  const TRANSITION_SPEED = 0.02; // Speed of transitions between states
  
  // Add cycle state tracking
  let cyclePhase = 0;
  let targetPositions: Map<Particle, p5.Vector> = new Map();
  let currentState = 0;
  const NUM_STATES = 4; // Number of different system states

  const calculateTargetPositions = (state: number) => {
    const centerX = p.width / 2;
    const centerY = p.height / 2;
    const radius = Math.min(p.width, p.height) * 0.3;
    
    particles.forEach(particle => {
      const baseAngle = (cyclePhase + particle.phase) % p.TWO_PI;
      let angle = baseAngle;
      let distance = radius * 0.5; // Default distance
      
      switch(state) {
        case 0: // Concentric circles
          angle = baseAngle;
          distance = particle.type === 'core' ? radius * 0.3 :
                    particle.type === 'shield' ? radius * 0.6 :
                    particle.type === 'flow' ? radius * 0.8 :
                    particle.type === 'wisdom' ? radius * 0.9 :
                    radius;
          break;
          
        case 1: // Spiral formation
          angle = baseAngle * 2;
          distance = radius * (0.3 + (baseAngle / p.TWO_PI) * 0.7);
          break;
          
        case 2: // Wave pattern
          angle = baseAngle;
          distance = radius * (0.5 + Math.sin(baseAngle * 3) * 0.3);
          break;
          
        case 3: // Dynamic clusters
          const clusterAngle = Math.floor(baseAngle / (p.TWO_PI / 6)) * (p.TWO_PI / 6);
          angle = clusterAngle + (baseAngle % (p.TWO_PI / 6)) * 0.5;
          distance = radius * (0.4 + Math.cos(baseAngle * 4) * 0.3);
          break;
      }
      
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      targetPositions.set(particle, p.createVector(x, y));
    });
  };

  const updateParticlePositions = () => {
    particles.forEach(particle => {
      const target = targetPositions.get(particle);
      if (target) {
        // Calculate desired velocity towards target
        const desired = p5.Vector.sub(target, particle.position);
        const distance = desired.mag();
        
        if (distance > 1) {
          desired.normalize();
          desired.mult(particle.maxSpeed);
          
          // Steer towards target
          const steer = p5.Vector.sub(desired, particle.velocity);
          steer.limit(0.1);
          particle.acceleration.add(steer);
        }
      }
    });
  };

  // Add click pattern calculation function
  const calculateClickPattern = (pattern: number, particle: Particle) => {
    const centerX = p.width / 2;
    const centerY = p.height / 2;
    const radius = Math.min(p.width, p.height) * 0.3;
    const clickX = p.mouseX;
    const clickY = p.mouseY;
    const angleToClick = Math.atan2(clickY - centerY, clickX - centerX);
    const baseAngle = (cyclePhase + particle.phase) % p.TWO_PI;
    
    let targetX, targetY;
    
    switch(pattern) {
      case 0: // Concentric rings around click
        const ringRadius = radius * (0.3 + (particle.type === 'core' ? 0 :
                                          particle.type === 'shield' ? 0.2 :
                                          particle.type === 'flow' ? 0.4 :
                                          particle.type === 'wisdom' ? 0.6 : 0.8));
        targetX = clickX + Math.cos(baseAngle) * ringRadius;
        targetY = clickY + Math.sin(baseAngle) * ringRadius;
        break;
        
      case 1: // Spiral from click
        const spiralRadius = radius * (0.2 + (baseAngle / p.TWO_PI) * 0.8);
        const spiralAngle = baseAngle * 3 + angleToClick;
        targetX = clickX + Math.cos(spiralAngle) * spiralRadius;
        targetY = clickY + Math.sin(spiralAngle) * spiralRadius;
        break;
        
      case 2: // Wave pattern from click
        const waveRadius = radius * (0.4 + Math.sin(baseAngle * 4) * 0.3);
        const waveAngle = baseAngle + angleToClick;
        targetX = clickX + Math.cos(waveAngle) * waveRadius;
        targetY = clickY + Math.sin(waveAngle) * waveRadius;
        break;
        
      case 3: // Particle type clusters
        const clusterAngle = (particle.type === 'core' ? 0 :
                            particle.type === 'shield' ? p.TWO_PI / 5 :
                            particle.type === 'flow' ? p.TWO_PI * 2 / 5 :
                            particle.type === 'wisdom' ? p.TWO_PI * 3 / 5 :
                            p.TWO_PI * 4 / 5) + baseAngle * 0.2;
        const clusterRadius = radius * 0.6;
        targetX = clickX + Math.cos(clusterAngle) * clusterRadius;
        targetY = clickY + Math.sin(clusterAngle) * clusterRadius;
        break;
        
      case 4: // Explosion pattern
        const explosionRadius = radius * (0.2 + (1 - clickTime / 60) * 0.8);
        const explosionAngle = baseAngle + angleToClick;
        targetX = clickX + Math.cos(explosionAngle) * explosionRadius;
        targetY = clickY + Math.sin(explosionAngle) * explosionRadius;
        break;
    }
    
    return p.createVector(targetX, targetY);
  };

  p.setup = () => {
    const container = document.getElementById('sketch-container');
    if (!container) {
      console.error('Sketch container not found');
      return;
    }

    const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
    canvas.parent('sketch-container');
    p.background(0, 0 , 0 , .2);
    p.colorMode(p.RGB, 255, 255, 255, 255);

    mouseForce = p.createVector(0, 0);
    centerForce = p.createVector(0, 0);
    
    createParticleSystem();
    
    console.log("Welcome to 'Resilience II' - A visualization of inner strength and balance");
    console.log("Controls:");
    console.log("- Move mouse to interact with the system");
    console.log("- Press 'p' to pause/resume");
    console.log("- Press 'r' to reset");
    console.log("- Press 'i' to toggle instructions");
  };

  p.draw = () => {
    if (isPaused) return;
    
    time += 0.01;
    cyclePhase = (cyclePhase + PHASE_SPEED) % p.TWO_PI;
    globalPhase += 0.005;
    p.background(0, 0, 0, .2);

    // Update click time
    if (isClicking) {
      clickTime++;
    }

    // Update system state (only when not clicking)
    if (!isClicking && cyclePhase < 0.1) {
      currentState = (currentState + 1) % NUM_STATES;
    }

    // Calculate target positions based on click state
    if (isClicking) {
      particles.forEach(particle => {
        const target = calculateClickPattern(clickPattern, particle);
        targetPositions.set(particle, target);
      });
    } else {
      calculateTargetPositions(currentState);
    }

    // Update grid for neighbor lookup
    updateGrid();

    // Update and draw particles
    particles.forEach(particle => {
      // Update particle phase
      particle.phase = (particle.phase + 0.01) % p.TWO_PI;

      // Update physics with increased speed during click
      const currentTransitionSpeed = isClicking ? TRANSITION_SPEED * 2 : TRANSITION_SPEED;
      updateParticlePositions();

      // Apply mouse force with distance-based strength
      if (p.mouseX > 0 && p.mouseY > 0) {
        const dx = particle.position.x - p.mouseX;
        const dy = particle.position.y - p.mouseY;
        const distanceToMouse = Math.sqrt(dx * dx + dy * dy);
        if (distanceToMouse < 150) {
          const mouseStrength = (1 - distanceToMouse / 150) * (1 - particle.innerStrength);
          particle.acceleration.add(dx * mouseStrength * 0.01, dy * mouseStrength * 0.01);
        }
      }

      // Add noise-based movement (reduced during click)
      const noiseStrength = isClicking ? 0.05 : 0.1;
      const noise = p.noise(
        particle.position.x * 0.005,
        particle.position.y * 0.005,
        time
      ) * p.TWO_PI;
      const noiseForce = p.createVector(
        p.cos(noise),
        p.sin(noise)
      ).mult(noiseStrength * (1 - particle.innerStrength));
      particle.acceleration.add(noiseForce);

      // Update velocity and position
      particle.velocity.add(particle.acceleration);
      particle.velocity.mult(0.98); // Damping
      particle.velocity.limit(particle.maxSpeed);
      particle.position.add(particle.velocity);
      particle.acceleration.mult(0);

      // Update opacity with dynamic transition speed
      particle.currentOpacity = p.lerp(
        particle.currentOpacity,
        particle.targetOpacity,
        currentTransitionSpeed
      );

      // Draw particle
      p.noStroke();
      const alpha = particle.currentOpacity * 255;
      p.fill(particle.color[0], particle.color[1], particle.color[2], alpha);
      
      // Add glow effect for core and shield particles
      if (particle.type === 'core' || particle.type === 'shield') {
        p.drawingContext.shadowBlur = 10;
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
      const neighbors = getNeighbors(particle);
      neighbors.forEach(other => {
        if (other !== particle) {
          const dx = particle.position.x - other.position.x;
          const dy = particle.position.y - other.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < particle.connectionRadius) {
            const connectionStrength = 1 - distance / particle.connectionRadius;
            const connectionAlpha = connectionStrength * 100 * particle.currentOpacity;
            
            // Different connection styles based on particle types
            if ((particle.type === 'core' && other.type === 'shield') ||
                (particle.type === 'shield' && other.type === 'core')) {
              p.stroke(particle.color[0], particle.color[1], particle.color[2], connectionAlpha * 0.8);
              p.strokeWeight(2);
            } else if (particle.type === 'flow' || other.type === 'flow') {
              p.stroke(particle.color[0], particle.color[1], particle.color[2], connectionAlpha * 0.4);
              p.strokeWeight(1);
            } else {
              p.stroke(particle.color[0], particle.color[1], particle.color[2], connectionAlpha * 0.6);
              p.strokeWeight(1.5);
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
    });

    // Draw instructions if enabled
    if (showInstructions) {
      p.fill(255, 200);
      p.noStroke();
      p.textSize(16);
      p.textAlign(p.LEFT);
      p.text("Move mouse to interact with particles", 20, p.height - 80);
      p.text("Click to cycle through different patterns", 20, p.height - 60);
      p.text("Press 'p' to pause/resume", 20, p.height - 40);
      p.text("Press 'r' to reset", 20, p.height - 20);
    }
  };

  p.keyPressed = () => {
    if (p.key === 'p') {
      isPaused = !isPaused;
    } else if (p.key === 'r') {
      createParticleSystem();
    } else if (p.key === 'i') {
      showInstructions = !showInstructions;
    }
  };

  p.windowResized = () => {
    const container = document.getElementById('sketch-container');
    if (!container) return;
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    createParticleSystem();
  };

  p.mousePressed = () => {
    isClicking = true;
    clickTime = 0;
    clickPattern = (clickPattern + 1) % CLICK_PATTERNS;
  };

  p.mouseReleased = () => {
    isClicking = false;
  };
};

// Create a new p5 instance with the sketch
const p5Instance = new p5(sketch); 
