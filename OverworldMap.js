class OverworldMap {
  constructor(config) {
    this.overword = null;
    this.gameObjects = config.gameObjects;
    this.walls = config.walls || {};
    this.cutSceneSpaces = config.cutSceneSpaces || {};
    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;
    this.isCutscenePlaying = false;
    this.clockIsRunning = Overworld.clockIsRunning;
  }

  drawLowerImage(ctx, cameraFocus) {
    ctx.drawImage(this.lowerImage, utils.withGrid(10.5) - cameraFocus.x, utils.withGrid(6) - cameraFocus.y);
  }

  drawUpperImage(ctx, cameraFocus) {
    ctx.drawImage(this.upperImage, utils.withGrid(10.5) - cameraFocus.x, utils.withGrid(6) - cameraFocus.y);
  }

  isSpaceTaken(currentX, currentY, direction) {
    const { x, y } = utils.nextPosition(currentX, currentY, direction);
    return this.walls[`${x},${y}`] || false;
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach((key) => {
      let obj = this.gameObjects[key];
      obj.id = key;

      obj.mount(this);
    });
  }

  //Play cutscene
  async startCutscene(events) {
    this.isCutscenePlaying = true;
    this.overworld.clockIsRunning = false;
    for (let i = 0; i < events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      });
      await eventHandler.init();
    }

    this.overworld.clockIsRunning = true;
    this.isCutscenePlaying = false;

    //Reset NPCs to their default behavior
    Object.values(this.gameObjects).forEach((object) => object.doBehaviorEvent(this));
  }

  // If hero steps on square with action, this will fire
  checkForFootstepCutscene() {
    const hero = this.gameObjects['hero'];
    const match = this.cutSceneSpaces[`${hero.x},${hero.y}`];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene(match[0].events);
    }
  }

  // interact with other objects
  checkForActionCutscene() {
    const hero = this.gameObjects['hero'];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find((object) => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`;
    });
    if (!this.isCutscenePlaying && match && match.talking.length) {
      this.startCutscene(match.talking[0].events);
    }
  }

  addWall(x, y) {
    this.walls[`${x},${y}`] = true;
  }

  removeWall(x, y) {
    delete this.walls[`${x},${y}`];
  }

  moveWall(wasX, wasY, direction) {
    this.removeWall(wasX, wasY);
    const { x, y } = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x, y);
  }
}

window.OverworldMaps = {
  Home: {
    lowerSrc: './images/maps/mapHome.png',
    upperSrc: './images/maps/mapHome_upper.png',
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(6),
        y: utils.withGrid(7),
      }),
      cat: new Person({
        x: utils.withGrid(22),
        y: utils.withGrid(16),
        src: './images/characters/people/sleepyCat.png',
        behaviorLoop: [
          { type: 'stand', direction: 'down', time: 1800 },
          { type: 'stand', direction: 'down', time: 1300 },
        ],
      }),
    },
    walls: {
      //UP
      [utils.asGridCoord(0, 3)]: true,
      [utils.asGridCoord(1, 3)]: true,
      [utils.asGridCoord(2, 3)]: true,
      [utils.asGridCoord(3, 3)]: true,
      [utils.asGridCoord(4, 3)]: true,
      [utils.asGridCoord(5, 3)]: true,
      [utils.asGridCoord(6, 3)]: true,
      [utils.asGridCoord(7, 3)]: true,
      [utils.asGridCoord(8, 3)]: true,
      [utils.asGridCoord(9, 3)]: true,
      [utils.asGridCoord(10, 3)]: true,
      [utils.asGridCoord(11, 3)]: true,
      [utils.asGridCoord(12, 3)]: true,
      [utils.asGridCoord(13, 3)]: true,
      [utils.asGridCoord(14, 3)]: true,
      [utils.asGridCoord(15, 3)]: true,
      [utils.asGridCoord(16, 3)]: true,
      [utils.asGridCoord(17, 3)]: true,
      [utils.asGridCoord(18, 3)]: true,
      [utils.asGridCoord(19, 3)]: true,
      [utils.asGridCoord(20, 3)]: true,
      [utils.asGridCoord(21, 3)]: true,
      [utils.asGridCoord(22, 3)]: true,
      [utils.asGridCoord(23, 3)]: true,
      [utils.asGridCoord(24, 3)]: true,
      [utils.asGridCoord(25, 3)]: true,

      // Left
      [utils.asGridCoord(0, 4)]: true,
      [utils.asGridCoord(0, 5)]: true,
      [utils.asGridCoord(1, 6)]: true,
      [utils.asGridCoord(1, 7)]: true,
      [utils.asGridCoord(1, 8)]: true,
      [utils.asGridCoord(2, 6)]: true,
      [utils.asGridCoord(2, 7)]: true,
      [utils.asGridCoord(2, 8)]: true,
      [utils.asGridCoord(0, 9)]: true,
      [utils.asGridCoord(0, 10)]: true,
      [utils.asGridCoord(0, 11)]: true,
      [utils.asGridCoord(0, 12)]: true,
      [utils.asGridCoord(1, 13)]: true,
      [utils.asGridCoord(1, 14)]: true,
      [utils.asGridCoord(1, 15)]: true,
      [utils.asGridCoord(1, 16)]: true,
      [utils.asGridCoord(0, 17)]: true,
      [utils.asGridCoord(0, 18)]: true,

      //Down
      [utils.asGridCoord(0, 18)]: true,
      [utils.asGridCoord(1, 18)]: true,
      [utils.asGridCoord(2, 18)]: true,
      [utils.asGridCoord(3, 17)]: true,
      [utils.asGridCoord(4, 17)]: true,
      [utils.asGridCoord(5, 17)]: true,
      [utils.asGridCoord(6, 17)]: true,
      [utils.asGridCoord(7, 17)]: true,
      [utils.asGridCoord(8, 17)]: true,
      [utils.asGridCoord(9, 17)]: true,
      [utils.asGridCoord(10, 17)]: true,
      [utils.asGridCoord(11, 17)]: true,
      [utils.asGridCoord(12, 18)]: true,
      [utils.asGridCoord(13, 17)]: true,
      [utils.asGridCoord(14, 18)]: true,
      [utils.asGridCoord(15, 18)]: true,
      [utils.asGridCoord(16, 18)]: true,
      [utils.asGridCoord(17, 18)]: true,
      [utils.asGridCoord(18, 18)]: true,
      [utils.asGridCoord(19, 18)]: true,
      [utils.asGridCoord(20, 18)]: true,
      [utils.asGridCoord(21, 18)]: true,
      [utils.asGridCoord(22, 18)]: true,
      [utils.asGridCoord(23, 18)]: true,
      [utils.asGridCoord(24, 18)]: true,
      [utils.asGridCoord(25, 18)]: true,

      // Right
      [utils.asGridCoord(25, 4)]: true,
      [utils.asGridCoord(25, 5)]: true,
      [utils.asGridCoord(25, 6)]: true,
      [utils.asGridCoord(25, 7)]: true,
      [utils.asGridCoord(25, 8)]: true,
      [utils.asGridCoord(25, 6)]: true,
      [utils.asGridCoord(25, 7)]: true,
      [utils.asGridCoord(25, 8)]: true,
      [utils.asGridCoord(25, 9)]: true,
      [utils.asGridCoord(25, 10)]: true,
      [utils.asGridCoord(25, 11)]: true,
      [utils.asGridCoord(25, 12)]: true,
      [utils.asGridCoord(25, 13)]: true,
      [utils.asGridCoord(25, 14)]: true,
      [utils.asGridCoord(25, 15)]: true,
      [utils.asGridCoord(25, 16)]: true,
      [utils.asGridCoord(25, 17)]: true,
      [utils.asGridCoord(25, 18)]: true,

      //Blocked Walls Inside
      [utils.asGridCoord(1, 11)]: true,
      [utils.asGridCoord(2, 11)]: true,
      [utils.asGridCoord(3, 11)]: true,
      [utils.asGridCoord(4, 11)]: true,
      [utils.asGridCoord(7, 11)]: true,
      [utils.asGridCoord(8, 11)]: true,
      [utils.asGridCoord(9, 11)]: true,
      [utils.asGridCoord(10, 11)]: true,
      [utils.asGridCoord(11, 11)]: true,
      [utils.asGridCoord(14, 11)]: true,
      [utils.asGridCoord(15, 11)]: true,
      [utils.asGridCoord(16, 11)]: true,
      [utils.asGridCoord(17, 11)]: true,
      [utils.asGridCoord(18, 11)]: true,
      [utils.asGridCoord(19, 11)]: true,
      [utils.asGridCoord(22, 11)]: true,
      [utils.asGridCoord(23, 11)]: true,
      [utils.asGridCoord(24, 11)]: true,

      [utils.asGridCoord(11, 4)]: true,
      [utils.asGridCoord(11, 5)]: true,
      [utils.asGridCoord(11, 8)]: true,
      [utils.asGridCoord(11, 9)]: true,
      [utils.asGridCoord(11, 10)]: true,

      [utils.asGridCoord(15, 12)]: true,
      [utils.asGridCoord(15, 13)]: true,
      [utils.asGridCoord(15, 14)]: true,
      [utils.asGridCoord(15, 17)]: true,

      //Blocked Objects
      [utils.asGridCoord(9, 4)]: true,
      [utils.asGridCoord(10, 4)]: true,

      [utils.asGridCoord(7, 12)]: true, //Kitchen
      [utils.asGridCoord(8, 12)]: true,
      [utils.asGridCoord(9, 12)]: true,
      [utils.asGridCoord(10, 12)]: true,
      [utils.asGridCoord(11, 12)]: true,
      [utils.asGridCoord(14, 12)]: true,

      [utils.asGridCoord(13, 15)]: true,
      [utils.asGridCoord(14, 15)]: true,
      [utils.asGridCoord(13, 16)]: true,
      [utils.asGridCoord(14, 16)]: true,

      [utils.asGridCoord(15, 10)]: true, //Living Room
      [utils.asGridCoord(16, 10)]: true, //TV
      [utils.asGridCoord(17, 10)]: true,
      [utils.asGridCoord(18, 10)]: true,
      [utils.asGridCoord(18, 11)]: true,

      [utils.asGridCoord(15, 7)]: true, //Couch
      [utils.asGridCoord(16, 7)]: true,
      [utils.asGridCoord(17, 7)]: true,
      [utils.asGridCoord(18, 7)]: true,
      [utils.asGridCoord(19, 7)]: true, //Phone

      [utils.asGridCoord(13, 4)]: true, //Shelf
      [utils.asGridCoord(14, 4)]: true,
      [utils.asGridCoord(15, 4)]: true,
      [utils.asGridCoord(16, 4)]: true,

      [utils.asGridCoord(21, 4)]: true, //Lamp
      [utils.asGridCoord(22, 4)]: true, //Table
      [utils.asGridCoord(22, 5)]: true,
      [utils.asGridCoord(23, 5)]: true,
      [utils.asGridCoord(24, 5)]: true,

      [utils.asGridCoord(16, 12)]: true, //Bad
      [utils.asGridCoord(17, 12)]: true,
      [utils.asGridCoord(18, 12)]: true,
      [utils.asGridCoord(16, 13)]: true,
      [utils.asGridCoord(17, 13)]: true,
      [utils.asGridCoord(18, 13)]: true,

      [utils.asGridCoord(16, 15)]: true, // Sink
      [utils.asGridCoord(16, 16)]: true,
      [utils.asGridCoord(24, 16)]: true, //wc

      //Objects that check To-Do
      [utils.asGridCoord(1, 4)]: true, //Book
      [utils.asGridCoord(9, 10)]: true, //Plant
      [utils.asGridCoord(12, 4)]: true, //Plant
      [utils.asGridCoord(16, 14)]: true, //Plant

      [utils.asGridCoord(23, 12)]: true, //laundry
      [utils.asGridCoord(24, 12)]: true, //laundry
    },
    cutSceneSpaces: {
      //tasks

      [utils.asGridCoord(2, 4)]: [
        {
          events: [{ type: 'textMessage', text: 'Cool! You have completed a task!' }, { type: 'readBook' }],
        },
      ],
      [utils.asGridCoord(23, 6)]: [
        {
          events: [{ type: 'textMessage', text: 'Cool! You have completed a task!' }, { type: 'goWork' }],
        },
      ],

      [utils.asGridCoord(24, 13)]: [
        {
          events: [{ type: 'textMessage', text: 'Cool! You have completed a task!' }, { type: 'doLaundry' }],
        },
      ],

      [utils.asGridCoord(14, 7)]: [
        {
          events: [{ type: 'textMessage', text: 'Cool! You have completed a task!' }, { type: 'trashOut' }],
        },
      ],

      [utils.asGridCoord(2, 12)]: [
        {
          events: [{ type: 'textMessage', text: 'Cool! You have completed a task!' }, { type: 'recycleBottle' }],
        },
      ],

      [utils.asGridCoord(9, 9)]: [
        {
          events: [{ type: 'textMessage', text: 'Cool! You have completed a task!' }, { type: 'waterPlantBedroom' }],
        },
      ],
      [utils.asGridCoord(12, 5)]: [
        {
          events: [{ type: 'textMessage', text: 'Cool! You have completed a task!' }, { type: 'waterPlantLivingRoom' }],
        },
      ],

      [utils.asGridCoord(17, 14)]: [
        {
          events: [{ type: 'textMessage', text: 'Cool! You have completed a task!' }, { type: 'waterPlantBath' }],
        },
      ],

      //Procratination Triggers

      [utils.asGridCoord(5, 11)]: [{ events: [{ type: 'textMessage', text: 'Oops.. You just spent some time on instagram!' }] }],
      [utils.asGridCoord(8, 7)]: [
        {
          events: [{ type: 'textMessage', text: 'Zzzzz...You took nap!' }],
        },
      ],
      [utils.asGridCoord(11, 14)]: [
        { events: [{ type: 'textMessage', text: 'Hello! That old friend of yours called you and you spent some time talking' }] },
      ],
      [utils.asGridCoord(17, 8)]: [{ events: [{ type: 'textMessage', text: 'Tetris is cool, right? You spent some time playing it!' }] }],
      [utils.asGridCoord(13, 5)]: [
        { events: [{ type: 'textMessage', text: "Maybe you shouldn't spend some time learning a new dance on tiktiok" }] },
      ],
      [utils.asGridCoord(22, 16)]: [{ events: [{ type: 'textMessage', text: 'Oops.. You just spent some time on instagram!' }] }],
      [utils.asGridCoord(18, 16)]: [{ events: [{ type: 'textMessage', text: 'Zzzzz...You took a nap!' }] }],
      [utils.asGridCoord(3, 15)]: [{ events: [{ type: 'textMessage', text: 'Tetris is cool, right? You spent some time playing it!' }] }],

      [utils.asGridCoord(7, 4)]: [
        {
          events: [
            // { who: 'npc2', type: 'walk', direction: 'left' },
            // { who: 'npc2', type: 'stand', direction: 'up', time: 500 },
            // { type: 'textMessage', text: 'Don't you have stuff to do?' },
            // { who: 'npc2', type: 'walk', direction: 'right' },
            // { who: 'npc2', type: 'stand', direction: 'down', time: 500 },
            // { who: 'hero', type: 'walk', direction: 'down' },
            // { who: 'hero', type: 'walk', direction: 'left' },
          ],
        },
      ],
      // [utils.asGridCoord(5, 10)]: [
      //   {
      //     events: [{ type: 'changeMap', map: 'Kitchen' }],
      //   },
      // ],
    },
  },
};
