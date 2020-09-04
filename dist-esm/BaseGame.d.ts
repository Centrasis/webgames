import * as BABYLON from 'babylonjs';
export declare enum GameRejectReason {
    GameNotPresent = 0,
    PlayerLimitExceeded = 1
}
export default abstract class BaseGame {
    name: string;
    abstract CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    abstract Tick(): void;
    abstract AddPlayer(id: String, isLocal: Boolean): void;
    abstract IsRunning(): Boolean;
    abstract StartGame(): void;
    abstract EndGame(): void;
    abstract SetGameID(id: String, doHost: Boolean): Boolean;
    abstract IsHostInstance(): Boolean;
    abstract MinPlayers(): number;
    abstract MaxPlayers(): number;
    abstract GetPlayersCount(): number;
    abstract GiveUp(): void;
    OnConnected: (success: Boolean) => void;
    OnNewPlayer: () => void;
    OnGameRejected?: (reason: GameRejectReason) => void;
}
//# sourceMappingURL=BaseGame.d.ts.map