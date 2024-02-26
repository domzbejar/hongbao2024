/* 
   HOW TO USE:
    1. import or add in html head  <script src="./src/script/voucher-btn.js" defer></script>
    2. this.load.image('voucher-btn-show.png', 'voucher-btn-show.png') and
        this.load.image('voucher-btn-hide.png', 'voucher-btn-hide.png') to load();
    3. in Main Scene, add CustomButton on create()
        const customBtn = new CustomButton(this,'button',x,y,image,depth);
        customBtn.init(540,50,'voucher-btn.png',9)

    TO SET VALUE: 
    customBtn.setAmount( value : number )

    TO SHOW / HIDE BUTTON: 
    customBtn.setVisibility( isVisible : boolen )

    TO ENABLE / DISABLE BUTTON: 
    customBtn.setEnableButton( isActive : boolen )

*/
class CustomButton extends Phaser.GameObjects.GameObject{
    scene; 
    type; 
    image = 'voucher-btn-hide.png';
    xPos = 0;
    yPos = 0;
    mainBtn;
    isShow = false;
    amount = 0;
    amountDisplay;
    clickFx;
    isEnable = true;
    depth = 9;
    constructor(scene,type){
        super(scene,type)
        this.scene = scene;
        this.type = type;
        this.xPos = this.scene.scale.width / 2;
        this.yPos = this.scene.scale.height / 2;
        //this.depth = depth;

        this.mainBtn = this.scene.add.image(this.xPos,this.yPos,this.image).setOrigin(1,.5).setScale(1.5).setInteractive().setDepth( this.depth );
        this.clickFx = this.mainBtn.preFX.addBarrel(1);
         
        //this.scene.load.image('voucher-button.png','voucher-button.png');

        this.amountDisplay = this.scene.add.text(this.xPos,this.yPos,this.amount,{
            fontSize : '30px'
        }).setOrigin(.5).setVisible(this.isShow).setDepth( this.depth );

        //this.init(this.xPos, this.yPos, this.image, this.depth );
    }
    init(x,y,image,depth){
        this.xPos = x+130;
        this.yPos = y;
        this.image = image;

        if(depth > 0){
            this.depth = depth;
            this.amountDisplay.setDepth( this.depth );
            this.mainBtn.setDepth( this.depth );
        }

        this.amountDisplay.setPosition(x,y);
        this.mainBtn.setPosition(this.xPos,this.yPos).setTexture( this.image );

        this.mainBtn.on('pointerup',()=>{
            this.toggleBtn();
        }).on('pointerover',()=>{
            this.scene.input.setDefaultCursor('pointer');
        }).on('pointerout',()=>{
            this.scene.input.setDefaultCursor('default');
        })
    }
    toggleBtn(){
        if(!this.mainBtn.visible)return console.warn(`Error: Button is Hidden`)
        if(this.isShow){
            this.isShow = false;
            this.mainBtn.setTexture('voucher-btn-hide.png');
        }else{
            this.isShow = true;
            this.mainBtn.setTexture('voucher-btn-show.png');
        }
        this.amountDisplay.setVisible( this.isShow )
        this.scene.tweens.killTweensOf(this.clickFx);
        this.scene.tweens.killTweensOf(this.amountDisplay);
        this.scene.tweens.add({
            targets : this.mainBtn,
            scaleX : 1.8,
            yoyo : true,
            duration : 100,
            onStart : ()=>{
                this.mainBtn.setScale(1.5);
            }
        })
        this.scene.tweens.add({
            targets : this.amountDisplay,
            x : this.xPos-135,
            yoyo : true,
            duration : 100,
            onStart : ()=>{
                this.amountDisplay.setX( this.xPos-130 );
            }
        })
    }
    setAmount( value ){
        this.amount = value;
        this.amountDisplay.setText( value );
    }
    setEnableButton( isActive = true ){
        if(isActive){
            this.isEnable = true
            this.mainBtn.setInteractive().clearTint()
        }else{
            this.isEnable = false
            this.mainBtn.removeInteractive().setTint(Phaser.Display.Color.GetColor(100,100,100))
        }
    }
    setVisibility(isVisible = true){
        this.mainBtn.setVisible( isVisible );
        this.amountDisplay.setVisible( isVisible );
    }
} 