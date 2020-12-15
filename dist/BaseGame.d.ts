import Peer from 'peerjs';
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
    protected socket?: Peer;
    protected localUser?: SVEAccount;
    protected playerList: SVEAccount[];
    protected connections: Peer.DataConnection[];
    private bIsHost;
    private bIsRunning;
    gameState: GameState;
    protected peerOpts: Peer.PeerJSOption;
    constructor(info: GameInfo);
    OnGameRejected: (reason: GameRejectReason) => void;
    IsHostInstance(): boolean;
    IsRunning(): boolean;
    protected setupHostPeerConnection(): Promise<void>;
    protected setupPeerConnection(peerID: string): Promise<Peer.DataConnection>;
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
}
export default abstract class BaseGame extends SVEGame {
    abstract CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    abstract Tick(): void;
    abstract MinPlayers(): number;
    abstract GetPlayersCount(): number;
    OnNewPlayer: () => void;
    onJoined(player: SVEAccount): void;
    MaxPlayers(): number;
}
//# sourceMappingURL=BaseGame.d.ts.map