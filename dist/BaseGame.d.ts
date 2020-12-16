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
    protected conOpts: Peer.PeerConnectOption;
    constructor(info: GameInfo);
    OnGameRejected: (reason: GameRejectReason) => void;
    IsHostInstance(): boolean;
    IsRunning(): boolean;
    protected setupHostPeerConnection(): Promise<void>;
    protected setupPeerConnection(peerID: string): Promise<Peer.DataConnection>;
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
    OnNewPlayer: () => void;
    onJoined(player: SVEAccount): void;
    MaxPlayers(): number;
}
//# sourceMappingURL=BaseGame.d.ts.map