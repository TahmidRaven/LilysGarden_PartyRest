import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween } from 'cc';
import { Draggable } from './Draggable';

const { ccclass, property } = _decorator;

@ccclass('GridGenerator')
export class GridGenerator extends Component {
    @property([Prefab]) itemPrefabs: Prefab[] = [];
    @property rows: number = 4;
    @property cols: number = 4;
    @property spacing: number = 110;

    start() {
        this.generateGrid();
    }

    generateGrid() {
        const cellSize = 100;
        const totalStep = cellSize + this.spacing;
        const startX = -((this.cols - 1) * totalStep) / 2;
        const startY = ((this.rows - 1) * totalStep) / 2;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const posX = startX + c * totalStep;
                const posY = startY - r * totalStep;
                this.spawnNewItem(new Vec3(posX, posY, 0), false);
            }
        }
    }

    /**
     * Called by MergeItem to refill a specific spot on the grid
     */
    public refillSlot(position: Vec3) {
        // Delay slightly to let the destruction animation breathe
        this.scheduleOnce(() => {
            this.spawnNewItem(position, true);
        }, 0.1);
    }

    private spawnNewItem(targetPos: Vec3, animate: boolean) {
        if (this.itemPrefabs.length === 0) return;

        const randomIndex = Math.floor(Math.random() * this.itemPrefabs.length);
        const item = instantiate(this.itemPrefabs[randomIndex]);
        
        // Ensure it's parented to the grid so coordinates align
        item.setParent(this.node);

        const dragComp = item.getComponent(Draggable);
        if (dragComp) {
            dragComp.setHomePosition(targetPos);
        }

        if (animate) {
            // Drop-in effect: spawn above and scale up
            item.setPosition(new Vec3(targetPos.x, targetPos.y + 200, 0));
            item.setScale(new Vec3(0, 0, 0));
            
            tween(item)
                .to(0.5, { position: targetPos, scale: Vec3.ONE }, { easing: 'backOut' })
                .start();
        } else {
            item.setPosition(targetPos);
        }
    }
}