import audioMarkers from "./helper/audioMarker.js";
import DummyData from "./helper/dummyData.js";
export default class WinEffectSmall extends Phaser.GameObjects.GameObject {
    constructor(scene, type, x, y, depth) {
        var _a;
        super(scene, type);
        this.hongbaoPos = {
            x: 0,
            y: 0,
        };
        this.win_amount = 0;
        this.scene = scene;
        this.xPos = x;
        this.yPos = y;
        this.hongbaoPos.x = x;
        this.hongbaoPos.y = y;
        this.tallySfx = this.scene.sound.add('all-sfx');
        this.tallySfx.addMarker(audioMarkers[3]);
        this.scene.anims.create({
            key: 'flip',
            frameRate: 16,
            frames: this.scene.anims.generateFrameNumbers('coin-sprite.png'),
            repeat: -1,
        });
        this.coinEmitter = this.scene.add.particles(0, 0, 'coin-sprite.png', {
            x: this.xPos,
            y: this.scene.scale.height + 20 - 200,
            lifespan: { min: 2200, max: 4000 },
            speed: 900,
            frequency: -1,
            scale: { min: .3, max: .5 },
            gravityY: 800,
            angle: {
                min: 250,
                max: 290
            },
            rotate: { min: 1, max: 360 },
        }).setDepth(depth).setAnim('flip');
        this.hongbaoSpine = this.scene.add.spine(this.xPos, this.yPos, 'hongbao', 'idle', true).setDepth(depth).setVisible(false);
        this.hongbaoSpine.timeScale = 1.3;
        this.winText = this.scene.add.bitmapText(this.xPos, this.yPos - 180, 'fugaz', '0', 80).setOrigin(.5).setDepth(depth).setLetterSpacing(-5).setVisible(false);
        this.emoticon = this.scene.add.image(this.xPos - 30, this.yPos + 30, 'hongbao2024', 'sad.png').setOrigin(.5, 1).setDepth(depth).setVisible(false);
        this.coinEmitter2 = this.scene.add.particles(0, 0, 'coin-sprite.png', {
            x: this.xPos,
            y: this.yPos - 280,
            lifespan: { min: 2200, max: 4000 },
            speed: 400,
            frequency: -1,
            scale: { min: .3, max: .5 },
            gravityY: 700,
            angle: {
                min: 250,
                max: 290
            },
            rotate: { min: 1, max: 360 },
        }).setDepth(depth).setAnim('flip');
        (_a = this.scene.input.keyboard) === null || _a === void 0 ? void 0 : _a.on('keydown', (event) => {
        });
    }
    honbaoPosition(x, y) {
        this.hongbaoPos.x = x;
        this.hongbaoPos.y = y;
        this.hongbaoSpine.setPosition(x, y);
        this.winText.setPosition(x, y - 250);
    }
    showWinAmount(amount, showCoins = true) {
        this.win_amount = amount;
        this.hongbaoSpine.setVisible(true);
        this.scene.tweens.add({
            targets: this.hongbaoSpine,
            y: 400,
            duration: 400,
            scaleX: 2.2,
            scaleY: 2.2,
            ease: 'back.out',
            onComplete: () => {
                this.hongbaoSpine.setAnimation(0, 'open', false);
                setTimeout(() => {
                    this.winText.setScale(0).setVisible(true).setY(this.yPos - 180);
                    this.scene.tweens.add({
                        targets: this.winText,
                        duration: 400,
                        ease: 'back.out',
                        easeParams: [8],
                        scaleX: 1,
                        scaleY: 1,
                        y: this.yPos - 230
                    });
                    this.tweenCounter = this.scene.tweens.addCounter({
                        delay: 400,
                        from: 0,
                        to: amount,
                        duration: 2000,
                        onStart: () => {
                            this.tallySfx.play('tallyloop-sfx');
                        },
                        onUpdate: (tween, data) => {
                            this.winText.setText(data.value.toFixed(2));
                        },
                        onComplete: () => {
                            this.tallySfx.stop();
                        }
                    });
                }, 500);
                if (showCoins) {
                    this.coinEmitter.flow(60);
                    this.coinEmitter2.flow(200);
                }
                else {
                    this.coinEmitter.flow(-1);
                    this.coinEmitter2.flow(-1);
                }
            }
        });
    }
    reset() {
        this.winText.setText(`0`).setVisible(false).setY(this.yPos - 180);
        this.coinEmitter.flow(-1);
        this.coinEmitter2.flow(-1);
        this.hongbaoSpine.setPosition(this.hongbaoPos.x, this.hongbaoPos.y).setScale(1).setVisible(false);
        this.hongbaoSpine.setAnimation(0, 'idle', false);
        this.emoticon.setVisible(false);
    }
    showEmoticon(type) {
        this.scene.tweens.killTweensOf(this.emoticon);
        this.emoticon.setVisible(true).setScale(0);
        this.emoticon.setFrame(`${type}.png`);
        this.scene.tweens.add({
            delay: 300,
            targets: this.emoticon,
            duration: 400,
            scaleX: 1,
            scaleY: 1,
            ease: 'back.out',
            easeParams: [4],
        });
    }
    skipAnimation() {
        var _a;
        this.scene.tweens.killTweensOf(this.hongbaoSpine);
        this.scene.tweens.killTweensOf(this.winText);
        if ((_a = this.tweenCounter) === null || _a === void 0 ? void 0 : _a.isPlaying()) {
            this.tweenCounter.complete();
        }
        this.scene.tweens.killTweensOf(this.emoticon);
        this.hongbaoSpine.setAnimation(0, 'idle', false);
        this.hongbaoSpine.setScale(2.2).setY(400).setVisible(true);
        this.winText.setText(`${DummyData.GetResult().win_amount.toFixed(2)}`).setScale(1.7).setVisible(true).setY(this.yPos - 230);
        if (DummyData.GetResult().isWin) {
            this.coinEmitter.flow(60);
            this.coinEmitter2.flow(200);
        }
    }
}
//# sourceMappingURL=winEffectSmall.js.map