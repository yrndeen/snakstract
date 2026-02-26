// Performance Optimization Utilities for Snakstract

class PerformanceOptimizer {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.targetFps = 60;
    this.frameSkip = 1;
    this.objectPool = new Map();
    this.spatialGrid = new Map();
    this.gridSize = 500; // Grid cell size for spatial partitioning
    this.visibleObjects = new Set();
    this.lastOptimization = 0;
    this.optimizationInterval = 1000; // Optimize every second
  }

  // Frame rate management
  shouldSkipFrame() {
    this.frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    if (deltaTime >= 1000) {
      this.fps = this.frameCount / (deltaTime / 1000);
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Adjust frame skip based on performance
      if (this.fps < this.targetFps * 0.8) {
        this.frameSkip = Math.min(this.frameSkip + 1, 3);
      } else if (this.fps > this.targetFps * 0.95) {
        this.frameSkip = Math.max(this.frameSkip - 1, 1);
      }
    }
    
    return this.frameCount % this.frameSkip !== 0;
  }

  // Object pooling for frequently created/destroyed objects
  getFromPool(type, createFn) {
    if (!this.objectPool.has(type)) {
      this.objectPool.set(type, []);
    }
    
    const pool = this.objectPool.get(type);
    if (pool.length > 0) {
      const obj = pool.pop();
      return obj;
    }
    
    return createFn();
  }

  returnToPool(type, obj, resetFn) {
    if (!this.objectPool.has(type)) {
      this.objectPool.set(type, []);
    }
    
    const pool = this.objectPool.get(type);
    if (pool.length < 100) { // Limit pool size
      resetFn(obj);
      pool.push(obj);
    }
  }

  // Spatial partitioning for collision detection optimization
  updateSpatialGrid(objects, getPosition) {
    this.spatialGrid.clear();
    
    for (const obj of objects) {
      const pos = getPosition(obj);
      const gridX = Math.floor(pos.x / this.gridSize);
      const gridY = Math.floor(pos.y / this.gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!this.spatialGrid.has(key)) {
        this.spatialGrid.set(key, []);
      }
      this.spatialGrid.get(key).push(obj);
    }
  }

  // Get nearby objects for collision detection
  getNearbyObjects(x, y, radius) {
    const nearby = [];
    const gridRadius = Math.ceil(radius / this.gridSize);
    const centerGridX = Math.floor(x / this.gridSize);
    const centerGridY = Math.floor(y / this.gridSize);
    
    for (let dx = -gridRadius; dx <= gridRadius; dx++) {
      for (let dy = -gridRadius; dy <= gridRadius; dy++) {
        const key = `${centerGridX + dx},${centerGridY + dy}`;
        const cell = this.spatialGrid.get(key);
        if (cell) {
          nearby.push(...cell);
        }
      }
    }
    
    return nearby;
  }

  // Level of Detail (LOD) system
  calculateLOD(distance, zoom, maxDistance) {
    const baseLOD = Math.max(0, 1 - (distance / maxDistance));
    const zoomLOD = Math.max(0, 1 - (zoom / 5));
    return Math.min(baseLOD, zoomLOD);
  }

  // Batch rendering for similar objects
  batchRender(ctx, objects, renderFn, batchSize = 10) {
    ctx.save();
    
    for (let i = 0; i < objects.length; i += batchSize) {
      const batch = objects.slice(i, i + batchSize);
      
      // Set common properties for the batch
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      
      for (const obj of batch) {
        renderFn(ctx, obj);
      }
    }
    
    ctx.restore();
  }

  // Optimize rendering based on performance
  optimizeRendering(currentTime) {
    if (currentTime - this.lastOptimization < this.optimizationInterval) {
      return;
    }
    
    this.lastOptimization = currentTime;
    
    // Adjust rendering quality based on performance
    if (this.fps < 30) {
      // Low performance - reduce quality
      this.reduceRenderingQuality();
    } else if (this.fps > 55) {
      // Good performance - increase quality
      this.increaseRenderingQuality();
    }
  }

  reduceRenderingQuality() {
    // Reduce visual effects
    this.targetFps = Math.max(this.targetFps - 5, 30);
    this.frameSkip = Math.min(this.frameSkip + 1, 3);
  }

  increaseRenderingQuality() {
    // Increase visual effects
    this.targetFps = Math.min(this.targetFps + 2, 60);
    this.frameSkip = Math.max(this.frameSkip - 1, 1);
  }

  // Memory management
  cleanup() {
    // Clear old objects from pools
    for (const [type, pool] of this.objectPool) {
      if (pool.length > 50) {
        pool.splice(50); // Keep only 50 objects
      }
    }
    
    // Clear spatial grid
    this.spatialGrid.clear();
    this.visibleObjects.clear();
  }

  // Performance monitoring
  getPerformanceStats() {
    return {
      fps: this.fps,
      targetFps: this.targetFps,
      frameSkip: this.frameSkip,
      poolSizes: Object.fromEntries(
        Array.from(this.objectPool.entries()).map(([type, pool]) => [type, pool.length])
      ),
      spatialGridSize: this.spatialGrid.size,
      visibleObjects: this.visibleObjects.size
    };
  }
}

// Specialized optimizers for different game objects
class OrbOptimizer extends PerformanceOptimizer {
  constructor() {
    super();
    this.orbBatches = new Map(); // Batch orbs by type
    this.lastOrbUpdate = 0;
    this.orbUpdateInterval = 50; // Update orbs every 50ms
  }

  shouldUpdateOrbs(currentTime) {
    return currentTime - this.lastOrbUpdate >= this.orbUpdateInterval;
  }

  batchOrbs(orbs) {
    this.orbBatches.clear();
    
    for (const orb of orbs) {
      const type = orb.moving ? 'moving' : 'normal';
      if (!this.orbBatches.has(type)) {
        this.orbBatches.set(type, []);
      }
      this.orbBatches.get(type).push(orb);
    }
  }

  renderOrbBatch(ctx, orbs, renderFn) {
    this.batchRender(ctx, orbs, renderFn, 20);
  }
}

class SnakeOptimizer extends PerformanceOptimizer {
  constructor() {
    super();
    this.segmentCache = new Map(); // Cache rendered segments
    this.lastSegmentUpdate = 0;
    this.segmentUpdateInterval = 100; // Update segments every 100ms
  }

  shouldUpdateSegments(currentTime) {
    return currentTime - this.lastSegmentUpdate >= this.segmentUpdateInterval;
  }

  cacheSegment(segment, zoom, distance) {
    const key = `${segment.x},${segment.y},${zoom},${distance}`;
    if (!this.segmentCache.has(key)) {
      this.segmentCache.set(key, true);
    }
  }

  isSegmentCached(segment, zoom, distance) {
    const key = `${segment.x},${segment.y},${zoom},${distance}`;
    return this.segmentCache.has(key);
  }

  clearSegmentCache() {
    this.segmentCache.clear();
  }
}

export { PerformanceOptimizer, OrbOptimizer, SnakeOptimizer }; 
 