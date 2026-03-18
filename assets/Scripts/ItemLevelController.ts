import { _decorator, Component, Node, instantiate, Vec3, tween } from 'cc';
import { DragAndDrop } from './DragAndDrop';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('ItemLevelController')
export class ItemLevelController extends Component {
    @property public itemType: string = "chair";
    @property public currentLevel: number = 0;
    public itemDatabase: any[] = []; 

    public upgrade() {
        const nextLevel = this.currentLevel + 1;
        const data = this.itemDatabase.find(d => d.typeName === this.itemType);
        
        if (data && data.levelPrefabs[nextLevel]) {
            const nextLevelPrefab = data.levelPrefabs[nextLevel];
            const newNode = instantiate(nextLevelPrefab);
            
            newNode.parent = this.node.parent;
            newNode.setPosition(this.node.position);

            newNode.setScale(new Vec3(0, 0, 0));
            tween(newNode)
                .to(0.15, { scale: new Vec3(1.4, 1.4, 1) }, { easing: 'sineOut' })
                .to(0.1, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'sineIn' })
                .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();

            const newCtrl = newNode.getComponent(ItemLevelController);
            if (newCtrl) {
                newCtrl.itemType = this.itemType;
                newCtrl.currentLevel = nextLevel;
                newCtrl.itemDatabase = this.itemDatabase;
            }

            const oldDrag = this.getComponent(DragAndDrop);
            const newDrag = newNode.getComponent(DragAndDrop);
            if (oldDrag && newDrag) {
                newDrag.grabLayer = oldDrag.grabLayer;
            }

            if (GameManager.Instance) {
                GameManager.Instance.advanceBackground();
                if (nextLevel === 2) {
                    GameManager.Instance.onFinalLevelReached();
                }
            }
            
            this.node.destroy();
        }
    }
}