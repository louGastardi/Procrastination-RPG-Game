class Person extends GameObject {
  constructor(config) {
    super(config);
    this.movingProgressRemaining = 0;
    this.isStanding = false;
    // If true all players in room will move to keyboard
    this.isPlayerControlled = config.isPlayerControlled || false;

    this.directionUpdate = {
      up: ['y', -1],
      down: ['y', 1],
      left: ['x', -1],
      right: ['x', 1],
    };
  }

  update(state) {
    if (this.movingProgressRemaining > 0) {
      this.updatePosition();
    } else {
      // Walk command when arrow pressed
      if (!state.map.isCutscenePlaying && this.isPlayerControlled && state.arrow) {
        this.startBehavior(state, {
          type: 'walk',
          direction: state.arrow,
        });
      }
      this.updateSprite(state);
    }
  }

  startBehavior(state, behavior) {
    //set character direction to same dirction behavior has
    this.direction = behavior.direction;

    //block character from walking into object
    if (behavior.type === 'walk') {
      if (state.map.isSpaceTaken(this.x, this.y, this.direction)) {
        //Only scripted walks retry. A retry loop for the hero would keep
        //overwriting its direction mid-step and push it off the 16px grid,
        //which breaks wall collisions and task tiles.
        behavior.retry &&
          setTimeout(() => {
            this.startBehavior(state, behavior);
          }, 50);
        return;
      }

      //Make character a moving "wall"- block its next position
      state.map.moveWall(this.x, this.y, this.direction);

      //Walk command
      this.movingProgressRemaining = 16;
      this.updateSprite(state);
    }

    if (behavior.type === 'stand') {
      this.isStanding = true;
      setTimeout(() => {
        utils.emitEvent('PersonStandComplete', {
          whoId: this.id,
        });
        this.isStanding = false;
      }, behavior.time);
    }
  }

  updatePosition() {
    const [property, change] = this.directionUpdate[this.direction];
    this[property] += change;
    this.movingProgressRemaining -= 1;

    if (this.movingProgressRemaining === 0) {
      utils.emitEvent('PersonWalkingComplete', {
        whoId: this.id,
      });
    }
  }

  updateSprite() {
    if (this.movingProgressRemaining > 0) {
      this.sprite.setAnimation('walk-' + this.direction);
      return;
    }
    this.sprite.setAnimation('idle-' + this.direction);
  }
}
