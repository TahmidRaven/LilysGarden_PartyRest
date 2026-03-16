import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween } from 'cc';
import { Draggable } from './Draggable';
import { GameManager } from './GameManager';
import { MergeItem } from './MergeItem';

const { ccclass, property } = _decorator;

@ccclass('GridGenerator')
export class GridGenerator extends Component {
    @property([Prefab]) itemPrefabs: Prefab[] = [];
    @property rows: number = 4;
    @property cols: number = 4;
    @property spacing: number = 110;

    start() {
        const initialStep = GameManager.instance ? GameManager.instance.getCurrentStep() : 1;
        this.generateGridForStep(initialStep);
    }

    public generateGridForStep(step: number) {
        [...this.node.children].forEach(child => {
            if (child.isValid && child.getComponent(MergeItem)) {
                child.destroy();
            }
        });

        const cellSize = 100;
        const totalStep = cellSize + this.spacing;
        const startX = -((this.cols - 1) * totalStep) / 2;
        const startY = ((this.rows - 1) * totalStep) / 2;

        let targetColor = '';
        if (step === 1) targetColor = 'purple';
        else if (step === 2) targetColor = 'yellow';
        else if (step === 3) targetColor = 'orange';

        const allObjectiveColors = ['purple', 'yellow', 'orange'];

        let targetPrefab: Prefab | null = null;
        let randomPrefabs: Prefab[] = [];

        this.itemPrefabs.forEach(p => {
            const itemComp = p.data.getComponent(MergeItem);
            if (itemComp) {
                const color = itemComp.colorName.toLowerCase();
                if (color === targetColor) {
                    targetPrefab = p;
                } else if (allObjectiveColors.indexOf(color) === -1) { 
                    randomPrefabs.push(p);
                }
            }
        });

        let deck: Prefab[] = [];

        // Add exactly 4 target items
        for (let i = 0; i < 4; i++) {
            if (targetPrefab) deck.push(targetPrefab);
        }

        // Fill the remaining 12 slots randomly with pure filler items
        const remainingSlots = (this.rows * this.cols) - deck.length;
        for (let i = 0; i < remainingSlots; i++) {
            if (randomPrefabs.length > 0) {
                const randomChoice = randomPrefabs[Math.floor(Math.random() * randomPrefabs.length)];
                deck.push(randomChoice);
            }
        }

        // Shuffle the deck so targets aren't clumped
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        let index = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const posX = startX + c * totalStep;
                const posY = startY - r * totalStep;
                
                if (index < deck.length) {
                    this.spawnSpecificItem(deck[index], new Vec3(posX, posY, 0), true);
                    index++;
                }
            }
        }
    }

    private spawnSpecificItem(prefab: Prefab, targetPos: Vec3, animate: boolean) {
        if (!prefab) return;

        const item = instantiate(prefab);
        item.setParent(this.node);

        const dragComp = item.getComponent(Draggable);
        if (dragComp) dragComp.setHomePosition(targetPos);

        if (animate) {
            item.setPosition(new Vec3(targetPos.x, targetPos.y + 200, 0));
            item.setScale(new Vec3(0, 0, 0));
            tween(item).to(0.5, { position: targetPos, scale: Vec3.ONE }, { easing: 'backOut' }).start();
        } else {
            item.setPosition(targetPos);
        }
    }
}