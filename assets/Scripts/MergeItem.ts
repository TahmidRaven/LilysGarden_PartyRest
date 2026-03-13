import { _decorator, Component, Vec3, tween, Prefab, instantiate, Color, Sprite, Animation } from 'cc';
import { Draggable } from './Draggable';
import { GameManager } from './GameManager';
import { GridGenerator } from './GridGenerator';

const { ccclass, property } = _decorator;

@ccclass('MergeItem')
export class MergeItem extends Component {
    @property
    public colorName: string = 'red';

    @property(Prefab)
    public destroyAnimPrefab: Prefab = null!; //

    public isMatched: boolean = false;

    /**
     * Maps the string colorName to a Cocos Color object.
     */
    private getColorValue(name: string): Color {
        const lowerName = name.toLowerCase();
        if (lowerName === 'purple') return new Color(150, 0, 255);
        if (lowerName === 'yellow') return new Color(255, 235, 0);
        if (lowerName === 'orange') return new Color(255, 165, 0);
        if (lowerName === 'red') return new Color(255, 50, 50);
        return Color.WHITE;
    }

    public playMatchAnimation() {
        this.isMatched = true;
        
        const dragComp = this.getComponent(Draggable);
        const spawnPos = dragComp ? dragComp.getHomePosition() : this.node.position;

        // --- Handle BlockDestroyAnim ---
        if (this.destroyAnimPrefab) {
            const animNode = instantiate(this.destroyAnimPrefab);
            
            // Ensure it spawns in the same container as the items
            animNode.setParent(this.node.parent); 
            animNode.setWorldPosition(this.node.worldPosition);
            animNode.setScale(new Vec3(1, 1, 1));

            // Apply the color to the Sprite component
            const sprite = animNode.getComponent(Sprite) || animNode.getComponentInChildren(Sprite);
            if (sprite) {
                sprite.color = this.getColorValue(this.colorName);
            }

            // Manually play the animation if 'Play On Load' is not set
            const animComp = animNode.getComponent(Animation) || animNode.getComponentInChildren(Animation);
            if (animComp) {
                animComp.play();
            }

            // Self-destruct the animation node after 1 second to clean up the hierarchy
            this.scheduleOnce(() => {
                if (animNode.isValid) animNode.destroy();
            }, 1.0);
        }

        // --- Visual feedback for the merging item ---
        tween(this.node)
            .to(0.1, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'sineOut' })
            .to(0.15, { scale: Vec3.ZERO }, { easing: 'sineIn' })
            .call(() => {
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