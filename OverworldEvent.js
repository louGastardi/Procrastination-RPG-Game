class OverworldEvent {
  constructor({ map, event, element }) {
    this.map = map;
    this.event = event;
    this.element = element;

    // get HTML elements
    this.plantBath = document.querySelector('#plant-bath');
    this.plantLivingRoom = document.querySelector('#plant-livingRoom');
    this.plantBedroom = document.querySelector('#plant-bedroom');
    this.bottle = document.querySelector('#bottle');
    this.trash = document.querySelector('#trash');
    this.work = document.querySelector('#work');
    this.laundry = document.querySelector('#laundry');
    this.book = document.querySelector('#book');
  }

  stand(resolve) {
    const who = this.map.gameObjects[this.event.who];
    who.startBehavior(
      {
        map: this.map,
      },
      {
        type: 'stand',
        direction: this.event.direction,
        time: this.event.time,
      }
    );

    //Set up a handler to complete when correct person is done walking, then resolve the event
    const completeHandler = (e) => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener('PersonStandComplete', completeHandler);
        resolve();
      }
    };
    document.addEventListener('PersonStandComplete', completeHandler);
  }

  walk(resolve) {
    const who = this.map.gameObjects[this.event.who];
    who.startBehavior(
      {
        map: this.map,
      },
      {
        type: 'walk',
        direction: this.event.direction,
        retry: true,
      }
    );

    //Set up a handler to complete when correct person is done walking, then resolve the event
    const completeHandler = (e) => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener('PersonWalkingComplete', completeHandler);
        resolve();
      }
    };
    document.addEventListener('PersonWalkingComplete', completeHandler);
  }

  textMessage(resolve) {
    //NPC faces hero
    if (this.event.faceHero) {
      const obj = this.map.gameObjects[this.event.faceHero];
      obj.direction = utils.oppositeDirection(this.map.gameObjects['hero'].direction);
    }

    const message = new TextMessage({
      text: this.event.text,
      onComplete: () => resolve(),
    });
    message.init(document.querySelector('.game-container'));
  }

  // tasks

  doLaundry(resolve) {
    this.laundry.classList.add('addCheck');

    resolve();
  }

  goWork(resolve) {
    this.work.classList.add('addCheck');

    resolve();
  }

  waterPlantBath(resolve) {
    this.plantBath.classList.add('addCheck');
    this.map.gameObjects.plantBath.setLook('healthy');

    resolve();
  }

  waterPlantLivingRoom(resolve) {
    this.plantLivingRoom.classList.add('addCheck');
    this.map.gameObjects.plantLivingRoom.setLook('healthy');

    resolve();
  }

  waterPlantBedroom(resolve) {
    this.plantBedroom.classList.add('addCheck');
    this.map.gameObjects.plantBedroom.setLook('healthy');

    resolve();
  }

  recycleBottle(resolve) {
    this.bottle.classList.add('addCheck');
    this.map.removeObject('bottle');

    resolve();
  }

  trashOut(resolve) {
    this.trash.classList.add('addCheck');
    this.map.removeObject('pizzaBox');

    resolve();
  }

  readBook(resolve) {
    this.book.classList.add('addCheck');

    resolve();
  }

  init() {
    return new Promise((resolve) => {
      this[this.event.type](resolve);
    });
  }
}
