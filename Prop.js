// Draws a still image (no animation frames, no shadow) at a fixed spot on the map.
// Images are cut from the map, so they line up with the map pixels.
class PropSprite {
  constructor(config) {
    this.gameObject = config.gameObject;
    this.offsetX = config.offsetX || 0;
    this.offsetY = config.offsetY || 0;

    //One image per look, e.g. { withered: '...', healthy: '...' }
    this.images = {};
    Object.entries(config.looks).forEach(([look, src]) => {
      const image = new Image();
      image.src = src;
      this.images[look] = image;
    });
    this.look = config.look || Object.keys(config.looks)[0];
  }

  draw(ctx, cameraFocus) {
    const image = this.images[this.look];
    if (!image || !image.complete) return;
    const x = this.gameObject.x + this.offsetX + utils.withGrid(10.5) - cameraFocus.x;
    const y = this.gameObject.y + this.offsetY + utils.withGrid(6) - cameraFocus.y;
    ctx.drawImage(image, x, y);
  }
}

// Objects on the map that change when a task is done: plants and floor items.
class Prop extends GameObject {
  constructor(config) {
    super(config);
    //Floor items lie under the hero when both are on the same tile
    this.sortOffset = config.isFloorItem ? -8 : 0;
    //Blocking props add their own wall when mounted and free it when removed
    this.isBlocking = config.isBlocking || false;
  }

  createSprite(config) {
    return new PropSprite({
      gameObject: this,
      looks: config.looks,
      look: config.look,
      offsetX: config.offsetX,
      offsetY: config.offsetY,
    });
  }

  //No behavior loop, props only change through task events
  mount(map) {
    this.isMounted = true;
    if (this.isBlocking) {
      map.addWall(this.x, this.y);
    }
  }

  setLook(look) {
    this.sprite.look = look;
  }
}
