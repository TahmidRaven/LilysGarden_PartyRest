import { _decorator, Component, Node, Prefab, instantiate, Vec3, tween } from 'cc';
import { Draggable } from './Draggable';
import { GameManager } from './GameManager';
import { MergeItem } from './MergeItem';

const { ccclass, property } = _decorator;

interface WeightedPrefab {
    prefab: Prefab;
    weight: number;
}

@ccclass('GridGenerator')
export class GridGenerator extends Component {
    @property([Prefab]) itemPrefabs: Prefab[] = [];
    @property rows: number = 4;
    @property cols: number = 4;
    @property spacing: number = 110;

    // Fixed weight for filler items (e.g., Red)
    private readonly FILLER_WEIGHT = 40;

    start() {
        this.generateGrid();
    }

    generateGrid() {
        const cellSize = 100;
        const totalStep = cellSize + this.spacing;
        const startX = -((this.cols - 1) * totalStep) / 2;
        const startY = ((this.rows - 1) * totalStep) / 2;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const posX = startX + c * totalStep;
                const posY = startY - r * totalStep;
                this.spawnNewItem(new Vec3(posX, posY, 0), false);
            }
        }
    }

    public refillSlot(position: Vec3) {
        this.scheduleOnce(() => {
            this.spawnNewItem(position, true);
        }, 0.1);
    }

    /**
     * Updated weight progression:
     * 0/3 Matches -> Weight 40 (Equal to filler)
     * 1/3 Matches -> Weight 25 (Rare)
     * 2/3 Matches -> Weight 12 (Very Rare)
     */
    private getTargetWeight(): number {
        if (!GameManager.instance) return 40;

        const matches = GameManager.instance.getMatchCounter();
        
        if (matches === 0) return 40;
        if (matches === 1) return 25;
        if (matches === 2) return 19;
        
        return 12; 
    }

    private spawnNewItem(targetPos: Vec3, animate: boolean) {
        if (this.itemPrefabs.length === 0) return;

        const currentStep = GameManager.instance?.getCurrentStep() || 1;
        const targetColor = this.getTargetColorForStep(currentStep);
        const dynamicTargetWeight = this.getTargetWeight();
        
        let weightedList: WeightedPrefab[] = [];
        let totalWeight = 0;

        this.itemPrefabs.forEach(prefab => {
            const itemComp = prefab.data.getComponent(MergeItem);
            if (!itemComp) return;

            const color = itemComp.colorName.toLowerCase();

            // Filter logic to keep the board relevant to the current step
            if (currentStep === 1 && (color === 'yellow' || color === 'orange')) return;
            if (currentStep === 2 && (color === 'purple' || color === 'orange')) return;
            if (currentStep === 3 && (color === 'purple' || color === 'yellow')) return;

            // Target uses dynamic rarity, others use FILLER_WEIGHT
            const weight = (color === targetColor) ? dynamicTargetWeight : this.FILLER_WEIGHT;

            weightedList.push({ prefab, weight });
            totalWeight += weight;
        });

        const randomValue = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        let selectedPrefab = this.itemPrefabs[0];

        for (const item of weightedList) {
            cumulativeWeight += item.weight;
            if (randomValue <= cumulativeWeight) {
                selectedPrefab = item.prefab;
                break;
            }
        }

        const item = instantiate(selectedPrefab);
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

    private getTargetColorForStep(step: number): string {
        if (step === 1) return 'purple';
        if (step === 2) return 'yellow';
        if (step === 3) return 'orange';
        return '';
    }
}