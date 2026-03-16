import { _decorator, Component, Vec3, tween, Prefab, instantiate, Color, Sprite, Animation } from 'cc';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

@ccclass('MergeItem')
export class MergeItem extends Component {
    @property
    public colorName: string = 'red';

    @property(Prefab)
    public destroyAnimPrefab: Prefab = null!;

    public isMatched: boolean = false;

    private getColorValue(name: string): Color {
        const lowerName = name.toLowerCase();
        if (lowerName === 'purple') return new Color(150, 0, 255);
        if (lowerName === 'yellow') return new Color(255, 235, 0);
        if (lowerName === 'orange') return new Color(255, 165, 0);
        if (lowerName === 'red') return new Color(255, 50, 50);
        if (lowerName === 'blue') return new Color(116, 116, 206, 255);
        if (lowerName === 'pink') return new Color(255, 192, 203);

        return Color.WHITE;
    }

    public playMatchAnimation() {
        this.isMatched = true;
        
        if (GameManager.instance) {
            GameManager.instance.playSFX("Destory");
        }

        if (this.destroyAnimPrefab) {
            const animNode = instantiate(this.destroyAnimPrefab);
            animNode.setParent(this.node.parent); 
            animNode.setWorldPosition(this.node.worldPosition);
            animNode.setScale(new Vec3(1, 1, 1));

            const sprite = animNode.getComponent(Sprite) || animNode.getComponentInChildren(Sprite);
            if (sprite) {
                sprite.color = this.getColorValue(this.colorName);
            }

            const animComp = animNode.getComponent(Animation) || animNode.getComponentInChildren(Animation);
            if (animComp) {
                animComp.play();
            }

            this.scheduleOnce(() => {
                if (animNode.isValid) animNode.destroy();
            }, 1.0);
        }

        tween(this.node)
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'sineOut' })
            .to(0.15, { scale: Vec3.ZERO }, { easing: 'sineIn' })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }
}