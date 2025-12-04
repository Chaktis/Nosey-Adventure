class Enemy extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, patrolDistance, variant = "Normal") {
        super(scene, x, y);

        this.scene = scene;
        this.variant = variant;  // normal or water
        this.patrolDistance = patrolDistance;

        // Create animation key prefix
        // Example: "ground" + "Water" → "groundWater"
        this.skin = this.getSkinPrefix();


        // ANIMATION KEYS
        this.animKeys = {
            idle: this.skin + "Idle",
            hurt: this.skin + "Hurt",
            die: this.skin + "Die"
        };

        // PHYSICS
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // PATHING
        this.startX = x;     // save original spawn point
        this.startY = y;
        this.patrolDistance = patrolDistance; // how far left/right to move
        this.direction = 1;  // 1 = right, -1 = left

        // STATUS FLAGS
        this.health = 100;
        this.alive = true;
        this.damageCooldown = 300;
        this.canTakeDamage = true;

        
        // Death particles
        this.deathParticles = this.scene.add.particles(0, 0, "coin_particle", {
            quantity: 20,
            lifespan: 250,
            speed: { min: 110, max: 140 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.0, end: 0 },
            alpha: { start: 1, end: 0.8 },
            gravityY: 0,
            emitting: false // only triggered manually with explode 
        });
    }

    getSkinPrefix() {
        // Override in subclasses
        return "";
    }
}

class GroundEnemy extends Enemy {
    
    constructor(scene, x, y, patrolDistance, variant) {
        super(scene, x, y, patrolDistance, variant);

        this.speed = 50;
        this.health = 400;

        // Enemy Hitbox
        this.body.setSize(16, 16);
        this.body.setOffset(0, 0);
    }

    
    getSkinPrefix() {
        return this.variant === "Water" ? "GroundWater" : "Ground";
    }

    update() {
        // If the enemy isn't alive, return
        if (!this.alive) return;


        // WALKING
        this.setVelocityX(this.speed * this.direction);

        // Check if enemy has reached patrol limit
        if (this.x > this.startX + this.patrolDistance) {
            this.direction = -1;
            this.anims.play(this.animKeys.idle, true);
            this.setFlip(true, false); // face left

        } else if (this.x < this.startX - this.patrolDistance) {
            this.direction = 1;
            this.anims.play(this.animKeys.idle, true);
            this.setFlip(false, false); // face right
        }
    }


    takeDamage() {
        if (!this.alive || !this.canTakeDamage) return;

        this.health -= 100;
        this.speed = 0;

        this.scene.sound.play("enemyHurt");
        this.play(this.animKeys.hurt);

        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (this.alive) {
                this.play(this.animKeys.idle);
                this.speed = 50;
            }
        });

        this.canTakeDamage = false;
        this.scene.time.delayedCall(300, () => this.canTakeDamage = true);

        if (this.health <= 0) {
            this.alive = false;
            this.play(this.animKeys.die);

            this.on("animationcomplete", () => this.destroy());
        }
    }
}

class FlyingEnemy extends Enemy {

    constructor(scene, x, y, patrolDistance, variant) {
        super(scene, x, y, patrolDistance, variant);

        this.speed = 50;
        this.health = 300;


        // Enemy Hitbox
        this.body.setSize(12, 12);
        this.body.setOffset(5, 1.5);
    }

    getSkinPrefix() {
        return this.variant === "Water" ? "FlyingWater" : "Flying";
    }


    update() {
        if (!this.alive) return;

        this.setVelocityY(this.speed * this.direction);

        if (this.y > this.startY + this.patrolDistance) {
            this.direction = -1;
            this.anims.play(this.animKeys.idle, true);

        } else if (this.y < this.startY - this.patrolDistance) {
            this.direction = 1;
            this.anims.play(this.animKeys.idle, true);
        }
    }

    takeDamage() {
        if (!this.alive || !this.canTakeDamage) return;

        this.health -= 100;
        this.speed = 0;

        this.scene.sound.play("enemyHurt");
        this.play(this.animKeys.hurt);

        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            if (this.alive) {
                this.play(this.animKeys.idle);
                this.speed = 50;
            }
        });

        this.canTakeDamage = false;
        this.scene.time.delayedCall(300, () => this.canTakeDamage = true);

        if (this.health <= 0) {
            this.alive = false;
            this.play(this.animKeys.die);

            this.on("animationcomplete", () => this.destroy());
        }
    }
}