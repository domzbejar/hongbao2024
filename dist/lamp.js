export default class Lamp extends Phaser.GameObjects.GameObject {
    constructor(scene, type, x, y) {
        super(scene, type);
        this.xPos = x;
        this.yPos = y;
        this.scene = scene;
        const anim = ["idle1", "idle2", "idle3", "idle4"];
        this.lamp = this.scene.add.spine(x, y, 'lamp', anim[Math.floor(Math.random() * anim.length)], true);
        const intensity = Phaser.Math.FloatBetween(.4, .8);
        this.light = this.scene.lights.addLight(x, y + 15, 80).setColor(0xffffff).setIntensity(intensity).setOrigin(.5);
        this.scene.tweens.add({
            targets: this.light,
            delay: Phaser.Math.Between(0, 200),
            x: Math.random() > .5 ? x + 30 : x - 30,
            duration: Phaser.Math.Between(300, 500),
            scaleX: .4,
            scaleY: .4,
            yoyo: true,
            repeat: -1,
            intensity: intensity / 4
        });
    }
}
//# sourceMappingURL=lamp.js.map