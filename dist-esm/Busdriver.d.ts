import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { BaseGameGUI, CardGame, Player, VotingUI } from './CardGame';
import { SVEAccount, SVEGame, GameState } from 'svebaselib';
declare class Challenge {
    CardValue: number;
    ChallengeText: string;
    name: string;
    Answers: string[];
}
declare class BusdriverGUI extends BaseGameGUI {
    protected GameStateText: GUI.TextBlock;
    AVotingUI: VotingUI;
    GameID: String;
    Game: SVEGame;
    protected EndRoundBtn: GUI.Button;
    OnEndRoundClick: () => void;
    constructor(scene: BABYLON.Scene);
    SetEnabledNextRoundBtn(val: boolean): void;
    protected OnClickedEndRound(): void;
    AnnounceBusdriver(): void;
    GetTextLine(player: Player): string;
    ShowGameState(gs: GameState): void;
    ShowChallenge(bd: Busdriver, challenge: Challenge): void;
    HideGameState(): void;
}
declare enum RoundType {
    GuessColor = 0,
    GuessHigherOrLower = 1,
    GuessInside = 2,
    GuessHadColor = 3,
    Busdriver = 4,
    Suspend = 5,
    PlayingPyramid = 6
}
declare enum BusdriverState {
    Selecting = 0,
    Pyramid = 1,
    Driving = 2
}
declare class Busdriver extends CardGame {
    gameType: string;
    protected isSetup: boolean;
    protected isBusdriver: boolean;
    protected CurrentRound: RoundType;
    protected CurrentState: BusdriverState;
    protected GUI: BusdriverGUI;
    CheckGameState(): GameState;
    protected GetChallengeFromType(type: RoundType): Challenge;
    StartLocalPlayersRound(): void;
    OnEndLocalRound(): void;
    StartGame(): void;
    CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    Tick(): void;
    AddPlayer(user: SVEAccount, isLocal: Boolean, player?: Player): void;
    GetLocalPlayerID(): String;
    OnServerResponse(result: any): void;
    OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo): void;
    MinPlayers(): number;
    MaxPlayers(): number;
}
export { Busdriver };
//# sourceMappingURL=Busdriver.d.ts.map