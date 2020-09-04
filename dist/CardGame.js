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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardGame = exports.BaseGameGUI = exports.VotingUI = exports.PlayerListUI = exports.GameState = exports.Player = exports.BaseCardDeck = exports.CardStack = exports.StackType = exports.StackDirection = exports.Card = exports.PlayerGamePhase = void 0;
var BABYLON = __importStar(require("babylonjs"));
var GUI = __importStar(require("babylonjs-gui"));
var BaseGame_1 = __importStar(require("./BaseGame"));
var util_1 = require("util");
var PlayerGamePhase;
(function (PlayerGamePhase) {
    PlayerGamePhase[PlayerGamePhase["Spectating"] = 0] = "Spectating";
    PlayerGamePhase[PlayerGamePhase["SelectingCard"] = 1] = "SelectingCard";
    PlayerGamePhase[PlayerGamePhase["SelectingStack"] = 2] = "SelectingStack";
})(PlayerGamePhase = exports.PlayerGamePhase || (exports.PlayerGamePhase = {}));
var Card = /** @class */ (function () {
    function Card(value, materials, scene, hl) {
        this.effect = function () { };
        this.bIsRevealed = false;
        this.upVector = new BABYLON.Vector3(0, 1, 0);
        this.bIsSelected = false;
        this.highlightLayer = hl;
        this.value = value;
        this.width = 0.665;
        this.size = 2;
        var f = new BABYLON.Vector4(0.5, 0, 1, 1); // front image = half the whole image along the width 
        var b = new BABYLON.Vector4(0, 0, 0.5, 1); // back image = second half along the width
        this.mesh = BABYLON.MeshBuilder.CreatePlane("", { height: 1 * this.size, width: this.width * this.size, sideOrientation: BABYLON.Mesh.DOUBLESIDE, frontUVs: f, backUVs: b }, scene);
        this.mesh.isPickable = true;
        if (materials != null) {
            this.mesh.material = materials.get(value);
        }
        this.mesh.rotate(BABYLON.Axis.X, -Math.PI / 2.0, BABYLON.Space.LOCAL);
    }
    Card.prototype.GetMesh = function () {
        return this.mesh;
    };
    Card.prototype.SetEffect = function (effect) {
        this.effect = effect;
    };
    Card.prototype.InvokeEffect = function () {
        this.effect();
    };
    Card.prototype.GetValue = function () {
        return this.value;
    };
    Card.prototype.IsSelected = function () {
        return this.bIsSelected;
    };
    Card.prototype.toogleSelect = function () {
        this.bIsSelected = !this.bIsSelected;
        this.highlightLayer.removeAllMeshes();
        if (this.bIsSelected) {
            this.highlightLayer.addMesh(this.mesh, BABYLON.Color3.Red());
        }
    };
    Card.prototype.setPosition = function (loc) {
        this.mesh.position = loc;
    };
    Card.prototype.uplift = function (camera) {
        //let upliftAngle = 3.0 * Math.PI / 4.0;
        //this.mesh.rotate(BABYLON.Axis.X, upliftAngle, BABYLON.Space.LOCAL);
        if (util_1.isUndefined(camera) || camera == null) {
            return;
        }
        var dir = BABYLON.Ray.CreateNewFromTo(camera.position, camera.getTarget()).direction;
        this.mesh.lookAt(new BABYLON.Vector3(this.mesh.position.x + dir.x, this.mesh.position.y + dir.y, this.mesh.position.z + dir.z));
        //this.mesh.rotate(BABYLON.Axis.Y, -Math.PI / 2.0, BABYLON.Space.WORLD);
        //let m = BABYLON.Matrix.RotationAxis(BABYLON.Axis.X, upliftAngle);
        //this.upVector = BABYLON.Vector3.TransformCoordinates(this.upVector, m);
    };
    Card.prototype.reveal = function () {
        this.mesh.lookAt(new BABYLON.Vector3(this.mesh.position.x, this.mesh.position.y - 2, this.mesh.position.z));
        this.mesh.rotate(BABYLON.Axis.Y, -Math.PI / 2.0, BABYLON.Space.WORLD);
        this.bIsRevealed = true;
    };
    Card.prototype.IsRevealed = function () {
        return this.bIsRevealed;
    };
    Card.prototype.cover = function () {
        this.mesh.lookAt(new BABYLON.Vector3(this.mesh.position.x, this.mesh.position.y + 2, this.mesh.position.z));
        this.mesh.rotate(BABYLON.Axis.Y, -Math.PI / 2.0, BABYLON.Space.WORLD);
        this.bIsRevealed = false;
    };
    return Card;
}());
exports.Card = Card;
var StackDirection;
(function (StackDirection) {
    StackDirection[StackDirection["Upwards"] = 0] = "Upwards";
    StackDirection[StackDirection["Downwards"] = 1] = "Downwards";
    StackDirection[StackDirection["Undef"] = 2] = "Undef";
})(StackDirection = exports.StackDirection || (exports.StackDirection = {}));
var StackType;
(function (StackType) {
    StackType[StackType["Push"] = 0] = "Push";
    StackType[StackType["Pop"] = 1] = "Pop";
    StackType[StackType["FreeForEverything"] = 2] = "FreeForEverything";
})(StackType = exports.StackType || (exports.StackType = {}));
var CardStack = /** @class */ (function () {
    function CardStack(dir, type, id) {
        this.id = id;
        this.Cards = [];
        this.type = type;
        this.direction = dir;
        this.card_distance = 0.01;
        this.setPosition(new BABYLON.Vector3(0, 0, 0));
    }
    CardStack.prototype.GetID = function () {
        return this.id;
    };
    CardStack.prototype.GetCards = function () {
        return this.Cards;
    };
    // returns if card can be played on this stack
    CardStack.prototype.check = function (card) {
        if (this.type == StackType.Pop) {
            return false;
        }
        if (this.Cards.length == 0)
            return true;
        if (card === null) {
            return false;
        }
        if (this.direction == StackDirection.Upwards) {
            return (this.Cards[this.Cards.length - 1].GetValue() < card.GetValue() || 10 == this.Cards[this.Cards.length - 1].GetValue() - card.GetValue());
        }
        else {
            return (this.Cards[this.Cards.length - 1].GetValue() > card.GetValue() || 10 == card.GetValue() - this.Cards[this.Cards.length - 1].GetValue());
        }
    };
    CardStack.prototype.GiveCardByNameTo = function (card_name, player) {
        var card = null;
        for (var i = 0; i < this.Cards.length; i++) {
            if (this.Cards[i].GetMesh().name == card_name) {
                card = this.Cards[i];
            }
        }
        ;
        this.Cards = this.Cards.filter(function (e) { return e.GetMesh().name != card_name; });
        if (card != null) {
            player.AddCardLocal(card);
        }
        this.setPosition(this.position);
    };
    /** No Replication */
    CardStack.prototype.TakeCardByName = function (card_name) {
        var card = null;
        for (var i = 0; i < this.Cards.length; i++) {
            if (this.Cards[i].GetMesh().name == card_name) {
                card = this.Cards[i];
            }
        }
        ;
        if (card != null) {
            this.Cards = this.Cards.filter(function (e) { return e.GetMesh().name != card_name; });
            this.setPosition(this.position);
        }
        return card;
    };
    CardStack.prototype.setPosition = function (loc) {
        var _this = this;
        this.position = loc;
        var i = 0;
        this.Cards.forEach(function (element) {
            i++;
            element.setPosition(new BABYLON.Vector3(0 + loc.x, _this.card_distance * i + loc.y, 0 + loc.z));
        });
    };
    /** Does not replicate */
    CardStack.prototype.addCardLocal = function (card, shouldReveal) {
        if (shouldReveal === void 0) { shouldReveal = true; }
        this.Cards.push(card);
        if (shouldReveal) {
            card.reveal();
        }
        else {
            card.cover();
        }
    };
    CardStack.prototype.update = function () {
        this.setPosition(this.position);
    };
    /** Does replicate */
    CardStack.prototype.addCard = function (card, previousOwner, shouldReveal) {
        if (shouldReveal === void 0) { shouldReveal = true; }
        if (!util_1.isUndefined(this.Socket)) {
            this.Socket.send(JSON.stringify({
                type: "playCard",
                id: this.GameID,
                card: card.GetMesh().name,
                stack: this.GetID(),
                player: (previousOwner == null) ? "" : previousOwner.GetID(),
                revealed: shouldReveal
            }));
        }
        this.addCardLocal(card, shouldReveal);
    };
    CardStack.prototype.GetCard = function (pick) {
        var ret = null;
        for (var j = this.Cards.length - 1; j >= 0; j--) {
            if (pick.pickedMesh.name == this.Cards[j].GetMesh().name) {
                ret = this.Cards[j];
                break;
            }
        }
        return ret;
    };
    /** Does not replicate */
    CardStack.prototype.DrawCard = function () {
        if (this.Cards.length >= 1) {
            var c_1 = this.Cards[Math.round(Math.random() * (this.Cards.length - 1))];
            this.Cards = this.Cards.filter(function (card) { return card !== c_1; });
            this.setPosition(this.position);
            return c_1;
        }
        else {
            return null;
        }
    };
    CardStack.prototype.ForceSetCards = function (cards) {
        this.Cards = cards;
        this.setPosition(this.position);
    };
    CardStack.prototype.GetCardsCount = function () {
        return this.Cards.length;
    };
    /** replicates */
    CardStack.prototype.PlayCardOnStack = function (player) {
        if (player === null) {
            return false;
        }
        if (this.check(player.GetSelectedCard())) {
            this.addCard(player.PlaySelectedCard(), player);
            this.setPosition(this.position);
            return true;
        }
        else {
            console.log("Could not play card: " + player.GetSelectedCard().GetMesh().name);
        }
        return false;
    };
    return CardStack;
}());
exports.CardStack = CardStack;
var BaseCardDeck = /** @class */ (function () {
    function BaseCardDeck() {
    }
    BaseCardDeck.prototype.setPosition = function (loc) {
        this.position = loc;
    };
    BaseCardDeck.prototype.drawCard = function (stackID) {
        return this.stacks.find(function (e) { return e.GetID() == stackID; }).DrawCard();
    };
    BaseCardDeck.prototype.PlayCardFromDeckOnStack = function (id, card_name, shouldReveal) {
        if (shouldReveal === void 0) { shouldReveal = true; }
        console.log("Empty call: PlayCardFromDeckOnStack");
    };
    /** Dose not replicate */
    BaseCardDeck.prototype.PlayCardByNameOnStack = function (id, card_name, player, shouldReveal) {
        if (shouldReveal === void 0) { shouldReveal = true; }
        var card = player.GetCards().find(function (c) { return c.GetMesh().name == card_name; });
        if (card != null) {
            var stack = this.stacks.find(function (e) { return e.GetID() == id; });
            if (stack.check(card)) {
                card.GetMesh().setEnabled(true);
                stack.addCardLocal(card, shouldReveal);
                this.setPosition(this.position);
            }
        }
    };
    BaseCardDeck.prototype.PlayCardOnStack = function (id, player) {
        var stack = this.stacks.find(function (e) { return e.GetID() == id; });
        if (stack === null) {
            return;
        }
        if (player === null) {
            return;
        }
        stack.Socket = this.Socket;
        stack.GameID = this.GameID;
        stack.PlayCardOnStack(player);
    };
    BaseCardDeck.prototype.GetStackFromPick = function (pick) {
        if (pick.pickedMesh === null) {
            return null;
        }
        var ret = this.stacks.find(function (e) { return e.GetCard(pick) != null; });
        return ret;
    };
    return BaseCardDeck;
}());
exports.BaseCardDeck = BaseCardDeck;
var Player = /** @class */ (function () {
    function Player(id, maxCardCount, isLocal) {
        this.phase = PlayerGamePhase.Spectating;
        this.isLocal = isLocal;
        this.id = id;
        this.maxCardCount = maxCardCount;
        this.cards = [];
        this.cardOrigin = new BABYLON.Vector3(0, 1, -6);
    }
    Player.prototype.GetPhase = function () {
        return this.phase;
    };
    Player.prototype.SetPhase = function (p) {
        this.phase = p;
    };
    Player.prototype.commitToServer = function () {
        this.Socket.send(JSON.stringify({
            type: "updatePlayer",
            id: this.GameID,
            player: this.GetID(),
            field: "maxCardCount",
            value: this.maxCardCount
        }));
    };
    /** No replication */
    Player.prototype.dropCards = function () {
        this.cards = [];
        this.update();
    };
    Player.prototype.SetHasTurn = function (val) {
        this.bHasTurn = val;
    };
    Player.prototype.GetID = function () {
        return this.id;
    };
    Player.prototype.SetMaxCardCount = function (count) {
        this.maxCardCount = count;
    };
    Player.prototype.GetCards = function () {
        return this.cards;
    };
    // Returns other than null if a owned card was selected
    Player.prototype.GetOwnCard = function (pick) {
        if (pick.pickedMesh === null) {
            return null;
        }
        var ret = null;
        for (var i = 0; i < this.cards.length; i++) {
            if (pick.pickedMesh.name == this.cards[i].GetMesh().name) {
                ret = this.cards[i];
                break;
            }
        }
        ;
        return ret;
    };
    Player.prototype.UnSelectAll = function () {
        this.cards.forEach(function (element) {
            if (element.IsSelected()) {
                element.toogleSelect();
            }
        });
    };
    Player.prototype.GetCardsCount = function () {
        return this.cards.length;
    };
    Player.prototype.GetMaxCardCount = function () {
        return this.maxCardCount;
    };
    Player.prototype.GetSelectedCard = function () {
        var ret = null;
        for (var i = 0; i < this.cards.length; i++) {
            if (this.cards[i].IsSelected()) {
                ret = this.cards[i];
                break;
            }
        }
        ;
        return ret;
    };
    Player.prototype.PlaySelectedCard = function () {
        var ret = this.GetSelectedCard();
        if (ret != null) {
            ret.toogleSelect();
            this.cards = this.cards.filter(function (c) { return c !== ret; });
            ret.GetMesh().setEnabled(true);
            ret.InvokeEffect();
        }
        return ret;
    };
    Player.prototype.drawCards = function (stack) {
        this.SetPhase(PlayerGamePhase.Spectating);
        while (this.maxCardCount > this.cards.length) {
            var card = stack.DrawCard();
            if (card === null) {
                break;
            }
            this.AddCard(card);
        }
    };
    Player.prototype.drawNumberOfCards = function (stack, count) {
        for (var i = 0; i < count; i++) {
            var card = stack.DrawCard();
            if (card === null) {
                break;
            }
            this.AddCard(card);
        }
    };
    Player.prototype.update = function () {
        var posX = null;
        for (var i = 0; i < this.cards.length; i++) {
            var card = this.cards[i];
            if (posX === null) {
                posX = -1 * (card.width * card.size * (5 / 4) * this.cards.length) / 2.0;
            }
            card.setPosition(new BABYLON.Vector3(this.cardOrigin.x + posX, this.cardOrigin.y, this.cardOrigin.z));
            posX += card.width * (5 / 4) * card.size;
        }
    };
    Player.prototype.SetOrigin = function (loc) {
        this.cardOrigin = loc;
        this.update();
    };
    /** Replicates */
    Player.prototype.AddCard = function (card) {
        this.AddCardLocal(card);
        this.Socket.send(JSON.stringify({
            type: "drawCard",
            id: this.GameID,
            player: this.GetID(),
            card: card.GetMesh().name
        }));
    };
    Player.prototype.AddCardLocal = function (card) {
        this.cards.push(card);
        card.uplift(this.camera);
        card.GetMesh().setEnabled(this.isLocal);
        this.update();
    };
    Player.prototype.IsLocalPlayer = function () {
        return this.isLocal;
    };
    Player.prototype.SetGameState = function (gs) {
        this.gameState = gs;
        if (gs != GameState.Undetermined) {
            this.Socket.send(JSON.stringify({
                type: "gameState",
                id: this.GameID,
                player: this.GetID(),
                value: (gs == GameState.Won) ? "won" : "lost",
            }));
        }
    };
    Player.prototype.GetGameState = function () {
        return this.gameState;
    };
    return Player;
}());
exports.Player = Player;
var GameState;
(function (GameState) {
    GameState[GameState["Undetermined"] = 0] = "Undetermined";
    GameState[GameState["Won"] = 1] = "Won";
    GameState[GameState["Lost"] = 2] = "Lost";
})(GameState = exports.GameState || (exports.GameState = {}));
var PlayerListUI = /** @class */ (function () {
    function PlayerListUI(GUI) {
        this.GUI = GUI;
        this.players = new Map();
        this.GetTextOfPlayerLine = this.GetTextOfPlayerMethod.bind(this);
    }
    PlayerListUI.prototype.AddPlayer = function (player) {
        this.textColor = "orange";
        this.textActiveColor = "white";
        var text = new GUI.TextBlock();
        text.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        text.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        text.fontSize = 30;
        text.color = this.textColor;
        text.left = "-40%";
        text.top = "-" + (50 - ((this.players.size + 1) * 5)) + "%";
        this.players.set(player, text);
        this.GUI.addControl(text);
        this.UpdatePlayer(player);
    };
    PlayerListUI.prototype.UpdatePlayer = function (player) {
        this.players.get(player).text = this.GetTextOfPlayerLine(player);
    };
    PlayerListUI.prototype.GetTextOfPlayerMethod = function (player) {
        return player.GetID().toString();
    };
    PlayerListUI.prototype.GetPlayersTexts = function () {
        var list = [];
        this.players.forEach(function (p) {
            list.push(p.text);
        });
        return list;
    };
    PlayerListUI.prototype.SetPlayerActive = function (player) {
        var _this = this;
        this.players.forEach(function (e) { return e.color = _this.textColor; });
        var p = this.players.get(player);
        if (p !== null) {
            p.color = this.textActiveColor;
        }
    };
    return PlayerListUI;
}());
exports.PlayerListUI = PlayerListUI;
var VotingUI = /** @class */ (function () {
    function VotingUI(gui, caption, votes, onVote) {
        var _this = this;
        this.GUI = gui;
        this.votes = [];
        this.caption = new GUI.TextBlock("", caption);
        this.caption.fontSize = 30;
        this.caption.color = "blue";
        this.caption.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.caption.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.GUI.addControl(this.caption);
        var i = 0;
        votes.forEach(function (p) {
            var id = p;
            var btn = GUI.Button.CreateSimpleButton("", id.toString());
            btn.width = "150px";
            btn.height = "40px";
            btn.disabledColor = "grey";
            btn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            btn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            btn.color = "white";
            btn.cornerRadius = 20;
            btn.background = "orange";
            btn.top = "-" + (50 - ((i + 1) * 10)) + "%";
            btn.onPointerUpObservable.add(function () {
                onVote(id);
            });
            _this.GUI.addControl(btn);
            _this.votes.push(btn);
            i++;
        });
    }
    VotingUI.prototype.removeAll = function () {
        var _this = this;
        this.votes.forEach(function (b) {
            _this.GUI.removeControl(b);
        });
        this.GUI.removeControl(this.caption);
    };
    return VotingUI;
}());
exports.VotingUI = VotingUI;
var BaseGameGUI = /** @class */ (function () {
    function BaseGameGUI(scene) {
        this.GUI = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.PlayerList = new PlayerListUI(this.GUI);
        this.NextRoundSound = new BABYLON.Sound("Ping", "/sounds/ping.wav", scene, null, {
            loop: false,
            autoplay: false,
            volume: 1
        });
    }
    BaseGameGUI.prototype.RememberItsYourTurn = function () {
        this.NextRoundSound.play();
    };
    return BaseGameGUI;
}());
exports.BaseGameGUI = BaseGameGUI;
var CardGame = /** @class */ (function (_super) {
    __extends(CardGame, _super);
    function CardGame(port) {
        var _this = _super.call(this) || this;
        _this.enableZMovement = false;
        _this.players = [];
        _this.playDirection = 1;
        _this.bIsRunning = false;
        _this.bIsHosting = false;
        _this.port = port;
        _this.localPlayer = null;
        _this.Socket = null;
        _this.Deck = null;
        _this.GUI = null;
        return _this;
    }
    CardGame.prototype.StartLocalPlayersRound = function () {
        if (this.localPlayer.GetPhase() == PlayerGamePhase.Spectating) {
            this.GUI.RememberItsYourTurn();
            this.localPlayer.SetPhase(PlayerGamePhase.SelectingCard);
            this.OnSelect(null, null);
        }
    };
    CardGame.prototype.SetInitialCardCount = function (cardsCount) {
        var _this = this;
        this.players.forEach(function (player) {
            player.SetMaxCardCount(cardsCount);
            player.Socket = _this.Socket;
            player.GameID = _this.gameID;
            player.commitToServer();
        });
    };
    CardGame.prototype.StartGame = function () {
        this.bIsRunning = true;
        this.scene.onPointerDown = this.OnSelect.bind(this);
        this.localPlayer.SetPhase(PlayerGamePhase.Spectating);
        if (this.bIsHosting) {
            this.Socket.send(JSON.stringify({
                type: "startGame",
                id: this.gameID
            }));
        }
    };
    CardGame.prototype.IsRunning = function () {
        return this.bIsRunning;
    };
    CardGame.prototype.IsHostInstance = function () {
        return this.bIsHosting;
    };
    CardGame.prototype.CreateScene = function (engine, canvas) {
        this.players = [];
        var self = this;
        console.log("Call create scene!");
        // This creates a basic Babylon Scene object (non-mesh)
        this.scene = new BABYLON.Scene(engine);
        // This creates and positions a free camera (non-mesh)
        this.camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 10, -8), this.scene);
        // This targets the camera to scene origin
        this.camera.setTarget(new BABYLON.Vector3(0, 0, -3));
        // This attaches the camera to the canvas
        this.camera.attachControl(canvas, true);
        // disable movement
        this.camera.inputs.clear();
        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;
        // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
        var ground = BABYLON.Mesh.CreateGround("ground1", 16, 12, 2, this.scene);
        ground.isPickable = true;
        var deskMat = new BABYLON.StandardMaterial("", this.scene);
        deskMat.specularColor = new BABYLON.Color3(1, 1, 1);
        deskMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        deskMat.diffuseTexture = new BABYLON.Texture("/images/cards/desk.png", this.scene);
        ground.material = deskMat;
        this.highlightLayer = new BABYLON.HighlightLayer("hl1", this.scene);
        // wheel scrolling
        /*this.scene.onPrePointerObservable.add(
            function(pointerInfo, eventState) {
                var event = pointerInfo.event;
                var delta = 0;
                if ((<WheelEvent>event)) {
                    delta = (<WheelEvent>event).deltaY;
                } else {
                    delta = (<PointerEvent>event).webkitMovementY;
                }
               
               if (delta && !isUndefined(delta))
               {
                console.log("Zooming: " + delta);
               }

               self.camera.fov -= delta / 18000;
            });*/
        // pinch zooming on touch
        var evCache = new Array();
        var prevDiff = -1;
        var prevPoint = [-1.0, -1.0];
        var remove_event = function (ev) {
            // Remove this event from the target's cache
            for (var i = 0; i < evCache.length; i++) {
                if (evCache[i].pointerId == ev.pointerId) {
                    evCache.splice(i, 1);
                    break;
                }
            }
        };
        canvas.onpointerdown = function (ev) {
            evCache.push(ev);
        };
        var pointerup_handler = function (ev) {
            remove_event(ev);
            // If the number of pointers down is less than two then reset diff tracker
            if (evCache.length < 2) {
                prevDiff = -1;
            }
            if (evCache.length < 1) {
                prevPoint = [-1.0, -1.0];
            }
        };
        canvas.onpointerup = pointerup_handler;
        canvas.onpointercancel = pointerup_handler;
        canvas.onpointerout = pointerup_handler;
        canvas.onpointerleave = pointerup_handler;
        canvas.onpointermove = function (ev) {
            for (var i = 0; i < evCache.length; i++) {
                if (ev.pointerId == evCache[i].pointerId) {
                    evCache[i] = ev;
                    break;
                }
            }
            // if pinch
            if (evCache.length == 2) {
                var curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);
                var delta = 0.0;
                if (prevDiff > 0) {
                    delta = curDiff - prevDiff;
                }
                self.camera.fov -= delta / 100.0;
                if (self.camera.fov < 0.2) {
                    self.camera.fov = 0.2;
                }
                prevDiff = curDiff;
            }
            // if drag
            if (evCache.length == 1) {
                var curPoint = [evCache[0].clientX, evCache[0].clientY];
                var delta = [0.0, 0.0];
                if (prevPoint[0] > 0) {
                    delta = [curPoint[0] - prevPoint[0], curPoint[1] - prevPoint[1]];
                }
                self.camera.position = self.camera.position.add(new BABYLON.Vector3(-delta[0] / 100.0, 0.0, (self.enableZMovement) ? delta[1] / 100.0 : 0.0));
                if (self.camera.position.x > 10.0) {
                    self.camera.position.x = 10.0;
                }
                if (self.camera.position.x < -10.0) {
                    self.camera.position.x = -10.0;
                }
                if (self.camera.position.y > 10.0) {
                    self.camera.position.y = 10.0;
                }
                if (self.camera.position.y < -10.0) {
                    self.camera.position.y = -10.0;
                }
                prevPoint = curPoint;
            }
        };
        return this.scene;
    };
    CardGame.prototype.OnEndLocalRound = function () {
        if (this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
            this.localPlayer.SetPhase(PlayerGamePhase.Spectating);
            this.InvokeNextPlayerRound();
        }
    };
    CardGame.prototype.GiveUp = function () {
        this.Socket.send(JSON.stringify({
            type: "gameState",
            id: this.gameID,
            value: "lost"
        }));
        this.EndGame();
    };
    CardGame.prototype.InvokeNextPlayerRound = function () {
        console.log("Invoke next round");
        this.Socket.send(JSON.stringify({
            type: "nextTurn",
            id: this.gameID,
            playDirection: this.playDirection,
            player: this.localPlayer.GetID()
        }));
    };
    CardGame.prototype.AddPlayer = function (id, isLocal, player) {
        if (player === void 0) { player = null; }
        if (isLocal) {
            console.log("On add new local player: " + id);
        }
        else {
            console.log("On add new remote player: " + id);
        }
        if (player == null)
            player = new Player(id, 6, isLocal);
        this.GUI.PlayerList.AddPlayer(player);
        if (isLocal) {
            this.localPlayer = player;
            this.localPlayer.camera = this.camera;
            this.localPlayer.Socket = this.Socket;
            this.localPlayer.GameID = this.gameID;
        }
        this.players.push(player);
        if (isLocal) {
            var str = window.location.hostname;
            this.Socket = new WebSocket("wss://" + str + ":" + this.port + "/" + this.name);
            var self = this;
            this.Socket.onopen = function () {
                self.Socket.send(JSON.stringify({
                    type: "addPlayer",
                    name: player.GetID(),
                    id: self.gameID
                }));
            };
            this.Socket.onmessage = function (e) {
                var result = JSON.parse(e.data);
                self.OnServerResponse(result);
            };
            this.Socket.onclose = function (e) {
                console.log("Socket closed reason: " + e.reason);
                self.bIsRunning = false;
                self.OnSelect(null, null);
            };
        }
        player.Socket = this.Socket;
        player.GameID = this.gameID;
        this.OnNewPlayer();
    };
    CardGame.prototype.UpdateGameDirection = function (dir) {
        this.playDirection = dir;
        this.Socket.send(JSON.stringify({
            type: "updateGame",
            playDirection: dir,
            id: this.gameID
        }));
    };
    // player null means the next one
    CardGame.prototype.NotifyPlayer = function (player, notification) {
        this.Socket.send(JSON.stringify({
            type: "notifyPlayer",
            id: this.gameID,
            origin: this.localPlayer.GetID(),
            playDirection: this.playDirection,
            notification: notification,
            target: (player != null) ? player.GetID() : ""
        }));
    };
    CardGame.prototype.GetLocalPlayDirection = function () {
        return this.playDirection;
    };
    CardGame.prototype.GetLocalPlayerID = function () {
        return this.localPlayer.GetID();
    };
    CardGame.prototype.OnServerResponse = function (result) {
        var _this = this;
        if (result.type == "addPlayer") {
            this.AddPlayer(result.player, false);
            return;
        }
        if (result.type == "PlayerWelcome") {
            if (result.Succeeded) {
                // nothing to do
            }
            else {
                this.OnGameRejected(BaseGame_1.GameRejectReason.PlayerLimitExceeded);
            }
            return;
        }
        if (result.type == "gameState") {
            var gs = (result.value == "lost") ? GameState.Lost : GameState.Won;
            if (result.player == this.localPlayer.GetID()) {
                this.localPlayer.SetGameState(gs);
            }
            return;
        }
        if (result.type == "updatePlayer") {
            this.players.forEach(function (p) {
                if (p.GetID() == result.player) {
                    if (result.field == "maxCardCount")
                        p.SetMaxCardCount(result.value);
                    _this.GUI.PlayerList.UpdatePlayer(p);
                }
            });
            return;
        }
        if (result.type == "updateGame") {
            this.playDirection = result.playDirection;
            return;
        }
        if (result.type == "playCard") {
            if (result.player == "") {
                this.Deck.PlayCardFromDeckOnStack(result.stack, result.card, result.revealed);
            }
            else {
                this.players.forEach(function (p) {
                    if (p.GetID() == result.player) {
                        console.log("Play Card from player: " + result.player);
                        _this.Deck.GameID = _this.gameID;
                        _this.Deck.Socket = _this.Socket;
                        _this.Deck.PlayCardByNameOnStack(result.stack, result.card, p, result.revealed);
                        _this.GUI.PlayerList.UpdatePlayer(p);
                    }
                });
            }
            return;
        }
        if (result.type == "drawCard") {
            this.players.forEach(function (p) {
                if (p.GetID() == result.player) {
                    _this.Deck.GameID = _this.gameID;
                    _this.Deck.Socket = _this.Socket;
                    _this.Deck.GiveCardByNameTo(result.card, p);
                    _this.GUI.PlayerList.UpdatePlayer(p);
                }
            });
            return;
        }
        if (result.type == "startGame") {
            this.StartGame();
            if (this.bIsRunning)
                this.OnSelect(null, null);
            return;
        }
        if (result.type == "nextTurn") {
            if (this.localPlayer.GetID() == result.player) {
                this.StartLocalPlayersRound();
            }
            return;
        }
        //console.log("Unknown response:" + JSON.stringify(result));
    };
    CardGame.prototype.SetGameID = function (id, doHost) {
        this.gameID = id;
        this.bIsHosting = doHost;
        var self = this;
        var str = window.location.hostname;
        var Socket = new WebSocket("wss://" + str + ":" + this.port + "/" + this.name);
        Socket.onopen = function (e) {
            console.log("Opened WebSocked for gaming! Greet server!");
            if (self.bIsHosting) {
                Socket.send(JSON.stringify({
                    type: "newGame",
                    id: self.gameID,
                    gameType: self.name,
                    maxPlayers: self.MaxPlayers()
                }));
            }
            else {
                Socket.send(JSON.stringify({
                    type: "join",
                    id: self.gameID
                }));
            }
        };
        Socket.onmessage = function (e) {
            var result = JSON.parse(e.data);
            if (result.type == "welcome") {
                console.log("Server sended greetings!");
                self.OnConnected(result.Succeeded);
                if (!result.Succeeded) {
                    self.OnGameRejected(BaseGame_1.GameRejectReason.GameNotPresent);
                }
            }
        };
        return true;
    };
    CardGame.prototype.OnSelect = function (evt, pickInfo) {
        if (this.localPlayer == null)
            return;
        if (pickInfo != null && this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
            var card = this.localPlayer.GetOwnCard(pickInfo);
            if (card !== null) {
                this.localPlayer.UnSelectAll();
                card.toogleSelect();
            }
        }
    };
    CardGame.prototype.EndGame = function () {
        this.Socket.send(JSON.stringify({
            type: "endGame",
            id: this.gameID,
            player: this.localPlayer.GetID()
        }));
        this.bIsRunning = false;
        this.players.forEach(function (p) { p.SetPhase(PlayerGamePhase.Spectating); });
    };
    CardGame.prototype.GetPlayersCount = function () {
        return this.players.length;
    };
    return CardGame;
}(BaseGame_1.default));
exports.CardGame = CardGame;
