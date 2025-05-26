// Application settings
const NETWORK_SETTINGS = {
  particleCount: 100,
  connectionThreshold: 100, // Maximum distance for particle connections
  particleRadius: 5,
  particleSpeed: 2,
  backgroundColor: 0,
  particleColor: 200, // Gray
  
  // Cursor interaction settings
  cursorInfluenceRadius: 100,  
  cursorRepulsionStrength: 2,  
  cursorHighlightColor: 255,   
  
  // Splice settings
  maxParticles: 200,           
  particleLifespan: 300,       
  spawnParticleCount: 5,       
  newParticleColor: 150,       
  
  // Collision settings
  collisionEnabled: true,      
  collisionElasticity: 0.8,   
  collisionDistance: 10,       
  collisionHighlightDuration: 15, 
  collisionHighlightColor: 230 
};

// Main application class
class ParticleConnectionSystem {
  constructor() {
    this.particles = [];
    this.canvas = null;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.mousePosition = { x: 0, y: 0 };
    this.mouseIsActive = false;
  }

  initialize() {
    // Create canvas with window dimensions
    this.canvasWidth = windowWidth;
    this.canvasHeight = windowHeight;
    this.canvas = createCanvas(this.canvasWidth, this.canvasHeight);
    background(NETWORK_SETTINGS.backgroundColor);
    
    // Create particles based on screen size
    this.createParticles();
  }

  // Create particles with positions relative to canvas size
  createParticles() {
    // Scale particle count based on screen area for consistent density
    const scaleFactor = (this.canvasWidth * this.canvasHeight) / (1000 * 1000);
    const adjustedParticleCount = Math.floor(NETWORK_SETTINGS.particleCount * scaleFactor);
    
    this.particles = Array.from({ length: adjustedParticleCount }, () => 
      new Particle(
        random(this.canvasWidth),
        random(this.canvasHeight),
        random(-NETWORK_SETTINGS.particleSpeed, NETWORK_SETTINGS.particleSpeed),
        random(-NETWORK_SETTINGS.particleSpeed, NETWORK_SETTINGS.particleSpeed)
      )
    );
  }

  // Add a new particle at the specified position
  addParticle(x, y, isFromClick = false) {
    // Only add if below maximum
    if (this.particles.length < NETWORK_SETTINGS.maxParticles) {
      // Create velocity - more random if spawned from click
      const speedMultiplier = isFromClick ? 1.5 : 1;
      const newVelocityX = random(-NETWORK_SETTINGS.particleSpeed, NETWORK_SETTINGS.particleSpeed) * speedMultiplier;
      const newVelocityY = random(-NETWORK_SETTINGS.particleSpeed, NETWORK_SETTINGS.particleSpeed) * speedMultiplier;
      
      // Create the new particle
      const newParticle = new Particle(
        x || random(this.canvasWidth),
        y || random(this.canvasHeight),
        newVelocityX,
        newVelocityY
      );
      
      // Set special properties for particles created by click
      if (isFromClick) {
        newParticle.currentColor = NETWORK_SETTINGS.newParticleColor;
        newParticle.lifespan = NETWORK_SETTINGS.particleLifespan;
        
        // Transition color back to normal over time
        newParticle.transitionToOriginalColor = true;
      }
      
      // Add to array
      this.particles.push(newParticle);
      return newParticle;
    }
    return null;
  }

  // Remove a particle at the specified index
  removeParticle(index) {
    if (index >= 0 && index < this.particles.length) {
      this.particles.splice(index, 1);
    }
  }

  // Handle mouse click to spawn new particles
  handleMouseClick(x, y) {
    // Spawn new particles
    for (let i = 0; i < NETWORK_SETTINGS.spawnParticleCount; i++) {
      // Add some randomness to position
      const offsetX = random(-10, 10);
      const offsetY = random(-10, 10);
      this.addParticle(x + offsetX, y + offsetY, true);
    }
  }

  // Handle particle-to-particle collisions
  handleParticleCollisions() {
    if (!NETWORK_SETTINGS.collisionEnabled) return;
    
    // Check each pair of particles for collisions
    for (let i = 0; i < this.particles.length; i++) {
      const particleA = this.particles[i];
      
      for (let j = i + 1; j < this.particles.length; j++) {
        const particleB = this.particles[j];
        
        // Calculate distance between particles
        const dx = particleB.positionX - particleA.positionX;
        const dy = particleB.positionY - particleA.positionY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if particles are colliding
        if (distance < NETWORK_SETTINGS.collisionDistance) {
          // Calculate collision normal
          const nx = dx / distance;
          const ny = dy / distance;
          
          // Calculate relative velocity
          const vx = particleB.velocityX - particleA.velocityX;
          const vy = particleB.velocityY - particleA.velocityY;
          
          // Calculate relative velocity in terms of the normal direction
          const velocityAlongNormal = vx * nx + vy * ny;
          
          // Do not resolve if velocities are separating
          if (velocityAlongNormal > 0) continue;
          
          // Calculate restitution (bounciness)
          const restitution = NETWORK_SETTINGS.collisionElasticity;
          
          // Calculate impulse scalar
          let impulseScalar = -(1 + restitution) * velocityAlongNormal;
          impulseScalar /= 2; // Assuming equal mass for all particles
          
          // Apply impulse
          const impulseX = impulseScalar * nx;
          const impulseY = impulseScalar * ny;
          
          particleA.velocityX -= impulseX;
          particleA.velocityY -= impulseY;
          particleB.velocityX += impulseX;
          particleB.velocityY += impulseY;
          
          // Move particles apart to prevent sticking
          const overlap = NETWORK_SETTINGS.collisionDistance - distance;
          const correctionX = nx * overlap * 0.5;
          const correctionY = ny * overlap * 0.5;
          
          particleA.positionX -= correctionX;
          particleA.positionY -= correctionY;
          particleB.positionX += correctionX;
          particleB.positionY += correctionY;
          
          // Visual feedback for collision
          particleA.collisionTimer = NETWORK_SETTINGS.collisionHighlightDuration;
          particleB.collisionTimer = NETWORK_SETTINGS.collisionHighlightDuration;
        }
      }
    }
  }

  // Handle window resize
  handleResize(newWidth, newHeight) {
    this.canvasWidth = newWidth;
    this.canvasHeight = newHeight;
    resizeCanvas(this.canvasWidth, this.canvasHeight);
    
    // Reposition existing particles to stay within new boundaries
    this.particles.forEach(particle => {
      // Keep particles within new canvas bounds
      particle.positionX = constrain(particle.positionX, 0, this.canvasWidth);
      particle.positionY = constrain(particle.positionY, 0, this.canvasHeight);
    });
  }

  // Update mouse position
  updateMousePosition(x, y, isActive) {
    this.mousePosition.x = x;
    this.mousePosition.y = y;
    this.mouseIsActive = isActive;
  }

  // Manage particle lifecycle (aging, removal)
  manageParticleLifecycle() {
    // Remove particles that have expired
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update lifespan if particle has one
      if (particle.lifespan !== undefined) {
        particle.lifespan--;
        
        // Handle color transition
        if (particle.transitionToOriginalColor) {
          const progress = 1 - (particle.lifespan / NETWORK_SETTINGS.particleLifespan);
          
          // Interpolate between new particle color and original color
          particle.currentColor = lerp(
            NETWORK_SETTINGS.newParticleColor, 
            NETWORK_SETTINGS.particleColor, 
            progress
          );
        }
        
        // Remove if lifespan is over
        if (particle.lifespan <= 0) {
          this.removeParticle(i);
        }
      }
      
      // Update collision timer
      if (particle.collisionTimer > 0) {
        particle.collisionTimer--;
      }
    }
  }

  render() {
    background(NETWORK_SETTINGS.backgroundColor);
    
    // Manage particle lifecycle
    this.manageParticleLifecycle();
    
    // Handle particle collisions
    this.handleParticleCollisions();
    
    // Update and render each particle
    this.particles.forEach(particle => {
      // Apply cursor interaction if mouse is on canvas
      if (this.mouseIsActive) {
        particle.respondToCursor(
          this.mousePosition.x, 
          this.mousePosition.y, 
          NETWORK_SETTINGS.cursorInfluenceRadius,
          NETWORK_SETTINGS.cursorRepulsionStrength
        );
      }
      
      particle.updatePosition(this.canvasWidth, this.canvasHeight);
      particle.render();
    });
    
    // Create connections between nearby particles
    this.createParticleConnections();
    
    // Visualize cursor influence area when mouse is on canvas
    if (this.mouseIsActive) {
      this.visualizeCursorInfluence();
    }
    
    // Display particle count
    this.displayParticleCount();
  }

  // Display the current particle count
  displayParticleCount() {
    fill(180);
    noStroke();
    textSize(14);
    textAlign(LEFT, TOP);
    text(`Particles: ${this.particles.length}/${NETWORK_SETTINGS.maxParticles}`, 10, 10);
  }

  // Visualize the cursor's area of influence
  visualizeCursorInfluence() {
    noFill();
    stroke(100, 50); // Dark gray with low opacity
    strokeWeight(1);
    circle(
      this.mousePosition.x, 
      this.mousePosition.y, 
      NETWORK_SETTINGS.cursorInfluenceRadius * 2
    );
  }

  createParticleConnections() {
    // Scale connection threshold based on screen size
    const scaledThreshold = NETWORK_SETTINGS.connectionThreshold * 
      Math.min(this.canvasWidth, this.canvasHeight) / 500;
    
    for (let i = 0; i < this.particles.length; i++) {
      const currentParticle = this.particles[i];
      
      for (let j = i + 1; j < this.particles.length; j++) {
        const targetParticle = this.particles[j];
        const distanceBetweenParticles = dist(
          currentParticle.positionX, 
          currentParticle.positionY, 
          targetParticle.positionX, 
          targetParticle.positionY
        );
        
        if (distanceBetweenParticles < scaledThreshold) {
          // Connection opacity decreases with distance
          const connectionOpacity = map(
            distanceBetweenParticles, 
            0, 
            scaledThreshold, 
            180, 
            50
          );
          stroke(150, connectionOpacity); // Medium gray with variable opacity
          strokeWeight(1);
          line(
            currentParticle.positionX, 
            currentParticle.positionY, 
            targetParticle.positionX, 
            targetParticle.positionY
          );
        }
      }
    }
  }
}

// Individual particle class
class Particle {
  constructor(positionX, positionY, velocityX, velocityY) {
    this.positionX = positionX;
    this.positionY = positionY;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.originalColor = NETWORK_SETTINGS.particleColor;
    this.currentColor = this.originalColor;
    this.isAffectedByCursor = false;
    this.cursorInfluenceTimer = 0;
    this.particleSize = NETWORK_SETTINGS.particleRadius;
    this.collisionTimer = 0; // Timer for collision highlight
    
    // Optional properties
    this.lifespan = undefined; // Will be set for particles with limited life
    this.transitionToOriginalColor = false;
  }

  // Respond to cursor proximity
  respondToCursor(cursorX, cursorY, influenceRadius, repulsionStrength) {
    const distanceToCursor = dist(
      this.positionX, 
      this.positionY, 
      cursorX, 
      cursorY
    );
    
    // Check if particle is within cursor influence radius
    if (distanceToCursor < influenceRadius) {
      // Calculate repulsion direction (away from cursor)
      const repulsionAngle = atan2(
        this.positionY - cursorY,
        this.positionX - cursorX
      );
      
      // Calculate repulsion force (stronger when closer)
      const repulsionForce = map(
        distanceToCursor,
        0,
        influenceRadius,
        repulsionStrength,
        0
      );
      
      // Apply repulsion force to velocity
      this.velocityX += cos(repulsionAngle) * repulsionForce;
      this.velocityY += sin(repulsionAngle) * repulsionForce;
      
      // Limit maximum velocity to prevent extreme acceleration
      const maxVelocity = NETWORK_SETTINGS.particleSpeed * 2;
      const currentSpeed = sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
      
      if (currentSpeed > maxVelocity) {
        this.velocityX = (this.velocityX / currentSpeed) * maxVelocity;
        this.velocityY = (this.velocityY / currentSpeed) * maxVelocity;
      }
      
      // Mark particle as affected by cursor for visual effect
      this.isAffectedByCursor = true;
      this.cursorInfluenceTimer = 10; // Effect lasts for 10 frames
      
      // Change color to highlight cursor influence
      if (!this.transitionToOriginalColor && this.collisionTimer <= 0) { 
        // Don't override transitioning or colliding particles
        this.currentColor = NETWORK_SETTINGS.cursorHighlightColor;
      }
    } else if (this.cursorInfluenceTimer > 0) {
      // Gradually fade back to original color
      this.cursorInfluenceTimer--;
      if (this.cursorInfluenceTimer === 0 && !this.transitionToOriginalColor && this.collisionTimer <= 0) {
        this.isAffectedByCursor = false;
        this.currentColor = this.originalColor;
      }
    }
  }

  // Update particle position and handle canvas boundaries
  updatePosition(canvasWidth, canvasHeight) {
    this.positionX += this.velocityX;
    this.positionY += this.velocityY;

    this.handleBoundaryCollisions(canvasWidth, canvasHeight);
    
    // Gradually slow down particles that were affected by cursor
    if (!this.isAffectedByCursor && this.cursorInfluenceTimer === 0) {
      const slowdownFactor = 0.98;
      const baseSpeed = NETWORK_SETTINGS.particleSpeed;
      const currentSpeed = sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
      
      if (currentSpeed > baseSpeed) {
        this.velocityX *= slowdownFactor;
        this.velocityY *= slowdownFactor;
      }
    }
  }

  handleBoundaryCollisions(canvasWidth, canvasHeight) {
    // Left boundary
    if (this.positionX < 0) {
      this.positionX = 0;
      this.velocityX *= -1;
    } 
    // Right boundary
    else if (this.positionX > canvasWidth) {
      this.positionX = canvasWidth;
      this.velocityX *= -1;
    }

    // Top boundary
    if (this.positionY < 0) {
      this.positionY = 0;
      this.velocityY *= -1;
    } 
    // Bottom boundary
    else if (this.positionY > canvasHeight) {
      this.positionY = canvasHeight;
      this.velocityY *= -1;
    }
  }

  // Render the particle on canvas
  render() {
    noStroke();
    
    // Determine particle color based on state
    let displayColor;
    
    if (this.collisionTimer > 0) {
      // Collision highlight takes precedence
      displayColor = NETWORK_SETTINGS.collisionHighlightColor;
    } else if (this.transitionToOriginalColor) {
      // Color transition for new particles
      displayColor = this.currentColor;
    } else if (this.isAffectedByCursor) {
      // Cursor influence highlight
      displayColor = NETWORK_SETTINGS.cursorHighlightColor;
    } else {
      // Default color
      displayColor = this.originalColor;
    }
    
    // Apply the determined color
    fill(displayColor);
    
    // Make affected particles slightly larger
    let size = this.particleSize;
    
    if (this.isAffectedByCursor) {
      size *= 1.5;
    } else if (this.collisionTimer > 0) {
      // Make colliding particles slightly larger
      size *= 1.3;
    }
      
    ellipse(this.positionX, this.positionY, size);
  }
}

// Create the particle system
const particleSystem = new ParticleConnectionSystem();

// p5.js setup function
function setup() {
  particleSystem.initialize();
}

// p5.js draw function
function draw() {
  particleSystem.render();
  
  // Update mouse position in particle system
  particleSystem.updateMousePosition(
    mouseX, 
    mouseY, 
    mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height
  );
}

// p5.js mousePressed function - handle mouse clicks
function mousePressed() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    // Only handle left-click (mouseButton === LEFT)
    if (mouseButton === LEFT) {
      particleSystem.handleMouseClick(mouseX, mouseY);
    }
    return false; // Prevent default behavior
  }
}

// p5.js windowResized function - called when window is resized
function windowResized() {
  particleSystem.handleResize(windowWidth, windowHeight);
}
