import { _decorator, Component, Node, Prefab, instantiate, Vec3, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GridGenerator')
export class GridGenerator extends Component {
    @property([Prefab])
    itemPrefabs: Prefab[] = []; // Drag your 6 color prefabs here

    @property
    rows: number = 4;

    @property
    cols: number = 4;

    @property
    spacing: number = 110;

    start() {
        this.generateGrid();
    }

    generateGrid() {
        const uiTransform = this.node.getComponent(UITransform);
        const cellSize = 100; // Adjust based on your asset size
        
        // Calculate the starting top-left position to center the grid
        const startX = -((this.cols - 1) * (cellSize + this.spacing)) / 2;
        const startY = ((this.rows - 1) * (cellSize + this.spacing)) / 2;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Pick a random prefab from your list
                const randomIndex = Math.floor(Math.random() * this.itemPrefabs.length);
                const item = instantiate(this.itemPrefabs[randomIndex]);

                // Set parent and position
                item.setParent(this.node);
                const posX = startX + c * (cellSize + this.spacing);
                const posY = startY - r * (cellSize + this.spacing);
                item.setPosition(new Vec3(posX, posY, 0));
            }
        }
    }
}