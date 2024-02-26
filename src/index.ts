//import { SpinePlugin } from '@esotericsoftware/spine-phaser';
import MainScene from './main.js';
//import { SpinePlugin } from '@esotericsoftware/spine-phaser';
// namespace window{
//     interface SpinePlugin{}
// }
const config  = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    
    scene: [MainScene],
    scale : {
        width: 1080,
        height: 610,
        autoCenter : Phaser.Scale.CENTER_BOTH,
        mode : Phaser.Scale.ScaleModes.FIT,
    },
    plugins: {
        scene: [
            { key: "SpinePlugin", plugin: SpinePlugin, mapping: "spine" }
            // {
                //     plugin: window.PhaserMatterCollisionPlugin, // The plugin class
                //     key: "matterCollision", // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
                //     mapping: "matterCollision" // Where to store in the Scene, e.g. scene.matterCollision
                // }
                //{ key: "spine.SpinePlugin", plugin: Window.SpinePlugin, mapping: "spine" }
            ]
    },
};

const game = new Phaser.Game(config);
