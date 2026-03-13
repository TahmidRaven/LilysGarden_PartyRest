import { _decorator, Component, Node, Vec3, AudioSource, UITransform } from 'cc';
import { MergeItem } from './MergeItem';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager = null!;

    @property(Node) public gridContainer: Node = null!; 
    @property(AudioSource) public audioSource: AudioSource = null!;

    onLoad() {
        GameManager.instance = this;
    }


    public checkMatchAtPosition(draggedNode: Node): boolean {
        const dragScript = draggedNode.getComponent(MergeItem);
        if (!dragScript) return false;

        const worldPos = draggedNode.worldPosition;
        const allItems = this.gridContainer.getComponentsInChildren(MergeItem);
        
        for (const targetItem of allItems) {
            if (targetItem.node === draggedNode) continue;

            const distance = Vec3.distance(worldPos, targetItem.node.worldPosition);
            
            if (distance < 60) {
                if (dragScript.colorName === targetItem.colorName) {
                    dragScript.playMatchAnimation();
                    targetItem.playMatchAnimation();
                    if (this.audioSource) this.audioSource.play();
                    return true;
                }
            }
        }
        return false;
    }
}