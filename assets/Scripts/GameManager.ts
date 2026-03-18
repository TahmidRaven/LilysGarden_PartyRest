import { _decorator, Component, Node } from 'cc';
import { GameBoardController } from './GameBoardController';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property(Node)
    public initialSceneNode: Node = null;

    @property(Node)
    public boardHolderNode: Node = null;

    @property(GameBoardController)
    public gameBoardController: GameBoardController = null;

    start() {
        // Ensure BoardHolder is inactive at the start
        if (this.boardHolderNode) {
            this.boardHolderNode.active = false;
        }

        // Listen for the tap on the instruction screen
        if (this.initialSceneNode) {
            this.initialSceneNode.on(Node.EventType.TOUCH_START, this.onFirstTouch, this);
        }
    }

    private onFirstTouch() {
        // 1. Activate the board
        if (this.boardHolderNode) {
            this.boardHolderNode.active = true;
        }

        // 2. Trigger the item spawning
        if (this.gameBoardController) {
            this.gameBoardController.initBoard();
        }

        // 3. Remove the initial instruction scene
        if (this.initialSceneNode) {
            this.initialSceneNode.destroy();
        }
    }
}