class Enemy extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture, patrolDistance) {
        super(scene, x, y, texture);
        this.scene = scene;
        

        // PATHING
        this.startX = x;     // save original spawn point
        this.startY = y;
        this.patrolDistance = patrolDistance; // how far left/right to move
        this.direction = 1;  // 1 = right, -1 = left

        // STATUS FLAGS
        this.health = 500;
        this.alive = true;

        // PHYSICS
        scene.add.existing(this);
        scene.physics.add.existing(this);
        //this.setCollideWorldBounds(true);
    }
}

class GroundEnemy extends Enemy {
    
    constructor(scene, x, y, texture, patrolDistance) {
        super(scene, x, y, texture, patrolDistance);
        this.speed = 50;

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

        // If the enemy isn't alive, return
        if (!this.alive) return;

        // Reduce health + play sound
        this.health -= 100;
        this.scene.sound.play("enemyHurt", {volume: 0.5});

        // Delete the enemy once it's dead
        if (this.health <= 0) {
            this.alive = false;

            // play death animation
            this.play('groundDie');
            this.alive = false;

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

    constructor(scene, x, y, texture, patrolDistance) {
        super(scene, x, y, texture, patrolDistance);
        this.speed = 50;

        this.body.setSize(16, 16);
        this.body.setOffset(0, 0);
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

        // If the enemy isn't alive, return
        if (!this.alive) return;

        // Reduce health + play sound
        this.health -= 100;
        this.scene.sound.play("enemyHurt", {volume: 0.5});

        // Delete the enemy once it's dead
        if (this.health <= 0) {
            this.alive = false;

            // play death animation
            this.play('flyingDie');
            this.alive = false;

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