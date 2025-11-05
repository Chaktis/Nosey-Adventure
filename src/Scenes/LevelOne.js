class LevelOne extends Phaser.Scene{

    constructor() {
        super("LevelOne");
    }

    init() {

        this.physics.world.gravity.y = 950;

        // Turn off debug
        this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;

        // COUNTERS
        this.coinCount = 0;
        this.keysCollected = 0;
        this.cypherCompleted = false;
        this.gameOver = false

        // Stores locks that will be unlocked once player gets near
        this.pendingUnlocks = [];

        // Correct statue order
        this.statueCode = ["statue1", "statue2", "statue3", "statue4", "statue5", "statue6"]
        this.statueLog = []
    }

    preload() {

        this.load.setPath("./assets/");
    }

    create() {

        // KEYBOARD INPUT
        this.inputKeys = {
            cursors: this.input.keyboard.createCursorKeys(),
            keys: this.input.keyboard.addKeys({
                W: Phaser.Input.Keyboard.KeyCodes.W,
                A: Phaser.Input.Keyboard.KeyCodes.A,
                S: Phaser.Input.Keyboard.KeyCodes.S,
                D: Phaser.Input.Keyboard.KeyCodes.D
            }),
            spaceKey: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            keyS: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
        };
        this.inputEnabled = true; // disables/enables user input


        // TILEMAP SETUP
        // Create new 16x16 tilemap game object that uses pixel tiles
        this.map = this.add.tilemap("level-one", 16, 16, 183, 120);
        this.animatedTiles.init(this.map);

        // Add a tileset to the map
        const oneBit = this.map.addTilesetImage("black_tile", "black_tile");
        const oneBitTransparent = this.map.addTilesetImage("1-bit-transparent", "monochrome_tilemap_transparent");
        const oneBitCrystal = this.map.addTilesetImage("crystal_tilemap", "crystal_tilemap");
        const oneBiDungeon = this.map.addTilesetImage("Dungeon_Expanded_Tilemap", "Dungeon_Expanded_Tilemap");
        const tilesets = [oneBit, oneBitTransparent, oneBitCrystal, oneBiDungeon];


        // LAYER SETUP
        // Create level layers
        this.bgLayer = this.map.createLayer("Background", tilesets, 0, 0);
        this.bgLayer.setScale(2.0);
        this.bgLayer.alpha = 0.2;

        this.collisionLayer = this.map.createLayer("Collision-Layer", tilesets, 0, 0);
        this.collisionLayer.setScale(2.0);
        this.collisionLayer.setCollisionByProperty({ collides: true });

        this.groundLayer = this.map.createLayer("Base-Layer", tilesets, 0, 0);
        this.groundLayer.setScale(2.0);

        this.foregroundLayer = this.map.createLayer("Foreground", tilesets, 0, 0);
        this.foregroundLayer.setScale(2.0);


        // PLAYER SETUP
        this.player = new Player(this, 2750, 10, "characters", 240, this.inputKeys);
        this.player.setCollideWorldBounds(true);


        // ENEMY SETUP
        this.enemies = this.physics.add.group();

        // Get point objects from "EnemySpawns" layer in Tiled
        const enemySpawnObjects = this.map.getObjectLayer('EnemySpawns').objects;
        enemySpawnObjects.forEach((obj) => {

            // Use Tiled Class property
            const enemyType = obj.type || 'groundEnemy'; // default value is ground enemy

            let enemy;
            if (enemyType === 'flyingEnemy') {
                enemy = new FlyingEnemy(this, obj.x * 2, obj.y * 2, 50);
            } 
            else {
                enemy = new GroundEnemy(this, obj.x * 2, obj.y * 2, 50);
            }

            enemy.setScale(2);
            this.enemies.add(enemy);
        });


        // PHYSICS GROUPS
        this.spikeGroup = this.physics.add.staticGroup();
        this.lockGroup = this.physics.add.staticGroup();
        this.coinGroup = this.physics.add.staticGroup();
        this.keyGroup = this.physics.add.staticGroup();
        this.doorGroup = this.physics.add.staticGroup();
        this.statueGroup = this.physics.add.staticGroup();


        // LAYER COLLISIONS
        this.physics.add.collider(this.player, this.collisionLayer);
        this.physics.add.collider(this.enemies, this.collisionLayer);
        



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
        });


        // STATUE OBJECTS
        const statueObjects = this.map.getObjectLayer('CypherStatues').objects;
        statueObjects.forEach(obj => {
            // Get tile's global ID in tilesheet
            const gid = obj.gid;

            // Convert GID to the frame index in the tileset’s image
            const tileset = this.map.tilesets[0]; // Find specific tileset
            const firstgid = tileset.firstgid;
            const frameIndex = gid - firstgid; // get local frame index

            // Create the sprite using that frame
            const statue = this.statueGroup.create(
                obj.x * 2,
                obj.y * 2,
                'characters',   
                frameIndex 
            );

            statue.setOrigin(0, 1);
            statue.setScale(2);

            // Copy Tiled "class" property
            statue.type = obj.type;
        });



        

        /////////////// *** COLLISION DETECTION*** ///////////////

        // PLAYER COLLISION WITH LOCKS
        this.physics.add.collider(this.player, this.lockGroup);


        // PLAYER COLLISION WITH KEYS
        this.physics.add.overlap(this.player, this.keyGroup, (player, key) => {
            key.destroy();
            this.keysCollected++;
            this.keyCount.setText('x ' + this.keysCollected);
            this.sound.play("pickupKey", { volume: 0.5 });
            this.unlockNextLock();
        });


        // PLAYER COLLISION WITH COINS
        this.physics.add.overlap(this.player, this.coinGroup, (player, coin) => {
            //trigger particle effect
            this.coinCollectParticles.explode(10, coin.x, coin.y);

            // remove coin on overlap
            coin.destroy(); 
            this.coinCount++;
            this.coinScore.setText('x ' + this.coinCount);
            this.sound.play("pickupCoin", { volume: 0.5 });

            // Add health for every 10 coins collected
            if (this.coinCount % 10 == 0) {
                this.player.health++;
                this.healthCounter.setText('x ' + this.player.health);
                this.sound.play("heal", { volume: 0.5 });
            }
        })


        // PLAYER COLLISION WITH SPIKES
        this.physics.add.overlap(this.player, this.spikeGroup, () => {
            this.player.playerTakeDamage();
        });

        
        // PLAYER COLLISION WITH ENEMIES
        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            if (enemy.alive) {
                player.playerTakeDamage();
            }
        });

        // PLAYER ATTACKING ENEMIES
        this.physics.add.overlap(this.player.attackHitbox, this.enemies, (hitbox, enemy) => {
            if (this.player.isAttacking && hitbox.active) {
                enemy.takeDamage();
            }
        });


        // PLAYER INTERACTING WITH STATUES
        this.physics.add.overlap(this.player.attackHitbox, this.statueGroup, (hitbox, statue) => {
            if (this.player.isAttacking && hitbox.active) {
                this.statueHit(statue)
            }
        });

        
        // PLAYER COLLISION WITH EXIT DOOR
        this.physics.add.overlap(this.player, this.doorGroup, () => {
            this.showWinScreen();
        });
        



        /////////////// ***UI ELEMENTS *** ///////////////

        // COIN UI
        this.coin = this.add.image(250, 300, 'coin').setScrollFactor(0).setScale(2);
        this.coinScore = this.add.text(this.cameras.main.centerX - 150, this.cameras.main.centerY - 236, 'x ' + this.coinCount, {
            fontFamily: 'Alagard',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setScale(2.0).setScrollFactor(0);
        
        
        // HEALTH UI
        this.heart = this.add.image(250, 340, 'heart').setScrollFactor(0).setScale(2);
        this.healthCounter = this.add.text(this.cameras.main.centerX - 150, this.cameras.main.centerY - 197, 'x ' + this.player.health, {
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
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08, 100, -100);
        this.cameras.main.setDeadzone(10, 100); // Determines how far you can move before the screen moves with you
        this.cameras.main.setZoom(2.0);
        this.cameras.main.followOffset.set(0, -50);
        this.physics.world.TILE_BIAS = 40; // should help with not having the player go through tiles while falling

        // CAMERA LOOK VARIABLES
        this.cameraLookOffset = 0;       // current camera offset
        this.cameraLookTarget = 0;       // target offset (changes when player looks up/down)
        this.lookAmount = 120;           // how far to shift the camera
        this.lookSpeed = 6;              // how quickly to shift to target position

        
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

        // UPDATE ENEMIES
        this.enemies.children.iterate(enemy => {
            if (enemy && enemy.update) {
                enemy.update();
            }
        });

        // UPDATE PLAYER
        this.player.update()

        // Check for nearby pending locks to unlock
        this.pendingUnlocks = this.pendingUnlocks.filter(lock => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                lock.x, lock.y
            );

            if (distance < 200) { // can adjust proximity
                this.lockGroup.remove(lock, true, true); // remove from pendingUnlocks
                this.coinCollectParticles.explode(10, lock.x + 18, lock.y - 20);
                this.keysCollected--;
                this.keyCount.setText('x ' + this.keysCollected);
                return false; 
            }
            return true; // don't remove if still too far
        });

        // LOSE CONDITIONS
        if (this.player.health <= 0) {
            this.player.playerAlive = false;
            this.endScreen();
        }
    }



    // Makes the locks disappear as the player collects the keys
    unlockNextLock() {
            const lockToUnlock = this.lockArray[this.lockArray.length - this.keysCollected]; // reverse order
            if (lockToUnlock) {
            // Queue it for unlocking when the player gets close
            this.pendingUnlocks.push(lockToUnlock);
        }  
    }


    statueHit(statue) {
        // Prevent repeated triggers from lingering attack hitbox/don't run if puzzle complete
        if (statue.justHit || this.cypherCompleted) return;
        
        statue.justHit = true;
        // Reset flag after attack finished
        this.time.delayedCall(200, () => {
            statue.justHit = false;
        });

        const sequence = this.statueLog.map(s => s.id);

        // Check if sequences match
        if (sequence.length === this.statueCode.length) {
            const matches = sequence.every((id, i) => id === this.statueCode[i]);

            if (matches) {
                const key = this.keyGroup.create(1290, 1300, 'key');
                key.setScale(2.0);
                this.cypherCompleted = true
            } else { // Wrong order — reset everything
                this.statueLog.forEach(obj => {obj.sprite.alpha = 1;});
                this.statueLog = [];
            }
            return;
        }

        // Only add statue if not already in the log
        if (!this.statueLog.find(s => s.sprite === statue)) {
            statue.alpha = 0.5;
            this.statueLog.push({ id: statue.type, sprite: statue });
            this.sound.play("statueHit", { volume: 0.2 });
        }
    }



    endScreen() {
        // prevent repeat triggers
        if (this.gameOver) return;
        this.gameOver = true;

        this.inputEnabled = false;
        this.player.setAccelerationX(0);
        this.sound.play("death", { volume: 0.5 });

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