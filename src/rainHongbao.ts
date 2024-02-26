import Config from "./config.js";
export default class RainHongbao extends Phaser.GameObjects.GameObject{
    xPos : number;
    yPos : number;
    scene: Phaser.Scene;
    depth : number;
    // emoticon : Phaser.GameObjects.Image;
    // hongbaoSpine : SpineGameObject;
    // winText : Phaser.GameObjects.BitmapText;
    hongbaoEmitter : Phaser.GameObjects.Particles.ParticleEmitter;
    constructor(scene : Phaser.Scene, type : string, x : number, y : number, depth : number = 11){
        super(scene,type);
        this.xPos = x;
        this.yPos = y;
        this.scene = scene;
        this.depth = depth?depth:0;

        // this.emoticon = this.scene.add.image(this.xPos, this.yPos,'sad.png').setOrigin(.5,1).setDepth(this.depth).setVisible(true)

        // this.hongbaoSpine = this.scene.add.spine(this.xPos,this.yPos,'hongbao','idle',true).setDepth(this.depth).setVisible(true);
        // this.hongbaoSpine.timeScale = 1.3
        // this.winText = this.scene.add.bitmapText(this.xPos,this.yPos-180,'fugaz','0',80).setOrigin(.5).setDepth(this.depth).setLetterSpacing(-5).setVisible(true)
        
        this.hongbaoEmitter = this.scene.add.particles(0,0,'hongbao-particle',{
            x : {min : 0, max : Config.width},//this.xPos,
            y : 0,
            frame : [0,1,2,3,4],
            rotate : { start : 0, end : 180},
            lifespan : {min : 1000, max: 2000},
            frequency : -1,
            gravityY : 30,
            angle : {min : 0, max: 180},
            speedY : 400,//{min : 500, max: 1000},
            speedX : {min : -100, max: 100},
            scale : {min : .5, max: 1},
        }).setDepth(depth)
    }
    setRain(isRaining:boolean){
        if(isRaining){
            this.hongbaoEmitter.flow(100)
        }else{
            this.hongbaoEmitter.flow(-1)
        }
    }
}