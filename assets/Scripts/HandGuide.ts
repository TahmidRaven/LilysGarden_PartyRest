import { _decorator, Component, Node, Vec3, tween, Tween, UITransform } from 'cc';
import { ItemLevelController } from './ItemLevelController';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

@ccclass('HandGuide')
export class HandGuide extends Component {
    @property(Node)
    public boardHolder: Node = null!;

    @property
    public idleDelay: number = 3.0; // Time to wait before showing guide

    private _tween: Tween<Node> | null = null;
    private _isGuiding: boolean = false;
    private _lastTouchTime: number = 0;

    start() {
        this.node.active = false;
        this._lastTouchTime = Date.now();
        
        // Listen for touches globally to reset the timer
        this.node.parent?.on(Node.EventType.TOUCH_START, this.resetTimer, this);
    }

    public triggerImmediateCheck() {
        this._lastTouchTime = 0; // Force the idle check to pass in the next update
        this.showGuide();
    }

    update(dt: number) {
        if (this._isGuiding) return;

        // Check if user has been idle
        const currentTime = Date.now();
        if (currentTime - this._lastTouchTime > this.idleDelay * 1000) {
            this.showGuide();
        }
    }

    private resetTimer() {
        this._lastTouchTime = Date.now();
        this.stopGuide();
    }

    private showGuide() {
        const pair = this.findValidMergePair();
        if (pair) {
            this._isGuiding = true;
            this.node.active = true;
            this.animateHand(pair.startNode, pair.endNode);
        }
    }

    private stopGuide() {
        this._isGuiding = false;
        this.node.active = false;
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
    }

    private findValidMergePair(): { startNode: Node, endNode: Node } | null {
        if (!this.boardHolder) return null;

        const items = this.boardHolder.getComponentsInChildren(ItemLevelController);
        
        // Loop through items to find two that match type and level
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                const a = items[i];
                const b = items[j];

                if (a.itemType === b.itemType && a.currentLevel === b.currentLevel && a.currentLevel < 2) {
                    return { startNode: a.node, endNode: b.node };
                }
            }
        }
        return null;
    }

    private animateHand(startNode: Node, endNode: Node) {
        const startPos = this.convertToLocalPos(startNode.worldPosition);
        const endPos = this.convertToLocalPos(endNode.worldPosition);

        this.node.setPosition(startPos);

        this._tween = tween(this.node)
            .repeatForever(
                tween()
                    .set({ position: startPos, scale: new Vec3(1.2, 1.2, 1) })
                    .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' }) // "Press" effect
                    .to(1.2, { position: endPos }, { easing: 'quadInOut' })
                    .to(0.2, { scale: new Vec3(1.2, 1.2, 1) }) // "Release" effect
                    .delay(0.5)
            )
            .start();
    }

    private convertToLocalPos(worldPos: Vec3): Vec3 {
        const uiTransform = this.node.parent!.getComponent(UITransform)!;
        return uiTransform.convertToNodeSpaceAR(worldPos);
    }
}

