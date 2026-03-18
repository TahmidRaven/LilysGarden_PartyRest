import { _decorator, Component, Node, Vec3, EventTouch, RigidBody2D, ERigidBody2DType, Vec2, Collider2D, Contact2DType, IPhysics2DContact } from 'cc';
import { ItemLevelController } from './ItemLevelController';
const { ccclass, property } = _decorator;

@ccclass('DragAndDrop')
export class DragAndDrop extends Component {
    public grabLayer: Node = null; 

    private _rb: RigidBody2D = null;
    private _isDragging: boolean = false;
    private _originalParent: Node = null;
    
    // Tracks all items currently touching our sensor
    private _contactNodes: Set<Node> = new Set<Node>();

    private readonly GROUP_DRAGGED = 1 << 1;
    private readonly GROUP_STATIONARY = 1 << 2;

    start() {
        this._rb = this.getComponent(RigidBody2D);
        this._originalParent = this.node.parent;
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
                collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
            }
        });
    }

    private onTouchStart(event: EventTouch) {
        this._isDragging = true;
        this._contactNodes.clear(); 
        
        if (this.grabLayer) {
            const worldPos = this.node.worldPosition.clone();
            this.node.parent = this.grabLayer;
            this.node.worldPosition = worldPos;
        }

        if (this._rb) {
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

        let merged = false;

        // 1. Check Physics-based overlaps
        for (const targetNode of this._contactNodes) {
            if (targetNode && targetNode.isValid && this.checkMerge(targetNode)) {
                merged = true;
                break; 
            }
        }

        // 2. Fallback: Proximity check (if physics missed it)
        if (!merged && this._originalParent) {
            const siblings = this._originalParent.children;
            for (const sibling of siblings) {
                if (sibling === this.node) continue;
                const dist = Vec3.distance(this.node.worldPosition, sibling.worldPosition);
                if (dist < 130) { // Adjust threshold based on your item size
                    if (this.checkMerge(sibling)) {
                        merged = true;
                        break;
                    }
                }
            }
        }

        if (!merged) {
            this.returnToBoard();
        }
    }

    private returnToBoard() {
        if (this._originalParent) {
            const worldPos = this.node.worldPosition.clone();
            this.node.parent = this._originalParent;
            this.node.worldPosition = worldPos;
        }
        if (this._rb) {
            this._rb.group = this.GROUP_STATIONARY;
            this._rb.type = ERigidBody2DType.Dynamic;
        }
    }

    private onBeginContact(self: Collider2D, other: Collider2D) {
        if (other.tag === 10) this._contactNodes.add(other.node);
    }

    private onEndContact(self: Collider2D, other: Collider2D) {
        if (other.tag === 10) this._contactNodes.delete(other.node);
    }

    private checkMerge(otherNode: Node): boolean {
        const myCtrl = this.getComponent(ItemLevelController);
        const otherCtrl = otherNode.getComponent(ItemLevelController);

        if (!myCtrl || !otherCtrl) return false;

        // Strict Type and Level matching
        if (myCtrl.itemType === otherCtrl.itemType && 
            myCtrl.currentLevel === otherCtrl.currentLevel &&
            myCtrl.currentLevel < 2) {
            
            otherCtrl.upgrade(); 
            this.node.destroy(); 
            return true;
        }
        return false;
    }
}