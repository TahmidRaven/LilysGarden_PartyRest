import { _decorator, Component, Node, Prefab, instantiate, Vec3, UITransform, tween } from 'cc';
import { ItemLevelController } from './ItemLevelController';
const { ccclass, property } = _decorator;

@ccclass('ItemData')
class ItemData {
    @property({ tooltip: "Name of the item (e.g., Chair)" })
    public typeName: string = "";

    @property([Prefab])
    public levelPrefabs: Prefab[] = []; // Place Lv0, Lv1, and Lv2 prefabs here
}

@ccclass('GameBoardController')
export class GameBoardController extends Component {

    @property([ItemData])
    public itemDatabase: ItemData[] = []; 

    @property(Node)
    public boardHolder: Node = null;

    public initBoard() {
        if (this.itemDatabase.length === 0 || !this.boardHolder) return;

        // Loop through the 3 item types
        this.itemDatabase.forEach((itemGroup, groupIndex) => {
            // Spawn 4 of each at Level 0
            for (let i = 0; i < 4; i++) {
                const totalIndex = (groupIndex * 4) + i;
                this.scheduleOnce(() => {
                    this.spawnItem(itemGroup);
                }, totalIndex * 0.1); // Staggered delay for juice
            }
        });
    }

    private spawnItem(group: ItemData) {
        // Get the Level 0 prefab (first index)
        const prefab = group.levelPrefabs[0];
        if (!prefab) return;

        const newItem = instantiate(prefab);
        newItem.parent = this.boardHolder;

        // --- Positioning (Top of board with random X) ---
        const uiTransform = this.boardHolder.getComponent(UITransform);
        const width = uiTransform ? uiTransform.contentSize.width : 600;
        const height = uiTransform ? uiTransform.contentSize.height : 800;
        
        const startX = (Math.random() - 0.5) * (width * 0.8);
        const startY = height / 2; // Spawn at the top edge of the holder
        
        newItem.setPosition(new Vec3(startX, startY, 0));

        // --- "Juice" Pop Animation ---
        newItem.setScale(new Vec3(0, 0, 0));
        tween(newItem)
            .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();

        // --- Data Setup ---
        const controller = newItem.getComponent(ItemLevelController);
        if (controller) {
            controller.itemType = group.typeName;
            controller.currentLevel = 0;
        }
    }
}