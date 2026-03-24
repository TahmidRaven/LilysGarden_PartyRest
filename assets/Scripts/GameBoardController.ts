import { _decorator, Component, Node, Prefab, instantiate, Vec3, UITransform, tween } from 'cc';
import { ItemLevelController } from './ItemLevelController';
import { DragAndDrop } from './DragAndDrop';
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

    // New database for your 4 extra specific prefabs
    @property([ItemData])
    public extraItemDatabase: ItemData[] = []; 

    @property(Node)
    public boardHolder: Node = null;

    @property(Node)
    public grabItemOnTop: Node = null; 


    public initBoard() {
        if (this.itemDatabase.length === 0 || !this.boardHolder) {
            console.warn("GameBoardController: itemDatabase is empty or boardHolder is not assigned.");
            return;
        }

        let count = 0;

        // 1. Spawn initial set (4 of each type from the main database)
        this.itemDatabase.forEach((itemGroup) => {
            for (let i = 0; i < 4; i++) {
                const delay = count * 0.04; 
                this.scheduleOnce(() => {
                    this.spawnItem(itemGroup, this.itemDatabase);
                }, delay);
                count++;
            }
        });

        // 2. Spawn exactly the 4 items from the extra database instead of randoms
        const finalDelayBase = count * 0.04;
        this.extraItemDatabase.forEach((itemGroup, index) => {
            this.scheduleOnce(() => {
                this.spawnItem(itemGroup, this.extraItemDatabase);
            }, finalDelayBase + (index * 0.05));
        });
    }

    /**
     * Refactored spawning logic to handle specific databases and maintain original scale
     */
    private spawnItem(group: ItemData, sourceDb: any[]) {
        const prefab = group.levelPrefabs[0];
        if (!prefab) return;

        const newItem = instantiate(prefab);
        newItem.parent = this.boardHolder;

        // Position Logic 
        const uiTransform = this.boardHolder.getComponent(UITransform);
        if (uiTransform) {
            const randomX = (Math.random() - 0.5) * (uiTransform.contentSize.width * 0.8);
            const baseYSpan = uiTransform.contentSize.height / 2;
            const randomYOffset = (Math.random() - 0.5) * 40; 
            
            newItem.setPosition(new Vec3(randomX, baseYSpan + randomYOffset, 0));
        }

        // Maintain original scale from prefab
        const originalScale = newItem.scale.clone();
        newItem.setScale(new Vec3(0, 0, 0));

        // Spawning Animation using the native scale
        tween(newItem)
            .to(0.25, { scale: originalScale }, { easing: 'backOut' })
            .start();

        // Setup Item Controller
        const controller = newItem.getComponent(ItemLevelController);
        if (controller) {
            controller.itemType = group.typeName;
            controller.currentLevel = 0;
            // Pass the specific database this item belongs to
            controller.itemDatabase = sourceDb; 
        }

        // Drag & Drop Setup
        const dragScript = newItem.getComponent(DragAndDrop);
        if (dragScript) {
            dragScript.grabLayer = this.grabItemOnTop; 
        }
    }
}