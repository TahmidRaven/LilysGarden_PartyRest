import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, Vec2, tween, UITransform, Widget, RigidBody2D, ERigidBody2DType } from 'cc';
import { GameBoardController } from './GameBoardController';
import { VictoryScreen } from './VictoryScreen'; // Added reference to your new script

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node) public initialSceneNode: Node = null;
    @property(Node) public boardHolderNode: Node = null;
    @property(Node) public boardHolderMovePos: Node = null; 
    @property(GameBoardController) public gameBoardController: GameBoardController = null;
    @property(Sprite) public backgroundSprite: Sprite = null;
    @property([SpriteFrame]) public bgStages: SpriteFrame[] = [];

    // Reference to the Victory Screen component
    @property(VictoryScreen) public victoryScreen: VictoryScreen = null;

    private _currentStage: number = 0;
    private _isTransitioning: boolean = false;
    private _originalBoardPos: Vec3 = new Vec3();

    public static Instance: GameManager = null;

    onLoad() { 
        GameManager.Instance = this; 
    }

    start() {
        if (this.boardHolderNode) {
            this.boardHolderNode.active = false;
            // Record initial local position
            this._originalBoardPos = this.boardHolderNode.position.clone();
        }
        if (this.initialSceneNode) {
            this.initialSceneNode.on(Node.EventType.TOUCH_START, this.onFirstTouch, this);
        }
    }

    private onFirstTouch() {
        if (this.boardHolderNode) this.boardHolderNode.active = true;
        if (this.gameBoardController) this.gameBoardController.initBoard();
        if (this.initialSceneNode) this.initialSceneNode.destroy();
    }
    
public advanceBackground() {
    this._currentStage++;
    console.log(`Merge Success! Stage: ${this._currentStage}`);
    
    // Update the background sprite based on stage
    if (this.bgStages.length > this._currentStage && this.backgroundSprite) {
        this.backgroundSprite.spriteFrame = this.bgStages[this._currentStage];
    }

    // CHECK FOR VICTORY CONDITION:
    // If this is the 3rd successful merge/transition, trigger the sequence
    if (this._currentStage === 3) {
        this.onFinalLevelReached();
    }
}

    /**
     * Toggles physics for all items. 
     * Kinematic = items follow the parent board perfectly and ignore gravity.
     * Dynamic = items fall and collide normally.
     */
    private setAllItemsPhysics(isKinematic: boolean) {
        if (!this.boardHolderNode) return;
        const bodies = this.boardHolderNode.getComponentsInChildren(RigidBody2D);
        bodies.forEach(rb => {
            rb.type = isKinematic ? ERigidBody2DType.Kinematic : ERigidBody2DType.Dynamic;
            rb.linearVelocity = new Vec2(0, 0);
            rb.angularVelocity = 0;
        });
    }

    /**
     * Triggered when the final merge level is reached.
     * Moves board to a target location and back, then shows victory.
     */
    public onFinalLevelReached() {
        if (this._isTransitioning) return;
        if (!this.boardHolderMovePos) {
            console.error("boardHolderMovePos not assigned!");
            return;
        }

        this._isTransitioning = true;
        console.log(">>> FINAL LEVEL REACHED: Starting Transition <<<");

        if (this.boardHolderNode) {
            // Disable widget so it doesn't fight the tween
            const widget = this.boardHolderNode.getComponent(Widget);
            if (widget) widget.enabled = false;

            // 1. LOCK ITEMS TO BOARD
            this.setAllItemsPhysics(true);

            const targetWorldPos = this.boardHolderMovePos.worldPosition;
            const parentUITransform = this.boardHolderNode.parent.getComponent(UITransform);
            
            if (parentUITransform) {
                const targetLocalPos = new Vec3();
                parentUITransform.convertToNodeSpaceAR(targetWorldPos, targetLocalPos);

                tween(this.boardHolderNode)
                    .to(1.2, { position: targetLocalPos }, { easing: 'expoInOut' })
                    .call(() => console.log("Sequence: Board at target location."))
                    .delay(2.0) 
                    .to(1.0, { position: this._originalBoardPos }, { easing: 'expoOut' })
                    .call(() => {
                        this._isTransitioning = false;
                        if (widget) widget.enabled = true;
                        
                        // 2. RESTORE PHYSICS
                        this.setAllItemsPhysics(false);
                        console.log("Sequence Complete: Board returned and items restored.");

                        // 3. SHOW VICTORY SCREEN
                        if (this.victoryScreen) {
                            this.victoryScreen.show(true);
                        }
                    })
                    .start();
            }
        }
    }
}