class Load extends Phaser.Scene {
    constructor() {
        super("Load");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load tilemap information
        this.load.image("monochrome_tilemap_transparent", "monochrome_tilemap_transparent_packed.png");
        this.load.image("black_tile", "black_tile.png");

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

        /*// Load audio
        this.load.audio("coinCollect", "coin_collect.mp3");
        this.load.audio("keyCollect", "key_collect.mp3");
        this.load.audio("jump", "jump.mp3");
        this.load.audio("attack", "laser.mp3");
        this.load.audio("hurt", "take_damage.mp3");
        this.load.audio("heal", "health_up.ogg");
        this.load.audio("death", "death.mp3");
        this.load.audio("unlock", "unlock.mp3");
        this.load.audio("win", "win.mp3");
        this.load.audio("enemyHurt", "enemy_damage.mp3");
        this.load.audio("enemyDeath", "enemy_death.mp3");
        this.load.audio("keyDrop", "key_drop.mp3");
        this.load.audio("select_1", "select_1.mp3");
        this.load.audio("select_2", "select_2.mp3");*/
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