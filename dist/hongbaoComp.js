import Config from "./config.js";
import HongbaoType from "./helper/hongbaoTypes.js";
import DummyData from "./helper/dummyData.js";
import Randomizer from "./helper/randomizer.js";
import BetHandler from "./helper/betHandler.js";
import audioMarkers from "./helper/audioMarker.js";
var HONGBAO_STATE;
(function (HONGBAO_STATE) {
    HONGBAO_STATE[HONGBAO_STATE["STAND_BY"] = 0] = "STAND_BY";
    HONGBAO_STATE[HONGBAO_STATE["PLAYER_TURN"] = 1] = "PLAYER_TURN";
    HONGBAO_STATE[HONGBAO_STATE["OPPONENT_TURN"] = 3] = "OPPONENT_TURN";
    HONGBAO_STATE[HONGBAO_STATE["OPPONENT_SELECT"] = 4] = "OPPONENT_SELECT";
    HONGBAO_STATE[HONGBAO_STATE["SELECTING"] = 5] = "SELECTING";
    HONGBAO_STATE[HONGBAO_STATE["SELECT_CYCLE_COMPLETE"] = 6] = "SELECT_CYCLE_COMPLETE";
    HONGBAO_STATE[HONGBAO_STATE["BATTLE"] = 7] = "BATTLE";
    HONGBAO_STATE[HONGBAO_STATE["START"] = 10] = "START";
    HONGBAO_STATE[HONGBAO_STATE["WIN"] = 20] = "WIN";
    HONGBAO_STATE[HONGBAO_STATE["DISTRIBUTE_PLAYER_HAS_SELECT"] = 21] = "DISTRIBUTE_PLAYER_HAS_SELECT";
    HONGBAO_STATE[HONGBAO_STATE["DISTRIBUTE_PLAYER_NOT_SELECT"] = 22] = "DISTRIBUTE_PLAYER_NOT_SELECT";
    HONGBAO_STATE[HONGBAO_STATE["DISTRIBUTE"] = 30] = "DISTRIBUTE";
    HONGBAO_STATE[HONGBAO_STATE["NEW_GAME"] = 40] = "NEW_GAME";
})(HONGBAO_STATE || (HONGBAO_STATE = {}));
export default class HongbaoComp extends Phaser.GameObjects.GameObject {
    constructor(scene, type, x, y, count = 6, depth = 9) {
        var _a, _b;
        super(scene, type);
        this.mixCount = 10;
        this.hongbaoPos = [];
        this.lastIndex = 0;
        this.availableHongbao = [];
        this.current_player_index = 0;
        this.hongbaoSpineGroup = [];
        this.lastHongbao_index = 0;
        this.isPlayerSelect = false;
        this.xPos = x;
        this.yPos = y;
        this.scene = scene;
        this.depth = depth;
        this.MAINSCENE = this.scene.scene.get('MainScene');
        this.hongbaoGroup = this.scene.add.group();
        this.tableArea = this.scene.add.rectangle(Config.centerX, Config.centerY + 60, 500, 200, 0x00ff00).setDepth(this.depth).setVisible(false);
        this.grabberMsgPos = {
            x: 0,
            y: 0
        };
        this.hongbaoGroupAmount = this.scene.add.group();
        for (let i = 0; i < count; i++) {
            const hongbao = this.scene.add.image(x, y, 'main', 'hongbao-selection.png').setDepth(depth).setScale(.8).setData({
                "id": i
            }).removeInteractive();
            this.availableHongbao.push(i);
            this.hongbaoGroup.addMultiple([hongbao]);
            const hongbaoSpine = this.scene.add.spine(x, y, 'hongbao', 'idle').setDepth(depth).setScale(.8).setVisible(false);
            this.hongbaoSpineGroup.push(hongbaoSpine);
            const amtHongbao = this.scene.add.bitmapText(x, y, 'skarjan', '0', 35).setOrigin(.5).setDepth(depth + 1).setVisible(false);
            this.hongbaoGroupAmount.addMultiple([amtHongbao]);
        }
        this.hongbaoGroup.getChildren().forEach((item, index) => {
            const currenthongbao = item;
            currenthongbao.on('pointerdown', () => {
                var _a;
                if (this.MAINSCENE.isAutoMode)
                    return console.log('Error: Disabled in Auto Mode');
                this.setInteractiveHongbao(false);
                this.isPlayerSelect = true;
                this.scene.sound.play('all-sfx', audioMarkers[4]);
                this.scene.sound.play('all-sfx', audioMarkers[0]);
                this.lastHongbao_index = currenthongbao.data.values.id;
                console.log(`%cSELECT: ${this.lastHongbao_index}`, 'color : yellow');
                (_a = this.playerTimerEvent) === null || _a === void 0 ? void 0 : _a.remove(true);
                const hongbao = this.hongbaoGroup.getChildren()[this.lastHongbao_index];
                const player = this.markerPosition.getChildren()[2];
                const removeIndex = this.availableHongbao.indexOf(this.lastHongbao_index);
                this.timerDisplay.setVisible(false);
                this.chooseFirst.setVisible(false);
                if (removeIndex > -1) {
                    this.availableHongbao.splice(removeIndex, 1);
                }
                this.hongbaoToPlayer(hongbao, player, true);
                this.changeState(HONGBAO_STATE.DISTRIBUTE_PLAYER_HAS_SELECT);
            });
        });
        this.markerPosition = this.scene.add.group();
        this.marker = this.scene.add.image(this.xPos + 265, this.yPos - 35, 'main', 'marker.png').setVisible(true).setDepth(depth);
        const p1 = this.scene.add.image(this.xPos + 265, this.yPos - 35, 'main', 'no1.png');
        const p2 = this.scene.add.image(this.xPos + 328, this.yPos + 142, 'main', 'no2.png');
        const p3 = this.scene.add.image(this.xPos, this.yPos + 191, 'main', 'no3.png');
        const p4 = this.scene.add.image(this.xPos - 330, this.yPos + 142, 'main', 'no4.png');
        const p5 = this.scene.add.image(this.xPos - 267, this.yPos - 35, 'main', 'no5.png');
        const p6 = this.scene.add.image(this.xPos, this.yPos - 70, 'main', 'no6.png');
        this.markerPosition.addMultiple([p1, p2, p3, p4, p5, p6]).setDepth(depth);
        Phaser.Actions.SetXY(this.hongbaoGroup.getChildren(), this.xPos - 200, this.yPos + 40, 80);
        (_a = this.hongbaoGroup) === null || _a === void 0 ? void 0 : _a.getChildren().forEach((item, i) => {
            const hongbao = item;
            this.hongbaoSpineGroup[i].setPosition(hongbao.x, hongbao.y + 10);
            this.hongbaoPos.push({ x: hongbao.x, y: hongbao.y });
        });
        this.playerHand = this.scene.add.image(this.xPos, this.yPos + 330, 'hongbao2024', 'hand-empty.png').setOrigin(.5, 1).setDepth(depth).setScale(.9);
        this.pullBtn = this.scene.add.image(this.xPos + 400, this.yPos + 160, 'hongbao2024', 'btn-pull.png').setInteractive().setVisible(false).setDepth(depth);
        this.pullBtn.on('pointerdown', () => {
            this.scene.sound.play('all-sfx', audioMarkers[0]);
            this.pullBtn.setFrame('btn-pull-active.png');
        }).on('pointerup', () => {
            this.pullBtn.setFrame('btn-pull.png');
        })
            .on('pointerout', () => {
            this.pullBtn.setFrame('btn-pull.png');
        });
        this.handgrabber = this.scene.add.spine(this.xPos, this.yPos + 100, 'hand-grabber-2', 'idle', true).setDepth(depth).setAngle(180).setVisible(false);
        this.handgrabber.timeScale = 1;
        this.pointer = this.scene.add.image(this.xPos, this.yPos, 'main', 'pointer.png').setScale(.8).setDepth(depth);
        const initialHongbao = this.hongbaoGroup.getChildren()[0];
        this.pointer.setPosition(initialHongbao.x, initialHongbao.y - 70);
        this.stealMsg = this.scene.add.image(this.xPos, this.yPos, 'hongbao2024', 'steal-msg.png').setVisible(false).setDepth(depth);
        this.chooseFirst = this.scene.add.image(this.xPos, this.yPos - 110, 'hongbao2024', 'choose-first.png').setVisible(false).setDepth(depth);
        this.timerDisplay = this.scene.add.bitmapText(this.xPos, this.yPos - 50, 'skarjan', '3', 60).setVisible(false).setOrigin(.5).setDepth(depth);
        (_b = this.scene.input.keyboard) === null || _b === void 0 ? void 0 : _b.on('keydown', (event) => {
        });
    }
    stealHongbao() {
        var _a, _b, _c, _d, _e;
        const handPos = [
            { y: this.yPos + 230, angle: 120, playerAngle: 60, playerX: this.xPos - 100 },
            { y: this.yPos + 120, angle: 140, playerAngle: -20, playerX: this.xPos - 40 },
            { y: this.yPos + 200, angle: 180, playerAngle: 0, playerX: this.xPos },
            { y: this.yPos + 120, angle: 230, playerAngle: 10, playerX: this.xPos - 10 },
            { y: this.yPos + 230, angle: 250, playerAngle: 20, playerX: this.xPos + 80 },
        ];
        const random = Math.floor(Math.random() * 5);
        const _supriseMgs = (_b = (_a = this.MAINSCENE.introScene) === null || _a === void 0 ? void 0 : _a.supriseMgs) === null || _b === void 0 ? void 0 : _b.getChildren()[random];
        this.grabberMsgPos = {
            x: _supriseMgs.x,
            y: _supriseMgs.y
        };
        (_c = this.handgrabber) === null || _c === void 0 ? void 0 : _c.setPosition(handPos[random].playerX, handPos[random].y).setAngle(handPos[random].angle).setVisible(true);
        (_d = this.handgrabber) === null || _d === void 0 ? void 0 : _d.setAnimation(0, 'grab', false);
        (_e = this.handgrabber) === null || _e === void 0 ? void 0 : _e.once('complete', () => {
            var _a;
            (_a = this.handgrabber) === null || _a === void 0 ? void 0 : _a.setAnimation(0, 'battle-mix', true);
        });
        this.scene.time.addEvent({
            delay: 400,
            callback: () => {
                this.playerHand.setVisible(false);
            }
        });
    }
    setInteractiveHongbao(isInteractive) {
        this.hongbaoGroup.getChildren().forEach((item, i) => {
            const hongbao = item;
            if (isInteractive) {
                hongbao.setInteractive();
            }
            else {
                hongbao.removeInteractive();
            }
        });
    }
    startTimer(seconds = 3, cb) {
        var _a;
        if (seconds <= 0) {
            if (cb) {
                cb();
            }
            return;
        }
        console.log('Timer Start');
        (_a = this.playerTimerEvent) === null || _a === void 0 ? void 0 : _a.remove(false);
        this.timerDisplay.setVisible(true).setText(seconds.toString());
        this.chooseFirst.setVisible(true).setScale(0);
        this.scene.tweens.add({
            targets: this.chooseFirst,
            yoyo: true,
            scaleX: 1,
            scaleY: 1,
            hold: 2500,
            duration: 200,
            ease: 'back.out',
            easeParams: [4],
        });
        this.playerTimerEvent = this.scene.time.addEvent({
            delay: 1000,
            repeat: seconds,
            startAt: 1000,
            callback: () => {
                var _a, _b;
                this.timerDisplay.setText(`${(_a = this.playerTimerEvent) === null || _a === void 0 ? void 0 : _a.repeatCount}`);
                this.scene.tweens.add({
                    targets: this.timerDisplay,
                    duration: 200,
                    ease: 'sine.out',
                    yoyo: true,
                    scaleX: 1.2,
                    scaleY: 1.2,
                });
                if (((_b = this.playerTimerEvent) === null || _b === void 0 ? void 0 : _b.repeatCount) === 0) {
                    this.timerDisplay.setVisible(false);
                    if (cb) {
                        cb();
                    }
                }
            }
        });
    }
    shuffleHongbao(mixCount = 10) {
        var _a;
        this.mixCount = mixCount;
        (_a = this.hongbaoGroup) === null || _a === void 0 ? void 0 : _a.getChildren().forEach((item, i) => {
            const hongbao = item;
            this.moveHongbao(hongbao, 0);
        });
    }
    moveHongbao(item, count) {
        let counter = count ? count : 0;
        if (counter > this.mixCount) {
            const id = item.data.values.id;
            this.scene.tweens.add({
                targets: item,
                delay: Phaser.Math.Between(0, 100),
                rotation: 0,
                duration: 200,
                x: this.hongbaoPos[id].x,
                y: this.hongbaoPos[id].y,
                ease: 'sine.inout',
                onComplete: () => {
                }
            });
            return;
        }
        this.scene.tweens.add({
            targets: item,
            delay: Phaser.Math.Between(0, 100),
            rotation: Phaser.Math.DegToRad(Phaser.Math.Between(0, 360)),
            duration: 200,
            x: this.tableArea.getBounds().getRandomPoint().x,
            y: this.tableArea.getBounds().getRandomPoint().y,
            onComplete: () => {
                let c = counter + 1;
                this.moveHongbao(item, c);
            }
        });
    }
    setVisibility(isVisible) {
        var _a;
        (_a = this.hongbaoGroup) === null || _a === void 0 ? void 0 : _a.getChildren().forEach((item, i) => {
            const hongbao = item;
            hongbao.setVisible(isVisible);
        });
        this.markerPosition.setVisible(isVisible);
        this.marker.setVisible(isVisible);
        this.pointer.setVisible(isVisible);
        this.hongbaoGroupAmount.setVisible(false);
        if (isVisible) {
            this.scene.tweens.killTweensOf(this.playerHand);
            this.scene.tweens.add({
                targets: this.playerHand,
                y: this.yPos + 330,
                duration: 300,
                delay: 500,
                ease: 'back.out',
                easeParams: [2],
            });
        }
        else {
            this.playerHand.setY(this.yPos + 600);
        }
    }
    chooseHongbao(index, cb) {
        console.log('chooseHongbao');
        const hongbaoCount = this.availableHongbao.length;
        if (typeof index === 'undefined') {
            if (hongbaoCount <= 1)
                return;
            this.tweenSelect = this.scene.tweens.addCounter({
                from: 0,
                to: this.availableHongbao.length - 1,
                duration: 0,
                repeat: -1,
                onUpdate: (tween, data) => {
                },
                hold: 120
            });
        }
        else {
            this.tweenSelect = this.scene.tweens.addCounter({
                from: 0,
                to: this.availableHongbao.length - 1,
                duration: hongbaoCount * 80,
                ease: 'step',
                repeat: 1,
                hold: 120,
                onUpdate: (tween, data) => {
                    const index = Math.floor(data.value);
                    const avail_hongbao_xPos = this.hongbaoPos[this.availableHongbao[index]].x;
                    this.pointer.setX(avail_hongbao_xPos);
                },
                onComplete: () => {
                    console.log(this.availableHongbao);
                    this.scene.tweens.addCounter({
                        from: 0,
                        to: index,
                        duration: hongbaoCount * 80,
                        ease: 'step',
                        onUpdate: (tween, data) => {
                            const index = Math.floor(data.value);
                            const avail_hongbao_xPos = this.hongbaoPos[index].x;
                            this.pointer.setX(avail_hongbao_xPos);
                        },
                        onComplete: () => {
                            this.scene.time.addEvent({
                                delay: 300,
                                callback: () => {
                                    this.pointer.setVisible(false);
                                }
                            });
                            if (cb) {
                                cb();
                            }
                        }
                    });
                }
            });
        }
    }
    hongbaoToPlayer(hongbao, player, isPlayer = false) {
        this.scene.tweens.add({
            targets: hongbao,
            duration: 300,
            delay: isPlayer ? 0 : Phaser.Math.Between(1000, 3000),
            ease: 'sine.out',
            x: player.x,
            y: player.y,
            onComplete: () => {
                if (isPlayer) {
                    hongbao.setVisible(false);
                    this.playerHand.setY(this.yPos + 330).setFrame('hand-hongbao.png').setVisible(true);
                }
            }
        });
    }
    start() {
        console.log(`START HONGBAO SHUFFLE`);
        this.reset();
        this.setVisibility(false);
        this.playerHand.setY(this.yPos + 330).setVisible(true);
        this.insertCoinstoHongbao();
        this.shuffleHongbaoTimer = this.scene.time.addEvent({
            delay: 1500,
            callback: () => {
                this.hongbaoSpineVisibility(false);
                this.hongbaoGroup.setVisible(true);
                this.shuffleHongbao(5);
            }
        });
        this.scene.time.addEvent({
            delay: 3500,
            callback: () => {
                this.changeState(HONGBAO_STATE.PLAYER_TURN);
            }
        });
    }
    insertCoinstoHongbao(cb) {
        this.hongbaoSpineGroup.forEach((hongbao, i) => {
            hongbao.setVisible(true);
            hongbao.setAnimation(0, 'coin-in', false);
        });
        this.hongbaoSpineGroup[0].once('complete', () => {
            if (cb) {
                cb();
            }
        });
    }
    hongbaoSpineVisibility(isVisible) {
        this.hongbaoSpineGroup.forEach((hongbao, i) => {
            hongbao.setVisible(isVisible);
        });
    }
    handleOpponentTurn() {
        if (this.availableHongbao.length <= 0)
            return;
        console.log(this.availableHongbao);
        const select_index = this.availableHongbao[Math.floor(Math.random() * this.availableHongbao.length)];
        console.log(`HONGBAO: ${select_index + 1}`);
        this.chooseHongbao(select_index, () => {
            const hongbao = this.hongbaoGroup.getChildren()[select_index];
            const player = this.markerPosition.getChildren()[this.current_player_index];
            this.hongbaoToPlayer(hongbao, player);
        });
    }
    handlePlayerNotSelect() {
        if (this.availableHongbao.length <= 0)
            return;
        this.setInteractiveHongbao(false);
        console.log('distibute');
        const marker_index = [0, 1, 3, 4, 5];
        const hongbao_index = [0, 1, 2, 3, 4, 5];
        const hongbao_for_player = hongbao_index[Math.floor(Math.random() * hongbao_index.length)];
        this.lastHongbao_index = hongbao_for_player;
        const hongbao_for_player_index = hongbao_index.indexOf(hongbao_for_player);
        hongbao_index.splice(hongbao_for_player_index, 1);
        const mixed_index = shuffleArray(marker_index);
        mixed_index.forEach((value, i) => {
            const hongbao = this.hongbaoGroup.getChildren()[hongbao_index[i]];
            const player = this.markerPosition.getChildren()[value];
            this.hongbaoToPlayer(hongbao, player);
        });
        this.scene.time.addEvent({
            delay: 3000,
            callback: () => {
                console.log('Player Last');
                this.hongbaoGroup.setVisible(true);
                const hongbao = this.hongbaoGroup.getChildren()[this.lastHongbao_index];
                const player = this.markerPosition.getChildren()[2];
                this.hongbaoToPlayer(hongbao, player, true);
                this.scene.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        this.changeState(HONGBAO_STATE.SELECT_CYCLE_COMPLETE);
                    }
                });
            }
        });
    }
    handlePlayerTurn() {
        if (this.availableHongbao.length <= 0)
            return;
        console.log('Player Turn');
        this.hongbaoGroup.setVisible(true);
        this.lastHongbao_index = this.availableHongbao[Math.floor(Math.random() * this.availableHongbao.length)];
        const isAuto = this.MAINSCENE.isAutoMode ? 0 : 3;
        if (this.MAINSCENE.isAutoMode) {
            this.setInteractiveHongbao(false);
            this.changeState(HONGBAO_STATE.DISTRIBUTE_PLAYER_NOT_SELECT);
            return;
        }
        else {
            this.setInteractiveHongbao(true);
        }
        this.startTimer(isAuto, () => {
            if (this.isPlayerSelect)
                return;
            this.changeState(HONGBAO_STATE.DISTRIBUTE_PLAYER_NOT_SELECT);
        });
    }
    reset() {
        this.availableHongbao = Array.from({ length: 6 }, (_, index) => index);
        this.isPlayerSelect = false;
        console.log(this.availableHongbao);
        this.setInteractiveHongbao(false);
        Phaser.Actions.SetXY(this.hongbaoGroup.getChildren(), this.xPos - 200, this.yPos + 40, 80);
        this.hongbaoGroup.getChildren().forEach((item, i) => {
            const hongbao = item;
            hongbao.setVisible(true);
            hongbao.removeInteractive();
        });
        this.playerHand.setVisible(false).setFrame('hand-empty.png');
        this.grabberMsgPos = {
            x: 0,
            y: 0
        };
        this.hongbaoSpineVisibility(false);
        this.hongbaoGroupAmount.setVisible(false);
        this.lastHongbao_index = 0;
    }
    handleComplete(delay = 500) {
        console.log('SELECT_CYCLE_COMPLETE');
        DummyData.SetResult(2.5);
        if (DummyData.GetResult().odds >= 3)
            return this.changeState(HONGBAO_STATE.WIN);
        if (DummyData.GetResult().odds >= 2) {
            this.stealMsg.setVisible(true).setScale(0);
            this.scene.tweens.add({
                targets: this.stealMsg,
                delay: delay,
                duration: 300,
                ease: 'back.out',
                easeParams: [3],
                scaleX: 1,
                scaleY: 1,
                hold: 1000,
                yoyo: true,
                onComplete: () => {
                    this.changeState(HONGBAO_STATE.BATTLE);
                }
            });
        }
        else {
            this.scene.time.addEvent({
                delay: 1000,
                callback: () => {
                    this.changeState(HONGBAO_STATE.WIN);
                }
            });
        }
    }
    handleBattle() {
        var _a, _b;
        console.log('BATTLE');
        console.log();
        if (this.MAINSCENE.isAutoMode) {
            (_a = this.MAINSCENE.skipAnimBtn) === null || _a === void 0 ? void 0 : _a.setVisible(false);
        }
        else {
            (_b = this.MAINSCENE.skipAnimBtn) === null || _b === void 0 ? void 0 : _b.setVisible(true);
            this.pullBtn.setVisible(true);
        }
        this.stealHongbao();
        this.battleTimerEvent = this.scene.time.addEvent({
            delay: 1000,
            repeat: 3,
            callback: () => {
                var _a;
                if (((_a = this.battleTimerEvent) === null || _a === void 0 ? void 0 : _a.repeatCount) === 0) {
                    this.changeState(HONGBAO_STATE.WIN);
                }
            }
        });
    }
    skipBattle() {
        var _a, _b;
        (_a = this.handgrabber) === null || _a === void 0 ? void 0 : _a.clearTracks().setVisible(false);
        this.playerHand.setVisible(false);
        (_b = this.battleTimerEvent) === null || _b === void 0 ? void 0 : _b.remove(false);
    }
    showHongbaoGroupAmount(amountToSplit) {
        const totalRoomPot = BetHandler.bet_amount * 6;
        const _amountToSplit = amountToSplit ? amountToSplit : totalRoomPot - DummyData.GetResult().win_amount;
        const result = Randomizer.spitNumber(_amountToSplit);
        this.markerPosition.getChildren().forEach((item, i) => {
            if (i === 2)
                return;
            const hongbao = item;
            const hongbaoAmount = this.hongbaoGroupAmount.getChildren()[i < 2 ? i : i - 1];
            hongbaoAmount.setText(result[i < 2 ? i : i - 1]).setPosition(hongbao.x, hongbao.y).setVisible(true);
        });
    }
    handleWin() {
        var _a, _b, _c, _d, _e;
        const dummyOdds = DummyData.GetResult().odds;
        const totalRoomPot = BetHandler.bet_amount * 6;
        const amount_to_split = totalRoomPot - DummyData.GetResult().win_amount;
        this.pullBtn.setVisible(false);
        if (dummyOdds >= 3) {
            (_a = this.MAINSCENE.introScene) === null || _a === void 0 ? void 0 : _a.characterSuprise();
            this.scene.time.addEvent({
                delay: 2000,
                callback: () => {
                    this.MAINSCENE.winEffect.showWinAmount(DummyData.GetResult().win_amount);
                    this.scene.sound.play('all-sfx', audioMarkers[6]);
                    this.showHongbaoGroupAmount();
                    this.MAINSCENE.ChangeState(HongbaoType.GAME_STATES.END_GAME);
                }
            });
        }
        else if (dummyOdds >= 2) {
            (_b = this.handgrabber) === null || _b === void 0 ? void 0 : _b.setVisible(false);
            this.playerHand.setVisible(true).setFrame('hand-empty.png');
            (_c = this.MAINSCENE.introScene) === null || _c === void 0 ? void 0 : _c.setStingyMsg(this.grabberMsgPos.x, this.grabberMsgPos.y);
            this.scene.time.addEvent({
                delay: 400,
                callback: () => {
                    var _a;
                    (_a = this.MAINSCENE.introScene) === null || _a === void 0 ? void 0 : _a.crowdReaction();
                    this.MAINSCENE.winSmall.showWinAmount(DummyData.GetResult().win_amount);
                    this.showHongbaoGroupAmount();
                    this.MAINSCENE.ChangeState(HongbaoType.GAME_STATES.END_GAME);
                }
            });
        }
        else if (dummyOdds >= 1) {
            console.log('SMALL WIN');
            (_d = this.handgrabber) === null || _d === void 0 ? void 0 : _d.setVisible(false);
            this.playerHand.setVisible(true).setFrame('hand-empty.png');
            this.scene.time.addEvent({
                delay: 400,
                callback: () => {
                    var _a;
                    (_a = this.MAINSCENE.introScene) === null || _a === void 0 ? void 0 : _a.crowdReaction();
                    this.MAINSCENE.winSmall.showEmoticon("happy");
                    this.MAINSCENE.winSmall.showWinAmount(DummyData.GetResult().win_amount);
                    this.MAINSCENE.rainHongbao.setRain(true);
                    this.showHongbaoGroupAmount();
                    this.MAINSCENE.ChangeState(HongbaoType.GAME_STATES.END_GAME);
                }
            });
        }
        else {
            console.log('LOSE');
            (_e = this.handgrabber) === null || _e === void 0 ? void 0 : _e.setVisible(false);
            this.playerHand.setVisible(true).setFrame('hand-empty.png');
            this.scene.time.addEvent({
                delay: 400,
                callback: () => {
                    this.MAINSCENE.winSmall.showEmoticon("sad");
                    this.MAINSCENE.winSmall.showWinAmount(DummyData.GetResult().win_amount, false);
                    this.showHongbaoGroupAmount(amount_to_split);
                    this.MAINSCENE.ChangeState(HongbaoType.GAME_STATES.END_GAME);
                }
            });
        }
        DummyData.balance += DummyData.GetResult().win_amount;
        this.MAINSCENE.updateBalance(DummyData.getBalance());
    }
    distributeToOtherPlayers() {
        console.log('distibute');
        const marker_index = [0, 1, 3, 4, 5];
        const hongbao_index = [...this.availableHongbao];
        this.availableHongbao.forEach((index) => {
            const currenthongbao = this.hongbaoGroup.getChildren()[index];
            currenthongbao.removeInteractive();
        });
        const mixed_index = shuffleArray(marker_index);
        mixed_index.forEach((value, i) => {
            console.log(hongbao_index[i]);
            const hongbao = this.hongbaoGroup.getChildren()[hongbao_index[i]];
            const player = this.markerPosition.getChildren()[value];
            this.hongbaoToPlayer(hongbao, player);
        });
        this.scene.time.addEvent({
            delay: 2000,
            callback: () => {
                this.changeState(HONGBAO_STATE.SELECT_CYCLE_COMPLETE);
            }
        });
    }
    handleDistribute() {
        console.log('distibute');
        const marker_index = [0, 1, 3, 4, 5];
        const hongbao_index = [0, 1, 2, 3, 4, 5];
        const hongbao_for_player = hongbao_index[Math.floor(Math.random() * hongbao_index.length)];
        this.lastHongbao_index = hongbao_for_player;
        const hongbao_for_player_index = hongbao_index.indexOf(hongbao_for_player);
        hongbao_index.splice(hongbao_for_player_index, 1);
        const mixed_index = shuffleArray(marker_index);
        mixed_index.forEach((value, i) => {
            const hongbao = this.hongbaoGroup.getChildren()[hongbao_index[i]];
            const player = this.markerPosition.getChildren()[value];
            this.hongbaoToPlayer(hongbao, player);
        });
        this.scene.time.addEvent({
            delay: 3000,
            callback: () => {
                this.changeState(HONGBAO_STATE.PLAYER_TURN);
            }
        });
    }
    handleNewGame() {
        this.scene.time.addEvent({
            delay: 6000,
            callback: () => {
                this.reset();
                this.MAINSCENE.ChangeState(HongbaoType.GAME_STATES.NEW_GAME);
            }
        });
    }
    changeState(state, data) {
        switch (state) {
            case HONGBAO_STATE.WIN:
                this.handleWin();
                break;
            case HONGBAO_STATE.PLAYER_TURN:
                this.handlePlayerTurn();
                break;
            case HONGBAO_STATE.OPPONENT_TURN:
                break;
            case HONGBAO_STATE.SELECT_CYCLE_COMPLETE:
                this.handleComplete(1200);
                break;
            case HONGBAO_STATE.START:
                this.start();
                break;
            case HONGBAO_STATE.BATTLE:
                this.handleBattle();
                break;
            case HONGBAO_STATE.DISTRIBUTE:
                this.distributeToOtherPlayers();
                break;
            case HONGBAO_STATE.DISTRIBUTE_PLAYER_HAS_SELECT:
                this.distributeToOtherPlayers();
                break;
            case HONGBAO_STATE.DISTRIBUTE_PLAYER_NOT_SELECT:
                this.handlePlayerNotSelect();
                break;
            case HONGBAO_STATE.NEW_GAME:
                this.handleNewGame();
                break;
            default:
                break;
        }
    }
}
function shuffleArray(array) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}
//# sourceMappingURL=hongbaoComp.js.map