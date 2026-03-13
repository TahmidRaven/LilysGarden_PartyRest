import { _decorator, Component, Node, Vec3, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIElemAnim')
export class UIElemAnim extends Component {
    @property(Node) public logoNode: Node = null!;
    @property(Node) public scoreboardNode: Node = null!;
    @property(Node) public gridControllerNode: Node = null!;
    @property(Node) public playButtonNode: Node = null!;

    @property(Node) public logoAnimPos: Node = null!;
    @property(Node) public scoreboardAnimPos: Node = null!;
    @property(Node) public gridControllerAnimPos: Node = null!;

    private originalLogoPos: Vec3 = new Vec3();
    private originalScoreboardPos: Vec3 = new Vec3();
    private originalGridPos: Vec3 = new Vec3();

    onLoad() {
        this.originalLogoPos = this.logoNode.position.clone();
        this.originalScoreboardPos = this.scoreboardNode.position.clone();
        this.originalGridPos = this.gridControllerNode.position.clone();
    }

    /**
     * Toggles the active state of gameplay UI nodes
     */
    public setUIVisible(visible: boolean) {
        if (this.logoNode) this.logoNode.active = visible;
        if (this.scoreboardNode) this.scoreboardNode.active = visible;
        if (this.gridControllerNode) this.gridControllerNode.active = visible;
        if (this.playButtonNode) this.playButtonNode.active = visible;
    }

    public moveUIOut(onComplete?: Function) {
        this.playButtonNode.active = false;

        tween(this.logoNode)
            .to(1.0, { worldPosition: this.logoAnimPos.worldPosition }, { easing: 'sineOut' })
            .call(() => { if (onComplete) onComplete(); })
            .start();

        tween(this.scoreboardNode)
            .to(1.0, { worldPosition: this.scoreboardAnimPos.worldPosition }, { easing: 'sineOut' })
            .start();

        tween(this.gridControllerNode)
            .to(1.0, { worldPosition: this.gridControllerAnimPos.worldPosition }, { easing: 'sineOut' })
            .start();
    }

    public returnToOriginal() {
        tween(this.logoNode).to(1.0, { position: this.originalLogoPos }, { easing: 'backOut' }).start();
        tween(this.scoreboardNode).to(1.0, { position: this.originalScoreboardPos }, { easing: 'backOut' }).start();
        tween(this.gridControllerNode).to(1.0, { position: this.originalGridPos }, { easing: 'backOut' }).start();
        
        this.scheduleOnce(() => {
            this.playButtonNode.active = true;
        }, 0.5);
    }
}