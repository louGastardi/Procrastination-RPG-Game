class Overworld {
  constructor(config) {
    //Element for the game to operate on - Game container
    this.element = config.element;
    this.canvas = this.element.querySelector('.game-canvas');

    //Called with 'win' or 'midnight' once the end transition is done
    this.onEnd = config.onEnd || (() => {});

    //Draw on Canvas
    this.ctx = this.canvas.getContext('2d');
    this.map = null;
    //Clock
    this.hoursAndMinutes = ``;
    this.hours = 8;
    this.minutes = 0;
    this.clockIsRunning = true;

    //Check Game Over
    this.liElements = document.querySelectorAll('.todo-list li');
    this.isEnding = false;
    this.isDestroyed = false;
    this.transition = null;
  }

  start() {
    this.startMap(window.OverworldMaps.Home());
    this.bindActionInput();
    this.bindHeroPositionCheck();
    this.directionInput = new DirectionInput();
    this.directionInput.start();

    this.startGameLoop();

    // PLAY CUTSCENE
    this.map.startCutscene([
      { type: 'textMessage', text: "it looks like it's going to be a long day full of tasks..." },
      { type: 'textMessage', text: "Don't waste time procrastinating and get everything done before midnight!" },
    ]);
  }
  clock() {
    const leadingZero = (n) => (n > 9 ? n : `0${n}`);
    this.minutes++;
    if (this.minutes === 60) {
      this.minutes = 0;
      this.hours++;
    }

    this.hoursAndMinutes = `${leadingZero(this.hours)}:${leadingZero(this.minutes)}`;
    document.querySelector('#clock').innerHTML = this.hoursAndMinutes;

    if (this.hours >= 24) {
      this.endGame('midnight');
    }
  }

  startGameLoop() {
    this.clockInterval = setInterval(() => {
      //Clock pauses while a cutscene (text message) is on screen
      if (this.clockIsRunning) {
        this.clock();
      }
    }, 1000 / 15);

    const frame = () => {
      if (this.isDestroyed) return;

      //Clear off Canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      //Establish the camera focus
      const cameraFocus = this.map.gameObjects.hero;

      //Update animation before drawing, to prevent glitches
      Object.values(this.map.gameObjects).forEach((object) => {
        object.update({
          arrow: this.directionInput.direction,
          map: this.map,
        });
      });

      // Draw lower layer
      this.map.drawLowerImage(this.ctx, cameraFocus);

      //Draw gameObjects
      Object.values(this.map.gameObjects)
        .sort((a, b) => {
          return a.y + a.sortOffset - (b.y + b.sortOffset);
        })
        .forEach((object) => {
          object.sprite.draw(this.ctx, cameraFocus);
        });

      //Draw upper layer
      this.map.drawUpperImage(this.ctx, cameraFocus);

      this.drawTransition();
      this.isGameOver();

      this.frameRequest = requestAnimationFrame(frame);
    };

    frame();
  }

  // Restored: these were removed in the "cleanup" commit but start() still calls them
  bindActionInput() {
    this.actionListener = new KeyPressListener('Space', () => {
      // Is there a person here to talk to?
      this.map.checkForActionCutscene();
    });
  }

  bindHeroPositionCheck() {
    this.heroPositionHandler = (e) => {
      if (e.detail.whoId === 'hero') {
        //Hero's position has changed
        this.map.checkForFootstepCutscene();
      }
    };
    document.addEventListener('PersonWalkingComplete', this.heroPositionHandler);
  }

  startMap(mapConfig) {
    this.map = new OverworldMap(mapConfig);
    this.map.overworld = this;
    this.map.mountObjects();
  }

  isGameOver() {
    if (this.isEnding) return;
    const allDone = Array.from(this.liElements).every((li) => li.classList.contains('addCheck'));
    if (allDone) {
      this.endGame('win');
    }
  }

  //Freeze the game, play a jingle and cover the screen with black pixels,
  //then hand over to the end screen
  endGame(result) {
    if (this.isEnding) return;
    this.isEnding = true;

    //Stop the clock when the game ends
    clearInterval(this.clockInterval);
    //The hero stops walking during the transition
    this.map.isCutscenePlaying = true;

    Sound.stopMusic();
    if (result === 'win') {
      Sound.victory();
    } else {
      Sound.midnight();
    }

    //8px blocks in a random order
    const size = 8;
    const blocks = [];
    for (let y = 0; y < this.canvas.height; y += size) {
      for (let x = 0; x < this.canvas.width; x += size) {
        blocks.push([x, y]);
      }
    }
    for (let i = blocks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    }
    this.transition = { start: performance.now(), duration: 1200, size, blocks };

    //Short black pause after the wipe, then show the end screen
    this.endTimeout = setTimeout(() => {
      this.stopLoop();
      this.onEnd(result);
    }, this.transition.duration + 400);
  }

  drawTransition() {
    if (!this.transition) return;
    const { start, duration, size, blocks } = this.transition;
    const progress = Math.min(1, (performance.now() - start) / duration);
    const count = Math.ceil(blocks.length * progress);
    this.ctx.fillStyle = '#000';
    for (let i = 0; i < count; i++) {
      this.ctx.fillRect(blocks[i][0], blocks[i][1], size, size);
    }
  }

  stopLoop() {
    cancelAnimationFrame(this.frameRequest);
    this.isDestroyed = true;
  }

  //Remove every timer, loop and listener of this game so a new one can start clean
  destroy() {
    this.stopLoop();
    clearInterval(this.clockInterval);
    clearTimeout(this.endTimeout);
    this.directionInput && this.directionInput.stop();
    this.actionListener && this.actionListener.unbind();
    document.removeEventListener('PersonWalkingComplete', this.heroPositionHandler);
    TextMessage.closeAll();
    this.map && this.map.destroy();
  }
}
