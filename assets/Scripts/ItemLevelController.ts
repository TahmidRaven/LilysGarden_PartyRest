import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ItemLevelController')
export class ItemLevelController extends Component {

    @property({ tooltip: "The category of the item (e.g., chair, flower, lamp)" })
    public itemType: string = "chair";

    @property({ tooltip: "The current level of the item (0, 1, 2...)" })
    public currentLevel: number = 0;

    public upgrade() {
        this.currentLevel++;
        this.updateVisuals();
    }

    private updateVisuals() {
        console.log(`Item ${this.itemType} is now Level ${this.currentLevel}`);
    }
}