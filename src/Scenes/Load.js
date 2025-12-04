class Load extends Phaser.Scene {
    constructor() {
        super("Load");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load tilemap information
        this.load.image("monochrome_tilemap_transparent", "monochrome_tilemap_transparent_packed.png");
        this.load.image("black_tile", "black_tile.png");
        this.load.image("crystal_tilemap", "crystal_tilemap.png");
        this.load.image("Dungeon_Expanded_Tilemap", "DungeonTilesetExpanded.png");
        this.load.image("OvergrownSheetEx", "OvergrownSheetEx.png");

        // Load images
        this.load.image("coin_particle", "coin_particle.png");
        this.load.image('heart', 'heart.png')
        this.load.image('coin', 'coin.png')
        this.load.image('key', 'key.png') 

        // Load animation spritesheets
        this.load.spritesheet('characters', 'monochrome_tilemap_transparent_packed.png', {
            frameWidth: 16,  
            frameHeight: 16
        });
        this.load.spritesheet('enemies', 'enemies.png', {
            frameWidth: 16,  
            frameHeight: 16
        });
        this.load.spritesheet('nosebat', 'nosebat.png', {
            frameWidth: 22,  
            frameHeight: 16
        });
        this.load.spritesheet('bubblesnail', 'bubblesnail.png', {
            frameWidth: 21,  
            frameHeight: 16
        });
        this.load.spritesheet('monochrome_tilemap_spritesheet', 'monochrome_tilemap_transparent_packed.png', {
            frameWidth: 16,  
            frameHeight: 16
        });
        
        // Packed tilemap level
        this.load.tilemapTiledJSON("level-one", "final_game.json");

        // Load audio
        this.load.audio("pickupCoin", "pickupCoin.wav");
        this.load.audio("pickupKey", "pickupKey.wav");
        this.load.audio("jump", "jump.wav");
        this.load.audio("hurt", "playerHurt.wav");
        this.load.audio("death", "playerDeath.wav");
        this.load.audio("enemyHurt", "enemyHurt.wav");
        this.load.audio("enemyDeath", "enemyDeath.wav");
        this.load.audio("heal", "heal.wav");
        this.load.audio("swoosh", "swoosh.wav");
        this.load.audio("statueHit", "statueHit.wav");
    }

    create() {
    
        //// PLAYER ANIMATIONS ////
        this.anims.create({
            key: 'walk',
            frames: [
                {key: 'characters', frame: 241},
                {key: 'characters', frame: 242},
                {key: 'characters', frame: 243},
                {key: 'characters', frame: 244},
                {key: 'characters', frame: 245},
                {key: 'characters', frame: 246}
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: [
                {key: 'characters', frame: 240}
            ],
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: [
                {key: 'characters', frame: 242}
            ],
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'attack',
            frames: [
                {key: 'characters', frame: 280},
                {key: 'characters', frame: 281}
            ],
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'swim',
            frames: [
                {key: 'characters', frame: 283},
                {key: 'characters', frame: 284},
                {key: 'characters', frame: 285},
                {key: 'characters', frame: 286},
                {key: 'characters', frame: 287},
                {key: 'characters', frame: 288}
            ],
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'slash',
            frames: [
                {key: 'characters', frame: 247},
                {key: 'characters', frame: 248}
            ],
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'hurt',
            frames: [
                {key: 'characters', frame: 0},
                {key: 'characters', frame: 240}
            ],
            frameRate: 10,
            repeat: 25
        });

        

        ////////// ENEMY ANIMATIONS ///////////

        // KNIGHT
        this.anims.create({
            key: 'GroundIdle',
            frames: [
                {key: 'enemies', frame: 4},
                {key: 'enemies', frame: 5},
                {key: 'enemies', frame: 6},
                {key: 'enemies', frame: 7},
                {key: 'enemies', frame: 8},
                {key: 'enemies', frame: 9}
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'GroundHurt',
            frames: [
                {key: 'enemies', frame: 21},
                {key: 'enemies', frame: 10}
            ],
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'GroundDie',
            frames: [
                {key: 'enemies', frame: 21}
            ],
            frameRate: 8,
            repeat: -1
        });



        // BUBBLESNAIL
        this.anims.create({
            key: 'GroundWaterIdle',
            frames: [
                {key: 'bubblesnail', frame: 0},
                {key: 'bubblesnail', frame: 1},
                {key: 'bubblesnail', frame: 2},
                {key: 'bubblesnail', frame: 3},
                {key: 'bubblesnail', frame: 4},
                {key: 'bubblesnail', frame: 5},
                {key: 'bubblesnail', frame: 6},
                {key: 'bubblesnail', frame: 7},
                {key: 'bubblesnail', frame: 8},
                {key: 'bubblesnail', frame: 9}
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'GroundWaterHurt',
            frames: [
                {key: 'enemies', frame: 21},
                {key: 'bubblesnail', frame: 10}
            ],
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'GroundWaterDie',
            frames: [
                {key: 'enemies', frame: 21}
            ],
            frameRate: 8,
            repeat: -1
        });



        // BAT
        this.anims.create({
            key: 'FlyingIdle',
            frames: [
                {key: 'nosebat', frame: 0},
                {key: 'nosebat', frame: 1},
                {key: 'nosebat', frame: 2},
                {key: 'nosebat', frame: 3},
                {key: 'nosebat', frame: 4}
            ],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'FlyingHurt',
            frames: [
                {key: 'enemies', frame: 21},
                {key: 'nosebat', frame: 5}
                
            ],
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'FlyingDie',
            frames: [
                {key: 'enemies', frame: 21}
            ],
            frameRate: 8,
            repeat: -1
        });


        // JELLYFISH
        // USES ANGLERFISH SPRITES CURRENTLY
        this.anims.create({
            key: 'FlyingWaterIdle',
            frames: [
                {key: 'enemies', frame: 22},
                {key: 'enemies', frame: 23},
                {key: 'enemies', frame: 24},
                {key: 'enemies', frame: 25},
                {key: 'enemies', frame: 26},
                {key: 'enemies', frame: 27}
            ],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'FlyingWaterHurt',
            frames: [
                {key: 'enemies', frame: 21},
                {key: 'enemies', frame: 28}
                
            ],
            frameRate: 8,
            repeat: 0
        });

        this.anims.create({
            key: 'FlyingWaterDie',
            frames: [
                {key: 'enemies', frame: 21}
            ],
            frameRate: 8,
            repeat: -1
        });




        // Start level scene
        this.scene.start("LevelOne");
    }
}