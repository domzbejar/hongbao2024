import Config from "./config";
export default class NormalWin extends Phaser.GameObjects.GameObject {
    constructor(scene, type, x, y, depth) {
        super(scene, type);
        this.xPos = x;
        this.yPos = y;
        this.scene = scene;
        this.depth = depth ? depth : 0;
        this.emoticon = this.scene.add.image(this.xPos, this.yPos, 'sad.png').setOrigin(.5, 1).setDepth(this.depth).setVisible(true);
        this.hongbaoSpine = this.scene.add.spine(this.xPos, this.yPos, 'hongbao', 'idle', true).setDepth(this.depth).setVisible(true);
        this.hongbaoSpine.timeScale = 1.3;
        this.winText = this.scene.add.bitmapText(this.xPos, this.yPos - 180, 'fugaz', '0', 80).setOrigin(.5).setDepth(this.depth).setLetterSpacing(-5).setVisible(true);
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
    }
}
//# sourceMappingURL=normalWin.js.map