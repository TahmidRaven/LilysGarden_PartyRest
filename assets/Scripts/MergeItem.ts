import { _decorator, Component, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MergeItem')
export class MergeItem extends Component {
    @property
    public colorName: string = 'red'; 

    // This flag prevents other items from "seeing" this one during a search
    public isMatched: boolean = false;

    public playMatchAnimation() {
        this.isMatched = true; // Mark as busy immediately
        
        tween(this.node)
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'sineOut' })
            .to(0.15, { scale: Vec3.ZERO }, { easing: 'sineIn' })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }
}