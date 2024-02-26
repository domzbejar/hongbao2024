export default class WaitingPlayers extends Phaser.GameObjects.GameObject {
    constructor(scene, type) {
        super(scene, type);
        this.isActive = false;
        this.scene = scene;
        this.root = this.scene.add.container();
        const msg = '玩家匹配中。。。';
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, .8);
        overlay.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        const char_width = 70;
        const split_msg = msg.split("");
        const charGroup = this.scene.add.group();
        const message_width = split_msg.length * char_width;
        split_msg.forEach((char, i) => {
            const text = this.scene.add.text(540, 305, `${char}`, {
                fontSize: 60,
                fontStyle: 'bold',
            }).setOrigin(.5).setStroke("#b58747", 10).setShadow(0, 1, "#111111", 3, true, true);
            charGroup.addMultiple([text]);
        });
        Phaser.Actions.SetXY(charGroup.getChildren(), 540 - (message_width / 2) + char_width, 305, char_width);
        charGroup.getChildren().forEach((item, i) => {
            const char = item;
            this.scene.tweens.add({
                targets: char,
                delay: i * 300,
                y: 280,
                duration: 500,
                ease: 'sine.in',
                yoyo: true,
                repeat: -1,
            });
        });
        this.root.add([overlay]);
        this.root.add(charGroup.getChildren());
        this.root.setDepth(90);
        this.setVisibility(false);
    }
    setVisibility(isVisible) {
        this.root.setVisible(isVisible);
        this.isActive = isVisible;
    }
}
//# sourceMappingURL=waitingPlayer.js.map