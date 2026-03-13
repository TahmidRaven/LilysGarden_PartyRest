import { _decorator, Component, Vec3, tween, UIOpacity, Node, Label } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('VictoryScreen')
@requireComponent(UIOpacity) 
export class VictoryScreen extends Component {

    @property(Label) titleLabel: Label = null!; 

    private opacityComp: UIOpacity = null!;
    private readonly TARGET_SCALE = new Vec3(1, 1, 1);
    private readonly POP_SCALE = new Vec3(1.1, 1.1, 1);

    onLoad() {
        this.initializeComponents();
        this.node.active = false;
        this.node.setScale(Vec3.ZERO);
    }

    private initializeComponents() {
        if (!this.opacityComp) {
            this.opacityComp = this.getComponent(UIOpacity)!;
        }
    }

    public show(isWin: boolean = true) {
        this.initializeComponents();
        this.node.active = true;

        // Ensure the Victory Screen is at the top of the layer stack
        if (this.node.parent) {
            this.node.setSiblingIndex(this.node.parent.children.length - 1);
        }

        if (this.titleLabel) {
            this.titleLabel.string = isWin ? "VICTORY!" : "OUT OF MOVES";
        }

        this.node.setScale(new Vec3(0.5, 0.5, 1)); 
        
        if (this.opacityComp) {
            this.opacityComp.opacity = 0; 
            tween(this.opacityComp).to(0.3, { opacity: 255 }).start();
        }

        tween(this.node as Node)
            .to(0.4, { scale: this.POP_SCALE }, { easing: 'cubicOut' })
            .to(0.2, { scale: this.TARGET_SCALE }, { easing: 'sineOut' })
            .call(() => this.triggerEndGameAds())
            .start();
    }

    private triggerEndGameAds() {
        // Trigger ad network logic here
        console.log("Victory Animation Complete");
    }
}