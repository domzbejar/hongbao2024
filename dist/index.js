import MainScene from './main.js';
const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    scene: [MainScene],
    scale: {
        width: 1080,
        height: 610,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.ScaleModes.FIT,
    },
    plugins: {
        scene: [
            { key: "SpinePlugin", plugin: SpinePlugin, mapping: "spine" }
        ]
    },
};
const game = new Phaser.Game(config);
//# sourceMappingURL=index.js.map