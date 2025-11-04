class Enemy extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, patrolDistance) {
        super(scene, x, y);
        this.scene = scene;
        

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

        // PHYSICS
        scene.add.existing(this);
        scene.physics.add.existing(this);


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
}

class GroundEnemy extends Enemy {
    
    constructor(scene, x, y, patrolDistance) {
        super(scene, x, y, patrolDistance);

        this.speed = 50;
        this.health = 400;

        // Enemy Hitbox
        this.body.setSize(16, 16);
        this.body.setOffset(0, 0);
    }

    update() {

        // If the enemy isn't alive, return
        if (!this.alive) return;

        else {
            // WALKING
            // Set the velocity in the direction that the enemy is moving
            this.setVelocityX(this.speed * this.direction);

            // Check if enemy has reached patrol limit
            if (this.x > this.startX + this.patrolDistance) {
                this.direction = -1;
                this.anims.play('groundIdle', true);
                this.setFlip(true, false); // face left

            } else if (this.x < this.startX - this.patrolDistance) {
                this.direction = 1;
                this.anims.play('groundIdle', true);
                this.setFlip(false, false); // face right
            }
        }
    }

    takeDamage() {

        // If the enemy isn't alive or can't take damage, don't trigger
        if (!this.alive || !this.canTakeDamage) return;

        // Reduce health + play sound
        this.health -= 100;
        this.speed = 0
        this.scene.sound.play("enemyHurt", {volume: 0.5});
        this.play('groundHurt');


        // Return to idle once animation finishes
            this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim, frame) => {
                if (anim.key === 'groundHurt' && this.alive) {
                    this.play('groundIdle');
                    this.speed = 50;
                }
            });


        this.canTakeDamage = false

        // Reset flag after a delay
        this.scene.time.delayedCall(this.damageCooldown, () => {
            this.canTakeDamage = true;
        });

        // Delete the enemy once it's dead
        if (this.health <= 0) {
            this.alive = false;

            // play death animation
            this.play('groundDie');

            //trigger particle effect
            this.deathParticles.explode(25, this.x, this.y); // Number determines # of particles

            // play death sound
            //this.scene.sound.play("enemyDeath", {volume: 0.5});

            // remove from scene
            this.on('animationcomplete', () => {
                this.disableBody(true, true);  
                this.setVelocity(0, 0);
                this.setCollideWorldBounds(false);
                this.setImmovable(true);
                this.body.enable = false;
                this.destroy();
            });
        }
    }
}

class FlyingEnemy extends Enemy {

    constructor(scene, x, y, patrolDistance) {
        super(scene, x, y, patrolDistance);

        this.speed = 50;
        this.health = 300;


        // Enemy Hitbox
        this.body.setSize(12, 12);
        this.body.setOffset(5, 1.5);
    }

    update() {

        // If the enemy isn't alive, return
        if (!this.alive) return;

        else {
            // FLYING
            // set the velocity in the direction that the enemy is moving
            this.setVelocityY(this.speed * this.direction);

            // Check if enemy has reached patrol limit
            if (this.y > this.startY + this.patrolDistance) {
                this.direction = -1;
                this.anims.play('flyingIdle', true);

            } else if (this.y < this.startY - this.patrolDistance) {
                this.direction = 1;
                this.anims.play('flyingIdle', true);
            }
        }
    }

    takeDamage() {

        /// If the enemy isn't alive or can't take damage, don't trigger
        if (!this.alive || !this.canTakeDamage) return;

        // Reduce health + play sounds/anims
        this.health -= 100;
        this.speed = 0
        this.scene.sound.play("enemyHurt", {volume: 0.5});
        this.play('flyingHurt');

        // Return to idle once animation finishes
            this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim, frame) => {
                if (anim.key === 'flyingHurt' && this.alive) {
                    this.play('flyingIdle');
                    this.speed = 50;
                }
            });

        this.canTakeDamage = false

        // Reset flag after a delay
        this.scene.time.delayedCall(this.damageCooldown, () => {
            this.canTakeDamage = true;
        });

        // Delete the enemy once it's dead
        if (this.health <= 0) {
            this.alive = false;

            // play death animation
            this.play('flyingDie');

            //trigger particle effect
            this.deathParticles.explode(20, this.x, this.y); // Number determines # of particles

            // play death sound
            //this.scene.sound.play("enemyDeath", {volume: 0.5});

            // remove physics and collisions
            this.on('animationcomplete', () => {
                this.disableBody(true, true);
                this.setVelocity(0, 0);
                this.setCollideWorldBounds(false);
                this.setImmovable(true);
                this.body.enable = false;
                this.destroy();
            });
        }
    }
}