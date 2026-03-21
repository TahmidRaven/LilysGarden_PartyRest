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
        //Spawn initial set (4 of each type)
        this.itemDatabase.forEach((itemGroup) => {
            for (let i = 0; i < 4; i++) {
                const delay = count * 0.04; 
                this.scheduleOnce(() => {
                    this.spawnLevelZeroItem(itemGroup);
                }, delay);
                count++;
            }
        });

        // Spawn 2 extra random items for no fucking reason 
        const finalDelay = count * 0.04;
        this.scheduleOnce(() => {
            this.spawnRandomItems(2);
        }, finalDelay);
    }

    public spawnRandomItems(amount: number = 2) {
        if (this.itemDatabase.length === 0) return;

        for (let i = 0; i < amount; i++) {
            const randomIndex = Math.floor(Math.random() * this.itemDatabase.length);
            const randomGroup = this.itemDatabase[randomIndex];
            
            // A tiny stagger delay if spawning multiple
            this.scheduleOnce(() => {
                this.spawnLevelZeroItem(randomGroup);
            }, i * 0.05);
        }
    }

    private spawnLevelZeroItem(group: ItemData) {
        const prefab = group.levelPrefabs[0];
        if (!prefab) return;

        const newItem = instantiate(prefab);
        newItem.parent = this.boardHolder;

        // Random Position Logic 
        const uiTransform = this.boardHolder.getComponent(UITransform);
        if (uiTransform) {
            const randomX = (Math.random() - 0.5) * (uiTransform.contentSize.width * 0.8);
            
            // Random Y offset to prevent physics overlap "lag"
            const baseYSpan = uiTransform.contentSize.height / 2;
            const randomYOffset = (Math.random() - 0.5) * 40; 
            
            newItem.setPosition(new Vec3(randomX, baseYSpan + randomYOffset, 0));
        }

        // Spawning Animation
        newItem.setScale(new Vec3(0, 0, 0));
        tween(newItem)
            .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();


        const controller = newItem.getComponent(ItemLevelController);
        if (controller) {
            controller.itemType = group.typeName;
            controller.currentLevel = 0;
            controller.itemDatabase = this.itemDatabase; 
        }

        // Drag & Drop Setup
        const dragScript = newItem.getComponent(DragAndDrop);
        if (dragScript) {
            dragScript.grabLayer = this.grabItemOnTop; 
        }
    }
}