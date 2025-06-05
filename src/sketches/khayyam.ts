import p5 from 'p5';

interface Particle {
  position: p5.Vector;
  velocity: p5.Vector;
  acceleration: p5.Vector;
  color: p5.Color;
  size: number;
  maxSpeed: number;
  type: 'grape' | 'pebble' | 'sparkle' | 'wisdom';
  opacity: number;
  targetOpacity: number;
  phase: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

const sketch = (p: p5) => {
  let particles: Particle[] = [];
  let mouseForce: p5.Vector;
  let isPaused = false;
  let time = 0;
  let moodPhase = 0;
  let transformationProgress = 0;
  
  const createParticle = (x: number, y: number, type: Particle['type']): Particle => {
    const baseColor = type === 'grape' ? p.color(180, 40, 60, 200) :
                     type === 'pebble' ? p.color(200, 200, 200, 180) :
                     type === 'sparkle' ? p.color(255, 215, 0, 150) :
                     p.color(150, 100, 200, 180);

    return {
      position: p.createVector(x, y),
      velocity: p.createVector(0, 0),
      acceleration: p.createVector(0, 0),
      color: baseColor,
      size: type === 'grape' ? p.random(4, 6) :
            type === 'pebble' ? p.random(3, 5) :
            type === 'sparkle' ? p.random(2, 3) :
            p.random(3, 4),
      maxSpeed: type === 'grape' ? 2 :
                type === 'pebble' ? 1.5 :
                type === 'sparkle' ? 3 :
                2,
      type,
      opacity: 0,
      targetOpacity: type === 'sparkle' ? p.random(0.4, 0.6) :
                    type === 'pebble' ? p.random(0.3, 0.5) :
                    p.random(0.5, 0.7),
      phase: p.random(p.TWO_PI),
      life: 0,
      maxLife: type === 'sparkle' ? p.random(100, 200) : Infinity,
      rotation: p.random(p.TWO_PI),
      rotationSpeed: p.random(-0.02, 0.02)
    };
  };

  const createSparkle = (x: number, y: number) => {
    const count = p.random(3, 6);
    for (let i = 0; i < count; i++) {
      const angle = p.random(p.TWO_PI);
      const distance = p.random(10, 30);
      const sparkleX = x + p.cos(angle) * distance;
      const sparkleY = y + p.sin(angle) * distance;
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
    
    // Initialize particles
    const particleCount = 300;
    const centerX = p.width / 2;
    const centerY = p.height / 2;
    const radius = Math.min(p.width, p.height) * 0.3;

    // Create different types of particles
    for (let i = 0; i < particleCount; i++) {
      const type = i < particleCount * 0.4 ? 'pebble' :
                  i < particleCount * 0.7 ? 'grape' :
                  i < particleCount * 0.9 ? 'wisdom' : 'sparkle';
      
      const angle = (i / particleCount) * p.TWO_PI;
      const distance = radius * p.random(0.8, 1.2);
      const x = centerX + p.cos(angle) * distance;
      const y = centerY + p.sin(angle) * distance;
      
      particles.push(createParticle(x, y, type));
    }

    mouseForce = p.createVector(0, 0);
    
    console.log("Welcome to 'Khayyám's Wisdom' - A visualization of joy and transformation");
    console.log("Controls:");
    console.log("- Move mouse to interact with particles");
    console.log("- Press 'p' to pause/resume");
    console.log("- Press 'r' to reset");
  };

  p.draw = () => {
    if (isPaused) return;

    time += 0.01;
    moodPhase = (moodPhase + 0.005) % p.TWO_PI;
    transformationProgress = p.sin(moodPhase) * 0.5 + 0.5;
    p.background(0, 0, 0, 0);

    // Update and draw particles
    particles = particles.filter(particle => {
      // Update particle life
      if (particle.type === 'sparkle') {
        particle.life += 1;
        if (particle.life > particle.maxLife) return false;
      }

      // Update rotation
      particle.rotation += particle.rotationSpeed;

      // Apply forces based on particle type
      if (particle.type === 'pebble') {
        const noise = p.noise(particle.position.x * 0.005, particle.position.y * 0.005, time * 0.5) * p.TWO_PI;
        particle.acceleration.x = p.cos(noise) * 0.02;
        particle.acceleration.y = p.sin(noise) * 0.02;
        particle.opacity = p.lerp(particle.opacity, particle.targetOpacity * (1 - transformationProgress), 0.02);
      } else if (particle.type === 'grape') {
        particle.acceleration.y = -0.15 * transformationProgress;
        particle.acceleration.x = p.sin(time + particle.phase) * 0.1 * transformationProgress;
        particle.opacity = p.lerp(particle.opacity, particle.targetOpacity * transformationProgress, 0.03);
      } else if (particle.type === 'wisdom') {
        const centerForce = p5.Vector.sub(
          p.createVector(p.width/2, p.height/2),
          particle.position
        ).mult(0.001);
        particle.acceleration.add(centerForce);
        particle.opacity = p.lerp(particle.opacity, particle.targetOpacity * transformationProgress, 0.02);
      } else if (particle.type === 'sparkle') {
        const lifeRatio = 1 - (particle.life / particle.maxLife);
        particle.opacity = particle.targetOpacity * lifeRatio;
        particle.acceleration.y -= 0.05;
        particle.acceleration.x += p.sin(time * 2 + particle.phase) * 0.03;
      }

      // Apply mouse force
      if (p.mouseX > 0 && p.mouseY > 0) {
        const mousePos = p.createVector(p.mouseX, p.mouseY);
        const force = p5.Vector.sub(particle.position, mousePos);
        const distance = force.mag();
        if (distance < 150) {
          const strength = p.map(distance, 0, 150, 0.3, 0);
          force.normalize();
          force.mult(strength);
          particle.acceleration.add(force);
        }
      }

      // Update physics
      particle.velocity.add(particle.acceleration);
      particle.velocity.mult(0.98);
      particle.velocity.limit(particle.maxSpeed);
      particle.position.add(particle.velocity);
      particle.acceleration.mult(0);

      // Create sparkles for grapes during transformation
      if (particle.type === 'grape' && transformationProgress > 0.5 && p.random() < 0.02) {
        createSparkle(particle.position.x, particle.position.y);
      }

      // Draw particle
      p.push();
      p.translate(particle.position.x, particle.position.y);
      p.rotate(particle.rotation);
      
      p.noStroke();
      const alpha = particle.opacity * 255;
      p.fill(p.red(particle.color), p.green(particle.color), p.blue(particle.color), alpha);
      
      if (particle.type === 'grape') {
        p.drawingContext.shadowBlur = 10;
        p.drawingContext.shadowColor = p.color(p.red(particle.color), p.green(particle.color), p.blue(particle.color), alpha * 0.5);
        p.ellipse(0, 0, particle.size);
      } else if (particle.type === 'pebble') {
        p.rect(-particle.size/2, -particle.size/2, particle.size, particle.size, 2);
      } else if (particle.type === 'sparkle') {
        p.drawingContext.shadowBlur = 5;
        p.drawingContext.shadowColor = p.color(255, 215, 0, alpha * 0.5);
        p.ellipse(0, 0, particle.size);
      } else {
        p.drawingContext.shadowBlur = 8;
        p.drawingContext.shadowColor = p.color(p.red(particle.color), p.green(particle.color), p.blue(particle.color), alpha * 0.5);
        p.ellipse(0, 0, particle.size);
      }
      
      p.drawingContext.shadowBlur = 0;
      p.pop();

      return true;
    });
  };

  p.keyPressed = () => {
    if (p.key === 'p' || p.key === 'P') {
      isPaused = !isPaused;
    } else if (p.key === 'r' || p.key === 'R') {
      p.setup();
    }
  };

  p.windowResized = () => {
    const container = document.getElementById('sketch-container');
    if (!container) return;

    p.resizeCanvas(container.clientWidth, container.clientHeight);
    particles = [];
    p.setup();
  };
};

const p5Instance = new p5(sketch); 