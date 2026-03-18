import { _decorator, Component, Node, Vec3, EventTouch, RigidBody2D, ERigidBody2DType, Vec2, Collider2D, Contact2DType, IPhysics2DContact } from 'cc';
import { ItemLevelController } from './ItemLevelController';
const { ccclass, property } = _decorator;

@ccclass('DragAndDrop')
export class DragAndDrop extends Component {

    public grabLayer: Node = null; 

    private _rb: RigidBody2D = null;
    private _isDragging: boolean = false;
    private _originalParent: Node = null;

    // These correspond to the indices in your Project Settings > Physics
    // Index 1 = DRAGGED, Index 2 = STATIONARY
    private readonly GROUP_DRAGGED = 1 << 1;
    private readonly GROUP_STATIONARY = 1 << 2;

    start() {
        this._rb = this.getComponent(RigidBody2D);
        this._originalParent = this.node.parent;
        
        // Ensure it starts in the stationary group
        if (this._rb) {
            this._rb.group = this.GROUP_STATIONARY;
        }
    }

    onEnable() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);

        const colliders = this.getComponents(Collider2D);
        colliders.forEach(collider => {
            if (collider.tag === 10) { 
                collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            }
        });
    }

    private onTouchStart(event: EventTouch) {
        if (!this.node.parent) return;
        this._isDragging = true;
        
        // Move to top layer
        if (this.grabLayer && this.node.parent !== this.grabLayer) {
            const worldPos = this.node.worldPosition.clone();
            this.node.parent = this.grabLayer;
            this.node.worldPosition = worldPos;
        }

        if (this._rb) {
            // Change group so it doesn't push others
            this._rb.group = this.GROUP_DRAGGED;
            this._rb.type = ERigidBody2DType.Kinematic;
            this._rb.linearVelocity = Vec2.ZERO;
        }
    }

    private onTouchMove(event: EventTouch) {
        if (!this._isDragging) return;
        const d = event.getDelta();
        const worldPos = this.node.worldPosition;
        this.node.setWorldPosition(worldPos.x + d.x, worldPos.y + d.y, worldPos.z);
    }

    private onTouchEnd(event: EventTouch) {
        if (!this._isDragging) return;
        this._isDragging = false;

        // Return to board layer
        if (this._originalParent && this.node.parent !== this._originalParent) {
            const worldPos = this.node.worldPosition.clone();
            this.node.parent = this._originalParent;
            this.node.worldPosition = worldPos;
        }

        if (this._rb) {
            // Return to stationary physics
            this._rb.group = this.GROUP_STATIONARY;
            this._rb.type = ERigidBody2DType.Dynamic;
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // Only trigger merge if WE are the one being dragged
        if (!this._isDragging) return;

        // Only merge with other sensors (Tag 10)
        if (otherCollider.tag !== 10) return;

        const myCtrl = this.getComponent(ItemLevelController);
        const otherCtrl = otherCollider.node.getComponent(ItemLevelController);

        if (myCtrl && otherCtrl && 
            myCtrl.itemType === otherCtrl.itemType && 
            myCtrl.currentLevel === otherCtrl.currentLevel) {
            
            // Limit to max level (based on your levelPrefabs array length)
            if (myCtrl.currentLevel < 2) { 
                this.executeMerge(otherCtrl);
            }
        }
    }

    private executeMerge(target: ItemLevelController) {
        this._isDragging = false;
        target.upgrade(); // Upgrade the one on the board
        this.node.destroy(); // Destroy the one in our "hand"
    }
}