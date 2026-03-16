import { _decorator, Component, Node, Vec3, AudioSource, Sprite, SpriteFrame, UIOpacity, tween, Label, Animation, Tween } from 'cc';
import { MergeItem } from './MergeItem';
import { UIElemAnim } from './UIElemAnim'; 
import { VictoryScreen } from './VictoryScreen'; 
import { AudioContent } from './AudioContent'; 
import { GridGenerator } from './GridGenerator';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager = null!;

    @property(Node) public gridContainer: Node = null!;
    @property(Node) public introScene: Node = null!; 
    
    @property([AudioContent]) 
    public audioList: AudioContent[] = [];
    
    @property(Sprite) public backgroundSprite: Sprite = null!; 
    @property([SpriteFrame]) public sceneFrames: Array<SpriteFrame> = []; 

    @property(UIElemAnim) public uiAnim: UIElemAnim = null!;
    @property(VictoryScreen) public victoryScreen: VictoryScreen = null!; 

    @property(Label) public fountainLabel: Label = null!;
    @property(Label) public gardenLabel: Label = null!;
    @property(Label) public lanternLabel: Label = null!;

    @property(Animation) public lilyAnimation: Animation = null!; 

    @property(Node) public completedStep01: Node = null!;
    @property(Node) public completedStep02: Node = null!;
    @property(Node) public completedStep03: Node = null!;

    @property(Node) public handGuide: Node = null!;

    private currentStep: number = 1;
    private matchCounter: number = 0;
    private fountainCount: number = 0;
    private gardenCount: number = 0;
    private lanternCount: number = 0;
    private hasGameStarted: boolean = false; 
    private guideTween: Tween<Node> | null = null;

    onLoad() {
        GameManager.instance = this;
        this.updateLabels(); 

        if (this.uiAnim) {
            this.uiAnim.setUIVisible(false);
        }

        if (this.handGuide) {
            this.handGuide.active = false; 
        }

        this.node.on(Node.EventType.TOUCH_START, this.handleFirstTap, this);
    }

    private handleFirstTap() {
        if (this.hasGameStarted) return;
        this.hasGameStarted = true;

        if (this.introScene) {
            this.introScene.destroy();
        }

        if (this.uiAnim) {
            this.uiAnim.setUIVisible(true);
            this.uiAnim.returnToOriginal(); 
        }

        this.node.off(Node.EventType.TOUCH_START, this.handleFirstTap, this);
        this.playSFX("BGM");
    }

    start() {}

    public getCurrentStep(): number {
        return this.currentStep;
    }

    public getMatchCounter(): number {
        return this.matchCounter;
    }

    public playSFX(name: string) {
        const target = this.audioList.find(a => a.AudioName === name);
        if (target) {
            target.play();
        }
    }

    private updateLabels() {
        if (this.fountainLabel) {
            const isDone = this.fountainCount >= 2;
            this.fountainLabel.node.active = !isDone;
            if (this.completedStep01) this.completedStep01.active = isDone;
            this.fountainLabel.string = `Fix Fountain\n${this.fountainCount} / 2`;
        }

        if (this.gardenLabel) {
            const isDone = this.gardenCount >= 2;
            this.gardenLabel.node.active = !isDone;
            if (this.completedStep02) this.completedStep02.active = isDone;
            this.gardenLabel.string = `Fix Garden\n${this.gardenCount} / 2`;
        }

        if (this.lanternLabel) {
            const isDone = this.lanternCount >= 2;
            this.lanternLabel.node.active = !isDone;
            if (this.completedStep03) this.completedStep03.active = isDone;
            this.lanternLabel.string = `Lantern\n${this.lanternCount} / 2`;
        }
    }

    private getTargetColor(): string {
        if (this.currentStep === 1) return 'purple';
        if (this.currentStep === 2) return 'yellow';
        if (this.currentStep === 3) return 'orange';
        return '';
    }

    // --- FASTER HAND GUIDE LOGIC ---
    public startHandGuideWithDelay(delay: number = 0.3) { // Default delay reduced to 0.3s
        this.stopHandGuide();
        this.scheduleOnce(this.startHandGuide, delay);
    }

    public startHandGuide() {
        this.stopHandGuide();
        if (!this.handGuide || !this.gridContainer) return;

        const targetColor = this.getTargetColor();
        const allItems = this.gridContainer.getComponentsInChildren(MergeItem);
        
        const targets = allItems.filter(item => item.colorName.toLowerCase() === targetColor && !item.isMatched);

        if (targets.length >= 2) {
            const startNode = targets[0].node;
            const endNode = targets[1].node;

            this.handGuide.active = true;
            this.handGuide.setWorldPosition(startNode.worldPosition);

            this.guideTween = tween(this.handGuide)
                .call(() => {
                    if (!startNode.isValid || !endNode.isValid || targets[0].isMatched || targets[1].isMatched) {
                        this.startHandGuide();
                        return;
                    }
                    this.handGuide.active = true;
                    this.handGuide.setWorldPosition(startNode.worldPosition);
                })
                .to(0.8, { worldPosition: endNode.worldPosition }, { easing: 'sineInOut' }) // Hand movement slightly faster (0.8s instead of 1.0s)
                .call(() => {
                    this.handGuide.active = false;
                })
                .delay(0.2) // FASTER REPEAT: Only wait 0.2 seconds before showing the hint again! (was 1.0s)
                .call(() => {
                    this.startHandGuide(); 
                })
                .start();
        } else {
            this.handGuide.active = false;
        }
    }

    public stopHandGuide() {
        this.unschedule(this.startHandGuide);
        if (this.guideTween) {
            this.guideTween.stop();
            this.guideTween = null;
        }
        if (this.handGuide) {
            this.handGuide.active = false;
        }
    }
    // -------------------------

    private reportMergeEvent(colorName: string) {
        const color = colorName.toLowerCase();
        let shouldTriggerStep = false;
        let frameIndex = 0;
        let isFinalStep = false;

        if (this.currentStep === 1 && color === 'purple') {
            this.fountainCount++;
            this.matchCounter++;
            if (this.matchCounter >= 2) { shouldTriggerStep = true; frameIndex = 1; }
        } 
        else if (this.currentStep === 2 && color === 'yellow') {
            this.gardenCount++;
            this.matchCounter++;
            if (this.matchCounter >= 2) { shouldTriggerStep = true; frameIndex = 2; }
        } 
        else if (this.currentStep === 3 && color === 'orange') {
            this.lanternCount++;
            this.matchCounter++;
            if (this.matchCounter >= 2) { shouldTriggerStep = true; frameIndex = 3; isFinalStep = true; }
        }

        this.updateLabels();

        if (shouldTriggerStep) {
            this.scheduleOnce(() => {
                this.moveToNextStep(); 
                this.executeStepTransition(frameIndex, isFinalStep);
            }, 0.35); 
        } else {
            // Point out the next match almost immediately
            this.startHandGuideWithDelay(0.5); 
        }
    }

    private executeStepTransition(frameIndex: number, isFinalStep: boolean) {
        if (!this.uiAnim) return;

        this.playSFX("SceneTransition");

        this.uiAnim.moveUIOut(() => {
            this.revealNewScene(frameIndex, () => {
                this.scheduleOnce(() => {
                    if (isFinalStep) {
                        if (this.lilyAnimation) {
                            this.lilyAnimation.play('Lily_happy');
                        }
                        
                        this.scheduleOnce(() => {
                            if (this.victoryScreen) this.victoryScreen.show(true);
                        }, 3.0);

                    } else {
                        this.uiAnim.returnToOriginal();
                        this.resetBoardForCurrentStep();
                    }
                }, 0.5);
            });
        });
    }

    private resetBoardForCurrentStep() {
        if (this.gridContainer) {
            const generator = this.gridContainer.getComponent(GridGenerator);
            if (generator) {
                generator.generateGridForStep(this.currentStep);
            }
        }
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

            if (Vec3.distance(worldPos, targetItem.node.worldPosition) < 75) {
                if (dragScript.colorName === targetItem.colorName) {
                    
                    dragScript.isMatched = true;
                    targetItem.isMatched = true;

                    const targetWorldPos = targetItem.node.worldPosition.clone();
                    
                    tween(draggedNode)
                        .to(0.05, { worldPosition: targetWorldPos }, { easing: 'sineOut' })
                        .call(() => {
                            this.playSFX("Merge"); 
                            this.reportMergeEvent(dragScript.colorName);
                            
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