import Peer from 'peerjs';
import * as BABYLON from 'babylonjs';
import { GameRequest, SVEAccount, GameState, GameInfo, GameRejectReason, TargetType, SVESystemInfo, LoginState } from 'svebaselib';

export interface Commandable {
    executeCommand(cmd: string, req: GameRequest);
}

export class SVEGame {
    public host: string;
    public name: string;
    public gameType: string;
    public maxPlayers: number;
    public hostPeerID: string = "";
    protected socket?: Peer = undefined;
    protected localUser?: SVEAccount;
    protected playerList: SVEAccount[] = [];
    protected connections: Peer.DataConnection[] = [];
    private bIsHost: boolean = false;
    private bIsRunning: boolean = false;
    public gameState: GameState = GameState.Undetermined;
    protected peerOpts: Peer.PeerJSOption = {
        host:"/",
        path: "/peer",
        secure: true
    }
    protected conOpts: Peer.PeerConnectOption = {
        serialization: "json",
        reliable: false
    }


    constructor(info: GameInfo) {
        this.host = info.host;
        this.hostPeerID = (info.peerID !== undefined) ? info.peerID : "";
        this.name = info.name;
        this.gameType = info.gameType;
        this.maxPlayers = info.maxPlayers;
        this.gameState = info.gameState;
    }

    public OnGameRejected: (reason: GameRejectReason) => void = (r) => {};
    public OnGameStart: () => void = () => {};

    public IsHostInstance(): boolean {
        return this.bIsHost;
    }

    public IsRunning(): boolean {
        return this.bIsRunning;
    }

    protected setupHostPeerConnection(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.socket!.on("connection", (c) => {
                c.on('open', () => {
                    console.log("New player connection: " + JSON.stringify(c.metadata));
                    if (this.connections.length < this.maxPlayers - 1) {
                        this.connections.push(c);
                    } else {
                        c.close();
                    }
                });

                c.on('close', () => {
                    console.log("A player connection was closed");
                });

                c.on('data', (e:any) => {
                    this.onRequest(e as GameRequest);
                    // broadcasting
                    this.sendGameRequest(e as GameRequest);
                });

                c.on('error', (err) => {
                    console.log("An peer error occured: " + JSON.stringify(err));
                });
            });

            resolve();
        });
    }

    protected setupPeerConnection(peerID:string): Promise<Peer.DataConnection> {
        console.log("Setup client connection..");
        return new Promise<Peer.DataConnection>((resolve, reject) => {
            this.conOpts.metadata = {
                client: this.localUser!.getName(),
                host: this.host
            };
            const conn = this.socket!.connect(peerID, this.conOpts);
            let returned = false;
            conn.on('open', () => {
                console.log("Connected with game: " + this.name);
                returned = true;
                resolve(conn);
            });
    
            conn.on('data', (e:any) => {
                this.onRequest(e as GameRequest);
            });
    
            conn.on('close', () => {
                console.log("End game: " + this.name);
                this.onEnd();
                this.OnGameRejected(GameRejectReason.PlayerLimitExceeded);
                if (!returned) {
                    returned = true;
                    reject(null);
                }
            });
    
            conn.on('error', (err:any) => {
                console.log("Error with game connection: " + JSON.stringify(err));
                this.onEnd();
                this.OnGameRejected(GameRejectReason.GameNotPresent);
                if (!returned) {
                    returned = true;
                    reject(err);
                }
            });
        });
    }

    public updateInfos() {
        fetch(SVESystemInfo.getGameRoot() + '/update/' + this.name, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(this.getAsInitializer())
        });
    }

    public join(localPlayer: SVEAccount): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            console.log("Try join game: " + this.name);
            fetch(SVESystemInfo.getGameRoot() + '/join/' + this.name, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                }
            }).then(response => {
                if(response.status < 400) {
                    response.json().then(res => {
                        this.hostPeerID = (res as GameInfo).peerID!;
                        this.host = (res as GameInfo).host;
                        this.maxPlayers = (res as GameInfo).maxPlayers;
                        this.gameState = (res as GameInfo).gameState;
                        console.log("Try connect with host: " + this.hostPeerID);
                        this.socket = new Peer(this.peerOpts);
                        this.bIsHost = false;
                        this.localUser = localPlayer;
                        let resolved = false;
                        this.socket.on("open", (id) => {
                            resolved = true;
                            this.setupPeerConnection(this.hostPeerID).then((c) => {
                                this.connections = [c];
                                this.OnConnected(true);
                                this.sendGameRequest({
                                    action: "join",
                                    target: {
                                        type: TargetType.Game,
                                        id: ""
                                    },
                                    invoker: this.localUser.getName()
                                });
                            }, err => this.OnConnected(false));  
                            resolve();  
                        });
                        this.socket.on("error", err => {
                            console.log("Client connection failed!");
                            if(!resolved)
                                reject();
                        })
                    }, err => reject(err));
                } else {
                    reject();
                }
            }, err => reject(err));
        });
    }

    public onJoined(player: SVEAccount) {
        this.playerList.push(player);
        this.updateInfos();
    }

    public OnConnected: (success: Boolean) => void = (s) => {};

    public onEnd(): void {
        this.bIsRunning = false;
    }

    public onStart(): void {
        this.bIsRunning = true;
        this.OnGameStart();
    }

    public EndGame() {
        if (this.IsHostInstance()) {
            this.sendGameRequest({
                action: "!endGame",
                invoker: this.localUser!.getName()
            });
            this.updateInfos();

            this.onEnd();
        }
    }

    public StartGame(): void {
        if (this.IsHostInstance()) {
            this.sendGameRequest({
                action: "!startGame",
                invoker: this.localUser!.getName(),
                target: {
                    type: TargetType.Game,
                    id: ""
                }
            });
        }
    }

    public GiveUp(): void {
        this.SetGameState(GameState.Lost);

        this.EndGame();
    }

    public SetGameState(gs: GameState) {
        if(this.IsHostInstance()) {
            this.gameState = gs;
            this.updateInfos();
            this.sendGameRequest({
                action: {
                    field: "gameState",
                    value: gs
                },
                invoker: this.localUser!.getName(),
                target: {
                    type: TargetType.Game,
                    id: ""
                }
            });
            this.OnGameStateChange(gs);
        }
    }

    // player null is not valid!
    public NotifyPlayer(player: SVEAccount, notification: String): void {
        this.sendGameRequest({
            action: { 
                field: "!notify",
                value: notification
            },
            invoker: this.localUser!.getName(),
            target: {
                type: TargetType.Player,
                id: player.getName()
            }
        });
    }

    protected OnGameStateChange(gs: GameState) {

    }

    public onRequest(req: GameRequest) {
        console.log("Request was: " + JSON.stringify(req));
        if (typeof req.action === "string") {
            if (req.action === "!startGame") {
                this.bIsRunning = true;
                this.onStart();
                return;
            }
            if(req.action === "!endGame") {
                this.onEnd();
                return;
            }
            if (req.action === "join" && req.target !== undefined && this.IsHostInstance()) {
                if (req.target.type === TargetType.Game) {
                    if (this.connections.length <= this.maxPlayers) {
                        this.sendGameRequest({
                            action: "join:OK",
                            target: {
                                id: req.invoker,
                                type: TargetType.Player
                            },
                            invoker: this.localUser!.getName()
                        });
                        this.playerList.forEach(p => {
                            this.sendGameRequest({
                                action: "join:OK",
                                target: {
                                    id: p.getName(),
                                    type: TargetType.Player
                                },
                                invoker: this.localUser!.getName()
                            });
                        });
                    } else {
                        this.sendGameRequest({
                            action: "join:REJECT",
                            target: {
                                id: req.invoker,
                                type: TargetType.Player
                            },
                            invoker: this.localUser!.getName()
                        });
                    }
                }
            }
            if (req.action === "join:OK" && req.target !== undefined) {
                this.host = req.invoker;
                if (req.target.type === TargetType.Player) {
                    if (this.playerList.findIndex((p) => p.getName() == req.target.id) < 0) {
                        if (req.target.id === this.localUser!.getName()) {
                            this.onJoined(this.localUser!);
                            this.OnGameStateChange(this.gameState);
                        } else {
                            new SVEAccount({name: req.target.id, id: -1, sessionID: "", loginState: LoginState.NotLoggedIn}, (usr) => {
                                this.onJoined(usr);
                            });
                        }
                    }
                }
            }
            if (req.action === "playersList?" && this.IsHostInstance()) {
                let list: string[] = [];
                this.playerList.forEach(p => list.push(p.getName()));
                this.sendGameRequest({
                    action: {
                        field: "playersList",
                        value: JSON.stringify(list)
                    },
                    invoker: this.localUser!.getName()
                });
            }
        } else {
            if (req.action.field === "playersList") {
                this.host = req.invoker;
                this.playerList = [];
                (JSON.parse(req.action.value) as string[]).forEach(p => {
                    new SVEAccount({name: p, id: -1, sessionID: "", loginState: LoginState.NotLoggedIn}, (usr) => {
                        this.playerList.push(usr);
                    });
                });
            }
            if (req.action.field === "gameState") {
                this.host = req.invoker;
                this.gameState = req.action.value as GameState;
                this.OnGameStateChange(this.gameState);
            }
            if (req.action.field === "!notify") {
                console.log("Notify: ", JSON.stringify(req.action.value));
                return;
            }
        }
    }

    public create(localPlayer: SVEAccount): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.bIsHost = true;
            this.localUser = localPlayer;
            this.playerList = [];
            let resolved = false;

            this.socket = new Peer(this.peerOpts);
            this.socket.on('open', (id) => {
                resolved = true;
                this.hostPeerID = id;
                console.log("Got Peer ID: " + this.hostPeerID);

                this.setupHostPeerConnection().then(() => {
                    fetch(SVESystemInfo.getGameRoot() + '/new', {
                        method: 'PUT',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json' 
                        },
                        body: JSON.stringify(this.getAsInitializer())
                    }).then(response => {
                        if(response.status < 400) {
                            this.OnConnected(true);
                            this.onJoined(this.localUser!);
                            resolve();
                        } else {
                            this.OnConnected(false);
                            reject();
                        }
                    }, err => reject(err));
                });
            });
            this.socket.on("error", (err) => {
                console.log("Connection error (p2p)!");
                if(!resolved)
                    reject();
            });
        });
    }

    public static getGames(): Promise<GameInfo[]> {
        return new Promise<GameInfo[]>((resolve, reject) => {
            fetch(SVESystemInfo.getGameRoot() + '/list', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json' 
                }
            }).then(response => {
                if(response.status < 400) {
                    let list: GameInfo[] = [];
                    response.json().then(val => {
                        val.forEach((gi: GameInfo) => {
                            list.push(gi);
                        });
                        resolve(list);
                    }, err => reject());
                } else {
                    reject();
                }
            });
        });
    }

    public leave(player: SVEAccount) {
        this.playerList = this.playerList.filter((v) => v.getName() === player.getName());
        this.updateInfos();
    }

    public getAsInitializer(): GameInfo {
        return {
            gameType: this.gameType,
            host: this.host,
            playersCount: this.playerList.length,
            maxPlayers: this.maxPlayers,
            name: this.name,
            gameState: this.gameState,
            peerID: this.hostPeerID
        }
    }

    public sendGameRequest(req: GameRequest) {
        this.connections.forEach(c => c.send(req));
        if(this.IsHostInstance())
            this.onRequest(req);
    }

    public GetPlayersCount(): number {
        return this.playerList.length;
    };
}

export default abstract class BaseGame extends SVEGame {
    public abstract CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    public abstract Tick(): void;
//    public abstract AddPlayer(user: SVEAccount, isLocal: Boolean): void;
    public abstract MinPlayers(): number;
    public OnNewPlayer: () => void = () => {};
    public onJoined(player: SVEAccount) {
        super.onJoined(player);
        this.OnNewPlayer();
    }

    public MaxPlayers(): number {
        return this.maxPlayers;
    }
}