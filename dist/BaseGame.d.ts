import * as BABYLON from 'babylonjs';
import { GameRequest, SVEAccount, GameState, GameInfo, GameRejectReason } from 'svebaselib';
export interface Commandable {
    executeCommand(cmd: string, req: GameRequest): any;
}
export declare class SVEGame {
    host: string;
    name: string;
    gameType: string;
    maxPlayers: number;
    hostPeerID: string;
    protected socket?: any;
    protected localUser?: SVEAccount;
    protected playerList: SVEAccount[];
    protected connections: any[];
    private bIsHost;
    private bIsRunning;
    gameState: GameState;
    constructor(info: GameInfo);
    OnGameRejected: (reason: GameRejectReason) => void;
    OnGameStart: () => void;
    OnNewPlayer: () => void;
    IsHostInstance(): boolean;
    IsRunning(): boolean;
    protected setupHostPeerConnection(): Promise<void>;
    protected setupPeerConnection(peerID: string): Promise<any>;
    updateInfos(): void;
    join(localPlayer: SVEAccount): Promise<void>;
    onJoined(player: SVEAccount): void;
    OnConnected: (success: Boolean) => void;
    onEnd(): void;
    onStart(): void;
    EndGame(): void;
    StartGame(): void;
    GiveUp(): void;
    SetGameState(gs: GameState): void;
    NotifyPlayer(player: SVEAccount, notification: String): void;
    protected OnGameStateChange(gs: GameState): void;
    onRequest(req: GameRequest): void;
    create(localPlayer: SVEAccount): Promise<void>;
    static getGames(): Promise<GameInfo[]>;
    leave(player: SVEAccount): void;
    getAsInitializer(): GameInfo;
    sendGameRequest(req: GameRequest): void;
    GetPlayersCount(): number;
}
export default abstract class BaseGame extends SVEGame {
    abstract CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    abstract Tick(): void;
    abstract MinPlayers(): number;
    MaxPlayers(): number;
}
//# sourceMappingURL=BaseGame.d.ts.map