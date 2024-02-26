import Config from "./config.js";
export default class RainHongbao extends Phaser.GameObjects.GameObject {
    constructor(scene, type, x, y, depth = 11) {
        super(scene, type);
        this.xPos = x;
        this.yPos = y;
        this.scene = scene;
        this.depth = depth ? depth : 0;
        this.hongbaoEmitter = this.scene.add.particles(0, 0, 'hongbao-particle', {
            x: { min: 0, max: Config.width },
            y: 0,
            frame: [0, 1, 2, 3, 4],
            rotate: { start: 0, end: 180 },
            lifespan: { min: 1000, max: 2000 },
            frequency: -1,
            gravityY: 30,
            angle: { min: 0, max: 180 },
            speedY: 400,
            speedX: { min: -100, max: 100 },
            scale: { min: .5, max: 1 },
        }).setDepth(depth);
    }
    setRain(isRaining) {
        if (isRaining) {
            this.hongbaoEmitter.flow(100);
        }
        else {
            this.hongbaoEmitter.flow(-1);
        }
    }
}
//# sourceMappingURL=rainHongbao.js.map