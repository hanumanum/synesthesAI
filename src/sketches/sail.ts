import p5 from 'p5';

interface Sail {
  position: p5.Vector;
  velocity: p5.Vector;
  angle: number;
  size: number;
  color: p5.Color;
  phase: number;
}

interface Wave {
  points: p5.Vector[];
  phase: number;
  amplitude: number;
  frequency: number;
  color: p5.Color;
}

interface Light {
  position: p5.Vector;
  size: number;
  brightness: number;
  phase: number;
}

const sketch = (p: p5) => {
  let sail: Sail;
  let waves: Wave[] = [];
  let lights: Light[] = [];
  let stormPhase = 0;
  let time = 0;
  
  const createSail = () => ({
    position: p.createVector(p.width * 0.5, p.height * 0.4),
    velocity: p.createVector(0, 0),
    angle: 0,
    size: Math.min(p.width, p.height) * 0.15,
    color: p.color(255, 255, 255, 200),
    phase: p.random(p.TWO_PI)
  });

  const createWave = (y: number, phase: number) => ({
    points: Array.from({ length: 50 }, (_, i) => 
      p.createVector(i * (p.width / 49), y)
    ),
    phase,
    amplitude: p.random(20, 40),
    frequency: p.random(0.02, 0.04),
    color: p.color(0, 100, 200, 150)
  });

  const createLight = () => ({
    position: p.createVector(
      p.random(p.width * 0.2, p.width * 0.8),
      p.random(p.height * 0.2, p.height * 0.6)
    ),
    size: p.random(20, 40),
    brightness: p.random(0.5, 1),
    phase: p.random(p.TWO_PI)
  });

  p.setup = () => {
    const container = document.getElementById('sketch-container');
    if (!container) {
      console.error('Sketch container not found');
      return;
    }

    const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
    canvas.parent('sketch-container');
    p.background(0);
    
    // Initialize elements
    sail = createSail();
    waves = Array.from({ length: 5 }, (_, i) => 
      createWave(p.height * (0.5 + i * 0.1), i * p.TWO_PI / 5)
    );
    lights = Array.from({ length: 3 }, createLight);
  };

  p.draw = () => {
    time += 0.01;
    stormPhase = (stormPhase + 0.003) % p.TWO_PI;
    const stormIntensity = p.sin(stormPhase) * 0.5 + 0.5;
    p.background(0, 0, 0, 0);

    // Update and draw waves
    waves.forEach((wave, i) => {
      wave.points.forEach((point, j) => {
        point.y = wave.points[0].y + 
          p.sin(time * wave.frequency + j * 0.1 + wave.phase) * 
          wave.amplitude * (1 + stormIntensity * 0.5);
      });

      // Draw wave
      p.noFill();
      p.stroke(wave.color);
      p.strokeWeight(2);
      p.beginShape();
      wave.points.forEach(point => p.vertex(point.x, point.y));
      p.endShape();
    });

    // Update and draw lights
    lights.forEach(light => {
      light.phase += 0.02;
      const brightness = light.brightness * (0.5 + p.sin(light.phase) * 0.5);
      
      p.noStroke();
      p.fill(255, 215, 0, brightness * 100);
      p.drawingContext.shadowBlur = 20;
      p.drawingContext.shadowColor = p.color(255, 215, 0, brightness * 50);
      p.ellipse(light.position.x, light.position.y, light.size);
      p.drawingContext.shadowBlur = 0;
    });

    // Update sail
    const windForce = p.createVector(
      p.cos(time * 0.5) * 0.2,
      p.sin(time * 0.3) * 0.1
    );
    sail.velocity.add(windForce);
    sail.velocity.mult(0.98);
    sail.position.add(sail.velocity);
    sail.angle = p.atan2(sail.velocity.y, sail.velocity.x);

    // Apply mouse force
    if (p.mouseX > 0 && p.mouseY > 0) {
      const mousePos = p.createVector(p.mouseX, p.mouseY);
      const force = p5.Vector.sub(sail.position, mousePos);
      const distance = force.mag();
      if (distance < 200) {
        const strength = p.map(distance, 0, 200, 0.3, 0);
        force.normalize();
        force.mult(strength);
        sail.velocity.add(force);
      }
    }

    // Keep sail within bounds
    sail.position.x = p.constrain(sail.position.x, sail.size, p.width - sail.size);
    sail.position.y = p.constrain(sail.position.y, sail.size, p.height - sail.size);

    // Draw sail
    p.push();
    p.translate(sail.position.x, sail.position.y);
    p.rotate(sail.angle);
    
    p.noStroke();
    p.fill(sail.color);
    p.drawingContext.shadowBlur = 15;
    p.drawingContext.shadowColor = p.color(255, 255, 255, 100);
    
    // Draw sail shape
    p.beginShape();
    p.vertex(-sail.size, 0);
    p.vertex(sail.size, -sail.size * 0.5);
    p.vertex(sail.size, sail.size * 0.5);
    p.endShape(p.CLOSE);
    
    p.drawingContext.shadowBlur = 0;
    p.pop();

    // Draw storm effects during intense phases
    if (stormIntensity > 0.7) {
      p.stroke(100, 100, 120, stormIntensity * 100);
      p.strokeWeight(1);
      for (let i = 0; i < 20; i++) {
        const x = p.random(p.width);
        const y = p.random(p.height);
        const length = p.random(20, 50);
        const angle = p.random(p.TWO_PI);
        p.line(x, y, x + p.cos(angle) * length, y + p.sin(angle) * length);
      }
    }
  };

  p.windowResized = () => {
    const container = document.getElementById('sketch-container');
    if (!container) return;

    p.resizeCanvas(container.clientWidth, container.clientHeight);
    p.setup();
  };
};

new p5(sketch); 