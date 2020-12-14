import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { BaseGameGUI, CardGame, Player, VotingUI } from './CardGame';
import { GameInfo, GameRequest, GameState, SVEAccount } from 'svebaselib';
import { SVEGame } from './BaseGame';
declare class WizardGUI extends BaseGameGUI {
    protected GameStateText: GUI.TextBlock;
    AVotingUI: VotingUI;
    GameID: String;
    Game: SVEGame;
    constructor(scene: BABYLON.Scene);
    protected GetTextLine(player: Player): string;
    ShowGameState(gs: GameState): void;
    ShowPointsGuess(ug: Wizard): void;
    HideGameState(): void;
}
declare class Wizard extends CardGame {
    gameType: string;
    protected isSetup: boolean;
    protected GUI: WizardGUI;
    protected bIsSuspended: Boolean;
    roundCount: number;
    maxRoundCount: number;
    protected lastPlayerBeganID: String;
    protected hadPlayedSinceReset: boolean;
    constructor(info: GameInfo);
    CheckGameState(): GameState;
    StartLocalPlayersRound(): void;
    OnEndLocalRound(): void;
    StartGame(): void;
    CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    Tick(): void;
    onJoined(user: SVEAccount): void;
    onRequest(result: GameRequest): void;
    protected OnGameStateChange(gs: any): void;
    protected onPlayersRoundBegin(player: Player): void;
    protected onNotify(notification: string, invoker: Player, target: Player): void;
    OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo): void;
    MinPlayers(): number;
    MaxPlayers(): number;
}
export { Wizard };
//# sourceMappingURL=Wizard.d.ts.map