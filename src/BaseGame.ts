import * as BABYLON from 'babylonjs';
import { SVEAccount, SVEGame } from 'svebaselib';

export enum GameRejectReason {
    GameNotPresent,
    PlayerLimitExceeded
}

export default abstract class BaseGame extends SVEGame {
    public abstract CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    public abstract Tick(): void;
    public abstract AddPlayer(user: SVEAccount, isLocal: Boolean): void;
    public abstract IsRunning(): Boolean;
    public abstract StartGame(): void;
    public abstract EndGame(): void;
    public abstract IsHostInstance(): Boolean;
    public abstract MinPlayers(): number;
    public abstract MaxPlayers(): number;
    public abstract GetPlayersCount(): number;
    public abstract GiveUp(): void
    public OnConnected: (success: Boolean) => void;
    public OnNewPlayer: () => void;
    public OnGameRejected?: (reason: GameRejectReason) => void;
}