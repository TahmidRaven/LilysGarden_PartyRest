import { _decorator, Component, Node, Vec3, EventTouch, find, tween, UITransform } from 'cc';
import { GameManager } from './GameManager'; 
import { MergeItem } from './MergeItem';

const { ccclass } = _decorator;

@ccclass('Draggable')
export class Draggable extends Component {
    private topLayerNode: Node = null!;
    private homePosition: Vec3 = new Vec3(); 
    private isDragging: boolean = false;
    private startTouchPos: Vec3 = new Vec3();
    private readonly DRAG_THRESHOLD: number = 20; 

    onLoad() {
        this.topLayerNode = find('Canvas/MergeItemGoOnTop')!;
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    public setHomePosition(pos: Vec3) {
        this.homePosition = pos.clone();
    }

    public getHomePosition(): Vec3 {
        return this.homePosition;
    }

    onTouchStart(event: EventTouch) {
        const mergeItem = this.getComponent(MergeItem);
        if (mergeItem && mergeItem.isMatched) return; // Non-blocking safety check

        const loc = event.getUILocation();
        this.startTouchPos.set(loc.x, loc.y, 0);
        this.isDragging = false; 
    }

    private prepareDrag() {
        const worldPos = this.node.worldPosition.clone();
        if (this.topLayerNode) {
            this.node.setParent(this.topLayerNode);
            this.node.setWorldPosition(worldPos);
            
            tween(this.node)
                .to(0.1, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'sineOut' })
                .start();
        }
    }

    onTouchMove(event: EventTouch) {
        const touchPos = event.getUILocation();
        const currentPos = new Vec3(touchPos.x, touchPos.y, 0);

        if (!this.isDragging && Vec3.distance(this.startTouchPos, currentPos) > this.DRAG_THRESHOLD) {
            this.isDragging = true;
            this.prepareDrag();
        }

        if (this.isDragging) {
            this.node.setWorldPosition(currentPos);
        }
    }

    onTouchEnd() {
        if (!this.isDragging) return;

        let matchFound = false;
        if (GameManager.instance) {
            matchFound = GameManager.instance.checkMatchAtPosition(this.node);
        }

        if (!matchFound) {
            this.returnToHome();
        }
        this.isDragging = false; 
    }

    public returnToHome() {
        if (!this.node.isValid || !GameManager.instance) return;

        tween(this.node).stop();
        const grid = GameManager.instance.gridContainer;
        const gridTransform = grid?.getComponent(UITransform);

        if (grid && gridTransform) {
            const worldTargetPos = gridTransform.convertToWorldSpaceAR(this.homePosition);

            tween(this.node)
                .to(0.15, { worldPosition: worldTargetPos, scale: Vec3.ONE }, { easing: 'sineOut' })
                .call(() => {
                    this.node.setParent(grid);
                    this.node.setPosition(this.homePosition);
                })
                .start();
        }
    }
}