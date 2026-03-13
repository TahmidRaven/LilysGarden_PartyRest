import { _decorator, Component, Node, Vec3, AudioSource, Sprite, SpriteFrame, UIOpacity, tween } from 'cc';
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

    private currentStep: number = 1;
    private matchCounter: number = 0;

    onLoad() {
        GameManager.instance = this;
    }

    private reportMergeEvent(colorName: string) {
        const color = colorName.toLowerCase();
        let shouldTriggerStep = false;
        let frameIndex = 0;
        let isFinalStep = false;

        if (this.currentStep === 1 && color === 'purple') {
            this.matchCounter++;
            if (this.matchCounter >= 3) {
                shouldTriggerStep = true;
                frameIndex = 1;
            }
        } 
        else if (this.currentStep === 2 && color === 'yellow') {
            this.matchCounter++;
            if (this.matchCounter >= 3) {
                shouldTriggerStep = true;
                frameIndex = 2;
            }
        } 
        else if (this.currentStep === 3 && color === 'orange') {
            this.matchCounter++;
            if (this.matchCounter >= 3) {
                shouldTriggerStep = true;
                frameIndex = 3;
                isFinalStep = true;
            }
        }

        if (shouldTriggerStep) {
            this.executeStepTransition(frameIndex, isFinalStep);
            this.moveToNextStep();
        }
    }

    private executeStepTransition(frameIndex: number, isFinalStep: boolean) {
        if (!this.uiAnim) return;

        // Stage 1: Move UI Out
        this.uiAnim.moveUIOut(() => {
            
            // Stage 2: Reveal the New Scene
            this.revealNewScene(frameIndex, () => {
                
                // Stage 3: Hold for 0.5 seconds as requested
                this.scheduleOnce(() => {
                    if (isFinalStep) {
                        if (this.victoryScreen) this.victoryScreen.show(true);
                    } else {
                        // Stage 4: Return UI to original positions
                        this.uiAnim.returnToOriginal();
                    }
                }, 0.5);
            });
        });
    }

    private revealNewScene(frameIndex: number, onComplete?: Function) {
        if (!this.backgroundSprite || !this.sceneFrames[frameIndex]) return;

        let uiOpacity = this.backgroundSprite.getComponent(UIOpacity) || this.backgroundSprite.addComponent(UIOpacity);

        // Initial Zoom/Fade out
        tween(this.backgroundSprite.node)
            .to(0.6, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'sineOut' })
            .start();

        tween(uiOpacity)
            .to(0.6, { opacity: 100 }, { 
                easing: 'sineOut',
                onComplete: () => {
                    this.backgroundSprite.spriteFrame = this.sceneFrames[frameIndex];
                    
                    // Zoom back in and Fade in
                    tween(this.backgroundSprite.node)
                        .to(0.8, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                        .start();

                    tween(uiOpacity!)
                        .to(0.8, { opacity: 255 }, { easing: 'sineIn' })
                        .call(() => { if (onComplete) onComplete(); })
                        .start();
                }
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