import * as BABYLON from 'babylonjs';

export enum GameRejectReason {
    GameNotPresent,
    PlayerLimitExceeded
}

export default abstract class BaseGame {
    public name: string;
    public abstract CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    public abstract Tick(): void;
    public abstract AddPlayer(id: String, isLocal: Boolean): void;
    public abstract IsRunning(): Boolean;
    public abstract StartGame(): void;
    public abstract EndGame(): void;
    public abstract SetGameID(id: String, doHost: Boolean): Boolean;
    public abstract IsHostInstance(): Boolean;
    public abstract MinPlayers(): number;
    public abstract MaxPlayers(): number;
    public abstract GetPlayersCount(): number;
    public abstract GiveUp(): void
    public OnConnected: (success: Boolean) => void;
    public OnNewPlayer: () => void;
    public OnGameRejected?: (reason: GameRejectReason) => void;
}