import { _decorator, Component, Node, Vec3, AudioSource, Sprite, SpriteFrame, UIOpacity, tween, Label } from 'cc';
import { MergeItem } from './MergeItem';
import { UIElemAnim } from './UIElemAnim'; 
import { VictoryScreen } from './VictoryScreen'; 
import { AudioContent } from './AudioContent'; // Import the AudioContent class

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager = null!;

    @property(Node) public gridContainer: Node = null!;
    
    // Updated: Global Audio List
    @property([AudioContent]) 
    public audioList: AudioContent[] = [];
    
    @property(Sprite) public backgroundSprite: Sprite = null!; 
    @property([SpriteFrame]) public sceneFrames: Array<SpriteFrame> = []; 

    @property(UIElemAnim) public uiAnim: UIElemAnim = null!;
    @property(VictoryScreen) public victoryScreen: VictoryScreen = null!; 

    @property(Label) public fountainLabel: Label = null!;
    @property(Label) public gardenLabel: Label = null!;
    @property(Label) public lanternLabel: Label = null!;

    private currentStep: number = 1;
    private matchCounter: number = 0;
    private fountainCount: number = 0;
    private gardenCount: number = 0;
    private lanternCount: number = 0;

    onLoad() {
        GameManager.instance = this;
        this.updateLabels(); 
    }

    start() {
        this.playSFX("BGM"); // Start background music on launch
    }

    /**
     * Helper to play sound by name from the list
     */
    public playSFX(name: string) {
        const target = this.audioList.find(a => a.AudioName === name);
        if (target) {
            target.play();
        }
    }

    private updateLabels() {
        if (this.fountainLabel) this.fountainLabel.string = `Fix Fountain\n${this.fountainCount} / 3`;
        if (this.gardenLabel) this.gardenLabel.string = `Fix Garden\n${this.gardenCount} / 3`;
        if (this.lanternLabel) this.lanternLabel.string = `Lantern\n${this.lanternCount} / 3`;
    }

    private reportMergeEvent(colorName: string) {
        const color = colorName.toLowerCase();
        let shouldTriggerStep = false;
        let frameIndex = 0;
        let isFinalStep = false;

        if (this.currentStep === 1 && color === 'purple') {
            this.fountainCount++;
            this.matchCounter++;
            if (this.matchCounter >= 3) { shouldTriggerStep = true; frameIndex = 1; }
        } 
        else if (this.currentStep === 2 && color === 'yellow') {
            this.gardenCount++;
            this.matchCounter++;
            if (this.matchCounter >= 3) { shouldTriggerStep = true; frameIndex = 2; }
        } 
        else if (this.currentStep === 3 && color === 'orange') {
            this.lanternCount++;
            this.matchCounter++;
            if (this.matchCounter >= 3) { shouldTriggerStep = true; frameIndex = 3; isFinalStep = true; }
        }

        this.updateLabels();

        if (shouldTriggerStep) {
            this.scheduleOnce(() => {
                this.executeStepTransition(frameIndex, isFinalStep);
                this.moveToNextStep();
            }, 0.35); 
        }
    }

    private executeStepTransition(frameIndex: number, isFinalStep: boolean) {
        if (!this.uiAnim) return;

        this.playSFX("SceneTransition"); // Play transition sound

        this.uiAnim.moveUIOut(() => {
            this.revealNewScene(frameIndex, () => {
                this.scheduleOnce(() => {
                    if (isFinalStep) {
                        if (this.victoryScreen) this.victoryScreen.show(true);
                    } else {
                        this.uiAnim.returnToOriginal();
                    }
                }, 0.5);
            });
        });
    }

    private revealNewScene(frameIndex: number, onComplete?: Function) {
        if (!this.backgroundSprite || !this.sceneFrames[frameIndex]) return;
        
        tween(this.backgroundSprite.node)
            .to(0.3, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'sineOut' })
            .call(() => {
                this.backgroundSprite.spriteFrame = this.sceneFrames[frameIndex];
            })
            .to(0.7, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .call(() => {
                if (onComplete) onComplete();
            })
            .start();
    }

    private moveToNextStep() {
        this.currentStep++;
        this.matchCounter = 0; 
    }

    public checkMatchAtPosition(draggedNode: Node): boolean {
        const dragScript = draggedNode.getComponent(MergeItem);
        if (!dragScript || dragScript.isMatched) return false;

        const worldPos = draggedNode.worldPosition;
        const allItems = this.gridContainer.getComponentsInChildren(MergeItem);
        
        for (const targetItem of allItems) {
            // Don't match with self or items already marked as matched
            if (targetItem.node === draggedNode || targetItem.isMatched) continue;

            // Check distance (Snap Threshold)
            if (Vec3.distance(worldPos, targetItem.node.worldPosition) < 75) {
                // Check color compatibility
                if (dragScript.colorName === targetItem.colorName) {
                    
                    // Mark both as matched immediately to prevent double-matching during tween
                    dragScript.isMatched = true;
                    targetItem.isMatched = true;

                    // SNAP EFFECT: Move the dragged node exactly onto the target node
                    const targetWorldPos = targetItem.node.worldPosition.clone();
                    
                    tween(draggedNode)
                        .to(0.05, { worldPosition: targetWorldPos }, { easing: 'sineOut' })
                        .call(() => {
                            // After snapping, trigger the destruction sequence
                            this.playSFX("Merge"); 
                            this.reportMergeEvent(dragScript.colorName);
                            
                            // Both items play their pop and destroy animations
                            dragScript.playMatchAnimation(); 
                            targetItem.playMatchAnimation(); 
                        })
                        .start();

                    return true;
                }
            }
        }
        return false;
    }
}