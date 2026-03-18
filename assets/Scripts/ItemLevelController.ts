import { _decorator, Component, Node, instantiate, Vec3 } from 'cc';
import { DragAndDrop } from './DragAndDrop';
const { ccclass, property } = _decorator;

@ccclass('ItemLevelController')
export class ItemLevelController extends Component {
    @property
    public itemType: string = "chair";
    @property
    public currentLevel: number = 0;

    public itemDatabase: any[] = []; 

    public upgrade() {
        const nextLevel = this.currentLevel + 1;
        const data = this.itemDatabase.find(d => d.typeName === this.itemType);
        
        if (data && data.levelPrefabs[nextLevel]) {
            const newNode = instantiate(data.levelPrefabs[nextLevel]);
            newNode.parent = this.node.parent;
            newNode.setPosition(this.node.position);

            // 1. Initialize Controller data
            const newCtrl = newNode.getComponent(ItemLevelController);
            if (newCtrl) {
                newCtrl.itemType = this.itemType;
                newCtrl.currentLevel = nextLevel;
                newCtrl.itemDatabase = this.itemDatabase;
            }

            // 2. Transfer Drag references
            const oldDrag = this.getComponent(DragAndDrop);
            const newDrag = newNode.getComponent(DragAndDrop);
            if (oldDrag && newDrag) {
                newDrag.grabLayer = oldDrag.grabLayer;
            }
            
            // 3. Remove old item
            this.node.destroy();
            console.log(`Upgraded ${this.itemType} to Level ${nextLevel}`);
        }
    }
}