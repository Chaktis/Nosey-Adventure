class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture, frame, input) {
        super(scene, x, y, texture, frame);
        this.scene = scene;


        // KEY INPUTS
        this.inputKeys = input

        // COUNTERS
        this.health = 3;
    

        // PLAYER JUMP VALUES
        this.ACCELERATION = 1000;
        this.MAX_VELOCITY = 170;
        this.MAX_FALLING_VELOCITY = 400;
        this.DRAG = 6000;
        this.AIR_DRAG = 10000;
        this.JUMP_VELOCITY = -500;


        // PLAYER SETUP
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setScale(1.8);
        this.setOrigin(0, 0);
        this.body.setSize(10, 13);
        this.body.setOffset(3, 3);

        this.body.checkCollision.up = true;
        this.body.checkCollision.down = true;
        this.body.checkCollision.left = true;
        this.body.checkCollision.right = true;

        // FLAGS
        this.playerAlive = true;
        this.canTakeDamage = true;
        this.isAttacking = false;
        this.damageCooldown = 5000; // 1 second
    }


    update() {
        // PLAYER MOVEMENT
        if (this.scene.inputEnabled) {
            // First, handle movement
            if (this.inputKeys.cursors.left.isDown || this.inputKeys.keys.A.isDown) {
                this.setAccelerationX(-this.ACCELERATION);
                this.setFlip(true, false);
                this.scene.cameras.main.followOffset.set(100, 50);
            } else if (this.inputKeys.cursors.right.isDown || this.inputKeys.keys.D.isDown) {
                this.scene.cameras.main.followOffset.set(-100, 50);
                this.setAccelerationX(this.ACCELERATION);
                this.resetFlip();
            } else {
                this.setAccelerationX(0);
            }

            // Apply max speed
            if (Math.abs(this.body.velocity.x) > this.MAX_VELOCITY) {
                this.setVelocityX(Phaser.Math.Clamp(this.body.velocity.x, -this.MAX_VELOCITY, this.MAX_VELOCITY));
            }

            // Cap falling speed
            if (this.body.velocity.y > this.MAX_FALLING_VELOCITY) {
                this.setVelocityY(this.MAX_FALLING_VELOCITY);
            }

            // Grounded drag
            this.setDragX(this.body.blocked.down ? this.DRAG : this.AIR_DRAG);


            // Jumping input
            if (this.body.blocked.down && (this.inputKeys.cursors.up.isDown || this.inputKeys.keys.W.isDown || this.inputKeys.spaceKey.isDown)) {
                this.setVelocityY(this.JUMP_VELOCITY);
                this.scene.sound.play("jump", {
                        volume: 0.4,
                        rate: Phaser.Math.FloatBetween(0.95, 1.15)
                    });
            }

            //#################################################################
            // TODO: MAKE AN ACTUAL JUMPING STATE
            // JUMP FRAME CONTROL
            if ((!this.body.blocked.down)) {
                // In air
                if (this.body.velocity.x > 10) {
                    // Jumping right
                    this.setFrame(242);
                    this.resetFlip(); // facing right
                } else if (this.body.velocity.x < -10) {
                    // Jumping left
                    this.setFrame(242);
                    this.setFlip(true, false); // facing left
                } else {
                    // Jumping straight up
                    this.setFrame(242);
                }

            // Attacking Input
            if (this.inputKeys.cursors.down.isDown || this.inputKeys.keys.S.isDown) {
                this.attack();
            }

            
            } else {
                // On ground - play walk/idle animations
                if (!this.isHurt) {
                    if (this.body.velocity.x !== 0) {
                        this.anims.play('walk', true);
                    } else {
                        this.anims.play('idle', true);
                    }
                }
            }
        }
        // Set player velocity to 0 if movement isn't enabled
        else this.setVelocityX(0);

    }



    attack(){
        this.anims.play('attack', true);
    }


    playerTakeDamage() {
        if (this.canTakeDamage) {
            if (this.playerAlive){
                this.health--;
                this.scene.healthCounter.setText('x ' + this.health);

                this.canTakeDamage = false;
                this.isHurt = true;
                this.anims.stop();
                this.anims.play('hurt', true);
                this.scene.sound.play("hurt", { volume: 0.5 });

                // Reset flag after a delay
                this.scene.time.delayedCall(this.damageCooldown, () => {
                    this.canTakeDamage = true;
                    this.isHurt = false;
                });
            }
        }
    }
}