import p5 from 'p5';

interface Particle {
  position: p5.Vector;
  velocity: p5.Vector;
  acceleration: p5.Vector;
  color: p5.Color;
  size: number;
  maxSpeed: number;
  originalPosition: p5.Vector;
  connectionRadius: number;
  type: 'shadow' | 'ember' | 'raven' | 'curtain' | 'echo';
  opacity: number;
  targetOpacity: number;
  phase: number;
  life: number;
  maxLife: number;
}

const sketch = (p: p5) => {
  let particles: Particle[] = [];
  let mouseForce: p5.Vector;
  let isPaused = false;
  let showInstructions = true;
  let time = 0;
  let ravenPosition: p5.Vector;
  let ravenSize = 0;
  let ravenOpacity = 0;
  let emberIntensity = 0;
  let curtainWave = 0;
  let echoTime = 0;
  let lastEcho = 0;

  const createParticle = (x: number, y: number, type: Particle['type']): Particle => {
    const baseColor = type === 'shadow' ? p.color(15, 15, 25) :
                     type === 'ember' ? p.color(180, 80, 40, 200) :
                     type === 'raven' ? p.color(30, 30, 35) :
                     type === 'echo' ? p.color(100, 100, 120, 150) :
                     p.color(80, 40, 120);

    return {
      position: p.createVector(x, y),
      velocity: p.createVector(0, 0),
      acceleration: p.createVector(0, 0),
      color: baseColor,
      size: type === 'raven' ? 8 : 
            type === 'echo' ? p.random(3, 6) :
            p.random(2, 4),
      maxSpeed: type === 'raven' ? 1.5 : 
                type === 'echo' ? 2.5 :
                p.random(1, 2.5),
      originalPosition: p.createVector(x, y),
      connectionRadius: p.random(40, 80),
      type,
      opacity: 0,
      targetOpacity: type === 'echo' ? p.random(0.4, 0.6) :
                    type === 'shadow' ? p.random(0.2, 0.4) :
                    p.random(0.3, 0.7),
      phase: p.random(p.TWO_PI),
      life: 0,
      maxLife: type === 'echo' ? p.random(100, 200) : Infinity
    };
  };

  const createEcho = (x: number, y: number) => {
    const count = p.random(5, 10);
    for (let i = 0; i < count; i++) {
      const angle = p.random(p.TWO_PI);
      const distance = p.random(20, 50);
      const echoX = x + p.cos(angle) * distance;
      const echoY = y + p.sin(angle) * distance;
      particles.push(createParticle(echoX, echoY, 'echo'));
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
    
    // Initialize particles
    const particleCount = 400; // Increased particle count
    ravenPosition = p.createVector(p.width * 0.7, p.height * 0.4);

    // Create different types of particles
    for (let i = 0; i < particleCount; i++) {
      const type = i < particleCount * 0.35 ? 'shadow' :
                  i < particleCount * 0.65 ? 'ember' :
                  i < particleCount * 0.9 ? 'curtain' : 'raven';
      
      let x, y;
      if (type === 'shadow') {
        x = p.random(p.width * 0.5, p.width * 0.9);
        y = p.random(p.height * 0.2, p.height * 0.8);
      } else if (type === 'ember') {
        x = p.random(p.width * 0.1, p.width * 0.3);
        y = p.random(p.height * 0.6, p.height * 0.9);
      } else if (type === 'curtain') {
        x = p.random(p.width * 0.1, p.width * 0.2);
        y = p.random(0, p.height);
      } else {
        x = ravenPosition.x + p.random(-15, 15);
        y = ravenPosition.y + p.random(-15, 15);
      }
      
      particles.push(createParticle(x, y, type));
    }

    mouseForce = p.createVector(0, 0);
    
    console.log("Welcome to 'The Raven' - An atmospheric visualization");
    console.log("Controls:");
    console.log("- Move mouse to interact with particles");
    console.log("- Press 'p' to pause/resume");
    console.log("- Press 'r' to reset");
    console.log("- Press 'i' to toggle instructions");
  };

  p.draw = () => {
    if (isPaused) return;

    time += 0.01;
    p.background(0, 0, 0, 0); // Removed background opacity for cleaner trails

    // Update raven properties with smoother transitions
    ravenSize = p.lerp(ravenSize, 1, 0.008);
    ravenOpacity = p.lerp(ravenOpacity, 1, 0.003);
    emberIntensity = p.sin(time * 1.5) * 0.5 + 0.5;
    curtainWave = p.sin(time * 0.8) * 0.5 + 0.5;

    // Create echo effect periodically
    echoTime += 1;
    if (echoTime - lastEcho > 180) { // Every 3 seconds at 60fps
      createEcho(ravenPosition.x, ravenPosition.y);
      lastEcho = echoTime;
    }

    // Update and draw particles
    particles = particles.filter(particle => {
      // Update particle life
      if (particle.type === 'echo') {
        particle.life += 1;
        if (particle.life > particle.maxLife) return false;
      }

      // Apply forces based on particle type
      if (particle.type === 'shadow') {
        const noise = p.noise(particle.position.x * 0.005, particle.position.y * 0.005, time * 0.5) * p.TWO_PI;
        particle.acceleration.x = p.cos(noise) * 0.03;
        particle.acceleration.y = p.sin(noise) * 0.03;
        particle.opacity = p.lerp(particle.opacity, particle.targetOpacity * 0.4, 0.015);
      } else if (particle.type === 'ember') {
        particle.acceleration.y = -0.25;
        particle.acceleration.x = p.sin(time + particle.phase) * 0.12;
        particle.opacity = p.lerp(particle.opacity, particle.targetOpacity * emberIntensity * 0.8, 0.06);
      } else if (particle.type === 'curtain') {
        particle.acceleration.x = p.sin(time * 1.5 + particle.phase) * 0.12;
        particle.acceleration.y = p.cos(time * 0.8 + particle.phase) * 0.06;
        particle.opacity = p.lerp(particle.opacity, particle.targetOpacity * curtainWave * 0.9, 0.02);
      } else if (particle.type === 'raven') {
        const toRaven = p5.Vector.sub(ravenPosition, particle.position);
        const distance = toRaven.mag();
        if (distance > 5) {
          toRaven.normalize();
          particle.acceleration.add(toRaven.mult(0.12));
        }
        particle.opacity = p.lerp(particle.opacity, particle.targetOpacity * ravenOpacity, 0.015);
      } else if (particle.type === 'echo') {
        const lifeRatio = 1 - (particle.life / particle.maxLife);
        particle.opacity = particle.targetOpacity * lifeRatio;
        particle.acceleration.y -= 0.02; // Slight upward drift
        particle.acceleration.x += p.sin(time * 2 + particle.phase) * 0.05;
      }

      // Apply mouse force with more subtle effect
      if (p.mouseX > 0 && p.mouseY > 0) {
        const mousePos = p.createVector(p.mouseX, p.mouseY);
        const force = p5.Vector.sub(particle.position, mousePos);
        const distance = force.mag();
        if (distance < 100) {
          const strength = p.map(distance, 0, 100, 0.4, 0);
          force.normalize();
          force.mult(strength);
          particle.acceleration.add(force);
        }
      }

      // Update physics with improved damping
      particle.velocity.add(particle.acceleration);
      particle.velocity.mult(0.985); // Slightly increased damping
      particle.velocity.limit(particle.maxSpeed);
      particle.position.add(particle.velocity);
      particle.acceleration.mult(0);

      // Draw particle with enhanced visual effects
      p.noStroke();
      const alpha = particle.opacity * 255 * 
                   (particle.type === 'shadow' ? 0.8 : 
                    particle.type === 'echo' ? 0.9 : 1);
      p.fill(p.red(particle.color), p.green(particle.color), p.blue(particle.color), alpha);
      
      // Draw particles with slight glow effect
      if (particle.type === 'ember' || particle.type === 'echo') {
        p.drawingContext.shadowBlur = 5;
        p.drawingContext.shadowColor = p.color(p.red(particle.color), p.green(particle.color), p.blue(particle.color), alpha * 0.5);
      }
      
      p.ellipse(particle.position.x, particle.position.y, particle.size * ravenSize);
      p.drawingContext.shadowBlur = 0;

      // Draw connections for shadow particles with improved aesthetics
      if (particle.type === 'shadow') {
        particles.forEach(other => {
          if (other.type === 'shadow' && other !== particle) {
            const distance = p5.Vector.dist(particle.position, other.position);
            if (distance < particle.connectionRadius) {
              const connectionOpacity = (1 - distance / particle.connectionRadius) * 25 * particle.opacity;
              p.stroke(20, 20, 30, connectionOpacity);
              p.line(particle.position.x, particle.position.y, other.position.x, other.position.y);
            }
          }
        });
      }

      return true;
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
      p.text("Press 'i' to toggle instructions", 20, p.height - 0);
    }
  };

  p.keyPressed = () => {
    if (p.key === 'p' || p.key === 'P') {
      isPaused = !isPaused;
    } else if (p.key === 'r' || p.key === 'R') {
      p.setup();
    } else if (p.key === 'i' || p.key === 'I') {
      showInstructions = !showInstructions;
    }
  };

  p.windowResized = () => {
    const container = document.getElementById('sketch-container');
    if (!container) return;

    p.resizeCanvas(container.clientWidth, container.clientHeight);
    ravenPosition = p.createVector(p.width * 0.7, p.height * 0.4);
    
    // Reset particles
    particles = [];
    p.setup();
  };
};

const p5Instance = new p5(sketch); 