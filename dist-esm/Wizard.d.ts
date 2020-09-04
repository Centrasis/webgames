import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { BaseGameGUI, CardGame, Player, GameState, VotingUI } from './CardGame';
declare class WizardGUI extends BaseGameGUI {
    protected GameStateText: GUI.TextBlock;
    AVotingUI: VotingUI;
    GameID: String;
    Socket: WebSocket;
    constructor(scene: BABYLON.Scene);
    protected GetTextLine(player: Player): string;
    ShowGameState(gs: GameState): void;
    ShowPointsGuess(ug: Wizard): void;
    HideGameState(): void;
}
declare class Wizard extends CardGame {
    name: string;
    protected isSetup: boolean;
    protected GUI: WizardGUI;
    protected bIsSuspended: Boolean;
    roundCount: number;
    maxRoundCount: number;
    protected lastPlayerBeganID: String;
    protected hadPlayedSinceReset: boolean;
    constructor(port: number);
    CheckGameState(): GameState;
    StartLocalPlayersRound(): void;
    OnEndLocalRound(): void;
    StartGame(): void;
    CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    Tick(): void;
    AddPlayer(id: String, isLocal: Boolean, player?: Player): void;
    OnServerResponse(result: any): void;
    OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo): void;
    MinPlayers(): number;
    MaxPlayers(): number;
}
export { Wizard };
//# sourceMappingURL=Wizard.d.ts.map