class LevelOne extends Phaser.Scene{

    constructor() {
        super("LevelOne");
    }

    init() {

        // PLAYER JUMP VALUES
        this.ACCELERATION = 1000;
        this.MAX_VELOCITY = 170;
        this.DRAG = 6000;
        this.AIR_DRAG = 10000;
        this.JUMP_VELOCITY = -500;
        this.physics.world.gravity.y = 1000;

        // turn off debug
        this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;

        // COUNTERS
        this.coinCount = 0;
        this.health = 3;
        this.keysCollected = 0;
        this.enemiesKilled = 0;
        this.playerAlive = true;
        this.gameOver = false

        // stores locks that will be unlocked once player gets near
        this.pendingUnlocks = [];
    }

    preload() {

        this.load.setPath("./assets/");
    }

    create() {

        // KEYBOARD INPUT
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys("W,S,A,D");
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);


        // FLAGS
        this.inputEnabled = true; // disables user input
        this.canTakeDamage = true;
        this.damageCooldown = 5000; // 1 second


        // TILEMAP SETUP
        // Create new 16x16 tilemap game object that uses pixel tiles, 40 tiles wide and 30 tiles tall.
        this.map = this.add.tilemap("level-one", 16, 16, 183, 120);

        // Add a tileset to the map
        const oneBit = this.map.addTilesetImage("black_tile", "black_tile");
        const oneBitTransparent = this.map.addTilesetImage("1-bit-transparent", "monochrome_tilemap_transparent");
        const tilesets = [oneBit, oneBitTransparent];


        // LAYER SETUP
        // Create level layers
        this.bgLayer = this.map.createLayer("Background", tilesets, 0, 0);
        this.bgLayer.setScale(2.0);
        this.bgLayer.alpha = 0.35;

        this.collisionLayer = this.map.createLayer("Collision-Layer", tilesets, 0, 0);
        this.collisionLayer.setScale(2.0);
        this.collisionLayer.setCollisionByProperty({ collides: true });
        this.collisionLayer.alpha = 1.0;

        this.groundLayer = this.map.createLayer("Base-Layer", tilesets, 0, 0);
        this.groundLayer.setScale(2.0);
        this.groundLayer.alpha = 1.0;

        this.foregroundLayer = this.map.createLayer("Foreground", tilesets, 0, 0);
        this.foregroundLayer.setScale(2.0);
        this.foregroundLayer.alpha = 1.0;


        // PLAYER SETUP
        this.player = this.physics.add.sprite(2750, 10, "characters", 240);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(1.8);
        this.player.setOrigin(0, 0);

        this.player.body.checkCollision.up = true;
        this.player.body.checkCollision.down = true;
        this.player.body.checkCollision.left = true;
        this.player.body.checkCollision.right = true;


        // LAYER COLLISIONS
        this.physics.add.collider(this.player, this.collisionLayer);
    
        // PHYSICS GROUPS
        this.spikeGroup = this.physics.add.staticGroup();
        this.lockGroup = this.physics.add.staticGroup();
        this.coinGroup = this.physics.add.staticGroup();
        this.keyGroup = this.physics.add.staticGroup();
        this.doorGroup = this.physics.add.staticGroup();


        /////////////// ***OBJECT CREATION*** ///////////////

        // DOOR OBJECT
        const doorObject = this.map.getObjectLayer('Exit').objects;
        doorObject.forEach(obj => {

            // get the "frameInt" property from Tiled
            let frameInt = obj.properties?.find(p => p.name === 'FrameInt')?.value ?? 56;

            // set characteristics
            const door = this.doorGroup.create(
                obj.x * 2,
                obj.y * 2,
                'characters',       
                frameInt           
            );

            door.setOrigin(0, 1);
            door.setScale(2.0);

            // door collision box
            let bodyX = 32;
            let bodyY = 32;
            let offsetX = 8;
            let offsetY = -24;

            door.body.setSize(bodyX, bodyY);
            door.body.setOffset(offsetX, offsetY);
            this.doorGroup.add(door);
        });



        // LOCK OBJECTS
        this.lockArray = [];
        const lockObjects = this.map.getObjectLayer('Gate').objects;
        // for each lock object
        lockObjects.forEach(obj => {

            // get the "frameInt" property from Tiled
            let frameInt = obj.properties?.find(p => p.name === 'FrameInt')?.value ?? 47;

            // set characteristics
            const lock = this.lockGroup.create(
                obj.x * 2,
                obj.y * 2,
                'monochrome_tilemap_spritesheet',       
                frameInt           
            );

            lock.setOrigin(0, 1);
            lock.setScale(2.0);

            // Lock collision box
            let bodyX = 32;
            let bodyY = 32;
            let offsetX = 8;
            let offsetY = -24;

            lock.body.setSize(bodyX, bodyY);
            lock.body.setOffset(offsetX, offsetY);
            this.lockGroup.add(lock);
            this.lockArray.push(lock);
        });


        // SPIKE OBJECTS
        const spikeObjects = this.map.getObjectLayer('Spikes').objects;
        // for each spike object
        spikeObjects.forEach(obj => {

            // get the "frameInt" property from Tiled
            const frameInt = obj.properties?.find(p => p.name === 'FrameInt')?.value ?? 183;

            // set characteristics
            const spike = this.spikeGroup.create(
                obj.x * 2,
                obj.y * 2,
                'characters',       
                frameInt           
            );

            spike.setOrigin(0, 1);
            spike.setScale(2.0);
            spike.alpha = 1.0;
            spike.angle = obj.rotation;

            // set the object to be flipped horizontal/vertical to match how the map looks in Tiled
            spike.flipX = obj.flippedHorizontal || false;
            spike.flipY = obj.flippedVertical || false;

            // MANUAL COLLISIONs
            // default spike collision box (FrameInt: 183, No Vertical, No Horizontal, Rotation 0)
            let bodyX = 32;
            let bodyY = 32;
            let offsetX = 8;
            let offsetY = -20;

            //DOESN'T ACCOUNT FOR EVERYTHING, would be a pain and long. Just don't be dumb when placing spikes
            // if FrameInt = 183 (normal Spike)
            if (frameInt === 183) {

                // Yes Vertical, Yes Horizontal
                if (obj.flippedVertical && obj.flippedHorizontal) offsetX = 20, offsetY = 8, bodyX = 16, bodyY = 32;
                
                // No Vertical, Yes Horizontal
                if (!obj.flippedVertical && obj.flippedHorizontal){
                    // Rotation 180
                    if (obj.rotation === 180) offsetX = -24, offsetY = 10;
                    // Rotation 90
                    else offsetX = 10, offsetY = 8;
                }
                // No Vertical, No Horizontal
                if (!obj.flippedVertical && !obj.flippedHorizontal)
                    //Rotation -90 
                    if(obj.rotation === -90) offsetX = -24, offsetY = -24;
                    //Rotation 90
                    else if (obj.rotation === 90) offsetX = 8, offsetY = 8;
                    //Rotation -180
                    else if (obj.rotation === -180) offsetX = -10, offsetY = -24;

                // Yes Vertical, No Horizontal
                if (obj.flippedVertical && !obj.flippedHorizontal) {
                    // Rotation -90
                    if (obj.rotation === -90) offsetX = -20, offsetY = -24;
                    // Rotation 0
                    else offsetX = 8, offsetY = -24;
                }
            }


            spike.body.setSize(bodyX, bodyY);
            spike.body.setOffset(offsetX, offsetY);
            this.spikeGroup.add(spike);

        });


        // COIN OBJECTS
        this.coins = this.map.createFromObjects("Coins", {
            name: "coin",
            key: "characters",
            frame: 2,
            scale: 2
        });

        let coinounter = 0;
        this.coins.forEach(coin => {
            coinounter++;
            coin.setScale(2.0);
            coin.setOrigin(0.5, 0.5);
            coin.x *= 2;
            coin.y *= 2;
            coin.alpha = 1.0;
            this.coinGroup.add(coin);
        });

        // vfx for collecting coins
        this.coinCollectParticles = this.add.particles(0, 0, "coin_particle", {
            quantity: 10,
            lifespan: 600,
            speed: { min: 50, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.0, end: 0.0 },
            alpha: { start: 1, end: 0 },
            gravityY: -100,
            emitting: false // only triggered manually with explode 
        });
        
        // KEY OBJECTS
        this.keyMap = this.map.createFromObjects("Keys", {
            name: "key",
            key: "characters",
            frame: 96,
            scale: 2
        });

        let keysCollected = 0;
        this.keyMap.forEach(key => {
            keysCollected++;
            key.setScale(2.0);
            key.setOrigin(0.5, 0.5);
            key.x *= 2;
            key.y *= 2;
            key.alpha = 1.0;
            this.keyGroup.add(key);
        });/*


        /////////////// *** COLLISION DETECTION*** ///////////////

        */// PLAYER COLLISION WITH LOCKS
        this.physics.add.collider(this.player, this.lockGroup);

        // PLAYER COLLISION WITH KEYS
        //this.physics.add.collider(this.keyGroup, this.groundLayer);
        this.physics.add.overlap(this.player, this.keyGroup, (player, key) => {
            key.destroy();
            this.keysCollected++;
            this.keyCount.setText('x ' + this.keysCollected);
            this.unlockNextLock();
        });


        // PLAYER COLLISION WITH COINS
        this.physics.add.overlap(this.player, this.coinGroup, (obj1, obj2) => {
            //trigger particle effect
            this.coinCollectParticles.explode(10, obj2.x, obj2.y);

            // remove coin on overlap
            obj2.destroy(); 
            this.coinCount++;
            this.coinScore.setText('x ' + this.coinCount);

            // Add health for every 10 coins collected
            if (this.coinCount % 10 == 0) {
                this.health++;
                this.healthCounter.setText('x ' + this.health);
            }
        })


        // PLAYER COLLISION WITH SPIKES
        this.physics.add.overlap(this.player, this.spikeGroup, () => {
            this.playerTakeDamage();
        });

        // PLAYER COLLISION WITH ENEMIES
        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            if (enemy.alive) {
                this.playerTakeDamage();
            }
        });
        
        // PLAYER COLLISION WITH EXIT DOOR
        this.physics.add.overlap(this.player, this.doorGroup, () => {
            this.showWinScreen();
        });
        
        /////////////// *** COLLISION DETECTION END *** ///////////////

        // COIN UI
        this.coin = this.add.image(250, 300, 'coin').setScrollFactor(0).setScale(2);
        this.coinScore = this.add.text(this.cameras.main.centerX - 150, this.cameras.main.centerY - 236, 'x ' + this.coinCount, {
            fontFamily: 'Alagard',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setScale(2.0).setScrollFactor(0);
        
        
        // HEALTH UI
        this.heart = this.add.image(250, 340, 'heart').setScrollFactor(0).setScale(2);
        this.healthCounter = this.add.text(this.cameras.main.centerX - 150, this.cameras.main.centerY - 197, 'x ' + this.health, {
            fontFamily: 'Alagard',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setScale(2.0).setScrollFactor(0);

        
        // KEY UI
        this.keyImage = this.add.image(600, 300, 'key').setScrollFactor(0).setScale(2);
        this.keyCount = this.add.text(this.cameras.main.centerX + 200, this.cameras.main.centerY - 236, 'x ' + this.keysCollected, {
            fontFamily: 'Alagard',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setScale(2.0).setScrollFactor(0);
        


        // CAMERA SETUP
        this.cameras.main.setBounds(0, 0, 5140, 8500);
        this.physics.world.setBounds(0, 0, 5140, 8500);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08, 100, 0);
        this.cameras.main.setDeadzone(150, 150);
        this.cameras.main.setZoom(2.0);
        this.cameras.main.followOffset.set(-100, 0);
        this.physics.world.TILE_BIAS = 40; // should help with not having the player go through tiles while falling

        
        // GAME RESTART
        this.input.keyboard.on('keydown-R', () => {
            if (this.gameOver) {
                this.isHurt = false;
                this.scene.restart();
            }
        });


        
    }

    update() {

        const cam = this.cameras.main;

        // PLAYER MOVEMENT
        if (this.inputEnabled) {
            // First, handle movement
            if (this.cursors.left.isDown || this.keys.A.isDown) {
                this.player.setAccelerationX(-this.ACCELERATION);
                this.player.setFlip(true, false);
                this.cameras.main.followOffset.set(100, 50);
            } else if (this.cursors.right.isDown || this.keys.D.isDown) {
                this.cameras.main.followOffset.set(-100, 50);
                this.player.setAccelerationX(this.ACCELERATION);
                this.player.resetFlip();
            } else {
                this.player.setAccelerationX(0);
            }

            // Apply max speed
            if (Math.abs(this.player.body.velocity.x) > this.MAX_VELOCITY) {
                this.player.setVelocityX(Phaser.Math.Clamp(this.player.body.velocity.x, -this.MAX_VELOCITY, this.MAX_VELOCITY));
            }

            // Grounded drag
            this.player.setDragX(this.player.body.blocked.down ? this.DRAG : this.AIR_DRAG);

            // Gravity
            //this.player.setGravityY(!this.player.body.blocked.down && this.player.body.velocity.y > 0 ? this.physics.world.gravity.y : 0);

            // Handle jumping input
            if (this.player.body.blocked.down && (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.W) || Phaser.Input.Keyboard.JustDown(this.spaceKey))) {
                this.player.setVelocityY(this.JUMP_VELOCITY);
            }

            //#################################################################
            // TODO: MAKE AN ACTUAL JUMPING STATE
            // JUMP FRAME CONTROL
            if ((!this.player.body.blocked.down) /*&& (!this.gunActive)*/) {
                // In air
                if (this.player.body.velocity.x > 10) {
                    // Jumping right
                    this.player.setFrame(242);
                    this.player.resetFlip(); // facing right
                } else if (this.player.body.velocity.x < -10) {
                    // Jumping left
                    this.player.setFrame(242);
                    this.player.setFlip(true, false); // facing left
                } else {
                    // Jumping straight up
                    this.player.setFrame(242);
                }

            } else {
                // On ground - play walk/idle animations
                if (!this.isHurt) {
                    if (this.player.body.velocity.x !== 0) {
                        this.player.anims.play('walk', true);
                    } else {
                        this.player.anims.play('idle', true);
                    }
                }
            }
        }
        else this.player.setVelocityX(0);


        // Check for nearby pending locks to unlock
        this.pendingUnlocks = this.pendingUnlocks.filter(lock => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                lock.x, lock.y
            );

            if (distance < 200) { // can adjust proximity
                this.lockGroup.remove(lock, true, true); // remove from pendingUnlocks
                this.coinCollectParticles.explode(10, lock.x + 18, lock.y - 20);
                return false; 
            }
            return true; // don't remove if still too far
        });

        // LOSE CONDITIONS
        if (this.health <= 0) {
            this.playerAlive = false;
            this.endScreen();
        }
    }


    // Makes the locks disappear as the player collects the keys
    unlockNextLock() {
        if (this.keysCollected <= this.lockArray.length) {
            const lockToUnlock = this.lockArray[this.lockArray.length - this.keysCollected]; // reverse order
            if (lockToUnlock) {
            // Queue it for unlocking when the player gets close
            this.pendingUnlocks.push(lockToUnlock);
            }
        }  
    }


    playerTakeDamage() {
        if (this.canTakeDamage) {
            if (this.playerAlive){
                this.health--;
                this.healthCounter.setText('x ' + this.health);

                this.canTakeDamage = false;
                this.isHurt = true;
                this.player.anims.stop();
                this.player.anims.play('hurt', true);

                // Reset flag after a delay
                this.time.delayedCall(this.damageCooldown, () => {
                    this.canTakeDamage = true;
                    this.isHurt = false;
                });
            }
        }
    }

    endScreen() {
        // prevent repeat triggers
        if (this.gameOver) return;
        this.gameOver = true;

        this.inputEnabled = false;
        this.player.setAccelerationX(0);

        // Dim background layers
        this.bgLayer.alpha = 0.15;
        this.groundLayer.alpha = 0.3;
        this.foregroundLayer.alpha = 0.3;


        this.coins.forEach(coin => coin.alpha = 0.3);
        this.keyGroup.getChildren().forEach(key => key.alpha = 0.3);
        this.spikeGroup.getChildren().forEach(spike => spike.alpha = 0.3);
        if (this.door) this.door.alpha = 0.3;


        const { centerX, centerY } = this.cameras.main;

        // Add game over text
        this.add.text(centerX, centerY - 50, "Game Over", {
            fontFamily: 'Alagard',
            fontSize: '75px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);

        this.add.text(centerX, centerY + 50, `Press R to Restart`, {
            fontFamily: 'Alagard',
            fontSize: '38px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
    }

    showWinScreen() {
        if (this.gameOver) return;
        this.gameOver = true;

        this.inputEnabled = false;
        this.player.setAccelerationX(0);

        // Dim background layers
        this.bgLayer.alpha = 0.15;
        this.groundLayer.alpha = 0.3;
        this.foregroundLayer.alpha = 0.3;

        this.coins.forEach(coin => coin.alpha = 0.3);
        this.keyGroup.getChildren().forEach(key => key.alpha = 0.3);
        this.spikeGroup.getChildren().forEach(spike => spike.alpha = 0.3);
        if (this.door) this.door.alpha = 0.3;

        const { centerX, centerY } = this.cameras.main;

        // Add win text
        this.add.text(centerX, centerY - 100, "You Won!", {
            fontFamily: 'Alagard',
            fontSize: '75px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);

        this.add.text(centerX, centerY, `Coins Collected: ${this.coinCount}`, {
            fontFamily: 'Alagard',
            fontSize: '38px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);

        this.add.text(centerX, centerY + 70, `Press R to Restart`, {
            fontFamily: 'Alagard',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
    }
}