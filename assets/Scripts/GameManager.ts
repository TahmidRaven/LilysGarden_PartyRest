import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, Vec2, tween, UITransform, Widget, RigidBody2D, ERigidBody2DType } from 'cc';
import { GameBoardController } from './GameBoardController';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node) public initialSceneNode: Node = null;
    @property(Node) public boardHolderNode: Node = null;
    @property(Node) public boardHolderMovePos: Node = null; 
    @property(GameBoardController) public gameBoardController: GameBoardController = null;
    @property(Sprite) public backgroundSprite: Sprite = null;
    @property([SpriteFrame]) public bgStages: SpriteFrame[] = [];

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
        if (this.bgStages.length > this._currentStage && this.backgroundSprite) {
            this.backgroundSprite.spriteFrame = this.bgStages[this._currentStage];
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
            // Use new Vec2(0, 0) to fix the 'v2 does not exist' error
            rb.linearVelocity = new Vec2(0, 0);
            rb.angularVelocity = 0;
        });
    }

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
                    })
                    .start();
            }
        }
    }
}