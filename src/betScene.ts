import BetHandler from "./helper/betHandler.js";
import MainScene from "./main.js";
import HongbaoType,{ GameState }  from "./helper/hongbaoTypes.js";
import audioMarkers from "./helper/audioMarker.js"; //this.scene.sound.play('all-sfx',audioMarkers[0])

export default class BetScene extends Phaser.GameObjects.GameObject{
    scene: Phaser.Scene;
    xPos : number;
    yPos : number;
    isActive : boolean = true;
    depth : number;
    //root : Phaser.GameObjects.Container;
    MAINSCENE : MainScene;
    notifMessage : Phaser.GameObjects.Container
    door1 : SpineGameObject;
    door10 : SpineGameObject;
    door50 : SpineGameObject;
    door100 : SpineGameObject;
    //doorContainer :SpineContainer;
    bg : Phaser.GameObjects.Image;
    enterBtn : Phaser.GameObjects.Image;
    hasSelected : boolean = false;
    constructor(scene : Phaser.Scene,  type : string, x : number, y : number, depth : number = 91){
        super(scene,type)
        this.xPos = x;
        this.yPos = y;
        this.scene = scene;
        this.depth = depth;

        //this.root = this.scene.add.container();
        const roomGroup = this.scene.add.group();
        this.MAINSCENE = this.scene.scene.get('MainScene') as MainScene;

        this.bg = this.scene.add.image(this.xPos, this.yPos, 'bet-select-bg.png').setDepth(this.depth);

        //const room1 = this.scene.add.image(this.xPos-300, this.yPos+40, 'room-select-main','btn-room-1.png').setData('bet', 1).setInteractive();
        //const room2 = this.scene.add.image(this.xPos-100, this.yPos+40, 'room-select-main','btn-room-10.png').setData('bet', 10).setInteractive();
        //const room3 = this.scene.add.image(this.xPos+100, this.yPos+40, 'room-select-main','btn-room-50.png').setData('bet', 50).setInteractive();
        //const room4 = this.scene.add.image(this.xPos+300, this.yPos+40, 'room-select-main','btn-room-100.png').setData('bet', 100).setInteractive();
        //this.doorContainer = this.scene.add.spineContainer(0,0);
        this.door1 = this.scene.add.spine(this.xPos-300, this.yPos+40,'door','idle',false).setSkinByName('door1').setDepth(this.depth).setData('bet', 1).setInteractive();
        this.door10 = this.scene.add.spine(this.xPos-100, this.yPos+40,'door','idle',false).setSkinByName('door10').setDepth(this.depth).setData('bet', 10).setInteractive();
        this.door50 = this.scene.add.spine(this.xPos+100, this.yPos+40,'door','idle',false).setSkinByName('door50').setDepth(this.depth).setData('bet', 50).setInteractive();
        this.door100 = this.scene.add.spine(this.xPos+300, this.yPos+40,'door','idle',false).setSkinByName('door100').setDepth(this.depth).setData('bet', 100).setInteractive();
        //this.doorContainer.add([this.door100,this.door50,this.door10,this.door1,])
        //this.doorContainer.setDepth(this.depth)
        //this.root = this.scene.add.container();
        this.enterBtn = this.scene.add.image(this.xPos,this.yPos+240,'hongbao2024','btn-enter-room.png').setDepth(depth).setInteractive();
        // const roomFrame = ['btn-room-1','btn-room-10','btn-room-50','btn-room-100']
        this.door1.setMix('idle','selected',.2).setMix('selected','idle',.2).setMix('selected','open',.2)
        this.door10.setMix('idle','selected',.2).setMix('selected','idle',.2).setMix('selected','open',.2)
        this.door50.setMix('idle','selected',.2).setMix('selected','idle',.2).setMix('selected','open',.2)
        this.door100.setMix('idle','selected',.2).setMix('selected','idle',.2).setMix('selected','open',.2)

        this.door1.on('pointerup',(pointer: PointerEvent , data: SpineGameObject )=>{
            if(this.hasSelected)return
            this.selectRoom();
            this.door1.setAnimation(0,'selected',true);
            BetHandler.bet_amount = 1
        })
        this.door10.on('pointerup',(pointer: PointerEvent , data: SpineGameObject )=>{
            if(this.hasSelected)return
            this.selectRoom();
            this.door10.setAnimation(0,'selected',true);
            BetHandler.bet_amount = 10
        })
        this.door50.on('pointerup',(pointer: PointerEvent , data: SpineGameObject )=>{
            if(this.hasSelected)return
            this.selectRoom();
            this.door50.setAnimation(0,'selected',true);
            BetHandler.bet_amount = 50
        })
        this.door100.on('pointerup',(pointer: PointerEvent , data: SpineGameObject )=>{
            if(this.hasSelected)return
            this.selectRoom();
            this.door100.setAnimation(0,'selected',true);
            BetHandler.bet_amount = 100
        })

        this.notifMessage = this.scene.add.container()
        const waringBorder = this.scene.add.graphics()
        waringBorder.fillStyle(0xE1331B,.9);
        waringBorder.fillRect(0,305+70,1080,70)
        waringBorder.setDepth(this.depth);
        const warnMessage = this.scene.add.text(this.xPos, this.yPos+110,'请选择房间',{
            fontSize : 40,
            color : '#ffffff',
            fontStyle : 'bold'
        }).setOrigin(.5).setDepth(this.depth);
        this.notifMessage.add([ waringBorder, warnMessage ])
        this.notifMessage.setDepth(this.depth).setVisible(false);

        this.enterBtn.on('pointerup',()=>{
            if(this.hasSelected)return 
            if(BetHandler.bet_amount <= 0 ){
                this.notifMessage.setVisible(true).setAlpha(0)
                this.scene.tweens.killTweensOf(this.notifMessage)
                this.scene.tweens.add({
                    targets : this.notifMessage,
                    duration : 300,
                    hold : 1200,
                    yoyo : true,
                    alpha : 1,
                })
                return console.log('No Bets')
            };
            this.isActive = false;
            this.hasSelected = true;
            this.scene.sound.play('all-sfx',audioMarkers[1])
            this.openDoor(BetHandler.bet_amount,()=>{
                this.MAINSCENE.ChangeState(HongbaoType.GAME_STATES.INTRO_STATE)
                this.closeScene()
            })
        })

        //this.root.setDepth(this.depth)
        
    }
    openDoor(selected:number, cb ?: ()=>void ){
        let door;
        switch( selected){
            case 1 :
                this.door1.setAnimation(0,'open',false);
                this.door1.setDepth(this.depth+1);

                this.scene.tweens.add({
                    targets : this.door1,
                    duration : 500,
                    x : this.xPos,
                    y : this.yPos,
                    scaleX : 1.5,
                    scaleY : 1.5,
                    ease : 'sine.out'
                })
            break;
            case 10 :
                this.door10.setAnimation(0,'open',false)
                this.door10.setDepth(this.depth+1);

                this.scene.tweens.add({
                    targets : this.door10,
                    duration : 500,
                    x : this.xPos,
                    y : this.yPos,
                    scaleX : 1.5,
                    scaleY : 1.5,
                    ease : 'sine.out'
                })
            break;
            case 50 :
                this.door50.setAnimation(0,'open',false)
                this.door50.setDepth(this.depth+1);

                this.scene.tweens.add({
                    targets : this.door50,
                    duration : 500,
                    x : this.xPos,
                    y : this.yPos,
                    scaleX : 1.5,
                    scaleY : 1.5,
                    ease : 'sine.out'
                })
            break;
            case 100 :
                this.door100.setAnimation(0,'open',false)
                this.door100.setDepth(this.depth+1);

                this.scene.tweens.add({
                    targets : this.door100,
                    duration : 500,
                    x : this.xPos,
                    y : this.yPos,
                    scaleX : 1.5,
                    scaleY : 1.5,
                    ease : 'sine.out'
                })
            break;
            default:
                console.log('Error: No Door!')
            break;
        }

        

        if(cb){
            this.scene.time.addEvent({
                delay : 800,
                callback : ()=>{
                    cb()
                }
            })
        }
    }
    selectRoom(){
        this.notifMessage.setVisible(false)
        this.door1.setAnimation(0,'idle',false)
        this.door10.setAnimation(0,'idle',false)
        this.door50.setAnimation(0,'idle',false)
        this.door100.setAnimation(0,'idle',false)
        this.door1.setDepth( this.depth );
        this.door10.setDepth( this.depth );
        this.door50.setDepth( this.depth );
        this.door100.setDepth( this.depth );
        this.scene.sound.play('all-sfx',audioMarkers[0])
    }
    closeScene(){
        this.bg.setVisible(false);
        this.enterBtn.setVisible(false);
        //this.doorContainer.setVisible(false);
        this.door1.setVisible(false).setDepth( this.depth );
        this.door10.setVisible(false).setDepth( this.depth );
        this.door50.setVisible(false).setDepth( this.depth );
        this.door100.setVisible(false).setDepth( this.depth );

        //this.MAINSCENE.betAmtDisplay.setText( BetHandler.bet_amount.toString())
        this.MAINSCENE.updateRoomType(BetHandler.bet_amount);
    }
    toBetScene(){
        this.bg.setVisible(true);
        this.enterBtn.setVisible(true);

        this.door1.setVisible(true).setDepth( this.depth );
        this.door10.setVisible(true).setDepth( this.depth );
        this.door50.setVisible(true).setDepth( this.depth );
        this.door100.setVisible(true).setDepth( this.depth );
        //this.doorContainer.setVisible(true);
        BetHandler.bet_amount = 0;
        this.hasSelected = false;
        this.isActive = true;
    }
}