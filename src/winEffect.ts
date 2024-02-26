import Config from "./config.js";
import MainScene from "./main.js";
import audioMarkers from "./helper/audioMarker.js"; //this.scene.sound.play('all-sfx',audioMarkers[0])

export default class WinEffect extends Phaser.GameObjects.GameObject{
    xPos : number;
    yPos : number;
    scene: Phaser.Scene;
    treasure_god : SpineGameObject;
    bg_spine ?: SpineGameObject;
    scroll ?: SpineGameObject;
    firecracker_left ?: SpineGameObject;
    firecracker_right ?: SpineGameObject;
    coinEmitter ?: Phaser.GameObjects.Particles.ParticleEmitter;
    hongbaoEmitter ?: Phaser.GameObjects.Particles.ParticleEmitter;
    glitterEmitter ?: Phaser.GameObjects.Particles.ParticleEmitter;
    winText ?: Phaser.GameObjects.BitmapText;
    overlay : Phaser.GameObjects.Graphics;
    rays1 : Phaser.GameObjects.Image;
    rays2 : Phaser.GameObjects.Image;
    isVisible : boolean;
    //customText : Phaser.GameObjects.BitmapText[] = [];
    customText : Phaser.GameObjects.Group;
    depth : number;
    customTextAnimating : boolean= false;
    MAINSCENE : MainScene;
    tallyLoopSfx : Phaser.Sound.BaseSound
    constructor(scene : Phaser.Scene, type : string, x :number, y : number, depth : number = 10){
        super(scene,type);
        this.xPos = x;
        this.yPos = y;
        this.scene=scene;
        this.depth = depth;
        this.MAINSCENE = this.scene.scene.get('MainScene') as MainScene;
        const glitterConfig : Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
            x : x,//this.xPos,
            y : y,
            //frame : 
            //lifespan: {min: 200,max : 1000},
            frame:'glitter.png',
            lifespan : 1000,
            quantity : 3,
            frequency : 100,
            scaleX: 0,
            scaleY: 0,
            emitZone : {
                source : new Phaser.Geom.Rectangle(-300,-200,600,400),
                quantity : 24,
                type : 'random'
            },
        }
        this.tallyLoopSfx = this.scene.sound.add('all-sfx');
        this.tallyLoopSfx.addMarker( audioMarkers[3] )

        this.overlay = this.scene.add.graphics();
        this.overlay.fillStyle(0x644a2e,.7);
        this.overlay.fillRect(0,0,Config.width,Config.height);
        this.overlay.setBlendMode('MULTIPLY').setDepth(depth)
        this.rays2 = this.scene.add.image(this.xPos,this.yPos,'hongbao2024','rays2.png').setScale(5).setDepth(depth).setBlendMode('ADD');
        this.bg_spine = this.scene.add.spine(this.xPos,this.yPos+250,'winspine','idle',true).setDepth(depth);
        this.glitterEmitter = this.scene.add.particles(0,0,'hongbao2024',glitterConfig).setDepth(depth)
        this.rays1 = this.scene.add.image(this.xPos,this.yPos,'hongbao2024','rays1.png').setScale(5).setDepth(depth).setBlendMode("ADD");
        this.treasure_god = this.scene.add.spine(this.xPos,this.yPos+85,'god-spine','happy',true).setDepth(depth);
        this.scroll = this.scene.add.spine(this.xPos,this.yPos+145,'scroll','close',false).setDepth(depth).setScale(.9);
        //this.winText = this.scene.add.bitmapText(this.xPos,this.yPos+145,'fugaz','1000',80).setOrigin(.5).setDepth(depth).setLetterSpacing(-5)
        this.firecracker_left = this.scene.add.spine(this.xPos-250,this.yPos-280,'firecracker','idle3',true).setDepth(depth).setScale(1);
        this.firecracker_right = this.scene.add.spine(this.xPos+250,this.yPos-280,'firecracker','idle3',true).setDepth(depth).setScale(1);

        this.customText = this.scene.add.group()
        // for(let i = 0; i < 7; i++){
        //     const text = this.scene.add.bitmapText(this.xPos-185+(i*60),this.yPos+145,'fugaz','0',80).setOrigin(.5).setDepth(depth).setVisible(false)
        //     this.customText.add(text);
        // }
        
        //console.log( this.customText.getLength() )
        // Add a tween to each particle
        this.glitterEmitter.onParticleEmit((particle)=>{
            this.scene.tweens.add({
                targets : particle,
                scaleX : 1,
                scaleY :1,
                duration : 500,
                yoyo : true,
                ease :'sine.in'
            })
        })

        this.coinEmitter = this.scene.add.particles(0,0,'coin-particle',{
            x : {min : 0, max : Config.width},//this.xPos,
            y : 0,
            frame : [0,1,2,3],
            rotate : { start : 0, end : 180},
            lifespan : {min : 700, max: 1000},
            frequency : 100,
            gravityY : 400,
            angle : {min : 0, max: 180},
            speedY : {min : 500, max: 1000},
            speedX : {min : -100, max: 100},
            scale : {min : .5, max: 1},
        }).setDepth(depth)

        this.hongbaoEmitter = this.scene.add.particles(0,0,'hongbao-particle',{
            x : {min : 0, max : Config.width},//this.xPos,
            y : 0,
            frame : [0,1,2,3,4],
            rotate : { start : 0, end : 180},
            lifespan : {min : 1000, max: 2000},
            frequency : 100,
            gravityY : 30,
            angle : {min : 0, max: 180},
            speedY : 400,//{min : 500, max: 1000},
            speedX : {min : -100, max: 100},
            scale : {min : .5, max: 1},
        }).setDepth(depth)

        this.scene.tweens.add({
            targets : this.rays2,
            duration : 1500,
            rotation : Phaser.Math.DegToRad(360),
            repeat : -1,
        })
        this.scene.tweens.add({
            targets : this.rays1,
            duration : 1000,
            rotation : Phaser.Math.DegToRad(-360),
            repeat : -1,
        })
        this.isVisible = true;
        this.setVisibility(false)

        this.scene.input.keyboard?.on('keydown',(event : KeyboardEvent)=>{
            // if(event.key === '0'){
            //     this.displayCusrtomFont(30281)
            // }
            // if(event.key === '1'){
            //     this.displayCusrtomFont(30.281)
            // }
        })
    }
    setVisibility(isVisible:boolean){
        this.overlay.setVisible(isVisible)
        this.bg_spine?.setVisible(isVisible);
    
        this.treasure_god.setVisible(isVisible);
        this.scroll?.setVisible(isVisible);
        this.winText?.setVisible(isVisible);
        this.customText.setVisible(isVisible)
        
        this.rays2.setVisible(isVisible)
        this.rays1.setVisible(isVisible)
        this.firecracker_left?.setVisible(isVisible)
        this.firecracker_right?.setVisible(isVisible)
        

        if(isVisible){
            this.coinEmitter?.flow(100)
            this.glitterEmitter?.flow(100)
            this.hongbaoEmitter?.flow(100)
        }else{
            this.coinEmitter?.flow(-1)
            this.glitterEmitter?.flow(-1)
            this.hongbaoEmitter?.flow(-1)
            this.scroll?.setAnimation(0,'close',false);
        }
        this.isVisible = isVisible;
    }
    displayCusrtomFont(amount : number , duration : number = 3000){
        let char = amount.toString();
        let decimal_index = char.indexOf(".");
        if(decimal_index > -1){
            char = char.substring(0, decimal_index)+char.substring(decimal_index+1,char.length); //removes the decimal
        }
        // console.log(char)
        // debugger
        if(this.customTextAnimating)return console.log('Calculating!');
        if(char.length > 7)return console.log('Error: MAX CHAR LENGTH');
        this.customTextAnimating =true;
        
        const charCount = char.length;
        const time_duration = duration/charCount
        const xOffset = (charCount * 60)/2; //to center text
        this.customText.clear(true,true); //remove all children
        for(let i = 0; i < charCount; i++){
            const text = this.scene.add.bitmapText(this.xPos-185+(i*60),this.yPos+145,'fugaz','0',80).setOrigin(.5).setDepth(this.depth)
            this.customText.add(text);
        }
        
        Phaser.Actions.SetX( this.customText.getChildren(),this.xPos+30-xOffset,60);

        const decimal_pos = this.customText.getChildren()[decimal_index] as Phaser.GameObjects.BitmapText
        
        const decimal_point = this.scene.add.bitmapText(0,0,'fugaz','.',80).setOrigin(.5).setDepth(this.depth)
        if(decimal_index > -1){
            decimal_point.setPosition(decimal_pos.x-30,this.yPos+145)
        }
        this.tallyLoopSfx.play('tallyloop-sfx');
        this.customText.getChildren().forEach((item : Phaser.GameObjects.GameObject,i : number)=>{
            const digit : number = parseInt(char[i])
            const text = this.customText.getChildren()[i] as Phaser.GameObjects.Text
            this.scene.tweens.addCounter({
                from : 0,
                to : 9,
                repeat : 10-i,
                duration : 300,//duration - (time_duration * i),
                onStart :()=>{

                },
                onUpdate : (tween,data)=>{
                    text.setText(data.value.toFixed(0))
                },
                onComplete:()=>{
                    text.setText(digit.toString())
                    if(0 === i){
                        //this.//this.tallyLoopSfx.stop();
                        this.customTextAnimating = false; //last number animatin
                    }
                    if(i===this.customText.getLength()-1){
                        this.tallyLoopSfx.stop();
                    }
                }
            })

        })
    }
    showWinAmount(win_amount:number){
        this.setVisibility(true)
        this.bg_spine?.setScale(0);
        this.firecracker_left?.setX(this.xPos-600); //this.xPos-250
        this.firecracker_right?.setX(this.xPos+600);
        this.treasure_god?.setY(this.yPos-500); //this.yPos+85
        this.winText?.setText("0").setScale(0);
        this.displayCusrtomFont(win_amount);
        this.MAINSCENE.skipAnimBtn?.setVisible(true);

        this.scroll?.setY(this.yPos+400) //this.yPos+145
        this.scene.tweens.add({
            targets : this.bg_spine,
            scaleX : 1,
            scaleY : 1,
            duration : 500,
            ease : 'back.out'
        })
        this.scene.tweens.add({
            targets : this.firecracker_left,
            delay : 300,
            x: this.xPos-250,
            duration : 500,
            ease : 'back.out'
        })
        this.scene.tweens.add({
            targets : this.firecracker_right,
            delay : 300,
            x: this.xPos+250,
            duration : 500,
            ease : 'back.out'
        })
        this.scene.tweens.add({
            targets : this.scroll,
            delay : 300,
            y: this.yPos+145,
            duration : 500,
            ease : 'back.out'
        })
        this.scene.tweens.add({
            targets : this.treasure_god,
            delay : 600,
            y: this.yPos+85,
            duration : 500,
            ease : 'back.out',
            onComplete : ()=>{
                this.scroll?.setAnimation(0,'open',false);
            }
        })
        this.scene.tweens.add({
            targets : this.winText,
            scaleX : 1,
            scaleY : 1,
            ease : 'back.out',
            duration : 300,
            delay : 1200,
            onComplete : ()=>{
                this.scene.tweens.addCounter({
                    from : 0,
                    to : win_amount,
                    duration : 3000,
                    onStart :()=>{},
                    onUpdate : (tween,data)=>{
                        //console.log()
                        this.winText?.setText( data.value.toFixed(2) )
                    },
                    onComplete:()=>{}
                })
            }
        })

    }

}