class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture, frame, input) {
        super(scene, x, y, texture, frame);
        this.scene = scene;


        // KEY INPUTS
        this.inputKeys = input

        // COUNTERS
        this.health = 4;
    

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
        this.setScale(2);
        this.setOrigin(0, 0);
        this.body.setSize(10, 13);
        this.body.setOffset(3, 3);

        this.body.checkCollision.up = true;
        this.body.checkCollision.down = true;
        this.body.checkCollision.left = true;
        this.body.checkCollision.right = true;


        // SWORD ATTACK SETUP (basically invisible hitbox that gets enabled/disabled)
        this.attackHitbox = scene.add.rectangle(0, 0, 38, 28, 0xff0000, 0);
        scene.physics.add.existing(this.attackHitbox);
        this.attackHitbox.body.allowGravity = false;
        this.attackHitbox.active = false; // starts inactive

        // FLAGS
        this.playerAlive = true;
        this.canTakeDamage = true;
        this.canAttack = true
        this.isAttacking = false;
        this.attackCooldown = 450;
        this.damageCooldown = 5000; 
    }


    update() {
        // PLAYER MOVEMENT
        if (this.scene.inputEnabled) {
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


            // Apply speed limits
            if (Math.abs(this.body.velocity.x) > this.MAX_VELOCITY) {
                this.setVelocityX(Phaser.Math.Clamp(this.body.velocity.x, -this.MAX_VELOCITY, this.MAX_VELOCITY));
            }

            if (this.body.velocity.y > this.MAX_FALLING_VELOCITY) {
                this.setVelocityY(this.MAX_FALLING_VELOCITY);
            }


            // Grounded drag
            this.setDragX(this.body.blocked.down ? this.DRAG : this.AIR_DRAG);


            // Jumping input
            if (this.body.blocked.down && (
                Phaser.Input.Keyboard.JustDown(this.inputKeys.cursors.up) || 
                Phaser.Input.Keyboard.JustDown(this.inputKeys.keys.W) || 
                Phaser.Input.Keyboard.JustDown(this.inputKeys.spaceKey)
            )) {
                this.jump();
            }


            // Attacking Input
            if (!this.isAttacking && 
                this.canAttack && 
                (Phaser.Input.Keyboard.JustDown(this.inputKeys.cursors.down) || 
                Phaser.Input.Keyboard.JustDown(this.inputKeys.keys.S))
            ){
                this.attack();
            }

            // Move slash with player
            if (this.isAttacking && this.slashSprite) {
                const facingLeft = this.flipX;
                const offsetX = facingLeft ? -Math.abs(this.attackOffset.x) : Math.abs(this.attackOffset.x);
                const offsetY = this.attackOffset.y;

                
                this.slashSprite.setPosition(this.x + offsetX, this.y + offsetY);
                this.attackHitbox.setPosition(this.x + offsetX, this.y + offsetY);
            }


            // Animation logic
            else {
                if (!this.isAttacking && !this.isHurt) { // If player isn't attacking or hurt
                    if (!this.body.blocked.down && this.anims.currentAnim?.key !== 'jump') {
                            this.anims.play('jump'); // Need this to be separate from jumping function, since otherwise it will be overridden
                    } 
                    else if (this.body.blocked.down) {
                        if (this.body.velocity.x !== 0) {
                            this.anims.play('walk', true);
                        } else {
                            this.anims.play('idle', true);
                        }
                    }
                }
            }
        }
        // Set player velocity to 0 if movement isn't enabled
        else this.setVelocityX(0);

    }

    jump(){
        this.setVelocityY(this.JUMP_VELOCITY);
        this.scene.sound.play("jump", {
            volume: 0.4,
            rate: Phaser.Math.FloatBetween(0.95, 1.15)
        });

    }



    attack(){
        this.isAttacking = true;
        this.canAttack = false;
        this.attackHitbox.active = true;
        this.anims.play('attack', true);

        // Slash hitbox/animation offset
        const facingLeft = this.flipX;
        const offsetX = facingLeft ? -16 : 48; // Change x position offset depending on which direction player is facing
        const offsetY = 16;

        // Store offsets to use in repositioning slash
        this.attackOffset = {x: offsetX, y: offsetY};

        // Create slash sprite
        this.slashSprite = this.scene.add.sprite(this.x + offsetX, this.y + offsetY, 'slash');
        this.slashSprite.setFlipX(facingLeft);
        this.slashSprite.setScale(2);
        this.slashSprite.play('slash');

        // Enable slash hitbox
        this.attackHitbox.setPosition(this.x + offsetX, this.y + offsetY);
        this.attackHitbox.body.enable = true;
        this.attackHitbox.active = true;

        // Remove slash after animation completes
        this.slashSprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.slashSprite.destroy();
            this.attackHitbox.active = false;
        });

        // Reset attacking flag once animation completes
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim) => {
            if (anim.key === 'attack') {
                this.isAttacking = false;
            }
        });

        // Reset flag after a delay
                this.scene.time.delayedCall(this.attackCooldown, () => {
                    this.canAttack = true;
                });

    }


    playerTakeDamage() {
        if (this.canTakeDamage && this.playerAlive) {
            this.health--;
            this.scene.healthCounter.setText('x ' + this.health);

            // Cancel any current attack when hit
            this.isAttacking = false;
            this.canAttack = true;
            if (this.slashSprite) {
                this.slashSprite.destroy();
                this.attackHitbox.active = false;
            }

            this.canTakeDamage = false;
            this.isHurt = true;
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