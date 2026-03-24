import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, Vec2, tween, UITransform, Widget, RigidBody2D, ERigidBody2DType, Animation, Prefab, instantiate } from 'cc';
import { GameBoardController } from './GameBoardController';
import { VictoryScreen } from './VictoryScreen';
import { AudioContent } from './AudioContent';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node) public initialSceneNode: Node = null;
    @property(GameBoardController) public gameBoardController: GameBoardController = null;
    @property(VictoryScreen) public victoryScreen: VictoryScreen = null;

    @property(Node) public playNowTop: Node = null;
    @property(Node) public logoTop: Node = null;

    @property(Node) public boardHolderNode: Node = null;
    @property(Node) public boardHolderMovePos: Node = null;

    @property(Sprite) public backgroundSprite: Sprite = null;
    @property(Sprite) public tableSprite: Sprite = null;
    @property(Sprite) public lampSprite: Sprite = null;
    @property(Node) public lightsNode: Node = null;

    @property(Node) public lilyNode: Node = null; 

    @property(SpriteFrame) public fixedTableSF: SpriteFrame = null;
    @property(SpriteFrame) public fixedLampSF: SpriteFrame = null;
    @property(SpriteFrame) public fixedGardenSF: SpriteFrame = null;

    @property(Node) public chandelierNode: Node = null;
    @property(Node) public chandelierDropPos: Node = null;

    @property(Prefab) public flowerPrefab: Prefab = null; 
    @property(Node) public flowerPos1: Node = null;
    @property(Node) public flowerPos2: Node = null;
    @property(Node) public flowerPos3: Node = null;

    @property(Prefab) public sparklePrefab: Prefab = null;

    @property(Node) public TableSparklePos1: Node = null;
    @property(Node) public TableSparklePos2: Node = null;
    @property(Node) public TableSparklePos3: Node = null;

    @property([AudioContent]) 
    public audioList: AudioContent[] = [];

    private _tableRestored = false;
    private _lampRestored = false;
    private _gardenRestored = false;
    private _isTransitioning = false;
    private _originalBoardPos: Vec3 = new Vec3();

    // Storing original positions to calculate offsets
    private _logoOriginalPos: Vec3 = new Vec3();
    private _playNowOriginalPos: Vec3 = new Vec3();

    public static Instance: GameManager = null;

    onLoad() { 
        GameManager.Instance = this;
        
        if (this.boardHolderNode) {
            this.boardHolderNode.active = false;
            this._originalBoardPos = this.boardHolderNode.position.clone();
        }
        
        if (this.lightsNode) this.lightsNode.active = false;
        if (this.lilyNode) this.lilyNode.active = false; 

        // move top UI up 300 units
        if (this.logoTop) {
            this._logoOriginalPos = this.logoTop.position.clone();
            this.logoTop.setPosition(this._logoOriginalPos.x, this._logoOriginalPos.y + 300, this._logoOriginalPos.z);
            this.logoTop.active = false;
        }
        if (this.playNowTop) {
            this._playNowOriginalPos = this.playNowTop.position.clone();
            this.playNowTop.setPosition(this._playNowOriginalPos.x, this._playNowOriginalPos.y + 300, this._playNowOriginalPos.z);
            this.playNowTop.active = false;
        }
    }

    start() {
        if (this.initialSceneNode) {
            this.initialSceneNode.on(Node.EventType.TOUCH_START, this.onFirstTouch, this);
        }
    }

    public playAudio(name: string) {
        const audio = this.audioList.find(a => a.AudioName === name);
        if (audio) {
            audio.play();
        }
    }

    private onFirstTouch() {
        this.playAudio("BGM");

        // Drop down the Top UI
        this.animateTopUI(true);

        if (this.boardHolderNode) {
            this.boardHolderNode.active = true;
            this.boardHolderNode.setScale(new Vec3(0, 0, 0));
            tween(this.boardHolderNode)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        }
        if (this.gameBoardController) this.gameBoardController.initBoard();
        if (this.initialSceneNode) this.initialSceneNode.destroy();
    }

    private animateTopUI(show: boolean) {
        const duration = 0.6;
        const easing = show ? 'backOut' : 'backIn';

        [this.logoTop, this.playNowTop].forEach(node => {
            if (!node) return;

            // Original position for "show", Original + 300 for "hide"
            const original = (node === this.logoTop) ? this._logoOriginalPos : this._playNowOriginalPos;
            const targetY = show ? original.y : original.y + 300;

            if (show) node.active = true;

            tween(node)
                .to(duration, { position: new Vec3(original.x, targetY, original.z) }, { easing: easing })
                .call(() => {
                    if (!show) node.active = false;
                })
                .start();
        });
    }

    private setAllItemsPhysics(isKinematic: boolean) {
        if (!this.boardHolderNode) return;
        const bodies = this.boardHolderNode.getComponentsInChildren(RigidBody2D);
        bodies.forEach(rb => {
            rb.type = isKinematic ? ERigidBody2DType.Kinematic : ERigidBody2DType.Dynamic;
            rb.linearVelocity = Vec2.ZERO;
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

        this.playAudio("Transition");

        const seq = tween(this.boardHolderNode)
            .by(0.07, { position: new Vec3(12, 0, 0) })
            .by(0.07, { position: new Vec3(-24, 0, 0) })
            .to(0.05, { position: this._originalBoardPos })
            .to(0.8, { position: targetLocalPos }, { easing: 'expoInOut' })
            .call(() => {
                restorationTask();
            });

        if (isFinalMerge) {
            // UI back up before victory screen hits
            this.animateTopUI(false);

            seq.delay(3.0)
               .call(() => {
                   if (this.lilyNode) {
                       this.lilyNode.active = true;
                       const anim = this.lilyNode.getComponent('cc.Animation') as Animation;
                       if (anim) anim.play();
                   }
               })
               .delay(3.0) 
               .call(() => {
                   if (this.victoryScreen) this.victoryScreen.show(true);
                   this.playAudio("Win");
               })
               .start();
        } else {
            seq.delay(1.5)
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

    this.executeMergeSequence(() => {
        this.applyJuice(this.tableSprite.node, this.fixedTableSF, () => {
            
            const sparkleNodes = [
                this.TableSparklePos1, 
                this.TableSparklePos2, 
                this.TableSparklePos3
            ];
            
            sparkleNodes.forEach((posNode, index) => {
                if (posNode) {
                    this.scheduleOnce(() => {
                        // Pass 2.0 for double size
                        this.spawnSparkle(posNode, 2.0);
                    }, index * 0.1); 
                }
            });

            // Sparkle on the table itself at 2x size
            this.spawnSparkle(this.tableSprite.node, 2.0);
            
            this.playAudio("Sparkle");
        });
    });
}

public restoreLamp() {
    if (this._lampRestored) return;
    this._lampRestored = true;

    this.executeMergeSequence(() => {
        this.applyJuice(this.lampSprite.node, this.fixedLampSF, () => {
            // Fairy Lights 
            if (this.lightsNode) {
                this.lightsNode.active = true;
                const anim = this.lightsNode.getComponent(Animation);
                if (anim) {
                    anim.play("FairyLightsAnim");
                    this.playAudio("Lights")
                }
            }

            // Drop the Chandelier 
            this.scheduleOnce(() => {
                this.dropChandelier();
                this.playAudio("Sparkle");
            }, 0.65); 
        });
    });
}

private dropChandelier() {
    if (!this.chandelierNode || !this.chandelierDropPos) return;

    this.chandelierNode.active = true;
    
    const targetWorldPos = this.chandelierDropPos.worldPosition;
    const parentUI = this.chandelierNode.parent.getComponent(UITransform);
    const targetLocalPos = new Vec3();
    
    if (parentUI) {
        parentUI.convertToNodeSpaceAR(targetWorldPos, targetLocalPos);
    }

    tween(this.chandelierNode)
        .to(1.2, { position: targetLocalPos }, { easing: 'bounceOut' }) 
        .call(() => {
            // this.playAudio("Sparkle"); 

            this.spawnSparkle(this.chandelierNode, 3.0);

            for (let i = 0; i < 2; i++) {
                this.scheduleOnce(() => {
                    this.spawnSparkle(this.chandelierNode, 1.5);
                }, 0.1 * (i + 1));
            }
        })
        .start();
}

    public restoreGarden() {
        if (this._gardenRestored) return;
        this._gardenRestored = true;

        this.executeMergeSequence(() => {
            // Background swap 
            tween(this.backgroundSprite.node)
                .to(0.2, { scale: new Vec3(1.05, 1.05, 1) })
                .call(() => { 
                    this.backgroundSprite.spriteFrame = this.fixedGardenSF; 
                })
                // Wait 0.3s AFTER the sprite swap before starting the flowers
                .delay(0.3) 
                .call(() => {
                    this.startFlowerSpawning();
                })
                .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                .start();
        });
    }

    private startFlowerSpawning() {
        const spawnFlower = (parentNode: Node) => {
            if (!parentNode || !this.flowerPrefab) return;
            const flower = instantiate(this.flowerPrefab);
            flower.parent = parentNode;
            flower.setPosition(0, 0, 0);
            
            const anim = flower.getComponent(Animation);
            if (anim) anim.play("FlowerAnim");
            this.spawnSparkle(parentNode); 
        };

        // Play Pos 2 and 3 together
        spawnFlower(this.flowerPos2);
        spawnFlower(this.flowerPos3);

        this.playAudio("Sparkle");

        // Play Pos 1 after the small staggered delay
        this.scheduleOnce(() => {
            spawnFlower(this.flowerPos1);
        }, 0.3);
    }


private spawnSparkle(parentNode: Node, scale: number = 1.0) {
    if (!parentNode || !this.sparklePrefab) return;

    const sparkle = instantiate(this.sparklePrefab);
    sparkle.parent = parentNode;
    sparkle.setPosition(0, 0, 0);
    
    // pass 2x scale
    sparkle.setScale(new Vec3(scale, scale, 1));

    const anim = sparkle.getComponent(Animation);
    if (anim) {
        anim.play(); 
    }

    this.scheduleOnce(() => {
        if (sparkle && sparkle.isValid) {
            sparkle.destroy();
        }
    }, 2.0); 
}

    private applyJuice(target: Node, newSprite: SpriteFrame, callback?: Function) {
        const originalScale = target.scale.clone();
        const popScale = new Vec3(originalScale.x * 1.2, originalScale.y * 1.2, originalScale.z);

        tween(target)
            .to(0.2, { scale: new Vec3(0, 0, 1) }, { easing: 'sineIn' })
            .call(() => {
                const s = target.getComponent(Sprite);
                if (s) s.spriteFrame = newSprite;
                if (callback) callback();
            })
            .to(0.3, { scale: popScale }, { easing: 'backOut' })
            .to(0.15, { scale: originalScale })
            .start();
    }
}