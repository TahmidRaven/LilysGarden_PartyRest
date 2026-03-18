import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, Vec2, tween, UITransform, Widget, RigidBody2D, ERigidBody2DType } from 'cc';
import { GameBoardController } from './GameBoardController';
import { VictoryScreen } from './VictoryScreen';
import { AudioContent } from './AudioContent';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node) public initialSceneNode: Node = null;
    @property(GameBoardController) public gameBoardController: GameBoardController = null;
    @property(VictoryScreen) public victoryScreen: VictoryScreen = null;

    @property(Node) public boardHolderNode: Node = null;
    @property(Node) public boardHolderMovePos: Node = null;

    @property(Sprite) public backgroundSprite: Sprite = null;
    @property(Sprite) public tableSprite: Sprite = null;
    @property(Sprite) public lampSprite: Sprite = null;
    @property(Node) public lightsNode: Node = null;

    @property(SpriteFrame) public fixedTableSF: SpriteFrame = null;
    @property(SpriteFrame) public fixedLampSF: SpriteFrame = null;
    @property(SpriteFrame) public fixedGardenSF: SpriteFrame = null;

    // --- Audio Array ---
    @property([AudioContent]) 
    public audioList: AudioContent[] = [];

    private _tableRestored = false;
    private _lampRestored = false;
    private _gardenRestored = false;
    private _isTransitioning = false;
    private _originalBoardPos: Vec3 = new Vec3();

    public static Instance: GameManager = null;

    onLoad() { 
        GameManager.Instance = this; 
        
        if (this.boardHolderNode) {
            this.boardHolderNode.active = false;
            this._originalBoardPos = this.boardHolderNode.position.clone();
        }
        
        if (this.lightsNode) this.lightsNode.active = false;
    }

    start() {
        if (this.initialSceneNode) {
            this.initialSceneNode.on(Node.EventType.TOUCH_START, this.onFirstTouch, this);
        }
    }

    /**
     * Finds and plays audio based on the AudioName property in the AudioContent script
     */
    public playAudio(name: string) {
        const audio = this.audioList.find(a => a.AudioName === name);
        if (audio) {
            audio.play();
        } else {
            console.warn(`Audio with name ${name} not found in GameManager audioList.`);
        }
    }

    private onFirstTouch() {
        // Play BGM on first touch to bypass browser audio restrictions
        this.playAudio("BGM");

        if (this.boardHolderNode) {
            this.boardHolderNode.active = true;
            this.boardHolderNode.setScale(new Vec3(0, 0, 0));
            tween(this.boardHolderNode)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        }

        if (this.gameBoardController) {
            this.gameBoardController.initBoard();
        }
        
        if (this.initialSceneNode) {
            this.initialSceneNode.destroy();
        }
    }

    private setAllItemsPhysics(isKinematic: boolean) {
        if (!this.boardHolderNode) return;
        const bodies = this.boardHolderNode.getComponentsInChildren(RigidBody2D);
        bodies.forEach(rb => {
            rb.type = isKinematic ? ERigidBody2DType.Kinematic : ERigidBody2DType.Dynamic;
            rb.linearVelocity = Vec2.ZERO;
            rb.angularVelocity = 0;
        });
    }

    private executeMergeSequence(restorationTask: () => void) {
        if (this._isTransitioning || !this.boardHolderNode || !this.boardHolderMovePos) return;
        this._isTransitioning = true;

        const widget = this.boardHolderNode.getComponent(Widget);
        if (widget) widget.enabled = false;

        this.setAllItemsPhysics(true);

        const targetWorldPos = this.boardHolderMovePos.worldPosition;
        const parentUI = this.boardHolderNode.parent.getComponent(UITransform);
        const targetLocalPos = new Vec3();
        parentUI.convertToNodeSpaceAR(targetWorldPos, targetLocalPos);

        const restoredCount = [this._tableRestored, this._lampRestored, this._gardenRestored].filter(v => v).length;
        const isFinalMerge = restoredCount === 3;

        // Play Transition SFX
        this.playAudio("Transition");

        const seq = tween(this.boardHolderNode)
            .by(0.07, { position: new Vec3(12, 0, 0) })
            .by(0.07, { position: new Vec3(-24, 0, 0) })
            .to(0.05, { position: this._originalBoardPos })
            .to(0.8, { position: targetLocalPos }, { easing: 'expoInOut' })
            .call(() => {
                restorationTask();
                // Play Merge SFX
            });

        if (isFinalMerge) {
            seq.delay(1.0)
               .call(() => {
                   if (this.victoryScreen) this.victoryScreen.show(true);
                   this.playAudio("Win");
               })
               .start();
        } else {
            seq.delay(1.2)
               .to(0.7, { position: this._originalBoardPos }, { easing: 'expoOut' })
               .call(() => {
                   this._isTransitioning = false;
                   if (widget) widget.enabled = true;
                   this.setAllItemsPhysics(false);
               })
               .start();
        }
    }

    public restoreTable() {
        if (this._tableRestored) return;
        this._tableRestored = true;
        this.executeMergeSequence(() => this.applyJuice(this.tableSprite.node, this.fixedTableSF));
    }

    public restoreLamp() {
        if (this._lampRestored) return;
        this._lampRestored = true;
        this.executeMergeSequence(() => {
            this.applyJuice(this.lampSprite.node, this.fixedLampSF, () => {
                this.scheduleOnce(() => {
                    if (this.lightsNode) {
                        this.lightsNode.active = true;
                        this.lightsNode.setScale(0, 0, 0);
                        tween(this.lightsNode).to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
                    }
                }, 0.15);
            });
        });
    }

    public restoreGarden() {
        if (this._gardenRestored) return;
        this._gardenRestored = true;
        this.executeMergeSequence(() => {
            tween(this.backgroundSprite.node)
                .to(0.2, { scale: new Vec3(1.05, 1.05, 1) })
                .call(() => { this.backgroundSprite.spriteFrame = this.fixedGardenSF; })
                .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                .start();
        });
    }

    private applyJuice(target: Node, newSprite: SpriteFrame, callback?: Function) {
        tween(target)
            .to(0.2, { scale: new Vec3(0, 0, 1) }, { easing: 'sineIn' })
            .call(() => {
                const s = target.getComponent(Sprite);
                if (s) s.spriteFrame = newSprite;
                if (callback) callback();
            })
            .to(0.3, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
            .to(0.15, { scale: new Vec3(1, 1, 1) })
            .start();
    }
}