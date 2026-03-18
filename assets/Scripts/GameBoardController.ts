import { _decorator, Component, Node, Prefab, instantiate, Vec3, UITransform, tween } from 'cc';
import { ItemLevelController } from './ItemLevelController';
import { DragAndDrop } from './DragAndDrop'; // Import your drag script
const { ccclass, property } = _decorator;

@ccclass('ItemData')
class ItemData {
    @property({ tooltip: "Name of the item category" })
    public typeName: string = "";

    @property([Prefab])
    public levelPrefabs: Prefab[] = []; 
}

@ccclass('GameBoardController')
export class GameBoardController extends Component {

    @property([ItemData])
    public itemDatabase: ItemData[] = []; 

    @property(Node)
    public boardHolder: Node = null;

    @property(Node)
    public grabItemOnTop: Node = null; // New Reference! Drag the scene node here.

    public initBoard() {
        if (this.itemDatabase.length === 0 || !this.boardHolder) return;

        this.itemDatabase.forEach((itemGroup, groupIndex) => {
            for (let i = 0; i < 4; i++) {
                const delay = (groupIndex * 4 + i) * 0.1;
                this.scheduleOnce(() => {
                    this.spawnLevelZeroItem(itemGroup);
                }, delay);
            }
        });
    }

    private spawnLevelZeroItem(group: ItemData) {
        const prefab = group.levelPrefabs[0];
        if (!prefab) return;

        const newItem = instantiate(prefab);
        newItem.parent = this.boardHolder;

        // --- Set Position & Pop Juice ---
        const uiTransform = this.boardHolder.getComponent(UITransform);
        const randomX = (Math.random() - 0.5) * (uiTransform.contentSize.width * 0.8);
        const startY = uiTransform.contentSize.height / 2;
        newItem.setPosition(new Vec3(randomX, startY, 0));

        newItem.setScale(new Vec3(0, 0, 0));
        tween(newItem).to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();

        // --- Injection: Give the item the references it needs ---
        const controller = newItem.getComponent(ItemLevelController);
        if (controller) {
            controller.itemType = group.typeName;
            controller.currentLevel = 0;
            (controller as any).itemDatabase = this.itemDatabase; 
        }

        const dragScript = newItem.getComponent(DragAndDrop);
        if (dragScript) {
            // This is the fix: Assign the scene reference at runtime
            dragScript.grabLayer = this.grabItemOnTop; 
        }
    }
}