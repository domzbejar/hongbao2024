import HongbaoType from "./helper/hongbaoTypes.js";
import MainScene from "./main.js";
import Randomizer from "./helper/randomizer.js";
import audioMarkers from "./helper/audioMarker.js"; //this.scene.sound.play('all-sfx',audioMarkers[0])
import Dialouge from "./dialouge.js";

export default class IntroScene extends Phaser.GameObjects.GameObject{
    scene: Phaser.Scene;
    xPos : number;
    yPos : number;
    depth : number;
    hongbaoTable : Phaser.GameObjects.Image;
    imageFg : Phaser.GameObjects.Image;
    dinnerBg : Phaser.GameObjects.Image;
    cheapMsg : Phaser.GameObjects.Image;
    doorLamps : SpineGameObject;
    chair : SpineGameObject;
    boy2 : SpineGameObject;
    lady : SpineGameObject;
    father : SpineGameObject;
    tableSpine : SpineGameObject;
    boy1 : SpineGameObject;
    boy3 : SpineGameObject;
    skipBtn : Phaser.GameObjects.Image;
    timeout ?: ReturnType<typeof setTimeout>;
    isPlaying : boolean = false;
    UI : Phaser.GameObjects.Container;
    //playerhand : Phaser.GameObjects.Container;
    supriseMgs ?: Phaser.GameObjects.Group;
    timerDelay ?: ReturnType<typeof setTimeout>
    MAINSCENE : MainScene;
    nametag_group : Phaser.GameObjects.Group;
    chatDialouge : Phaser.GameObjects.Group
    spineCharacters ?: SpineGameObject[];
    constructor(scene : Phaser.Scene, type : string, x : number, y : number,depth : number, ui : Phaser.GameObjects.Container){
        super(scene,type)
        this.scene = scene;
        this.xPos = x;
        this.yPos = y;
        this.depth = depth;
        this.UI = ui;
        this.MAINSCENE = this.scene.scene.get('MainScene') as MainScene
        this.skipBtn = this.scene.add.image(this.xPos-450,this.yPos+260,'hongbao2024','btn-skip.png').setScale(.9).setDepth(this.depth+1).setInteractive();
        
        this.skipBtn.on('pointerdown',()=>{
            this.scene.sound.play('all-sfx',audioMarkers[0])
            this.skip();
            //this.MAINSCENE.ChangeState(HongbaoType.GAME_STATES.NEW_GAME)
            this.MAINSCENE.ChangeState(HongbaoType.GAME_STATES.STAND_BY)
        })

        this.UI.setY(200);
        this.nametag_group = this.scene.add.group();
    
        this.dinnerBg = this.scene.add.image(this.xPos,this.yPos,'bg-moon.png').setDepth(this.depth);
        this.doorLamps = this.scene.add.spine(this.xPos,this.yPos,'dinner','doors-idle',true).setDepth(this.depth);
        this.chair = this.scene.add.spine(this.xPos,this.yPos-50,'dinner','chair',false).setDepth(this.depth);
        this.boy2 = this.scene.add.spine(this.xPos-260,this.yPos-30,'family','boy2',true).setDepth(this.depth);
        this.lady = this.scene.add.spine(this.xPos,this.yPos-30,'family','lady',true).setDepth(this.depth);
        this.father = this.scene.add.spine(this.xPos+260,this.yPos-50,'family','man',true).setDepth(this.depth); //original man
        this.tableSpine = this.scene.add.spine(this.xPos,this.yPos-70,'dinner','table-idle',true).setDepth(this.depth);
        this.hongbaoTable = this.scene.add.image(this.xPos,this.yPos+108+600,'hongbao2024','table.png').setDepth(this.depth);
        this.boy1 = this.scene.add.spine(this.xPos-420,this.yPos+180,'family','boy1',true).setDepth(this.depth);
        this.boy3 = this.scene.add.spine(this.xPos+400,this.yPos+200,'family','boy3',true).setDepth(this.depth); //original boy3

        const boy1_name = this.scene.add.text(this.boy1.x,this.boy1.y - 270, Randomizer.username(),{ fontSize : 20 }).setOrigin(.5).setDepth(this.depth).setStroke('#111111',5)
        const boy2_name = this.scene.add.text(this.boy2.x,this.boy2.y - 240, Randomizer.username(),{ fontSize : 20 }).setOrigin(.5).setDepth(this.depth).setStroke('#111111',5)
        const boy3_name = this.scene.add.text(this.boy3.x,this.boy3.y - 250, Randomizer.username(),{ fontSize : 20 }).setOrigin(.5).setDepth(this.depth).setStroke('#111111',5)
        const lady_name = this.scene.add.text(this.lady.x,this.lady.y - 240, Randomizer.username(),{ fontSize : 20 }).setOrigin(.5).setDepth(this.depth).setStroke('#111111',5)
        const father_name = this.scene.add.text(this.father.x,this.father.y - 200, Randomizer.username(),{ fontSize : 20 }).setOrigin(.5).setDepth(this.depth).setStroke('#111111',5)
        
        this.spineCharacters = [this.boy1,this.boy2, this.boy3, this.lady,this.father ];
        this.nametag_group.addMultiple([ boy1_name,boy2_name,boy3_name,lady_name,father_name])
        this.nametag_group.setVisible(false);
        // this.playerhand = this.scene.add.container()
        // const mainhand = this.scene.add.image(this.xPos,this.yPos+330,'hand-empty.png').setOrigin(.5,1);
        // // const leftHand = this.scene.add.image(this.xPos,this.yPos+330,'characters','hand-open.png').setOrigin(.5,1);
        // // const rightHand = this.scene.add.image(this.xPos+60,this.yPos+330,'characters','hand-open.png').setOrigin(.5,1).setFlipX(true);
        // this.playerhand.add(mainhand).setDepth(this.depth).setY(200)

        this.supriseMgs = this.scene.add.group();
        const supriseP1dialouge = this.scene.add.image(this.xPos-420, this.yPos-90,'hongbao2024','huh.png').setDepth(depth).setScale(1.5).setOrigin(.5,1);
        const supriseP2dialouge = this.scene.add.image(this.xPos-310, this.yPos-180,'hongbao2024','huh.png').setDepth(depth).setScale(1.5).setOrigin(.5,1);
        const supriseP3dialouge = this.scene.add.image(this.xPos-70, this.yPos-190,'hongbao2024','huh.png').setDepth(depth).setScale(1.5).setOrigin(.5,1);
        const supriseP4dialouge = this.scene.add.image(this.xPos+210, this.yPos-180,'hongbao2024','huh.png').setDepth(depth).setScale(1.5).setOrigin(.5,1);
        const supriseP5dialouge = this.scene.add.image(this.xPos+400, this.yPos-20,'hongbao2024','huh.png').setDepth(depth).setScale(1.5).setOrigin(.5,1);
        this.supriseMgs.addMultiple([ supriseP1dialouge, supriseP2dialouge, supriseP3dialouge,supriseP4dialouge, supriseP5dialouge , ])
        this.supriseMgs.setVisible(false);

        this.chatDialouge = this.scene.add.group();
        const dialouge1 = new Dialouge(this.scene,this.xPos-420, this.yPos-90,'dialouge');
        const dialouge2 = new Dialouge(this.scene,this.xPos-370, this.yPos-220,'dialouge');
        const dialouge3 = new Dialouge(this.scene,this.xPos-70, this.yPos-250,'dialouge');
        const dialouge4 = new Dialouge(this.scene,this.xPos+300, this.yPos-250,'dialouge');
        const dialouge5 = new Dialouge(this.scene,this.xPos+400, this.yPos-80,'dialouge');
        this.chatDialouge.addMultiple([ dialouge1, dialouge2, dialouge3, dialouge4, dialouge5]);

        this.cheapMsg = this.scene.add.image(this.xPos,this.yPos,'hongbao2024','cheap-msg.png').setOrigin(.5,1).setDepth(depth).setVisible(false);

        this.imageFg = this.scene.add.image(this.xPos,this.yPos+305,'hongbao2024','cloud-fg.png').setOrigin(.5,1).setDepth(this.depth);
        //305-462

        this.tableSpine.setMix('table-idle','table-out',0.3)
        this.lady.setMix('lady','lady-idle',0.3)
        this.boy3.setMix('boy3','boy3-idle',0.3)

        this.lady.on('interrupt',()=>{
            this.lady.setAnimation(0,'lady-idle',true);
        })
        this.boy3.on('interrupt',()=>{
            this.boy3.setAnimation(0,'boy3-idle',true);
        })

        this.scene.input.keyboard?.on('keydown',(event : KeyboardEvent)=>{
            
        })
    }
    crowdReaction(){
        this.chatDialouge.getChildren().forEach((item : Phaser.GameObjects.GameObject, i : number)=>{
            const chat_bubble = item as Dialouge;
            chat_bubble.show();
        })
    }
    characterSuprise(){
        this.supriseMgs?.setVisible(true)
        this.supriseMgs?.getChildren().forEach((item : Phaser.GameObjects.GameObject, i : number)=>{
            const msg = item as Phaser.GameObjects.Image;
            msg.setScale(0).setVisible(true);
            this.scene.tweens.killTweensOf( msg );
            this.scene.tweens.add({
                targets : msg,
                duration : 200,
                ease : 'back.out',
                scaleX : 1.5,
                scaleY : 1.5,
                delay : Phaser.Math.Between(1000,1500)
            })
        })
        //Phaser.Actions.ScaleXY(this.supriseMgs?.getChildren(),0,0)
    }
    message( cb ?: Function  ){
        this.lady.setAnimation(0,'lady-msg',false);
        this.lady.once('complete',()=>{
            //this.lady.setAnimation(0,'lady-i',true);
        })
        this.timeout = setTimeout(()=>{
            this.boy3.setAnimation(0,'boy3-msg',false);
            this.timeout = setTimeout(()=>{
                if(cb){
                    cb();
                }
            },1000)
        },700)
        
    }
    setUIVisible(isVisible :boolean){
        if(isVisible){
            this.scene.tweens.killTweensOf(this.UI)
            this.UI.setY(200);
            this.scene.tweens.add({
                targets : this.UI,
                y : 0,
                duration : 200,
                ease : 'back.out'
            })
        }else{
            this.UI.setY(200);
        }
    }
    delayPlayerEnter(){
        this.spineCharacters?.forEach((spine : SpineGameObject,i : number)=>{
            spine.setVisible(false);
            // setTimeout(()=>{
            //     spine.setVisible(true);
            //     const nametag = this.nametag_group.getChildren()[i] as Phaser.GameObjects.Text
            //     nametag.setVisible(true); 
            // },Phaser.Math.Between(500,3000))
            this.scene.time.addEvent({
                delay : Phaser.Math.Between(500,3000),
                callback : ()=>{
                    spine.setVisible(true);
                    const nametag = this.nametag_group.getChildren()[i] as Phaser.GameObjects.Text
                    nametag.setText(Randomizer.username());
                    nametag.setVisible(true); 
                }
            })
        })
    }
    skip(){
        window.clearTimeout( this.timeout )
        window.clearTimeout(this.timerDelay);
        //this.boy3.clearTracks();
        
        this.nametag_group.setVisible(false)
        this.spineVisible(false);
        this.lady.setEmptyAnimation(0);
        this.boy3.setEmptyAnimation(0);
        this.lady.setAnimation(0,'lady-idle',true);
        this.boy3.setAnimation(0,'boy3-idle',true);
        this.hongbaoTable.setY(this.yPos+108); 
        this.imageFg.setY(this.yPos+305);
        //this.playerhand.setY(0)
        this.isPlaying = false;
        this.scene.tweens.add({
            targets : this.UI,
            y : 0,
            duration : 200,
            ease : 'back.out'
        })
    }
    spineVisible( isVisible : boolean ){
         this.dinnerBg.setVisible(isVisible);
         this.tableSpine.setVisible(isVisible);
         this.skipBtn.setVisible(isVisible);
         this.chair.setVisible(isVisible);
         this.doorLamps.setVisible(isVisible);
    }
    close(){
        this.scene.tweens.add({
            targets : this.dinnerBg,
            y : -500,
            duration : 300,
            ease : 'back.in'
        })
        this.doorLamps.setAnimation(0,'doors-out',false);
        this.chair.setAnimation(0,'chair-out',false);
        this.tableSpine.setAnimation(0,'table-out',false);

        this.lady.setAnimation(0,'lady-idle',true);
        this.boy3.setAnimation(0,'boy3-idle',true);

        this.scene.tweens.add({
            targets : this.hongbaoTable,
            y : this.yPos+108,
            duration : 300,
            delay : 1000,
            ease : 'back.out'
        })
        // this.scene.tweens.add({
        //     targets : this.playerhand,
        //     y : 0,
        //     duration : 300,
        //     delay : 1200,
        //     ease : 'back.out',
        //     easeParams : [2],
        // })
        this.scene.tweens.add({
            targets : this.imageFg,
            y : this.yPos+600,
            yoyo : true,
            duration : 300,
            delay : 1200,
            ease : 'back.out',
            easeParams : [2],
            onComplete : ()=>{
                this.skipBtn.setVisible(false);
                this.scene.tweens.add({
                    targets : this.UI,
                    y : 0,
                    duration : 200,
                    ease : 'back.out'
                })
            }
        })
        //console.log( this.boy3.getAnimationList() )
    }
    setStingyMsg(x : number, y : number){
        this.scene.tweens.killTweensOf( this.cheapMsg);
        this.cheapMsg.setVisible(true).setScale(0).setPosition(x,y)
        this.scene.tweens.add({
            targets : this.cheapMsg,
            duration : 400,
            scaleX: 1,
            scaleY : 1,
            ease: 'back.out'
        })
    }
    reset(){
        this.isPlaying = false;
        this.spineVisible (true)
        this.dinnerBg.setPosition(this.xPos,this.yPos)
        this.doorLamps.setAnimation(0,'doors-idle',true);
        this.chair.setAnimation(0,'chair',true);
        this.tableSpine.setAnimation(0,'table-idle',true);

        this.lady.setAnimation(0,'lady',true);
        this.boy3.setAnimation(0,'boy3',true);
        this.nametag_group.setVisible(false)

        this.hongbaoTable.setY(this.yPos+108+600);
        this.imageFg.setY(this.yPos+305);
        //this.playerhand.setY(this.yPos+200);
        this.supriseMgs?.setVisible(false)
        this.skipBtn.setVisible(true);
        this.UI.setY(200)
        this.cheapMsg.setVisible(false);
    }
    clearName(){
        this.nametag_group.setVisible(false)
    }
    toMainScene( cb ?: Function){
        if(this.isPlaying)return console.warn("Error: Anim Playing")
        this.isPlaying = true;
        // this.timeout = setTimeout(()=>{
        //     this.message(()=>{
        //         this.close();
        //         this.timerDelay = setTimeout(()=>{
        //             if(cb){
        //                 cb();
        //             }
        //         },2000)
        //     })
        // },300)
        this.scene.time.addEvent({
            delay : 300,
            callback : ()=>{
                this.message(()=>{
                    this.close();
                    this.scene.time.addEvent({
                        delay : 2000,
                        callback : ()=>{
                            this.isPlaying = false;
                            if(cb){
                                cb();
                            }
                        }
                    })
                })
            }
        })
    }
}