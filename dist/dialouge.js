export default class Dialouge extends Phaser.GameObjects.Image {
    constructor(scene, x, y, texture, depth = 20) {
        super(scene, x, y, texture);
        this.scene = scene;
        this.xPos = x;
        this.yPos = y;
        this.img_texture = texture;
        this.root = this.scene.add.container(x, y);
        const bubble = scene.add.image(0, 0, texture, 'bubble.png').setScale(.8);
        this.message = scene.add.image(0, 0, texture, 'dialouge-0.png').setScale(.7);
        this.root.add([bubble, this.message]).setDepth(depth).setVisible(false);
    }
    show(type, showProability = .8) {
        if (Math.random() > showProability)
            return;
        const i = ['sad.png', 'cry.png', 'laugh.png', 'shock.png', 'party.png', 'cry.png'];
        const m = ['dialouge-0.png', 'dialouge-1.png', 'dialouge-2.png', 'dialouge-3.png'];
        let frame = '';
        if (type === 'icon') {
            frame = i[Math.floor(Math.random() * i.length)];
        }
        else if (type === 'message') {
            frame = m[Math.floor(Math.random() * i.length)];
        }
        else {
            const all = [...i, ...m];
            frame = all[Math.floor(Math.random() * i.length)];
        }
        this.root.setScale(0).setVisible(true);
        this.scene.tweens.killTweensOf(this.root);
        this.message.setFrame(frame);
        this.scene.tweens.add({
            targets: this.root,
            duration: 200,
            delay: Phaser.Math.Between(0, 500),
            yoyo: true,
            hold: 1200,
            scaleX: 1,
            scaleY: 1,
            ease: 'back.out',
            onComplete: () => {
                this.root.setVisible(false);
            }
        });
    }
    showSpecific(frame) {
        this.root.setScale(0).setVisible(true);
        this.scene.tweens.killTweensOf(this.root);
        this.message.setFrame(frame);
        this.scene.tweens.add({
            targets: this.root,
            duration: 200,
            delay: Phaser.Math.Between(0, 500),
            yoyo: true,
            hold: 1200,
            scaleX: 1,
            scaleY: 1,
            ease: 'back.out',
            onComplete: () => {
                this.root.setVisible(false);
            }
        });
    }
}
//# sourceMappingURL=dialouge.js.map