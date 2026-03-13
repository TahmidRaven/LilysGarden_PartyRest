import { _decorator, Component, Node, Vec3, AudioSource, Sprite, SpriteFrame, UIOpacity, tween, Label } from 'cc';
import { MergeItem } from './MergeItem';
import { UIElemAnim } from './UIElemAnim'; 
import { VictoryScreen } from './VictoryScreen'; 

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager = null!;

    @property(Node) public gridContainer: Node = null!;
    @property(AudioSource) public audioSource: AudioSource = null!;
    
    @property(Sprite) public backgroundSprite: Sprite = null!; 
    @property([SpriteFrame]) public sceneFrames: Array<SpriteFrame> = []; 

    @property(UIElemAnim) public uiAnim: UIElemAnim = null!;
    @property(VictoryScreen) public victoryScreen: VictoryScreen = null!; 

    // New Label Properties for Counters
    @property(Label) public fountainLabel: Label = null!;
    @property(Label) public gardenLabel: Label = null!;
    @property(Label) public lanternLabel: Label = null!;

    private currentStep: number = 1;
    private matchCounter: number = 0;

    // Individual progress trackers
    private fountainCount: number = 0;
    private gardenCount: number = 0;
    private lanternCount: number = 0;

    onLoad() {
        GameManager.instance = this;
        this.updateLabels(); // Initialize labels with 0/3
    }

    /**
     * Updates the text strings on the UI labels with newlines
     */
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

        // Logic updated to track individual counts and update UI
        if (this.currentStep === 1 && color === 'purple') {
            this.fountainCount++;
            this.matchCounter++;
            if (this.matchCounter >= 3) {
                shouldTriggerStep = true;
                frameIndex = 1;
            }
        } 
        else if (this.currentStep === 2 && color === 'yellow') {
            this.gardenCount++;
            this.matchCounter++;
            if (this.matchCounter >= 3) {
                shouldTriggerStep = true;
                frameIndex = 2;
            }
        } 
        else if (this.currentStep === 3 && color === 'orange') {
            this.lanternCount++;
            this.matchCounter++;
            if (this.matchCounter >= 3) {
                shouldTriggerStep = true;
                frameIndex = 3;
                isFinalStep = true;
            }
        }

        this.updateLabels(); // Refresh the labels after every match

        if (shouldTriggerStep) {
            this.scheduleOnce(() => {
                this.executeStepTransition(frameIndex, isFinalStep);
                this.moveToNextStep();
            }, 0.35); 
        }
    }

    private executeStepTransition(frameIndex: number, isFinalStep: boolean) {
        if (!this.uiAnim) return;

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
            if (targetItem.node === draggedNode || targetItem.isMatched) continue;

            if (Vec3.distance(worldPos, targetItem.node.worldPosition) < 60) {
                if (dragScript.colorName === targetItem.colorName) {
                    this.reportMergeEvent(dragScript.colorName);
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