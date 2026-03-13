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

        // Step 1: Purple Merge
        if (this.currentStep === 1 && color === 'purple') {
            this.matchCounter++;
            if (this.matchCounter >= 3) {
                this.revealNewScene(1); 
                if (this.uiAnim) this.uiAnim.playTransition(); 
                this.moveToNextStep();
            }
        } 
        // Step 2: Yellow Merge
        else if (this.currentStep === 2 && color === 'yellow') {
            this.matchCounter++;
            if (this.matchCounter >= 3) {
                this.revealNewScene(2); 
                if (this.uiAnim) this.uiAnim.playTransition(); 
                this.moveToNextStep();
            }
        } 
        // Step 3: Final Orange Merge
        else if (this.currentStep === 3 && color === 'orange') {
            this.matchCounter++;
            
            if (this.matchCounter >= 3) {
                this.revealNewScene(3); 
                
                // Hide UI elements during final reveal
                if (this.uiAnim) {
                    this.uiAnim.playTransition(true); 
                }
                
                // Show Victory Screen after background animation settles
                this.scheduleOnce(() => {
                    if (this.victoryScreen) {
                        this.victoryScreen.show(true);
                    }
                }, 2.0);

                this.moveToNextStep();
            }
        }
    }

    private revealNewScene(frameIndex: number) {
        if (!this.backgroundSprite || !this.sceneFrames[frameIndex]) return;

        let uiOpacity = this.backgroundSprite.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.backgroundSprite.addComponent(UIOpacity);
        }

        tween(this.backgroundSprite.node)
            .to(0.6, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'sineOut' })
            .start();

        tween(uiOpacity)
            .to(0.6, { opacity: 100 }, { 
                easing: 'sineOut',
                onComplete: () => {
                    this.backgroundSprite.spriteFrame = this.sceneFrames[frameIndex];
                    tween(this.backgroundSprite.node)
                        .to(0.8, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                        .start();
                    tween(uiOpacity!)
                        .to(0.8, { opacity: 255 }, { easing: 'sineIn' })
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