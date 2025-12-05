class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture, frame, input) {
        super(scene, x, y, texture, frame);
        this.scene = scene;

        // KEY INPUTS
        this.inputKeys = input

        // COUNTERS
        this.health = 4;
    

        // DEFAULT PLAYER JUMP VALUES
        this.ACCELERATION = 1000;
        this.MAX_VELOCITY = 170;
        this.MAX_FALLING_VELOCITY = 400;
        this.DRAG = 6000;
        this.AIR_DRAG = 10000;
        this.JUMP_VELOCITY = -520;


        // GRAVITY VALUES
        this.playerGravity = 0
        this.sceneGravity = this.scene.physics.world.gravity.y
        this.swimmingGravityChange = (this.sceneGravity * -0.55)
        this.gravityChange = (this.sceneGravity * -0.4) - this.sceneGravity


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

        // Attack offsets (relative to player)
        this.attackOffsets = {
            normal: {
                left:  { x: -16, y: 16 },
                right: { x:  48, y: 16 }
            },
            flipped: { // When gravity is flipped
                left:  { x: -16, y: -16 },   
                right: { x:  48, y: -16 }
            }
        };


        // FLAGS
        this.currentZones = new Set();

        // Underwater flags
        this.inWater = false
        this.canSwim = false
        this.isSwimming = false
        this.swimCooldown = 200
        

        // Gravity flip flags
        this.noGravity = false
        this.gravityDir = 1;        // 1 = down, -1 = up
        
        
        // Normal flags
        this.canAttack = true
        this.isAttacking = false;
        this.attackCooldown = 450;

        this.isJumping = false;
        this.jumpKeyHeld = false;
        this.jumpCutPower = 0.625; // how much to cut velocity by when jump released early
        
        this.playerAlive = true;
        this.canTakeDamage = true;
        this.damageCooldown = 3000; 
    }


    update() {
        // PLAYER MOVEMENT
        if (this.scene.inputEnabled) {

            const jumpPressed = (
                Phaser.Input.Keyboard.JustDown(this.inputKeys.cursors.up) ||
                Phaser.Input.Keyboard.JustDown(this.inputKeys.keys.W) ||
                Phaser.Input.Keyboard.JustDown(this.inputKeys.spaceKey)
            );


            const jumpReleased = (
                Phaser.Input.Keyboard.JustUp(this.inputKeys.cursors.up) ||
                Phaser.Input.Keyboard.JustUp(this.inputKeys.keys.W) ||
                Phaser.Input.Keyboard.JustUp(this.inputKeys.spaceKey)
            );

            if (this.inputKeys.cursors.left.isDown || this.inputKeys.keys.A.isDown) {
                this.setAccelerationX(-this.ACCELERATION);
                this.setFlip(true, false);
            } else if (this.inputKeys.cursors.right.isDown || this.inputKeys.keys.D.isDown) {
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

            this.setDragX(this.body.blocked.down ? this.DRAG : this.AIR_DRAG);




        ///////// PLAYER STATES//////////

            // Reset zone effects
            this.inWater = this.currentZones.has("water");
            this.noGravity = this.currentZones.has("flipG");



            // EXITING/ENTERING WATER
            if (!this.wasInWater && this.inWater) { // Entering water
                // Play splash sfx or smth
            }
            if (this.wasInWater && !this.inWater) { // Exiting water
                this.jump();
            }

            this.wasInWater = this.inWater;


            // EXITING GRAVITY FLIP
            if (this.wasNoGravity && !this.noGravity) {
                this.body.setGravityY(this.playerGravity)
                this.gravityDir = 1
                this.setScale(this.scaleX, Math.abs(this.scaleY));
                this.body.setOffset(3, 3);
            }

            this.wasNoGravity = this.noGravity;


            // HANDLE SWIMMING
            if (this.inWater) {
                this.body.setGravityY(this.swimmingGravityChange)
                this.MAX_VELOCITY = 120;
                this.MAX_FALLING_VELOCITY = 225;

                if (jumpPressed) {
                    this.swim();
                }
            } 


            // HANDLE GRAVITY FLIP
            else if (this.noGravity) {
                
                this.MAX_FALLING_VELOCITY = 275;

                // Check if player is falling vertically too fast
                if (this.body.velocity.y < -this.MAX_FALLING_VELOCITY) {
                    this.setVelocityY(-this.MAX_FALLING_VELOCITY);
                }

                // Flip gravity when jump pressed
                if ((this.body.blocked.down || this.body.blocked.up) && jumpPressed) {
                    this.gravityFlip();
                }
            } 

            // HANDLE NORMAL STATE
            else {

                // Reset gravity/speed if it was altered
                this.body.gravity.y = this.playerGravity;
                this.MAX_VELOCITY = 170;
                this.MAX_FALLING_VELOCITY = 400;
                
                if (this.body.blocked.down && jumpPressed) {
                    this.jump();
                }

                // Cut jump velocity if released early
                if (this.isJumping && jumpReleased && this.body.velocity.y < 0) {
                    this.setVelocityY(this.body.velocity.y * this.jumpCutPower);
                    this.isJumping = false;
                }
            }


            // Attacking Input
            if (!this.isAttacking && this.canAttack && 
                (Phaser.Input.Keyboard.JustDown(this.inputKeys.cursors.down) || 
                Phaser.Input.Keyboard.JustDown(this.inputKeys.keys.S))
            ) {
                this.attack();
            }

            // Move slash with player
            if (this.isAttacking && this.slashSprite) {
                const { x: offsetX, y: offsetY } = this.attackOffset;
                this.slashSprite.setPosition(this.x + offsetX, this.y + offsetY);
                this.attackHitbox.setPosition(this.x + offsetX, this.y + offsetY);
            }


            // ANIMATION LOGIC
            else {
                if (!this.isAttacking && !this.isHurt) { // If player isn't attacking or hurt
                    if (this.inWater) { // Play water specific anims
                        this.anims.play('swim', true);
                    }
                    else if (!this.body.blocked.down && this.anims.currentAnim?.key !== 'jump') {
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

    jump() {
        this.isJumping = true;
        this.setVelocityY(this.JUMP_VELOCITY);
        this.scene.sound.play("jump", { volume: 0.4 });
    }

    swim() {
        this.swimPressed = true;
        this.setVelocityY(this.JUMP_VELOCITY + 290);
        //this.scene.sound.play("jump", { volume: 0.4 });

        // Need a cooldown on swim because you don't need to be on the ground to do it
        this.scene.time.delayedCall(this.swimCooldown, () => {
            this.canSwim = true;
        });
    }

    gravityFlip() {
        // Flip gravity
        this.gravityDir *= -1; 
        
        // Modify player hitbox
        if (this.gravityDir === -1) {
            this.body.setOffset(3, 16);
            this.body.setGravityY(this.gravityChange)
        } else {
            this.body.setOffset(3, 3);
            this.body.setGravityY(this.playerGravity)
        }

        // Flip player sprite
        this.setScale(this.scaleX, this.scaleY * -1);
    }



    attack(){
        this.isAttacking = true;
        this.canAttack = false;
        this.attackHitbox.active = true;


        // Play swimming attack anim
        if (this.isSwimming) {
            this.anims.play('attack', true);
            this.scene.sound.play("swoosh", { volume: 0.2 });
        }
        // Else play regular attack anim
        else {
            this.anims.play('attack', true);
            this.scene.sound.play("swoosh", { volume: 0.2 });
        }
        
        // Slash hitbox/animation offset
        const facingLeft = this.flipX;
        // Pick correct group: normal or flipped
        const offsetGroup = (this.gravityDir === 1) ? this.attackOffsets.normal : this.attackOffsets.flipped;

        // Pick left/right offsets based on facing direction
        const offset = facingLeft ? offsetGroup.left : offsetGroup.right;

        // Store for later use
        this.attackOffset = offset;

        const { x: offsetX, y: offsetY } = offset;


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

            this.scene.sound.play("hurt", { volume: 0.5 });

            // Flash transparency for invincibility frames
            this.flashTween = this.scene.time.addEvent({
                delay: 150,
                callback: () => {
                    this.alpha = this.alpha === 1 ? 0 : 1;
                },
                loop: true
            });

            // isHurt should only be true briefly, so other anims can play again (blocks them otherwise)
            this.scene.time.delayedCall(400, () => {
                // TODO: add hurt animation
                this.isHurt = false;
            });

            // Reset canTakeDamage flag and stop flashing
            this.scene.time.delayedCall(this.damageCooldown, () => {
                this.canTakeDamage = true;
                this.isHurt = false;

                // Stop flashing and reset opacity
                if (this.flashTween) {
                    this.flashTween.remove();
                    this.setAlpha(1);
                }
            });
        }
    }
}