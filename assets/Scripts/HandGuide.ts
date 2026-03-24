import { _decorator, Component, Node, Vec3, tween, Tween } from 'cc';
import { ItemLevelController } from './ItemLevelController';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

@ccclass('HandGuide')
export class HandGuide extends Component {
    @property(Node)
    public boardHolder: Node = null!;

    private _tween: Tween<Node> | null = null;
    private _isShowing: boolean = false;

private findMergePair(): { start: Node, end: Node } | null {
    if (!this.boardHolder) return null;

    // 1. Get all items and sort them by level (Highest first)
    const items = this.boardHolder.getComponentsInChildren(ItemLevelController)
        .sort((a, b) => b.currentLevel - a.currentLevel);
    
    // 2. Search for the first valid pair in the sorted list
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const itemA = items[i];
            const itemB = items[j];

            if (
                itemA.itemType === itemB.itemType &&
                itemA.currentLevel === itemB.currentLevel &&
                itemA.currentLevel < 2 // Level 2 items are usually "final" targets
            ) {
                // Return the first match found (which will be the highest level)
                return { start: itemA.node, end: itemB.node };
            }
        }
    }
    return null;
}

public show() {

    if (this._isShowing || (GameManager.Instance && GameManager.Instance["_isTransitioning"])) {
        return;
    }
    
    const pair = this.findMergePair();
    if (!pair) return; 

    this._isShowing = true;
    this.node.active = true;

    this.playSequence(pair.start, pair.end);
}

    private playSequence(startNode: Node, endNode: Node) {
        if (this._tween) this._tween.stop();

        // We use a function to get position so it stays accurate if the board moves
        const getStartPos = () => startNode.worldPosition;
        const getEndPos = () => endNode.worldPosition;

        this.node.setWorldPosition(getStartPos());

        this._tween = tween(this.node)
            .repeatForever(
                tween()
                    // 1. Reset to start
                    .call(() => {
                        this.node.setWorldPosition(getStartPos());
                        this.node.setScale(new Vec3(1.2, 1.2, 1));
                    })
                    // 2. "Press" down animation
                    .to(0.3, { scale: new Vec3(0.8, 0.8, 1) }, { easing: 'sineOut' })
                    // 3. Move to target using worldPosition
                    .parallel(
                        tween().to(1.0, { worldPosition: getEndPos() }, { easing: 'quadInOut' }),
                        tween().to(1.0, { scale: new Vec3(1, 1, 1) })
                    )
                    // 4. "Release" animation
                    .to(0.2, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'sineIn' })
                    .delay(0.5)
            )
            .start();
    }


    public hide() {
        this._isShowing = false;
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
        this.node.active = false;
    }
}