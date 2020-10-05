import * as BABYLON from 'babylonjs';
import { SVEAccount, SVEGame } from 'svebaselib';
export declare enum GameRejectReason {
    GameNotPresent = 0,
    PlayerLimitExceeded = 1
}
export default abstract class BaseGame extends SVEGame {
    abstract CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    abstract Tick(): void;
    abstract AddPlayer(user: SVEAccount, isLocal: Boolean): void;
    abstract IsRunning(): Boolean;
    abstract StartGame(): void;
    abstract EndGame(): void;
    abstract IsHostInstance(): Boolean;
    abstract MinPlayers(): number;
    abstract GetPlayersCount(): number;
    abstract GiveUp(): void;
    OnConnected: (success: Boolean) => void;
    OnNewPlayer: () => void;
    OnGameRejected?: (reason: GameRejectReason) => void;
    MaxPlayers(): number;
}
//# sourceMappingURL=BaseGame.d.ts.map