import p5 from 'p5';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  brightness: number;
  life: number;
  type: 'anger' | 'growth' | 'poison';
}

interface Wave {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hue: number;
  intensity: number;
}

const sketch = (p: p5) => {
  let particles: Particle[] = [];
  let waves: Wave[] = [];
  let time = 0;
  let canvasWidth: number;
  let canvasHeight: number;
  let centerX: number;
  let centerY: number;

  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('sketch-container');
    p.colorMode(p.HSB, 360, 100, 100, 1);
    p.blendMode(p.SCREEN);
    
    canvasWidth = p.width;
    canvasHeight = p.height;
    centerX = canvasWidth / 2;
    centerY = canvasHeight / 2;
    
    // Create initial particles
    for (let i = 0; i < 200; i++) {
      addParticle();
    }
    
    // Create initial waves
    for (let i = 0; i < 5; i++) {
      addWave();
    }
  };

  function addParticle() {
    const angle = p.random(p.TWO_PI);
    const distance = p.random(0, 300);
    const x = centerX + p.cos(angle) * distance;
    const y = centerY + p.sin(angle) * distance;
    
    const types: ('anger' | 'growth' | 'poison')[] = ['anger', 'growth', 'poison'];
    const type = types[Math.floor(p.random(3))];
    
    let hue, speed;
    switch(type) {
      case 'anger':
        hue = p.random(0, 30); // Red-orange
        speed = p.random(2, 4);
        break;
      case 'growth':
        hue = p.random(60, 120); // Yellow-green
        speed = p.random(1, 3);
        break;
      case 'poison':
        hue = p.random(270, 320); // Purple-magenta
        speed = p.random(1.5, 3.5);
        break;
    }
    
    particles.push({
      x: x,
      y: y,
      vx: p.cos(angle) * speed,
      vy: p.sin(angle) * speed,
      size: p.random(3, 12),
      hue: hue,
      brightness: p.random(70, 100),
      life: 1.0,
      type: type
    });
  }

  function addWave() {
    waves.push({
      x: centerX + p.random(-200, 200),
      y: centerY + p.random(-200, 200),
      radius: 0,
      speed: p.random(1, 3),
      hue: p.random(240, 320),
      intensity: p.random(0.3, 0.8)
    });
  }

  p.draw = () => {
    time += 0.02;
    
    // Dark background
    p.background(270, 80, 5, 0.1);
    
    // Update and draw waves
    updateWaves();
    
    // Update and draw particles
    updateParticles();
    
    // Draw energy fields
    drawEnergyFields();
    
    // Add new particles periodically
    if (p.frameCount % 3 === 0) {
      addParticle();
    }
    
    // Add new waves periodically
    if (p.frameCount % 60 === 0) {
      addWave();
    }
  };

  function updateWaves() {
    waves = waves.filter(wave => {
      wave.radius += wave.speed;
      
      p.push();
      p.noFill();
      p.strokeWeight(2);
      p.stroke(wave.hue, 70, 80, wave.intensity * (1 - wave.radius / 400));
      p.ellipse(wave.x, wave.y, wave.radius * 2);
      p.pop();
      
      return wave.radius < 400;
    });
  }

  function updateParticles() {
    particles = particles.filter(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply forces based on type
      const distFromCenter = p.dist(particle.x, particle.y, centerX, centerY);
      const angleToCenter = p.atan2(centerY - particle.y, centerX - particle.x);
      
      switch(particle.type) {
        case 'anger':
          // Explosive outward motion
          particle.vx += p.cos(angleToCenter + p.PI) * 0.1;
          particle.vy += p.sin(angleToCenter + p.PI) * 0.1;
          break;
        case 'growth':
          // Spiral motion
          const spiralAngle = angleToCenter + time;
          particle.vx += p.cos(spiralAngle) * 0.05;
          particle.vy += p.sin(spiralAngle) * 0.05;
          break;
        case 'poison':
          // Sinuous, snake-like motion
          particle.vx += p.cos(time * 2 + particle.x * 0.01) * 0.2;
          particle.vy += p.sin(time * 2 + particle.y * 0.01) * 0.2;
          break;
      }
      
      // Decay life
      particle.life -= 0.005;
      
      // Draw particle
      p.push();
      p.noStroke();
      
      // Draw glow
      p.fill(particle.hue, 50, particle.brightness, particle.life * 0.3);
      p.ellipse(particle.x, particle.y, particle.size * 3);
      
      // Draw core
      p.fill(particle.hue, 80, particle.brightness, particle.life * 0.8);
      p.ellipse(particle.x, particle.y, particle.size);
      
      p.pop();
      
      // Wrap around screen
      if (particle.x < 0) particle.x = canvasWidth;
      if (particle.x > canvasWidth) particle.x = 0;
      if (particle.y < 0) particle.y = canvasHeight;
      if (particle.y > canvasHeight) particle.y = 0;
      
      return particle.life > 0;
    });
  }

  function drawEnergyFields() {
    // Draw flowing energy lines
    p.push();
    p.noFill();
    p.strokeWeight(1);
    
    for (let i = 0; i < 5; i++) {
      p.stroke(280 + i * 10, 60, 70, 0.4);
      
      p.beginShape();
      for (let x = 0; x <= canvasWidth; x += 20) {
        const y = centerY + p.sin(x * 0.01 + time + i) * 100 + p.sin(x * 0.005 + time * 0.5) * 50;
        p.curveVertex(x, y);
      }
      p.endShape();
    }
    
    // Draw radial energy bursts
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * p.TWO_PI + time * 0.5;
      const length = 100 + p.sin(time * 2 + i) * 50;
      const x1 = centerX + p.cos(angle) * 50;
      const y1 = centerY + p.sin(angle) * 50;
      const x2 = centerX + p.cos(angle) * length;
      const y2 = centerY + p.sin(angle) * length;
      
      p.stroke(300, 70, 80, 0.5);
      p.line(x1, y1, x2, y2);
    }
    
    p.pop();
  }

  p.mousePressed = () => {
    // Create burst of particles at mouse
    for (let i = 0; i < 20; i++) {
      const angle = p.random(p.TWO_PI);
      const speed = p.random(3, 8);
      
      particles.push({
        x: p.mouseX,
        y: p.mouseY,
        vx: p.cos(angle) * speed,
        vy: p.sin(angle) * speed,
        size: p.random(5, 15),
        hue: p.random(0, 360),
        brightness: p.random(80, 100),
        life: 1.0,
        type: 'anger'
      });
    }
    
    // Create wave at mouse
    waves.push({
      x: p.mouseX,
      y: p.mouseY,
      radius: 0,
      speed: 3,
      hue: p.random(270, 320),
      intensity: 0.8
    });
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    canvasWidth = p.width;
    canvasHeight = p.height;
    centerX = canvasWidth / 2;
    centerY = canvasHeight / 2;
  };
};

new p5(sketch); 