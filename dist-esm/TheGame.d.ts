import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import * as GUI from 'babylonjs-gui';
import { BaseGameGUI, CardGame, Player, VotingUI } from './CardGame';
import { SVEGame, GameState, GameInfo, SVEAccount, GameRequest } from 'svebaselib';
declare class TheGameGUI extends BaseGameGUI {
    protected EndRoundBtn: GUI.Button;
    protected GameStateText: GUI.TextBlock;
    protected CardsLeftText: GUI.TextBlock;
    AVotingUI: VotingUI;
    GameID: String;
    Game: SVEGame;
    OnNextRoundClick: () => void;
    constructor(scene: BABYLON.Scene);
    UpdateCardCounter(count: number): void;
    ShowGameState(gs: GameState): void;
    ShowVotePlayerStart(): void;
    HideGameState(): void;
    protected OnEndLocalRound(): void;
    ShowNextRoundBtn(): void;
    SetEnabledNextRoundBtn(val: boolean): void;
    HideNextRoundBtn(): void;
}
declare class TheGame extends CardGame {
    gameType: string;
    protected CardMaterails: Map<number, Materials.MixMaterial>;
    protected GUI: TheGameGUI;
    constructor(info: GameInfo);
    CheckGameState(): GameState;
    StartLocalPlayersRound(): void;
    StartGame(): void;
    ShowVotePlayerStartGUI(): void;
    CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    protected OnEndLocalRound(): void;
    protected CreateMaterialForCard(nb: number): void;
    Tick(): void;
    onJoined(id: SVEAccount): void;
    onRequest(req: GameRequest): void;
    protected onPlayersRoundBegin(player: Player): void;
    protected OnGameStateChange(gameState: GameState): void;
    OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo): void;
    MinPlayers(): number;
}
export { TheGame };
//# sourceMappingURL=TheGame.d.ts.map