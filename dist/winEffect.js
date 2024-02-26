import Config from "./config.js";
import audioMarkers from "./helper/audioMarker.js";
export default class WinEffect extends Phaser.GameObjects.GameObject {
    constructor(scene, type, x, y, depth = 10) {
        var _a;
        super(scene, type);
        this.customTextAnimating = false;
        this.xPos = x;
        this.yPos = y;
        this.scene = scene;
        this.depth = depth;
        this.MAINSCENE = this.scene.scene.get('MainScene');
        const glitterConfig = {
            x: x,
            y: y,
            frame: 'glitter.png',
            lifespan: 1000,
            quantity: 3,
            frequency: 100,
            scaleX: 0,
            scaleY: 0,
            emitZone: {
                source: new Phaser.Geom.Rectangle(-300, -200, 600, 400),
                quantity: 24,
                type: 'random'
            },
        };
        this.tallyLoopSfx = this.scene.sound.add('all-sfx');
        this.tallyLoopSfx.addMarker(audioMarkers[3]);
        this.overlay = this.scene.add.graphics();
        this.overlay.fillStyle(0x644a2e, .7);
        this.overlay.fillRect(0, 0, Config.width, Config.height);
        this.overlay.setBlendMode('MULTIPLY').setDepth(depth);
        this.rays2 = this.scene.add.image(this.xPos, this.yPos, 'hongbao2024', 'rays2.png').setScale(5).setDepth(depth).setBlendMode('ADD');
        this.bg_spine = this.scene.add.spine(this.xPos, this.yPos + 250, 'winspine', 'idle', true).setDepth(depth);
        this.glitterEmitter = this.scene.add.particles(0, 0, 'hongbao2024', glitterConfig).setDepth(depth);
        this.rays1 = this.scene.add.image(this.xPos, this.yPos, 'hongbao2024', 'rays1.png').setScale(5).setDepth(depth).setBlendMode("ADD");
        this.treasure_god = this.scene.add.spine(this.xPos, this.yPos + 85, 'god-spine', 'happy', true).setDepth(depth);
        this.scroll = this.scene.add.spine(this.xPos, this.yPos + 145, 'scroll', 'close', false).setDepth(depth).setScale(.9);
        this.firecracker_left = this.scene.add.spine(this.xPos - 250, this.yPos - 280, 'firecracker', 'idle3', true).setDepth(depth).setScale(1);
        this.firecracker_right = this.scene.add.spine(this.xPos + 250, this.yPos - 280, 'firecracker', 'idle3', true).setDepth(depth).setScale(1);
        this.customText = this.scene.add.group();
        this.glitterEmitter.onParticleEmit((particle) => {
            this.scene.tweens.add({
                targets: particle,
                scaleX: 1,
                scaleY: 1,
                duration: 500,
                yoyo: true,
                ease: 'sine.in'
            });
        });
        this.coinEmitter = this.scene.add.particles(0, 0, 'coin-particle', {
            x: { min: 0, max: Config.width },
            y: 0,
            frame: [0, 1, 2, 3],
            rotate: { start: 0, end: 180 },
            lifespan: { min: 700, max: 1000 },
            frequency: 100,
            gravityY: 400,
            angle: { min: 0, max: 180 },
            speedY: { min: 500, max: 1000 },
            speedX: { min: -100, max: 100 },
            scale: { min: .5, max: 1 },
        }).setDepth(depth);
        this.hongbaoEmitter = this.scene.add.particles(0, 0, 'hongbao-particle', {
            x: { min: 0, max: Config.width },
            y: 0,
            frame: [0, 1, 2, 3, 4],
            rotate: { start: 0, end: 180 },
            lifespan: { min: 1000, max: 2000 },
            frequency: 100,
            gravityY: 30,
            angle: { min: 0, max: 180 },
            speedY: 400,
            speedX: { min: -100, max: 100 },
            scale: { min: .5, max: 1 },
        }).setDepth(depth);
        this.scene.tweens.add({
            targets: this.rays2,
            duration: 1500,
            rotation: Phaser.Math.DegToRad(360),
            repeat: -1,
        });
        this.scene.tweens.add({
            targets: this.rays1,
            duration: 1000,
            rotation: Phaser.Math.DegToRad(-360),
            repeat: -1,
        });
        this.isVisible = true;
        this.setVisibility(false);
        (_a = this.scene.input.keyboard) === null || _a === void 0 ? void 0 : _a.on('keydown', (event) => {
        });
    }
    setVisibility(isVisible) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        this.overlay.setVisible(isVisible);
        (_a = this.bg_spine) === null || _a === void 0 ? void 0 : _a.setVisible(isVisible);
        this.treasure_god.setVisible(isVisible);
        (_b = this.scroll) === null || _b === void 0 ? void 0 : _b.setVisible(isVisible);
        (_c = this.winText) === null || _c === void 0 ? void 0 : _c.setVisible(isVisible);
        this.customText.setVisible(isVisible);
        this.rays2.setVisible(isVisible);
        this.rays1.setVisible(isVisible);
        (_d = this.firecracker_left) === null || _d === void 0 ? void 0 : _d.setVisible(isVisible);
        (_e = this.firecracker_right) === null || _e === void 0 ? void 0 : _e.setVisible(isVisible);
        if (isVisible) {
            (_f = this.coinEmitter) === null || _f === void 0 ? void 0 : _f.flow(100);
            (_g = this.glitterEmitter) === null || _g === void 0 ? void 0 : _g.flow(100);
            (_h = this.hongbaoEmitter) === null || _h === void 0 ? void 0 : _h.flow(100);
        }
        else {
            (_j = this.coinEmitter) === null || _j === void 0 ? void 0 : _j.flow(-1);
            (_k = this.glitterEmitter) === null || _k === void 0 ? void 0 : _k.flow(-1);
            (_l = this.hongbaoEmitter) === null || _l === void 0 ? void 0 : _l.flow(-1);
            (_m = this.scroll) === null || _m === void 0 ? void 0 : _m.setAnimation(0, 'close', false);
        }
        this.isVisible = isVisible;
    }
    displayCusrtomFont(amount, duration = 3000) {
        let char = amount.toString();
        let decimal_index = char.indexOf(".");
        if (decimal_index > -1) {
            char = char.substring(0, decimal_index) + char.substring(decimal_index + 1, char.length);
        }
        if (this.customTextAnimating)
            return console.log('Calculating!');
        if (char.length > 7)
            return console.log('Error: MAX CHAR LENGTH');
        this.customTextAnimating = true;
        const charCount = char.length;
        const time_duration = duration / charCount;
        const xOffset = (charCount * 60) / 2;
        this.customText.clear(true, true);
        for (let i = 0; i < charCount; i++) {
            const text = this.scene.add.bitmapText(this.xPos - 185 + (i * 60), this.yPos + 145, 'fugaz', '0', 80).setOrigin(.5).setDepth(this.depth);
            this.customText.add(text);
        }
        Phaser.Actions.SetX(this.customText.getChildren(), this.xPos + 30 - xOffset, 60);
        const decimal_pos = this.customText.getChildren()[decimal_index];
        const decimal_point = this.scene.add.bitmapText(0, 0, 'fugaz', '.', 80).setOrigin(.5).setDepth(this.depth);
        if (decimal_index > -1) {
            decimal_point.setPosition(decimal_pos.x - 30, this.yPos + 145);
        }
        this.tallyLoopSfx.play('tallyloop-sfx');
        this.customText.getChildren().forEach((item, i) => {
            const digit = parseInt(char[i]);
            const text = this.customText.getChildren()[i];
            this.scene.tweens.addCounter({
                from: 0,
                to: 9,
                repeat: 10 - i,
                duration: 300,
                onStart: () => {
                },
                onUpdate: (tween, data) => {
                    text.setText(data.value.toFixed(0));
                },
                onComplete: () => {
                    text.setText(digit.toString());
                    if (0 === i) {
                        this.customTextAnimating = false;
                    }
                    if (i === this.customText.getLength() - 1) {
                        this.tallyLoopSfx.stop();
                    }
                }
            });
        });
    }
    showWinAmount(win_amount) {
        var _a, _b, _c, _d, _e, _f, _g;
        this.setVisibility(true);
        (_a = this.bg_spine) === null || _a === void 0 ? void 0 : _a.setScale(0);
        (_b = this.firecracker_left) === null || _b === void 0 ? void 0 : _b.setX(this.xPos - 600);
        (_c = this.firecracker_right) === null || _c === void 0 ? void 0 : _c.setX(this.xPos + 600);
        (_d = this.treasure_god) === null || _d === void 0 ? void 0 : _d.setY(this.yPos - 500);
        (_e = this.winText) === null || _e === void 0 ? void 0 : _e.setText("0").setScale(0);
        this.displayCusrtomFont(win_amount);
        (_f = this.MAINSCENE.skipAnimBtn) === null || _f === void 0 ? void 0 : _f.setVisible(true);
        (_g = this.scroll) === null || _g === void 0 ? void 0 : _g.setY(this.yPos + 400);
        this.scene.tweens.add({
            targets: this.bg_spine,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'back.out'
        });
        this.scene.tweens.add({
            targets: this.firecracker_left,
            delay: 300,
            x: this.xPos - 250,
            duration: 500,
            ease: 'back.out'
        });
        this.scene.tweens.add({
            targets: this.firecracker_right,
            delay: 300,
            x: this.xPos + 250,
            duration: 500,
            ease: 'back.out'
        });
        this.scene.tweens.add({
            targets: this.scroll,
            delay: 300,
            y: this.yPos + 145,
            duration: 500,
            ease: 'back.out'
        });
        this.scene.tweens.add({
            targets: this.treasure_god,
            delay: 600,
            y: this.yPos + 85,
            duration: 500,
            ease: 'back.out',
            onComplete: () => {
                var _a;
                (_a = this.scroll) === null || _a === void 0 ? void 0 : _a.setAnimation(0, 'open', false);
            }
        });
        this.scene.tweens.add({
            targets: this.winText,
            scaleX: 1,
            scaleY: 1,
            ease: 'back.out',
            duration: 300,
            delay: 1200,
            onComplete: () => {
                this.scene.tweens.addCounter({
                    from: 0,
                    to: win_amount,
                    duration: 3000,
                    onStart: () => { },
                    onUpdate: (tween, data) => {
                        var _a;
                        (_a = this.winText) === null || _a === void 0 ? void 0 : _a.setText(data.value.toFixed(2));
                    },
                    onComplete: () => { }
                });
            }
        });
    }
}
//# sourceMappingURL=winEffect.js.map