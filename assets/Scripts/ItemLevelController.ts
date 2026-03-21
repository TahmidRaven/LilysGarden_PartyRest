import { _decorator, Component, Node, instantiate, Vec3, tween } from 'cc';
import { GameManager } from './GameManager';
import { DragAndDrop } from './DragAndDrop';
const { ccclass, property } = _decorator;

@ccclass('ItemLevelController')
export class ItemLevelController extends Component {
    @property public itemType: string = "table"; 
    @property public currentLevel: number = 0;
    public itemDatabase: any[] = []; 

    public upgrade() {
        const nextLevel = this.currentLevel + 1;
        const data = this.itemDatabase.find(d => d.typeName === this.itemType);
        
        if (data && data.levelPrefabs[nextLevel]) {

            if (GameManager.Instance) {
                GameManager.Instance.playAudio("Merge");
            }
            
            const nextLevelPrefab = data.levelPrefabs[nextLevel];
            const newNode = instantiate(nextLevelPrefab);
            newNode.parent = this.node.parent;
            newNode.setPosition(this.node.position);

            newNode.setScale(Vec3.ZERO);
            tween(newNode)
                .to(0.15, { scale: new Vec3(1.3, 1.3, 1) }, { easing: 'sineOut' })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();

            const newCtrl = newNode.getComponent(ItemLevelController);
            if (newCtrl) {
                newCtrl.itemType = this.itemType;
                newCtrl.currentLevel = nextLevel;
                newCtrl.itemDatabase = this.itemDatabase;
            }

            const oldDrag = this.getComponent(DragAndDrop);
            const newDrag = newNode.getComponent(DragAndDrop);
            if (oldDrag && newDrag) newDrag.grabLayer = oldDrag.grabLayer;

            // Restoration threshold reached (Level 2)
            if (GameManager.Instance && nextLevel === 2) {
                this.notifyManager();
            }
            
            this.node.destroy();
        }
    }

    private notifyManager() {
        const type = this.itemType.toLowerCase();
        // Transition logic for table/chair, lamp, and garden/flower
        if (type === 'table' || type === 'chair') GameManager.Instance.restoreTable();
        else if (type === 'lamp') GameManager.Instance.restoreLamp();
        else if (type === 'garden' || type === 'flower') GameManager.Instance.restoreGarden();
    }
}