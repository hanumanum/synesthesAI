import p5 from 'p5';

interface Particle {
  pos: p5.Vector;
  vel: p5.Vector;
  acc: p5.Vector;
  color: p5.Color;
  size: number;
  path: p5.Vector[];
  maxPathLength: number;
  isActive: boolean;
  targetPath: number; // 0 for left path, 1 for right path
  age: number;
  maxAge: number;
}

class RoadVisualization {
  private p: p5;
  private particles: Particle[] = [];
  private numParticles = 150;
  private paths: p5.Vector[][] = [];
  private mousePos: p5.Vector;
  private interactionRadius = 150;
  private currentStanza = 0;
  private lastStanzaChange = 0;
  private stanzaDuration = 12000; // 12 seconds per stanza
  private leafParticles: Particle[] = [];
  private numLeafParticles = 50;
  private yellowWood: p5.Color;
  private autumnColors: p5.Color[];

  constructor(p: p5) {
    this.p = p;
    this.mousePos = p.createVector(0, 0);
    this.yellowWood = p.color(255, 200, 50);
    this.autumnColors = [
      p.color(255, 200, 50),  // Yellow
      p.color(255, 150, 0),   // Orange
      p.color(200, 100, 0),   // Brown
      p.color(255, 100, 50)   // Red-orange
    ];
    this.initializePaths();
    this.initializeLeafParticles();
  }

  private initializePaths() {
    // Create two diverging paths
    const startX = this.p.width * 0.2;
    const startY = this.p.height * 0.5;
    const divergenceX = this.p.width * 0.4;
    const endX = this.p.width * 0.8;

    // Create curved paths using bezier points
    // Left path
    this.paths[0] = [
      this.p.createVector(startX, startY),
      this.p.createVector(divergenceX, startY),
      this.p.createVector(divergenceX + (endX - divergenceX) * 0.5, this.p.height * 0.35),
      this.p.createVector(endX, this.p.height * 0.3)
    ];

    // Right path
    this.paths[1] = [
      this.p.createVector(startX, startY),
      this.p.createVector(divergenceX, startY),
      this.p.createVector(divergenceX + (endX - divergenceX) * 0.5, this.p.height * 0.65),
      this.p.createVector(endX, this.p.height * 0.7)
    ];

    // Create particles
    for (let i = 0; i < this.numParticles; i++) {
      this.createParticle();
    }
  }

  private initializeLeafParticles() {
    for (let i = 0; i < this.numLeafParticles; i++) {
      this.createLeafParticle();
    }
  }

  private createLeafParticle() {
    const x = this.p.random(this.p.width * 0.3, this.p.width * 0.7);
    const y = this.p.random(this.p.height * 0.2, this.p.height * 0.8);
    
    const particle: Particle = {
      pos: this.p.createVector(x, y),
      vel: this.p.createVector(this.p.random(-0.5, 0.5), this.p.random(-0.5, 0.5)),
      acc: this.p.createVector(0, 0),
      color: this.p.random(this.autumnColors),
      size: this.p.random(3, 6),
      path: [],
      maxPathLength: 20,
      isActive: true,
      targetPath: 0,
      age: 0,
      maxAge: this.p.random(200, 400)
    };

    this.leafParticles.push(particle);
  }

  private createParticle() {
    const startPos = this.p.createVector(
      this.p.width * 0.2,
      this.p.height * 0.5 + this.p.random(-20, 20)
    );

    const particle: Particle = {
      pos: startPos.copy(),
      vel: this.p.createVector(this.p.random(0.5, 1.5), 0),
      acc: this.p.createVector(0, 0),
      color: this.p.color(255, 200, 50, 150),
      size: this.p.random(2, 4),
      path: [startPos.copy()],
      maxPathLength: 50,
      isActive: true,
      targetPath: this.p.random() < 0.5 ? 0 : 1,
      age: 0,
      maxAge: this.p.random(300, 500)
    };

    this.particles.push(particle);
  }

  private updateParticles() {
    const currentTime = this.p.millis();
    if (currentTime - this.lastStanzaChange > this.stanzaDuration) {
      this.currentStanza = (this.currentStanza + 1) % 4;
      this.lastStanzaChange = currentTime;
      this.resetParticles();
    }

    // Update main particles
    for (let particle of this.particles) {
      if (!particle.isActive) continue;

      particle.age++;
      if (particle.age > particle.maxAge) {
        particle.isActive = false;
        this.createParticle();
        continue;
      }

      // Calculate distance to mouse
      const d = this.p.dist(
        particle.pos.x,
        particle.pos.y,
        this.mousePos.x,
        this.mousePos.y
      );

      // Apply mouse interaction
      if (d < this.interactionRadius) {
        const force = this.p.createVector(
          particle.pos.x - this.mousePos.x,
          particle.pos.y - this.mousePos.y
        );
        force.normalize();
        force.mult(0.5);
        particle.acc.add(force);
      }

      // Follow the chosen path using bezier curves
      const targetPath = this.paths[particle.targetPath];
      const t = this.getPathProgress(particle.pos, targetPath);
      if (t !== null) {
        const nextT = Math.min(t + 0.01, 1);
        const currentPoint = this.getBezierPoint(targetPath, t);
        const nextPoint = this.getBezierPoint(targetPath, nextT);
        const desired = p5.Vector.sub(nextPoint, currentPoint);
        desired.normalize();
        desired.mult(0.5);
        particle.acc.add(desired);
      }

      // Update physics
      particle.vel.add(particle.acc);
      particle.vel.limit(3);
      particle.pos.add(particle.vel);
      particle.acc.mult(0);

      // Update path
      particle.path.push(particle.pos.copy());
      if (particle.path.length > particle.maxPathLength) {
        particle.path.shift();
      }

      // Check if particle has reached the end
      if (particle.pos.x > this.p.width * 0.9) {
        particle.isActive = false;
        this.createParticle();
      }
    }

    // Update leaf particles
    for (let particle of this.leafParticles) {
      if (!particle.isActive) continue;

      particle.age++;
      if (particle.age > particle.maxAge) {
        particle.isActive = false;
        this.createLeafParticle();
        continue;
      }

      // Add some random movement
      particle.acc.add(this.p.createVector(
        this.p.random(-0.1, 0.1),
        this.p.random(-0.1, 0.1)
      ));

      // Add slight gravity
      particle.acc.y += 0.05;

      // Update physics
      particle.vel.add(particle.acc);
      particle.vel.limit(2);
      particle.pos.add(particle.vel);
      particle.acc.mult(0);

      // Bounce off edges
      if (particle.pos.x < 0 || particle.pos.x > this.p.width) {
        particle.vel.x *= -0.8;
      }
      if (particle.pos.y < 0 || particle.pos.y > this.p.height) {
        particle.vel.y *= -0.8;
      }

      // Update path
      particle.path.push(particle.pos.copy());
      if (particle.path.length > particle.maxPathLength) {
        particle.path.shift();
      }
    }
  }

  private getPathProgress(pos: p5.Vector, path: p5.Vector[]): number | null {
    let minDist = Infinity;
    let progress = null;

    for (let t = 0; t <= 1; t += 0.01) {
      const point = this.getBezierPoint(path, t);
      const d = this.p.dist(pos.x, pos.y, point.x, point.y);
      if (d < minDist) {
        minDist = d;
        progress = t;
      }
    }

    return progress;
  }

  private getBezierPoint(points: p5.Vector[], t: number): p5.Vector {
    if (points.length === 4) {
      return this.p.createVector(
        this.p.bezierPoint(points[0].x, points[1].x, points[2].x, points[3].x, t),
        this.p.bezierPoint(points[0].y, points[1].y, points[2].y, points[3].y, t)
      );
    }
    return points[0];
  }

  private resetParticles() {
    for (let particle of this.particles) {
      particle.pos = this.p.createVector(
        this.p.width * 0.2,
        this.p.height * 0.5 + this.p.random(-20, 20)
      );
      particle.vel = this.p.createVector(this.p.random(0.5, 1.5), 0);
      particle.acc = this.p.createVector(0, 0);
      particle.path = [particle.pos.copy()];
      particle.isActive = true;
      particle.targetPath = this.p.random() < 0.5 ? 0 : 1;
      particle.age = 0;
    }
  }

  private drawPaths() {
    this.p.stroke(255, 100);
    this.p.strokeWeight(2);
    this.p.noFill();

    for (let path of this.paths) {
      this.p.beginShape();
      this.p.bezier(
        path[0].x, path[0].y,
        path[1].x, path[1].y,
        path[2].x, path[2].y,
        path[3].x, path[3].y
      );
      this.p.endShape();
    }
  }

  private drawParticles() {
    // Draw main particles
    for (let particle of this.particles) {
      if (!particle.isActive) continue;

      // Draw particle path
      this.p.noFill();
      this.p.stroke(particle.color);
      this.p.strokeWeight(particle.size * 0.5);
      this.p.beginShape();
      for (let point of particle.path) {
        this.p.vertex(point.x, point.y);
      }
      this.p.endShape();

      // Draw particle
      this.p.noStroke();
      this.p.fill(particle.color);
      this.p.circle(particle.pos.x, particle.pos.y, particle.size);
    }

    // Draw leaf particles
    for (let particle of this.leafParticles) {
      if (!particle.isActive) continue;

      this.p.noStroke();
      this.p.fill(particle.color);
      this.p.push();
      this.p.translate(particle.pos.x, particle.pos.y);
      this.p.rotate(particle.vel.heading());
      this.p.beginShape();
      this.p.vertex(0, -particle.size);
      this.p.vertex(particle.size, 0);
      this.p.vertex(0, particle.size);
      this.p.vertex(-particle.size, 0);
      this.p.endShape(this.p.CLOSE);
      this.p.pop();
    }
  }

  public draw() {
    this.p.background(20, 20, 30);
    
    // Draw yellow wood background
    this.p.noStroke();
    for (let i = 0; i < 100; i++) {
      const x = this.p.random(this.p.width);
      const y = this.p.random(this.p.height);
      const size = this.p.random(20, 40);
      this.p.fill(this.yellowWood);
      this.p.circle(x, y, size);
    }

    this.drawPaths();
    this.updateParticles();
    this.drawParticles();
  }

  public mouseMoved(x: number, y: number) {
    this.mousePos.set(x, y);
  }
}

export default function sketch(p: p5) {
  let visualization: RoadVisualization;

  p.setup = () => {
    const container = document.getElementById('sketch-container');
    if (!container) {
      console.error('Sketch container not found');
      return;
    }

    const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
    canvas.parent('sketch-container');
    visualization = new RoadVisualization(p);
  };

  p.draw = () => {
    visualization.draw();
  };

  p.mouseMoved = () => {
    visualization.mouseMoved(p.mouseX, p.mouseY);
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
    visualization = new RoadVisualization(p);
  };
} 

new p5(sketch);