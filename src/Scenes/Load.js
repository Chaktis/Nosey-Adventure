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

        // Load images
        this.load.image("coin_particle", "coin_particle.png");
        this.load.image('heart', 'heart.png')
        this.load.image('coin', 'coin.png')
        this.load.image('key', 'key.png') 

        // Load spritesheets
        this.load.spritesheet('characters', 'monochrome_tilemap_transparent_packed.png', {
            frameWidth: 16,  
            frameHeight: 16
        });
        this.load.spritesheet('monochrome_tilemap_spritesheet', 'monochrome_tilemap_transparent_packed.png', {
            frameWidth: 16,  
            frameHeight: 16
        });
        
        // Packed tilemap
        this.load.tilemapTiledJSON("level-one", "final_game.json");   // Tilemap in JSON

        // Load audio
        this.load.audio("pickupCoin", "pickupCoin.wav");
        this.load.audio("pickupKey", "pickupKey.wav");
        this.load.audio("jump", "jump.wav");
        this.load.audio("hurt", "playerHurt.wav");
        this.load.audio("death", "playerDeath.wav");
        this.load.audio("enemyHurt", "enemyHurt.wav");
    }

    create() {
    
        // ANIMATIONS
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
                //{key: 'characters', frame: 260},
                {key: 'characters', frame: 240}
            ],
            frameRate: 1,
            repeat: -1
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

        



         // Start level scene
         this.scene.start("LevelOne");
    }
}