"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVEGame = void 0;
var peerjs_1 = __importDefault(require("peerjs"));
var svebaselib_1 = require("svebaselib");
var SVEGame = /** @class */ (function () {
    function SVEGame(info) {
        this.hostPeerID = "";
        this.socket = undefined;
        this.playerList = [];
        this.connections = [];
        this.bIsHost = false;
        this.bIsRunning = false;
        this.gameState = svebaselib_1.GameState.Undetermined;
        this.peerOpts = {
            host: "/",
            path: "/peer",
            secure: true
        };
        this.conOpts = {
            serialization: "json",
            reliable: false
        };
        this.OnGameRejected = function (r) { };
        this.OnConnected = function (s) { };
        this.host = info.host;
        this.hostPeerID = (info.peerID !== undefined) ? info.peerID : "";
        this.name = info.name;
        this.gameType = info.gameType;
        this.maxPlayers = info.maxPlayers;
        this.gameState = info.gameState;
    }
    SVEGame.prototype.IsHostInstance = function () {
        return this.bIsHost;
    };
    SVEGame.prototype.IsRunning = function () {
        return this.bIsRunning;
    };
    SVEGame.prototype.setupHostPeerConnection = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.socket.on("connection", function (c) {
                c.on('open', function () {
                    console.log("New player connection: " + JSON.stringify(c.metadata));
                    if (_this.connections.length < _this.maxPlayers - 1) {
                        _this.connections.push(c);
                    }
                    else {
                        c.close();
                    }
                });
                c.on('close', function () {
                    console.log("A player connection was closed");
                });
                c.on('data', function (e) {
                    _this.onRequest(e);
                    // broadcasting
                    _this.sendGameRequest(e);
                });
                c.on('error', function (err) {
                    console.log("An peer error occured: " + JSON.stringify(err));
                });
            });
            resolve();
        });
    };
    SVEGame.prototype.setupPeerConnection = function (peerID) {
        var _this = this;
        console.log("Setup client connection..");
        return new Promise(function (resolve, reject) {
            _this.conOpts.metadata = {
                client: _this.localUser.getName(),
                host: _this.host
            };
            var conn = _this.socket.connect(peerID, _this.conOpts);
            var returned = false;
            conn.on('open', function () {
                console.log("Connected with game: " + _this.name);
                returned = true;
                resolve(conn);
            });
            conn.on('data', function (e) {
                _this.onRequest(e);
            });
            conn.on('close', function () {
                console.log("End game: " + _this.name);
                _this.onEnd();
                _this.OnGameRejected(svebaselib_1.GameRejectReason.PlayerLimitExceeded);
                if (!returned) {
                    returned = true;
                    reject(null);
                }
            });
            conn.on('error', function (err) {
                console.log("Error with game connection: " + JSON.stringify(err));
                _this.onEnd();
                _this.OnGameRejected(svebaselib_1.GameRejectReason.GameNotPresent);
                if (!returned) {
                    returned = true;
                    reject(err);
                }
            });
        });
    };
    SVEGame.prototype.updateInfos = function () {
        fetch(svebaselib_1.SVESystemInfo.getGameRoot() + '/update/' + this.name, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.getAsInitializer())
        });
    };
    SVEGame.prototype.join = function (localPlayer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            console.log("Try join game: " + _this.name);
            fetch(svebaselib_1.SVESystemInfo.getGameRoot() + '/join/' + _this.name, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(function (response) {
                if (response.status < 400) {
                    response.json().then(function (res) {
                        _this.hostPeerID = res.peerID;
                        _this.host = res.host;
                        _this.maxPlayers = res.maxPlayers;
                        _this.gameState = res.gameState;
                        console.log("Try connect with host: " + _this.hostPeerID);
                        _this.socket = new peerjs_1.default(_this.peerOpts);
                        _this.bIsHost = false;
                        _this.localUser = localPlayer;
                        var resolved = false;
                        _this.socket.on("open", function (id) {
                            resolved = true;
                            _this.setupPeerConnection(_this.hostPeerID).then(function (c) {
                                _this.connections = [c];
                                _this.OnConnected(true);
                                _this.sendGameRequest({
                                    action: "join",
                                    target: {
                                        type: svebaselib_1.TargetType.Game,
                                        id: ""
                                    },
                                    invoker: _this.localUser.getName()
                                });
                            }, function (err) { return _this.OnConnected(false); });
                            resolve();
                        });
                        _this.socket.on("error", function (err) {
                            console.log("Client connection failed!");
                            if (!resolved)
                                reject();
                        });
                    }, function (err) { return reject(err); });
                }
                else {
                    reject();
                }
            }, function (err) { return reject(err); });
        });
    };
    SVEGame.prototype.onJoined = function (player) {
        this.playerList.push(player);
        this.updateInfos();
    };
    SVEGame.prototype.onEnd = function () {
        this.bIsRunning = false;
    };
    SVEGame.prototype.onStart = function () {
        this.bIsRunning = true;
    };
    SVEGame.prototype.EndGame = function () {
        if (this.IsHostInstance()) {
            this.sendGameRequest({
                action: "!endGame",
                invoker: this.localUser.getName()
            });
            this.updateInfos();
            this.onEnd();
        }
    };
    SVEGame.prototype.StartGame = function () {
        if (this.IsHostInstance()) {
            this.sendGameRequest({
                action: "!startGame",
                invoker: this.localUser.getName(),
                target: {
                    type: svebaselib_1.TargetType.Game,
                    id: ""
                }
            });
        }
    };
    SVEGame.prototype.GiveUp = function () {
        this.SetGameState(svebaselib_1.GameState.Lost);
        this.EndGame();
    };
    SVEGame.prototype.SetGameState = function (gs) {
        if (this.IsHostInstance()) {
            this.gameState = gs;
            this.updateInfos();
            this.sendGameRequest({
                action: {
                    field: "gameState",
                    value: gs
                },
                invoker: this.localUser.getName(),
                target: {
                    type: svebaselib_1.TargetType.Game,
                    id: ""
                }
            });
            this.OnGameStateChange(gs);
        }
    };
    // player null is not valid!
    SVEGame.prototype.NotifyPlayer = function (player, notification) {
        this.sendGameRequest({
            action: {
                field: "!notify",
                value: notification
            },
            invoker: this.localUser.getName(),
            target: {
                type: svebaselib_1.TargetType.Player,
                id: player.getName()
            }
        });
    };
    SVEGame.prototype.OnGameStateChange = function (gs) {
    };
    SVEGame.prototype.onRequest = function (req) {
        var _this = this;
        console.log("Request was: " + JSON.stringify(req));
        if (typeof req.action === "string") {
            if (req.action === "!startGame") {
                this.bIsRunning = true;
                this.onStart();
                return;
            }
            if (req.action === "!endGame") {
                this.onEnd();
                return;
            }
            if (req.action === "join" && req.target !== undefined && this.IsHostInstance()) {
                if (req.target.type === svebaselib_1.TargetType.Game) {
                    if (this.connections.length <= this.maxPlayers) {
                        this.sendGameRequest({
                            action: "join:OK",
                            target: {
                                id: req.invoker,
                                type: svebaselib_1.TargetType.Player
                            },
                            invoker: this.localUser.getName()
                        });
                        this.playerList.forEach(function (p) {
                            _this.sendGameRequest({
                                action: "join:OK",
                                target: {
                                    id: p.getName(),
                                    type: svebaselib_1.TargetType.Player
                                },
                                invoker: _this.localUser.getName()
                            });
                        });
                    }
                    else {
                        this.sendGameRequest({
                            action: "join:REJECT",
                            target: {
                                id: req.invoker,
                                type: svebaselib_1.TargetType.Player
                            },
                            invoker: this.localUser.getName()
                        });
                    }
                }
            }
            if (req.action === "join:OK" && req.target !== undefined) {
                this.host = req.invoker;
                if (req.target.type === svebaselib_1.TargetType.Player) {
                    if (this.playerList.findIndex(function (p) { return p.getName() == req.target.id; }) < 0) {
                        if (req.target.id === this.localUser.getName()) {
                            this.onJoined(this.localUser);
                            this.OnGameStateChange(this.gameState);
                        }
                        else {
                            new svebaselib_1.SVEAccount({ name: req.target.id, id: -1, sessionID: "", loginState: svebaselib_1.LoginState.NotLoggedIn }, function (usr) {
                                _this.onJoined(usr);
                            });
                        }
                    }
                }
            }
            if (req.action === "playersList?" && this.IsHostInstance()) {
                var list_1 = [];
                this.playerList.forEach(function (p) { return list_1.push(p.getName()); });
                this.sendGameRequest({
                    action: {
                        field: "playersList",
                        value: JSON.stringify(list_1)
                    },
                    invoker: this.localUser.getName()
                });
            }
        }
        else {
            if (req.action.field === "playersList") {
                this.host = req.invoker;
                this.playerList = [];
                JSON.parse(req.action.value).forEach(function (p) {
                    new svebaselib_1.SVEAccount({ name: p, id: -1, sessionID: "", loginState: svebaselib_1.LoginState.NotLoggedIn }, function (usr) {
                        _this.playerList.push(usr);
                    });
                });
            }
            if (req.action.field === "gameState") {
                this.host = req.invoker;
                this.gameState = req.action.value;
                this.OnGameStateChange(this.gameState);
            }
            if (req.action.field === "!notify") {
                console.log("Notify: ", JSON.stringify(req.action.value));
                return;
            }
        }
    };
    SVEGame.prototype.create = function (localPlayer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.bIsHost = true;
            _this.localUser = localPlayer;
            _this.playerList = [];
            var resolved = false;
            _this.socket = new peerjs_1.default(_this.peerOpts);
            _this.socket.on('open', function (id) {
                resolved = true;
                _this.hostPeerID = id;
                console.log("Got Peer ID: " + _this.hostPeerID);
                _this.setupHostPeerConnection().then(function () {
                    fetch(svebaselib_1.SVESystemInfo.getGameRoot() + '/new', {
                        method: 'PUT',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(_this.getAsInitializer())
                    }).then(function (response) {
                        if (response.status < 400) {
                            _this.OnConnected(true);
                            _this.onJoined(_this.localUser);
                            resolve();
                        }
                        else {
                            _this.OnConnected(false);
                            reject();
                        }
                    }, function (err) { return reject(err); });
                });
            });
            _this.socket.on("error", function (err) {
                console.log("Connection error (p2p)!");
                if (!resolved)
                    reject();
            });
        });
    };
    SVEGame.getGames = function () {
        return new Promise(function (resolve, reject) {
            fetch(svebaselib_1.SVESystemInfo.getGameRoot() + '/list', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(function (response) {
                if (response.status < 400) {
                    var list_2 = [];
                    response.json().then(function (val) {
                        val.forEach(function (gi) {
                            list_2.push(gi);
                        });
                        resolve(list_2);
                    }, function (err) { return reject(); });
                }
                else {
                    reject();
                }
            });
        });
    };
    SVEGame.prototype.leave = function (player) {
        this.playerList = this.playerList.filter(function (v) { return v.getName() === player.getName(); });
        this.updateInfos();
    };
    SVEGame.prototype.getAsInitializer = function () {
        return {
            gameType: this.gameType,
            host: this.host,
            playersCount: this.playerList.length,
            maxPlayers: this.maxPlayers,
            name: this.name,
            gameState: this.gameState,
            peerID: this.hostPeerID
        };
    };
    SVEGame.prototype.sendGameRequest = function (req) {
        this.connections.forEach(function (c) { return c.send(req); });
        if (this.IsHostInstance())
            this.onRequest(req);
    };
    SVEGame.prototype.GetPlayersCount = function () {
        return this.playerList.length;
    };
    ;
    return SVEGame;
}());
exports.SVEGame = SVEGame;
var BaseGame = /** @class */ (function (_super) {
    __extends(BaseGame, _super);
    function BaseGame() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.OnNewPlayer = function () { };
        return _this;
    }
    BaseGame.prototype.onJoined = function (player) {
        _super.prototype.onJoined.call(this, player);
        this.OnNewPlayer();
    };
    BaseGame.prototype.MaxPlayers = function () {
        return this.maxPlayers;
    };
    return BaseGame;
}(SVEGame));
exports.default = BaseGame;
