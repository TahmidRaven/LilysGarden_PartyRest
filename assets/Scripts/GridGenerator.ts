import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
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
                const randomIndex = Math.floor(Math.random() * this.itemPrefabs.length);
                const item = instantiate(this.itemPrefabs[randomIndex]);

                item.setParent(this.node);
                const posX = startX + c * totalStep;
                const posY = startY - r * totalStep;
                const localPos = new Vec3(posX, posY, 0);
                
                item.setPosition(localPos);

                const dragComp = item.getComponent(Draggable);
                if (dragComp) dragComp.setHomePosition(localPos);
            }
        }
    }
}