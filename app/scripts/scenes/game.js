/* eslint-disable quotes */
/* eslint-disable no-unused-vars */
import UserSprite from '@/objects/UserSprite';
import ComfyJS from 'comfy.js';
import Coin from '@/objects/Coin';
import UserSpriteFactory from "@/helpers/UserSpriteFactory";

// giftsub VIA robertables - lurking_kat
// Resub - DannyKampsGamez

export default class Game extends Phaser.Scene {
  /**
   *  A sample Game scene, displaying the Phaser logo.
   *
   *  @extends Phaser.Scene
   */
  constructor() {
    super({ key: 'Game' });
  }

  /**
   *  Called when a scene is initialized. Method responsible for setting up
   *  the game objects of the scene.
   *
   *  @protected
   *  @param {object} data Initialization parameters.
   */
  create(/* data */) {
    this.initComfy();

    this.userGroup = this.physics.add.group({
      bounceX: 1,
      bounceY: 0.5,
      dragX: 100,
      collideWorldBounds: true,
    });

    this.coinsGroup = this.physics.add.group({
      bounceX: 1,
      bounceY: 0.5,
      dragX: 100,
      collideWorldBounds: true,
    });

    this.nameTextGroup = this.physics.add.group({
      allowGravity: false,
      collideWorldBounds: true,
    });

    // Update Physics collider with new sprites
    this.physics.add.collider(this.userGroup);
    this.physics.add.collider(this.coinsGroup);
    this.physics.add.collider(this.nameTextGroup);

    // Check if user touches coin
    this.physics.add.overlap(this.coinsGroup, this.userGroup, this.collectCoin);
    // Handle physics collisions
    this.physics.world.on('collide', (sprite1, sprite2) =>
      this.onCollision(sprite1, sprite2)
    );

    this.setupAudio();
  }

  setupAudio() {
    this.raidAlert = this.sound.add('raid_alert', { volume: 0.05 });
    this.subAudio = this.sound.add('victory_short', { volume: 0.1 });
    this.collectCoinAudio = this.sound.add('collect_coin', { volume: 0.05 });
    this.gameOverAudio = this.sound.add('game_over', { volume: 0.05 });
    this.cheerAudio = this.sound.add('cheer', { volume: 0.15 });
    this.helloAudio = this.sound.add('hello', { volume: 0.15 });
    this.hostedAudio = this.sound.add('hosted', { volume: 0.15 });
    this.errorAudio = this.sound.add('error', { volume: 0.15 });
    this.victoryAudio = this.sound.add('victory', { volume: 0.10 });
  }

  initComfy() {
    ComfyJS.Init('talk2megooseman');

    ComfyJS.onCommand = (user, command, message, flags) => {
      if (command == 'join') {
        this.addUserSprite(user, flags);
      } else if (command === 'run') {
        UserSpriteFactory.runUserSprite(this.userGroup, user, flags);
      } else if (command === 'jump') {
        UserSpriteFactory.jumpUserSprite(this.userGroup, user);
      } else if (command === 'dbag') {
        UserSpriteFactory.dbagMode(this.userGroup, user);
      } else if (command === 'booli') {
        UserSpriteFactory.tackle(this.userGroup, user, message);
      } else if (command === 'spin') {
        UserSpriteFactory.spin(this.userGroup, user);
      } else if (command === 'die') {
        UserSpriteFactory.die(this.userGroup, user);
      } else if (command === 'mushroom') {
        UserSpriteFactory.mushroom(this.userGroup, user);
      } else if (command ===  'gameover') {
        this.gameOverAudio.play();
      } else if (command ===  'hello') {
        this.helloAudio.play();
      } else if (command ===  'error') {
        this.errorAudio.play();
      } else if (command ===  'victory') {
        this.victoryAudio.play();
      } else if (command === 'alert' && flags.broadcaster) {
        this.raidAlert.play();
      } else if (command === 'sub' && flags.broadcaster) {
        this.subAudio.play();
      } else if (command === 'cheer' && flags.broadcaster) {
        this.cheerAudio.play();
      } else if (command === 'hosted' && flags.broadcaster) {
        this.hostedAudio.play();
      }
    };

    ComfyJS.onJoin = (user, self) => this.addUserSprite(user);

    ComfyJS.onPart = user => UserSpriteFactory.userParted(this.userGroup, user);

    ComfyJS.onChat = (user, message, flags, self, extra) => {
      const sprite = this.addUserSprite(user, flags);
      if (sprite) {
        sprite.displayNameText();
        sprite.displaySpeechBubble(message, extra);

        if (message.toLowerCase() === 'hello' || message.toLowerCase() === 'hi' || message.toLowerCase() === 'hey') {
          this.helloAudio.play();
        }
      }
    };

    ComfyJS.onCheer = (message, bits, extra) => {
      this.cheerAudio.play();
      this.addCoins(bits);
    };

    ComfyJS.onHosted = (user, viewers, autohost) => this.hostedAudio.play();

    ComfyJS.onRaid = (user, viewers) => this.raidAlert.play();

    ComfyJS.onSub = (user, message, subTierInfo, extra) =>
      this.subAudio.play();

    ComfyJS.onResub = (
      user,
      message,
      streamMonths,
      cumulativeMonths,
      subTierInfo,
      extra
    ) => this.subAudio.play();

    ComfyJS.onSubGift = (
      gifterUser,
      streakMonths,
      recipientUser,
      senderCount,
      subTierInfo,
      extra
    ) => this.subAudio.play();

    ComfyJS.onSubMysteryGift = (
      gifterUser,
      numbOfSubs,
      senderCount,
      subTierInfo,
      extra
    ) => this.victoryShort.play();

    ComfyJS.onGiftSubContinue = (user, sender, extra) =>
      this.victoryShort.play();
  }

  addCoins(amount) {
    for (var i = 0; i < amount; i++) {
      const coin = new Coin(this);
      this.coinsGroup.add(coin);
    }
  }

  addUserSprite(user, flags) {
    const sprite = UserSpriteFactory.createOrFindUser(this.userGroup, this, user, flags);
    sprite.walk();
    return sprite;
  }

  /**
   *  Called when a scene is updated. Updates to game logic, physics and game
   *  objects are handled here.
   *
   *  @protected
   *  @param {number} t Current internal clock time.
   *  @param {number} dt Time elapsed since last update.
   */
  update(/* t, dt */) {
    // Call update on all sprites in our group
    this.userGroup.getChildren().forEach(user => {
      // this.physics.moveToObject()
      user.update();
    });

    this.coinsGroup.getChildren().forEach(coin => {
      coin.update();
    });
  }

  collectCoin(coinSprite, userSprite) {
    coinSprite.grabbed();
  }

  onTextOverlap(s1, s2) {
  }

  /**
   *
   *
   * @param {Phaser.GameObjects.Sprite} sprite1
   * @param {Phaser.GameObjects.Sprite} sprite2
   * @memberof Game
   */
  onCollision(sprite1, sprite2) {
    if (sprite1.type === 'user' && sprite2.type === 'user') {
      if (sprite1.body.immovable) {
        sprite2.sendFlyingOnCollide();
      } else if (sprite2.body.immovable) {
        sprite1.sendFlyingOnCollide();
      }
    }
  }
}
