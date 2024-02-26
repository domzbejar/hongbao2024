//import Phaser from "phaser";
import Config from "./config.js";
//import { SpinePlugin } from "@esotericsoftware/spine-phaser";
//import 'phaser-spine';
//import 'phaser3-spine'
import HongbaoComp from "./hongbaoComp.js";
import Lamp from "./lamp.js";
import WinEffect from "./winEffect.js";
import IntroScene from "./introScene.js";
import HongbaoType,{ GameState }  from "./helper/hongbaoTypes.js";
import WinEffectSmall from "./winEffectSmall.js";
import WaitingPlayers from "./waitingPlayer.js";
import RainHongbao from "./rainHongbao.js";
import BetHandler from "./helper/betHandler.js";
import BetScene from "./betScene.js";
import { Visible } from "@esotericsoftware/spine-phaser";
import DummyData from "./helper/dummyData.js";
import audioMarkers from "./helper/audioMarker.js";
//import CustomButton from "./helper/voucher-btn.js";



export default class MainScene extends Phaser.Scene{
    hongbaoTable !: HongbaoComp
    introScene ?: IntroScene
    winEffect !: WinEffect
    winSmall !: WinEffectSmall
    waitingPlayer ?: WaitingPlayers;
    skipAnimBtn ?: Phaser.GameObjects.Image;
    continueBtn ?: Phaser.GameObjects.Image;
    backBtn !: Phaser.GameObjects.Image;
    rainHongbao !: RainHongbao;
    betScene !: BetScene
    betAmtDisplay !: Phaser.GameObjects.Text;
    btnGroup !: Phaser.GameObjects.Group;
    isAutoMode : boolean = false;
    autoBtn !: Phaser.GameObjects.Image;
    submitBtn !: Phaser.GameObjects.Image;
    stopBtn !: Phaser.GameObjects.Image;
    roomType !: Phaser.GameObjects.Image;
    balanceDisplay !: Phaser.GameObjects.BitmapText;
    warningMsg !: Phaser.GameObjects.Container;
    bgm_sound !: Phaser.Sound.BaseSound;
    isGameStart : boolean = false;
    constructor(){
        super({
            key : "MainScene",
            active : true
        })
    }
    preload(){
        this.load.setPath("src/assets");
        
        this.load.spritesheet('bal-emit','bal-emit.png',{ frameWidth: 75, frameHeight : 34 });
        this.load.spritesheet('coin','coin.png',{ frameWidth: 75, frameHeight : 75 });
        this.load.spritesheet('toggle','fullscreenToggle.png',{ frameWidth: 143, frameHeight : 152 });
        this.load.spritesheet('coin-particle','coin-particle.png',{ frameWidth: 74, frameHeight : 79 });
        this.load.spritesheet('hongbao-particle','hongbao-particle.png',{ frameWidth: 88, frameHeight : 135 });
        this.load.spritesheet('btn-mute','btn-mute.png',{ frameWidth: 66, frameHeight : 72 });

        this.load.spine('hongbao','hongbao-v2.json',['hongbao-v2.atlas'], true);
        this.load.spine('god-spine','god-spine.json',['god-spine.atlas'], true);
        this.load.spine('lamp','lamp.json',['lamp.atlas'], true);
        this.load.spine('scroll','scroll.json',['scroll.atlas'], true);
        this.load.spine('firecracker','firecracker.json',['firecracker.atlas'], true);

        //this.load.image('bg-dinner.png','bg-dinner.png');
        this.load.spine('dinner','dinner-haven.json',['dinner-haven.atlas'], true);
        this.load.spine('family','family-char.json',['family-char.atlas'], true);
        this.load.spine('winspine','winspine.json',['winspine.atlas'], true);
        this.load.spine('hand-grabber-2','hand-grabber-2.json',['hand-grabber-2.atlas'], true);
        this.load.spine('door','door.json',['door.atlas'], true);

        this.load.bitmapFont('skarjan','skarjan.png','skarjan.xml');
        this.load.bitmapFont('skarjan-brown','skarjan-brown.png','skarjan.xml');
        this.load.bitmapFont('fugaz','fugaz-one-gold2.png','fugaz-one.xml');
        this.load.image('bg-moon.png','bg-moon.png');
        this.load.image('bg.png','bg.png');
        this.load.image('info.png','info.png');
        //this.load.image('cloud-fg.png','cloud-fg.png');
        //this.load.image('table.png','table.png');

        this.load.image('bet-select-bg.png','bet-select-bg.png');
        //this.load.atlas('dice','dice.png','dice.json');
        //this.load.atlas('characters','characters.png','characters.json');
        this.load.atlas('hongbao2024','hongbao2024.png','hongbao2024.json');
        this.load.atlas('main','main.png','main.json');
        this.load.spritesheet('coin-sprite.png','coin-sprite.png',{ frameWidth: 130, frameHeight : 130 });

        //dialouge
        this.load.atlas('dialouge','dialouge.png','dialouge.json');

        this.load.audio('all-sfx','/audio/all-sfx.mp3');
        this.load.audio('bgm','/audio/grand-hongbao-bgm.mp3');

    }
    create(){
        if(!this.bgm_sound){
            this.bgm_sound = this.sound.add('bgm',{volume:.2, loop: true});
            this.bgm_sound.play();
        }

        //
        
        this.waitingPlayer = new WaitingPlayers(this,'waiting_player')
        
        this.lights.enable().setAmbientColor(0x939393);

        const bg_outdoor = this.add.image(Config.centerX,Config.centerY,'bg.png');
        bg_outdoor.setPipeline('Light2D');

        const lamp1 = new Lamp(this,'lamp',690,120);
        const lamp2 = new Lamp(this,'lamp',790,100);
        const lamp3 = new Lamp(this,'lamp',130,80);
        const lamp4 = new Lamp(this,'lamp',270,95);
        const lamp5 = new Lamp(this,'lamp',30,113);
        const lamp6 = new Lamp(this,'lamp',1020,50);

        this.hongbaoTable = new HongbaoComp(this,'hongbao_table',Config.centerX,Config.centerY,);
        this.hongbaoTable.setVisibility(false);
        
        //const hongbao1 = this.add.spine(300,300,"hongbao","idle");

        const UiPanel = this.add.container();
        this.btnGroup = this.add.group();

        const muteBtn = this.add.image(60,400,'btn-mute',1).setInteractive().setDepth(11);
        muteBtn.on('pointerup',()=>{
            this.sound.play('all-sfx',audioMarkers[0])
            if(this.sound.mute){
                muteBtn.setFrame(1)
                this.sound.mute = false;
            }else{
                muteBtn.setFrame(0)
                this.sound.mute = true;
            }
        })

       // const roomBetBg = this.add.image(273,580,'main','id-bg.png').setScale(1);
        this.backBtn = this.add.image(80,479,'hongbao2024','btn-back.png').setScale(.8).setVisible(false).setDepth(11).setInteractive();
        
        const minusBtn = this.add.image(56,566,'hongbao2024','btn-minus.png').setVisible(false).setInteractive();
        
        const betAmtBg = this.add.image(186-100,569,'main','bet-amt-bg.png');
        this.betAmtDisplay = this.add.text(186-80,569, '0元场' ,{
            fontSize : 40,
            color : "#FFC700",
        }).setOrigin(.5).setStroke('#BD0404',5).setShadow(0,0,'#111111',3,false,true);
        this.betAmtDisplay.setVisible(false);
        this.roomType = this.add.image(186-100,569,'main','room1.png').setScale(.9);

        const addBtn = this.add.image(315,566,'hongbao2024','btn-add.png').setVisible(false).setInteractive();
        // const roomBetAmtDisplay = this.add.image(280,540,'main','room1.png');
        // const orderId = this.add.text(235,570,"FHGDK81000",{
        //     color : '#fff',
        //     fontSize : "20px",
        //     fontFamily :'Sans-serif,Arial'
        // })
        this.stopBtn = this.add.image(470,565,'hongbao2024','btn-stop.png').setVisible(false).setInteractive();
        this.autoBtn = this.add.image(470,565,'hongbao2024','btn-auto.png').setVisible(true).setInteractive();
        this.submitBtn = this.add.image(660,565,'hongbao2024','btn-submit.png').setVisible(true).setInteractive();
        const balBg = this.add.image(875,565,'hongbao2024','bal-bg.png').setDepth(11);
        this.balanceDisplay = this.add.bitmapText(890,565,'skarjan',DummyData.balance.toFixed(2).toString(),30).setDepth(11).setOrigin(.5);

        const gameidbg = this.add.image(290-15,570,'hongbao2024','game-id-bg.png').setScale(.9,1).setDepth(11);
        const gameid = this.add.text(310-15,565,'*****dsd*******',{
            color : '#fff',
            fontSize : '14px',
        }).setOrigin(.5,0).setDepth(11);
        
        const infoContainer = this.add.container()
        const overlay2 = this.add.graphics();
        overlay2.fillStyle(0x000000,.8);
        overlay2.fillRect(0,0,1080,610);
        //overlay2.setInteractive(new Phaser.Geom.Rectangle(0,0,1080,601), Phaser.Geom.Rectangle.Contains);
        const info = this.add.image(Config.centerX, Config.centerY-30,'info.png').setVisible(true);
        infoContainer.add([overlay2,info]).setDepth(15).setVisible(false);
        infoContainer.setInteractive(new Phaser.Geom.Rectangle(0,0,1080,601), Phaser.Geom.Rectangle.Contains);

        const infoBtn = this.add.image(1035,565,'hongbao2024','btn-info.png').setDepth(11).setVisible(true).setScale(.95,1).setInteractive();
        infoBtn.on('pointerup',()=>{
            if( this.waitingPlayer?.isActive || this.introScene?.isPlaying )return
            this.sound.play('all-sfx',audioMarkers[0])
            infoContainer.setVisible(true);
        })
        infoContainer.on('pointerdown',()=>{
            //console.log('dsfs')
            this.sound.play('all-sfx',audioMarkers[2])
            infoContainer.setVisible(false);
        })

        UiPanel.add([ minusBtn ,addBtn, /*this.backBtn,*/ betAmtBg ,this.betAmtDisplay,this.roomType, this.stopBtn,this.autoBtn,this.submitBtn]);
        UiPanel.setDepth(11)

        this.skipAnimBtn = this.add.image(90,565,'hongbao2024','btn-skip-2.png').setVisible(false).setScale(.9).setDepth(11).setInteractive();
        this.continueBtn = this.add.image(90,565,'hongbao2024','btn-continue.png').setVisible(false).setScale(.9).setDepth(11).setInteractive();
        
        this.btnGroup.addMultiple([ this.submitBtn, this.autoBtn ]);

        this.introScene = new IntroScene(this,'intro_scene',Config.centerX, Config.centerY,5,UiPanel);
        this.winEffect = new WinEffect(this,'win-spine',Config.centerX,Config.centerY,);
        this.winSmall = new WinEffectSmall(this,'win-small',Config.centerX,Config.centerY+190,11);
        //this.normalWin = new NormalWin(this,'normal-win',Config.centerX,Config.centerY+170,11)
        this.betScene = new BetScene(this,'bet-scene',Config.centerX, Config.centerY);
        this.rainHongbao = new RainHongbao(this,'rain-hongbao',Config.centerX, Config.centerY)
        
        this.warningMsg = this.add.container();
        const waringbg = this.add.graphics();
        waringbg.fillStyle(0xA10303,.8);
        waringbg.fillRoundedRect(540-200,305,400,60,20);
        const noBal = this.add.text(540,305+10,'余额不足',{
            color : '#fff',
            fontSize : '35px',
        }).setOrigin(.5,0);
        //
        this.warningMsg.add([ waringbg , noBal ])
        this.warningMsg.setDepth(11).setY(-85).setAlpha(0);

        const treasureGod = this.add.spine(Config.centerX,-250,'god-spine','idle-treasure-front',true).setScale(.9);
        const scroll = this.add.spine(Config.centerX,Config.centerY+40,'scroll','idle-horizontal',false).setScale(.5
            ).setDepth(2).setVisible(false);

        this.skipAnimBtn.on('pointerdown',()=>{
            if(this.waitingPlayer?.isActive)return
            this.sound.play('all-sfx',audioMarkers[1])
            this.ChangeState(HongbaoType.GAME_STATES.SKIP_ANIMATION)
        })

        this.continueBtn.on('pointerdown',()=>{
            if(this.waitingPlayer?.isActive)return
            this.sound.play('all-sfx',audioMarkers[1])
            this.ChangeState(HongbaoType.GAME_STATES.STAND_BY);
        })

        addBtn.on('pointerdown',()=>{
            if(this.waitingPlayer?.isActive)return
            const bet = BetHandler.addBet();
            this.betAmtDisplay.setText(` 元场${BetHandler.bet_amount} `);
        })

        minusBtn.on('pointerdown',()=>{
            if(this.waitingPlayer?.isActive)return
            const bet = BetHandler.minusBet();
            this.betAmtDisplay.setText(` 元场${BetHandler.bet_amount} `);
        })

        this.submitBtn.on('pointerdown',()=>{
            if(this.submitBtn.isTinted || this.waitingPlayer?.isActive || this.isGameStart )return
            if( !BetHandler.hasBalance(BetHandler.bet_amount,DummyData.getBalance()) ){
                this.noBalance();
                this.sound.play('all-sfx',audioMarkers[2])
                return console.log("Error: no balance")
            }
            this.isGameStart = true;
            this.enableButtons(false)
            this.sound.play('all-sfx',audioMarkers[1])
            DummyData.balance-=BetHandler.bet_amount;
            this.updateBalance(DummyData.getBalance())
            //this.ChangeState(HongbaoType.GAME_STATES.START_GAME)
            this.ChangeState(HongbaoType.GAME_STATES.NEW_GAME)
        })

        this.stopBtn.on('pointerdown',()=>{
            if(this.stopBtn.isTinted || this.waitingPlayer?.isActive )return
            this.sound.play('all-sfx',audioMarkers[2])
            this.isAutoMode = false;
            this.stopBtn.setTint(Phaser.Display.Color.GetColor(90,90,90))
            //this.ChangeState(HongbaoType.GAME_STATES.START_GAME)
        })


        this.autoBtn.on('pointerdown',()=>{
            if(this.submitBtn.isTinted|| this.waitingPlayer?.isActive || this.isGameStart )return
            if( !BetHandler.hasBalance(BetHandler.bet_amount,DummyData.getBalance()) ){
                this.noBalance();
                this.sound.play('all-sfx',audioMarkers[2])
                return console.log("Error: no balance")
            }
            this.isAutoMode = true;
            this.isGameStart = true;
            this.enableButtons(false)
            this.sound.play('all-sfx',audioMarkers[1])
            DummyData.balance-=BetHandler.bet_amount
            this.updateBalance(DummyData.getBalance())
            
            this.stopBtn.setVisible(true);
            this.autoBtn.setVisible(false);
            
            //this.backBtn.setVisible(false);
            this.skipAnimBtn?.setVisible(false);

            //this.ChangeState(HongbaoType.GAME_STATES.START_GAME)
            this.hongbaoTable.setInteractiveHongbao(false);
            this.ChangeState(HongbaoType.GAME_STATES.AUTO_MODE)
        })

        this.backBtn.on('pointerdown',()=>{
            if(this.waitingPlayer?.isActive)return
            this.sound.play('all-sfx',audioMarkers[2])
            //this.betScene.toBetScene();
            //this.scale.st
            BetHandler.bet_amount = 0;
            //this.scene.manager.destroy();
            this.scene.start('MainScene');
        })

        this.input.keyboard?.on('keydown',(event : KeyboardEvent)=>{
        
        })

    }
    update(time: number, delta: number): void {
        
    }
    noBalance(){
        this.tweens.killTweensOf( this.warningMsg )
        this.warningMsg.setAlpha(0)
        this.tweens.add({
            targets : this.warningMsg,
            duration : 300,
            yoyo : true,
            hold : 1200,
            alpha : 1,
            ease : 'sine.inout',
            onComplete : ()=>{
                this.scene.start('MainScene')
            }
        })
    }
    updateBalance(balance:number){
        this.balanceDisplay.setText( balance.toFixed(2).toString() )
    }
    updateRoomType(betAmt : number){
        switch(betAmt){
            case 1 : 
                this.roomType.setFrame('room1.png')
            break;
            case 10 : 
                this.roomType.setFrame('room10.png')
            break;
            case 50 : 
                this.roomType.setFrame('room50.png')
            break;
            case 100 : 
                this.roomType.setFrame('room100.png')
            break;
            default:
                console.log('Error: No Room')
             break
        }
    }
    handleSkipAnimation(){
        this.hongbaoTable!.skipBattle();
        this.winSmall.skipAnimation();
        this.skipAnimBtn?.setVisible(false);
        this.hongbaoTable!.pullBtn.setVisible(false);
        
        if(this.isAutoMode){
            this.continueBtn?.setVisible(false);
            //this.backBtn.setVisible(false);
        }else{
            //this.continueBtn?.setVisible(true); //hideContinue
            this.backBtn.setVisible(true).clearTint().setInteractive();
        }
        
        
        this.hongbaoTable!.showHongbaoGroupAmount();
        this.betAmtDisplay.setText(` 元场${BetHandler.bet_amount} `)
    }
    handleIntroState(){
        this.introScene?.toMainScene(()=>{
            console.log("%cINTRO SCENE FINISH",'background-color: red')
            this.backBtn.setVisible(true);
            //this.ChangeState(HongbaoType.GAME_STATES.NEW_GAME)
            this.ChangeState(HongbaoType.GAME_STATES.STAND_BY)
        });
    }
    handleStandby(){
        console.log('Standby!!!');
        this.enableButtons(true);
        //this.isGameStart = false;
        this.winSmall.reset();
        this.winEffect.setVisibility(false);
        //this.waitingPlayer?.setVisibility(true);
        this.rainHongbao.setRain(false);
       this.introScene?.supriseMgs?.setVisible(false);
        this.hongbaoTable!.reset();
        this.introScene?.setUIVisible(true)
        this.introScene?.cheapMsg.setVisible(false);
        this.introScene?.clearName();

        this.hongbaoTable.hongbaoGroup.setVisible(false);

        //this.introScene?.delayPlayerEnter();
        this.skipAnimBtn?.setVisible(false);
        this.continueBtn?.setVisible(false);
        this.backBtn.setVisible(true);

        this.betAmtDisplay.setText(` 元场${BetHandler.bet_amount} `)

        //if auto
        if(this.isAutoMode){
            this.stopBtn.setVisible(true);
            this.autoBtn.setVisible(false)
        }else{
            this.stopBtn.setVisible(false).clearTint();
            this.autoBtn.setVisible(true)
        }
        
    }
    handleAutoMode(){
        console.log('%cAUTO MODE!!!','background-color: yellow');
        //reset
        this.winSmall.reset();
        this.winEffect.setVisibility(false);
        this.rainHongbao.setRain(false);
        this.introScene?.supriseMgs?.setVisible(false);
        this.hongbaoTable!.reset();
        this.introScene?.setUIVisible(true)
        this.introScene?.cheapMsg.setVisible(false);

        //wating players
        this.waitingPlayer?.setVisibility(true);
        this.introScene?.delayPlayerEnter();
       
        this.skipAnimBtn?.setVisible(false);
        this.continueBtn?.setVisible(false);
        this.backBtn.setVisible(true);

        console.log( BetHandler.bet_amount.toString() )
        this.betAmtDisplay.setText(` 元场${BetHandler.bet_amount} `)

        //if auto
        this.stopBtn.setVisible(true);
        this.autoBtn.setVisible(false)

        this.time.addEvent({
            delay : 3000,
            callback : ()=>{
                this.waitingPlayer?.setVisibility(false);
                // if(this.isAutoMode){
                //     if( !BetHandler.hasBalance(BetHandler.bet_amount,DummyData.balance) ){
                //         this.noBalance();
                //         return console.log("Error: no balance")
                //     }
                //     DummyData.balance-=BetHandler.bet_amount;
                //     this.updateBalance(DummyData.getBalance())
                //     this.ChangeState(HongbaoType.GAME_STATES.START_GAME)
                // }
                console.log('handleAutoMode')
                this.ChangeState(HongbaoType.GAME_STATES.START_GAME)
            }
        })
    }
    handleNewGame(){
        
        console.log('Waiting players!!!');
        //this.enableButtons(true);
        this.winSmall.reset();
        this.winEffect.setVisibility(false);
        this.waitingPlayer?.setVisibility(true);
        this.rainHongbao.setRain(false);
        this.introScene?.supriseMgs?.setVisible(false);
        this.hongbaoTable!.reset();
        this.introScene?.setUIVisible(true)
        this.introScene?.cheapMsg.setVisible(false);

        this.introScene?.delayPlayerEnter();
        this.skipAnimBtn?.setVisible(false);
        this.continueBtn?.setVisible(false);
        this.backBtn.setVisible(true);

        console.log( BetHandler.bet_amount.toString() )
        this.betAmtDisplay.setText(` 元场${BetHandler.bet_amount} `)

        //if auto
        if(this.isAutoMode){
            this.stopBtn.setVisible(true);
            this.autoBtn.setVisible(false)
        }else{
            this.enableButtons(true);
            this.stopBtn.setVisible(false).clearTint();
            this.autoBtn.setVisible(true)
        }
        

        this.time.addEvent({
            delay : 3000,
            callback : ()=>{
                this.waitingPlayer?.setVisibility(false);
                // if(this.isAutoMode){
                //     if( !BetHandler.hasBalance(BetHandler.bet_amount,DummyData.balance) ){
                //         this.noBalance();
                //         return console.log("Error: no balance")
                //     }
                //     DummyData.balance-=BetHandler.bet_amount;
                //     this.updateBalance(DummyData.getBalance())
                //     this.ChangeState(HongbaoType.GAME_STATES.START_GAME)
                // }
                console.log('handleNewgame')
                this.ChangeState(HongbaoType.GAME_STATES.START_GAME)
            }
        })
    }
    enableButtons(isActive:boolean){
        this.btnGroup.getChildren().forEach((item : Phaser.GameObjects.GameObject, i : number)=>{
            const btn = item as Phaser.GameObjects.Image
            if(isActive){
                btn.setInteractive()
                btn.clearTint()
            }else{
                btn.removeInteractive();
                btn.setTint(Phaser.Display.Color.GetColor(90,90,90));
            }
        })
        if(isActive){
            this.backBtn.setInteractive()
            this.backBtn.clearTint()
        }else{
            this.backBtn.removeInteractive();
            this.backBtn.setTint(Phaser.Display.Color.GetColor(90,90,90));
        }
    }
    handleStartBet(){

    }
    handleEndBet(){

    }
    handleStartGame(){
        this.enableButtons(false)
        this.hongbaoTable.start();
    }
    handleEndGame(){
        //DummyData.balance+=DummyData.GetResult().win_amount;
        
        this.skipAnimBtn?.setVisible(false);
        if(this.isAutoMode){
            //this.backBtn?.setVisible(false); //false
            this.continueBtn?.setVisible(false);
            this.time.addEvent({
                delay : 4500,
                callback :()=>{
                    if( !BetHandler.hasBalance(BetHandler.bet_amount,DummyData.balance) ){
                        this.noBalance();
                        return console.log("Error: no balance")
                    }
                    DummyData.balance-=BetHandler.bet_amount;
                    this.updateBalance(DummyData.getBalance())
                    console.log('restart autoMode')
                    this.ChangeState(HongbaoType.GAME_STATES.AUTO_MODE);
                }
            })
        }else{
            this.backBtn?.setVisible(true).setInteractive().clearTint();
            //this.continueBtn?.setVisible(true); //hideContinue
            this.time.addEvent({
                delay : 3000,
                callback : ()=>{
                    this.isGameStart = false;
                    this.enableButtons(true)
                }
            })
            
        }
        
    }
    restart(){
        this.introScene?.reset();
        this.winEffect.setVisibility(false);
        this.hongbaoTable!.setVisibility(false);
        this.winSmall.reset();
        this.skipAnimBtn?.setVisible(false);
        this.continueBtn?.setVisible(false)
    }
    ChangeState(state : HongbaoType ){
        switch( state ){
            case HongbaoType.GAME_STATES.INTRO_STATE :
                this.handleIntroState()
            break;
            case HongbaoType.GAME_STATES.START_GAME :
                this.handleStartGame()
            break;
            case HongbaoType.GAME_STATES.START_BET :
                this.handleStartBet()
            break;
            case HongbaoType.GAME_STATES.END_BET :
                this.handleEndBet()
            break;
            case HongbaoType.GAME_STATES.END_GAME :
                this.handleEndGame()
            break;
            case HongbaoType.GAME_STATES.NEW_GAME :
                this.handleNewGame()
            break;
            case HongbaoType.GAME_STATES.STAND_BY :
                this.handleStandby();
            break;
            case HongbaoType.GAME_STATES.SKIP_ANIMATION :
                this.handleSkipAnimation()
            break;
            case HongbaoType.GAME_STATES.AUTO_MODE :
                this.handleAutoMode()
            break;
            default:
                console.error(`Error no ${state} STATE`)
            break;
        }
    }
}
