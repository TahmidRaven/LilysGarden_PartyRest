import { _decorator, Component, Node, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ItemLevelController')
export class ItemLevelController extends Component {

    @property
    public itemType: string = "chair";

    @property
    public currentLevel: number = 0;

    public itemDatabase: any[] = []; 

    public upgrade() {
        this.currentLevel++;
        
        // Find the data for this item type
        const data = this.itemDatabase.find(d => d.typeName === this.itemType);
        
        if (data && data.levelPrefabs[this.currentLevel]) {
            const nextLevelPrefab = data.levelPrefabs[this.currentLevel];
            const newNode = instantiate(nextLevelPrefab);
            
            // Match position and parent
            newNode.parent = this.node.parent;
            newNode.setPosition(this.node.position);

            // Re-initialize the new node's controller
            const newCtrl = newNode.getComponent(ItemLevelController);
            if (newCtrl) {
                newCtrl.itemType = this.itemType;
                newCtrl.currentLevel = this.currentLevel;
                newCtrl.itemDatabase = this.itemDatabase;
            }
            
            // Destroy the old level item
            this.node.destroy();
        }
    }
}