import { _decorator, Component, Node, instantiate, Vec3, tween } from 'cc';
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
        
        // Find the data for this item type in our database
        const data = this.itemDatabase.find(d => d.typeName === this.itemType);
        
        if (data && data.levelPrefabs[nextLevel]) {
            // 1. Create the new item
            const nextLevelPrefab = data.levelPrefabs[nextLevel];
            const newNode = instantiate(nextLevelPrefab);
            
            // 2. Setup Hierarchy and Position
            newNode.parent = this.node.parent;
            newNode.setPosition(this.node.position);

            // 3. THE JUICY POP TWEEN
            // Start from nothing, burst large, then settle
            newNode.setScale(new Vec3(0, 0, 0));
            tween(newNode)
                .to(0.15, { scale: new Vec3(1.4, 1.4, 1) }, { easing: 'sineOut' }) // Quick burst
                .to(0.1, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'sineIn' })   // Small squash
                .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })    // Final settle
                .start();

            // 4. Initialize the new node's controller
            const newCtrl = newNode.getComponent(ItemLevelController);
            if (newCtrl) {
                newCtrl.itemType = this.itemType;
                newCtrl.currentLevel = nextLevel;
                newCtrl.itemDatabase = this.itemDatabase;
            }

            // 5. Transfer GrabLayer reference so the new item remains draggable
            const oldDrag = this.getComponent(DragAndDrop);
            const newDrag = newNode.getComponent(DragAndDrop);
            if (oldDrag && newDrag) {
                newDrag.grabLayer = oldDrag.grabLayer;
            }
            
            // 6. Destroy the old item
            this.node.destroy();
        }
    }
}