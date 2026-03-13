import { _decorator, Component, Vec3, tween } from 'cc';
import { Draggable } from './Draggable';
import { GameManager } from './GameManager';
import { GridGenerator } from './GridGenerator';

const { ccclass, property } = _decorator;

@ccclass('MergeItem')
export class MergeItem extends Component {
    @property
    public colorName: string = 'red';

    public isMatched: boolean = false;

    public playMatchAnimation() {
        this.isMatched = true;
        
        const dragComp = this.getComponent(Draggable);
        const spawnPos = dragComp ? dragComp.getHomePosition() : this.node.position;

        tween(this.node)
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'sineOut' })
            .to(0.15, { scale: Vec3.ZERO }, { easing: 'sineIn' })
            .call(() => {
                // Refill slot using the global reference
                if (GameManager.instance && GameManager.instance.gridContainer) {
                    const generator = GameManager.instance.gridContainer.getComponent(GridGenerator);
                    if (generator) {
                        generator.refillSlot(spawnPos);
                    }
                }
                this.node.destroy();
            })
            .start();
    }
}