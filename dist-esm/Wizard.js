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
import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import * as GUI from 'babylonjs-gui';
import { BaseGameGUI, PlayerGamePhase, CardGame, CardStack, StackDirection, StackType, Card, Player, VotingUI, BaseCardDeck } from './CardGame';
import { GameState, TargetType } from 'svebaselib';
var CardType;
(function (CardType) {
    CardType["Number"] = "Number";
    CardType["Fool"] = "Fool";
    CardType["Wizard"] = "Wizard";
})(CardType || (CardType = {}));
var CardColor;
(function (CardColor) {
    CardColor["Red"] = "Red";
    CardColor["Green"] = "Green";
    CardColor["Yellow"] = "Yellow";
    CardColor["Blue"] = "Blue";
})(CardColor || (CardColor = {}));
var WizardHelper = /** @class */ (function () {
    function WizardHelper() {
    }
    WizardHelper.CardColor2BABYLON = function (ct) {
        if (ct == CardColor.Green) {
            return new BABYLON.Color3(0.2, 0.8, 0.2);
        }
        if (ct == CardColor.Red) {
            return new BABYLON.Color3(0.8, 0.2, 0.2);
        }
        if (ct == CardColor.Blue) {
            return new BABYLON.Color3(0.2, 0.2, 0.8);
        }
        if (ct == CardColor.Yellow) {
            return new BABYLON.Color3(0.8, 0.8, 0.2);
        }
    };
    WizardHelper.CreateMaterialForCard = function (nb, cardType) {
        var newMat = new Materials.MixMaterial("", this.scene);
        var mixTexture = new BABYLON.DynamicTexture("", { width: 512, height: 420 }, this.scene, false);
        var cardTexture = null;
        if (cardType == CardType.Number) {
            cardTexture = new BABYLON.Texture("/images/cards/card_wiz.png", this.scene);
        }
        if (cardType == CardType.Fool) {
            cardTexture = new BABYLON.Texture("/images/cards/card_wiz_fool.png", this.scene);
        }
        if (cardType == CardType.Wizard) {
            cardTexture = new BABYLON.Texture("/images/cards/card_wiz_wiz.png", this.scene);
        }
        var textTexture = new BABYLON.Texture("/images/cards/white.png", this.scene);
        var font = "bold 100px monospace";
        var tmpctx = mixTexture.getContext();
        tmpctx.font = font;
        var NumberWidth = tmpctx.measureText(String(nb)).width;
        if (cardType == CardType.Number) {
            mixTexture.drawText(String(nb), 256 + ((256 - NumberWidth) / 2.0), 250, font, "#00FF00BB", "#FF0000FF");
        }
        else {
            mixTexture.drawText("", 256 + ((256 - NumberWidth) / 2.0), 250, font, "#00FF00BB", "#FF0000FF");
        }
        newMat.mixTexture1 = mixTexture;
        newMat.mixTexture2 = null;
        newMat.specularColor = new BABYLON.Color3(1, 1, 1);
        newMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        newMat.diffuseTexture1 = cardTexture;
        newMat.diffuseTexture2 = textTexture;
        newMat.diffuseTexture3 = mixTexture;
        newMat.diffuseTexture4 = mixTexture;
        return newMat;
    };
    return WizardHelper;
}());
var WizardCard = /** @class */ (function (_super) {
    __extends(WizardCard, _super);
    function WizardCard(value, type, color, scene, hl) {
        var _this = _super.call(this, value, null, scene, hl) || this;
        _this.bIsRevealed = false;
        _this.type = type;
        _this.color = color;
        _this.mesh.material = WizardHelper.CreateMaterialForCard(value, type);
        return _this;
    }
    WizardCard.prototype.GetColor = function () {
        return this.color;
    };
    WizardCard.prototype.GetType = function () {
        return this.type;
    };
    WizardCard.prototype.uplift = function (camera) {
        _super.prototype.uplift.call(this, camera);
        this.bIsRevealed = true;
        this.applyColor();
    };
    WizardCard.prototype.reveal = function () {
        _super.prototype.reveal.call(this);
        this.bIsRevealed = true;
        this.applyColor();
    };
    WizardCard.prototype.cover = function () {
        _super.prototype.cover.call(this);
        this.bIsRevealed = false;
        this.mesh.material.diffuseColor = BABYLON.Color3.White();
    };
    WizardCard.prototype.applyColor = function () {
        this.mesh.material.diffuseColor = WizardHelper.CardColor2BABYLON(this.color);
    };
    return WizardCard;
}(Card));
var WizardPlayer = /** @class */ (function (_super) {
    __extends(WizardPlayer, _super);
    function WizardPlayer(user, maxCardCount, isLocal, scene) {
        var _this = _super.call(this, user, maxCardCount, isLocal) || this;
        _this.bFirstRound = false;
        _this.Points = 0;
        _this.RoundPoints = 0;
        _this.TargetPoints = -1;
        _this.playerNamePanel = BABYLON.Mesh.CreatePlane("", 4, scene);
        _this.playerNamePanel.setEnabled(false);
        _this.bFirstRound = false;
        _this.nameTexture = GUI.AdvancedDynamicTexture.CreateForMesh(_this.playerNamePanel);
        var text = new GUI.TextBlock();
        text.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        text.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        text.fontSize = 40;
        text.color = "orange";
        text.text = user.getName();
        _this.nameTexture.addControl(text);
        return _this;
    }
    /** Replicates */
    WizardPlayer.prototype.SetPoints = function (pts) {
        this.Points = pts;
        this.Game.sendGameRequest({
            action: {
                field: "Points",
                value: this.Points
            },
            invoker: this.getName(),
            target: {
                id: this.getName(),
                type: TargetType.Player
            }
        });
    };
    WizardPlayer.prototype.IsFirstRound = function (val, idx, camera) {
        if (this.bFirstRound == val)
            return;
        this.bFirstRound = val;
        this.GetCards()[0].GetMesh().setEnabled(((val) ? !this.IsLocalPlayer().valueOf() : this.IsLocalPlayer().valueOf()));
        this.GetCards()[0].GetMesh().isPickable = (val) ? false : this.IsLocalPlayer().valueOf();
        this.playerNamePanel.parent = (val) ? this.GetCards()[0].GetMesh() : null;
        this.playerNamePanel.setEnabled(((val) ? !this.IsLocalPlayer().valueOf() : false));
        var loc = new BABYLON.Vector3(-6 + 2 * idx, 3, -4.5);
        this.GetCards()[0].setPosition(loc);
        this.playerNamePanel.position = new BABYLON.Vector3(0, 0.2, 1);
        this.GetCards()[0].uplift(camera);
    };
    /** Replicates */
    WizardPlayer.prototype.EvaluateRound = function () {
        var pts = this.Points;
        if (this.RoundPoints == this.TargetPoints) {
            pts++;
        }
        this.SetPoints(pts);
        this.RoundPoints = 0;
        this.TargetPoints = -1;
    };
    /** Replicates */
    WizardPlayer.prototype.SetTargetPoints = function (pts) {
        this.TargetPoints = pts;
        this.Game.sendGameRequest({
            invoker: this.getName(),
            target: {
                type: TargetType.Player,
                id: this.getName()
            },
            action: {
                field: "TargetPoints",
                value: this.TargetPoints
            }
        });
    };
    /** Replicates */
    WizardPlayer.prototype.SetRoundPoints = function (pts) {
        this.RoundPoints = pts;
        this.Game.sendGameRequest({
            invoker: this.getName(),
            target: {
                type: TargetType.Player,
                id: this.getName()
            },
            action: {
                field: "RoundPoints",
                value: this.RoundPoints
            }
        });
    };
    WizardPlayer.prototype.GetPoints = function () {
        return this.Points;
    };
    WizardPlayer.prototype.GetRoundPoints = function () {
        return this.RoundPoints;
    };
    WizardPlayer.prototype.GetTargetPoints = function () {
        return this.TargetPoints;
    };
    return WizardPlayer;
}(Player));
var WizardStack = /** @class */ (function (_super) {
    __extends(WizardStack, _super);
    function WizardStack(dir, type, id) {
        var _this = _super.call(this, dir, type, id) || this;
        _this.playerOwnership = [];
        return _this;
    }
    WizardStack.prototype.check = function (card) {
        if (this.type === StackType.Pop) {
            return false;
        }
        return true;
    };
    WizardStack.prototype.addCard = function (card, previousOwner, shouldReveal) {
        if (shouldReveal === void 0) { shouldReveal = true; }
        _super.prototype.addCard.call(this, card, previousOwner, shouldReveal);
        if (previousOwner != null)
            this.playerOwnership.push(previousOwner);
    };
    WizardStack.prototype.Clear = function () {
        this.playerOwnership = [];
        this.Cards = [];
        this.setPosition(this.position);
    };
    WizardStack.prototype.GetWinnerFromTrump = function (trump) {
        var highVal = 0;
        var player = null;
        for (var i = 0; i < this.Cards.length; i++) {
            if (this.Cards[i].GetType() == CardType.Wizard) {
                highVal = 100;
                player = this.playerOwnership[i];
                break;
            }
            if (this.Cards[i].GetValue() > highVal && this.Cards[i].GetColor() == trump) {
                player = this.playerOwnership[i];
                highVal = this.Cards[i].GetValue();
            }
        }
        if (highVal == 0) {
            for (var i = 0; i < this.Cards.length; i++) {
                if (this.Cards[i].GetValue() > highVal) {
                    player = this.playerOwnership[i];
                    highVal = this.Cards[i].GetValue();
                }
            }
        }
        return player;
    };
    return WizardStack;
}(CardStack));
var WizardCardDeck = /** @class */ (function (_super) {
    __extends(WizardCardDeck, _super);
    function WizardCardDeck(scene, hl) {
        var _this = _super.call(this) || this;
        _this.stacks = [];
        _this.stacks.push(new WizardStack(StackDirection.Undef, StackType.Pop, "MainStack"));
        _this.stacks.push(new WizardStack(StackDirection.Undef, StackType.Push, "PushStack"));
        _this.stacks.push(new WizardStack(StackDirection.Undef, StackType.Push, "Finished"));
        var cards = [];
        var cards_name = new Set();
        var color_list = [CardColor.Blue,
            CardColor.Green,
            CardColor.Yellow,
            CardColor.Red];
        color_list.forEach(function (color) {
            var types_list = [CardType.Fool,
                CardType.Number,
                CardType.Wizard];
            types_list.forEach(function (type) {
                var type_val = -4;
                switch (type) {
                    case CardType.Fool:
                        type_val = 0;
                        break;
                    case CardType.Wizard:
                        type_val = 14;
                        break;
                    case CardType.Number:
                        type_val = 0;
                        break;
                }
                if (type == CardType.Number) {
                    for (var v = 1; v <= 13; v++) {
                        for (var j = 0; j < 2; j++) {
                            var c = new WizardCard(v, type, color, scene, hl);
                            c.GetMesh().name = "Card_" + v + "_" + type.toString() + "_" + color.toString();
                            var count = 1;
                            while (cards_name.has(c.GetMesh().name + count)) {
                                count++;
                            }
                            c.GetMesh().name = c.GetMesh().name + count;
                            cards_name.add(c.GetMesh().name);
                            cards.push(c);
                        }
                    }
                }
                else {
                    var c = new WizardCard(type_val, type, color, scene, hl);
                    c.GetMesh().name = "Card_" + type.toString() + "_" + color.toString();
                    var count = 1;
                    while (cards_name.has(c.GetMesh().name + count)) {
                        count++;
                    }
                    c.GetMesh().name = c.GetMesh().name + count;
                    cards_name.add(c.GetMesh().name);
                    cards.push(c);
                }
            });
        });
        console.log("Setted up stack with: " + cards.length + " cards! (diffrent names: " + cards_name.size + ")");
        _this.stacks[0].ForceSetCards(cards);
        _this.setPosition(new BABYLON.Vector3(0, 0, 0));
        return _this;
    }
    WizardCardDeck.prototype.SetTrumpCard = function (t) {
        this.TrumpCard = t;
    };
    WizardCardDeck.prototype.GetTrumpCard = function () {
        return this.TrumpCard;
    };
    WizardCardDeck.prototype.ResetPlayedCards = function () {
        var _this = this;
        var card = null;
        if (this.GetDrawStack().GetCardsCount() > 0)
            this.GetDrawStack().GetCards()[this.GetDrawStack().GetCardsCount() - 1].cover();
        this.GetStacks().forEach(function (stack) {
            do {
                card = stack.DrawCard();
                if (card != null) {
                    _this.GetDrawStack().addCard(card, null, false);
                }
            } while (card != null);
            stack.Clear();
        });
    };
    WizardCardDeck.prototype.ClearPlayedCards = function () {
        var card = null;
        if (this.GetDrawStack().GetCardsCount() > 0) {
            if (this.GetDrawStack().GetCards()[this.GetDrawStack().GetCardsCount() - 1].IsRevealed()) {
                var name_1 = this.GetDrawStack().GetCards()[this.GetDrawStack().GetCardsCount() - 1].GetMesh().name;
                this.GetStacks()[1].addCard(this.GetDrawStack().TakeCardByName(name_1), null, true);
            }
        }
        do {
            card = this.GetStacks()[0].DrawCard();
            if (card != null) {
                this.GetStacks()[1].addCard(card, null, true);
            }
        } while (card != null);
        this.GetStacks()[0].Clear();
    };
    WizardCardDeck.prototype.RevealTrumpCard = function () {
        this.ClearPlayedCards();
        var stack = this.GetDrawStack();
        var c = stack.DrawCard();
        if (c != null) {
            console.log("Trump is: " + c.GetColor().toString());
            stack.Game = this.Game;
            stack.addCard(c, null, true);
            stack.update();
            this.TrumpCard = c.GetColor();
        }
        else {
            this.TrumpCard = null;
        }
    };
    WizardCardDeck.prototype.GetWinnerOfRound = function () {
        return this.GetStacks()[0].GetWinnerFromTrump(this.TrumpCard);
    };
    WizardCardDeck.prototype.GetNumberOfCardsInDeck = function () {
        return this.GetDrawStack().GetCardsCount();
    };
    WizardCardDeck.prototype.GetStacks = function () {
        return (this.stacks.filter(function (e) { return e.GetID() != "MainStack"; }));
    };
    WizardCardDeck.prototype.GetDrawStack = function () {
        return this.stacks.find(function (e) { return e.GetID() == "MainStack"; });
    };
    WizardCardDeck.prototype.GetStackFromPick = function (pick) {
        if (pick.pickedMesh === null) {
            return null;
        }
        var ret = this.GetStacks().find(function (e) { return e.GetCard(pick) != null; });
        return ret;
    };
    /** Does not replicate */
    WizardCardDeck.prototype.PlayCardFromDeckOnStack = function (id, card_name, shouldReveal) {
        if (shouldReveal === void 0) { shouldReveal = true; }
        console.log("Received drawn card(" + card_name + ") for stack: " + id);
        var card = null;
        this.stacks.forEach(function (element) {
            var c = element.TakeCardByName(card_name);
            if (c != null)
                card = c;
        });
        var target = this.stacks.find(function (s) { return s.GetID() == id; });
        target.addCardLocal(card, shouldReveal);
        this.setPosition(this.position);
    };
    WizardCardDeck.prototype.GiveCardByNameTo = function (card_name, player) {
        this.GetDrawStack().GiveCardByNameTo(card_name, player);
        this.setPosition(this.position);
    };
    WizardCardDeck.prototype.drawCard = function () {
        return _super.prototype.drawCard.call(this, "MainStack");
    };
    WizardCardDeck.prototype.setPosition = function (loc) {
        _super.prototype.setPosition.call(this, loc);
        var distance = 0.01;
        var card_width = 1.0;
        // get the cards size
        var mainStack = this.GetDrawStack();
        if (mainStack.GetCardsCount() > 0) {
            card_width = mainStack.GetCards()[0].width * mainStack.GetCards()[0].size;
        }
        else {
            this.stacks.forEach(function (e) {
                if (e.GetCardsCount() > 0) {
                    card_width = e.GetCards()[0].width * e.GetCards()[0].size;
                }
            });
        }
        mainStack.setPosition(new BABYLON.Vector3(loc.x, distance + loc.y, loc.z));
        var positions = [
            [
                -2.5,
                0.0
            ],
            [
                2.5,
                0.0
            ]
        ];
        var j = 0;
        this.GetStacks().forEach(function (s) {
            s.setPosition(new BABYLON.Vector3(positions[j][0] * card_width + loc.x, distance + loc.y, positions[j][1] * card_width + loc.z));
            j++;
        });
    };
    return WizardCardDeck;
}(BaseCardDeck));
var WizardGUI = /** @class */ (function (_super) {
    __extends(WizardGUI, _super);
    function WizardGUI(scene) {
        var _this = _super.call(this, scene) || this;
        _this.GameStateText = new GUI.TextBlock();
        _this.GameStateText.fontSize = 70;
        _this.PlayerList.GetTextOfPlayerLine = _this.GetTextLine.bind(_this);
        return _this;
    }
    WizardGUI.prototype.GetTextLine = function (player) {
        return player.GetID().toString() + ", Stiche: " + player.GetPoints() + ", Vorher: " + player.GetTargetPoints();
    };
    WizardGUI.prototype.ShowGameState = function (gs) {
        this.GameStateText.text = (gs == GameState.Won) ? "Gewonnen!" : "Verloren!";
        this.GameStateText.color = (gs == GameState.Won) ? "green" : "red";
        this.GUI.addControl(this.GameStateText);
    };
    WizardGUI.prototype.ShowPointsGuess = function (ug) {
        var self = this;
        var list = [];
        for (var i = 0; i <= ug.roundCount; i++) {
            list.push(i.toString());
        }
        this.AVotingUI = new VotingUI(this.GUI, "Wie viele Stiche wirst du bekommen?", list, ug.GetPlayersCount(), function (val) {
            self.AVotingUI.removeAll();
            self.AVotingUI.postVote("SelfOnly", "PointsGuess_" + ug.GetLocalPlayerID(), val, ug.GetLocalPlayer());
            self.AVotingUI = null;
            ug.OnEndLocalRound();
        });
    };
    WizardGUI.prototype.HideGameState = function () {
        this.GUI.removeControl(this.GameStateText);
    };
    return WizardGUI;
}(BaseGameGUI));
var Wizard = /** @class */ (function (_super) {
    __extends(Wizard, _super);
    function Wizard(info) {
        var _this = _super.call(this, info) || this;
        _this.gameType = "Wizard";
        _this.isSetup = false;
        _this.roundCount = 0;
        _this.maxRoundCount = 1;
        _this.hadPlayedSinceReset = false;
        _this.gameType = "Wizard";
        _this.bIsSuspended = false;
        return _this;
    }
    Wizard.prototype.CheckGameState = function () {
        if (this.roundCount >= this.maxRoundCount) {
            // check for win conditions
            var playerWon = "";
            var high = 0;
            for (var i = 0; i < this.players.length; i++) {
                if (high < this.players[i].GetPoints()) {
                    high = this.players[i].GetPoints();
                    playerWon = this.players[i].GetID();
                }
            }
            return (playerWon == this.localPlayer.GetID()) ? GameState.Won : GameState.Lost;
        }
        // else state is Undetermined
        return GameState.Undetermined;
    };
    Wizard.prototype.StartLocalPlayersRound = function () {
        var _this = this;
        if (this.localPlayer.GetCardsCount() == 0) {
            console.log("Suspended this round!");
            this.bIsSuspended = false;
            if (this.IsHostInstance()) {
                this.players.forEach(function (p) {
                    _this.NotifyPlayer(p, "!reset");
                });
            }
            else {
                this.localPlayer.SetPhase(PlayerGamePhase.SelectingCard);
                this.OnEndLocalRound();
            }
        }
        else {
            _super.prototype.StartLocalPlayersRound.call(this);
            console.log("Prepare " + this.roundCount + " round:");
            var i_1 = 0;
            this.players.forEach(function (p) {
                p.IsFirstRound(false, i_1, _this.camera);
                i_1++;
            });
            this.localPlayer.update();
            if (this.lastPlayerBeganID == this.localPlayer.GetID() && this.hadPlayedSinceReset) {
                var player = this.Deck.GetWinnerOfRound();
                if (player != null) {
                    console.log("Player: " + player.GetID() + " Won round!");
                    player.SetRoundPoints(player.GetRoundPoints() + 1);
                }
                console.log("Get next trump!");
                this.Deck.Game = this;
                this.Deck.RevealTrumpCard();
                this.players.forEach(function (p) {
                    _this.sendGameRequest({
                        invoker: "",
                        target: {
                            type: TargetType.Player,
                            id: p.getName()
                        },
                        action: {
                            field: "TrumpCard",
                            value: _this.Deck.GetTrumpCard()
                        }
                    });
                });
            }
            this.hadPlayedSinceReset = true;
        }
    };
    Wizard.prototype.OnEndLocalRound = function () {
        var _this = this;
        this.localPlayer.update();
        this.players.forEach(function (p) { return _this.GUI.PlayerList.UpdatePlayer(p); });
        _super.prototype.OnEndLocalRound.call(this);
    };
    Wizard.prototype.StartGame = function () {
        var _this = this;
        this.roundCount = 0;
        this.maxRoundCount = 20;
        if (this.players.length >= 4) {
            this.maxRoundCount = 15;
        }
        if (this.players.length >= 5) {
            this.maxRoundCount = 10;
        }
        this.lastPlayerBeganID = "";
        _super.prototype.StartGame.call(this);
        this.bIsSuspended = false;
        if (this.IsHostInstance()) {
            this.Deck.Game = this;
            this.SetInitialCardCount(1);
            this.players.forEach(function (p) {
                _this.NotifyPlayer(p, "!reset");
            });
        }
    };
    Wizard.prototype.CreateScene = function (engine, canvas) {
        _super.prototype.CreateScene.call(this, engine, canvas);
        WizardHelper.scene = this.scene;
        var self = this;
        this.Deck = new WizardCardDeck(this.scene, this.highlightLayer);
        // GUI
        this.GUI = new WizardGUI(this.scene);
        return this.scene;
    };
    Wizard.prototype.Tick = function () {
    };
    Wizard.prototype.onJoined = function (user) {
        _super.prototype.onJoined.call(this, user);
        var isLocal = user.getName() === this.localUser.getName();
        if (isLocal) {
            console.log("On add new local player: " + user.getName());
        }
        else {
            console.log("On add new remote player: " + user.getName());
        }
        var player = new WizardPlayer(user, 1, isLocal, this.scene);
        this.GUI.PlayerList.AddPlayer(player);
        if (isLocal) {
            this.localPlayer = player;
            this.localPlayer.camera = this.camera;
            this.localPlayer.Game = this;
        }
        this.players.push(player);
        player.Game = this;
        this.OnNewPlayer();
        if (isLocal) {
            this.localPlayer.SetOrigin(new BABYLON.Vector3(0, 1, -5.5));
        }
        this.Deck.Game = this;
        this.GUI.GameID = this.gameID;
        this.GUI.Game = this;
    };
    Wizard.prototype.onRequest = function (result) {
        _super.prototype.onRequest.call(this, result);
        /*if (result.type == "vote") {
            if (result.voteID.includes("PointsGuess_")) {
                console.log("Found pointsGuess: " + result.voteID);
                this.players.forEach(p => {
                    if(result.voteID == "PointsGuess_" + p.GetID()) {
                        (<WizardPlayer>p).SetTargetPoints(result.value);
                    }
                });

                if(this.IsHostInstance()) {
                    let hasAllVotes = true;
                    this.players.forEach(p => {
                        hasAllVotes = hasAllVotes && (<WizardPlayer>p).GetTargetPoints() >= 0;
                    });

                    if(hasAllVotes) {
                        if (this.lastPlayerBeganID != "") {
                            for(let i = 0; i < this.players.length; i++) {
                                if(this.players[i].GetID() == this.lastPlayerBeganID) {
                                    if (i+1 < this.players.length) {
                                        this.lastPlayerBeganID = this.players[i+1].GetID();
                                    } else {
                                        this.lastPlayerBeganID = this.players[0].GetID();
                                    }
                                    break;
                                }
                            }
                        } else {
                            this.lastPlayerBeganID = this.players[Math.round(Math.random() * (this.players.length - 1))].GetID();
                        }
    
                        this.sendGameRequest({
                            action: {
                                field: "!setTurn",
                                value: this.lastPlayerBeganID,
                            },
                            invoker: String(this.GetLocalPlayerID())
                        });
                    }
                }
            }
            return;
        }

        if (typeof result.action !== "string") {
            if (result.action.field == "RoundCount") {
                this.roundCount = result.action.value;
            }

            if (result.type == "updatePlayer") {
                this.players.forEach(p => {
                    if(p.GetID() == result.player) {
                        if (result.field == "points")
                            (<WizardPlayer>p).Points = result.value;
                        if (result.field == "roundpoints")
                            (<WizardPlayer>p).RoundPoints = result.value;
                        if (result.field == "targetpoints")
                            (<WizardPlayer>p).TargetPoints = result.value;
                        this.GUI.PlayerList.UpdatePlayer(p);
                    }
                });

                if(result.field == "trumpCard") {
                    (<WizardCardDeck>this.Deck).SetTrumpCard(result.value);
                }

                return;
            }

            if (result.type == "drawCard") {
                this.isSetup = true;

                if (this.roundCount == 1) {
                    console.log("Prepare first round:");

                    let i = 0;
                    this.players.forEach((p) => {
                        if (p.GetID() == result.player) {
                            (<WizardPlayer>p).IsFirstRound(true, i, this.camera);
                        }
                        i++;
                    });
                } else {
                    console.log("Prepare " + this.roundCount + " round:");

                    let i = 0;
                    this.players.forEach((p) => {
                        if (p.GetID() == result.player) {
                            (<WizardPlayer>p).IsFirstRound(false, i, this.camera);
                        }
                        i++;
                    });
                    this.localPlayer.update();
                }
            }
        }
        */
        console.log("Unknown response:" + JSON.stringify(result));
    };
    Wizard.prototype.OnGameStateChange = function (gs) {
        _super.prototype.OnGameStateChange.call(this, gs);
        if (gs != GameState.Undetermined) {
            this.GUI.ShowGameState(gs);
            this.localPlayer.Game = this;
            this.localPlayer.SetGameState(gs);
            this.EndGame();
        }
    };
    Wizard.prototype.onPlayersRoundBegin = function (player) {
        _super.prototype.onPlayersRoundBegin.call(this, player);
        this.GUI.PlayerList.SetPlayerActive(player);
        if (this.lastPlayerBeganID == "") {
            this.lastPlayerBeganID = player.getName();
        }
        if (this.localPlayer.getName() == player.getName()) {
            if (this.localPlayer.GetCardsCount() == 0) {
                this.OnEndLocalRound();
            }
        }
    };
    Wizard.prototype.onNotify = function (notification, invoker, target) {
        var _this = this;
        if (notification == "!reset") {
            this.lastPlayerBeganID = "";
            this.hadPlayedSinceReset = false;
            this.roundCount++;
            if (this.roundCount > this.maxRoundCount) {
                this.OnSelect(null, null);
                return;
            }
            console.log("Start round: " + this.roundCount);
            if (this.IsHostInstance()) {
                this.Deck.Game = this;
                this.Deck.ResetPlayedCards();
                if (this.roundCount > 1) {
                    this.players.forEach(function (p) {
                        p.EvaluateRound();
                        p.GetCards().forEach(function (c) {
                            _this.Deck.GetDrawStack().addCard(c, p, false);
                        });
                    });
                }
                setTimeout(function () {
                    _this.players.forEach(function (p) {
                        p.Game = _this;
                        p.drawNumberOfCards(_this.Deck.GetDrawStack(), _this.roundCount);
                    });
                    console.log("Reveal trump!");
                    _this.Deck.Game = _this;
                    _this.Deck.RevealTrumpCard();
                    if (_this.roundCount == 1) {
                        console.log("Prepare first round host:");
                        var i_2 = 0;
                        _this.players.forEach(function (p) {
                            p.IsFirstRound(true, i_2, _this.camera);
                            i_2++;
                        });
                    }
                }, 1000);
            }
            this.localPlayer.SetPhase(PlayerGamePhase.Spectating);
            this.GUI.ShowPointsGuess(this);
        }
    };
    Wizard.prototype.OnSelect = function (evt, pickInfo) {
        _super.prototype.OnSelect.call(this, evt, pickInfo);
        if (this.localPlayer == null)
            return;
        if (this.localPlayer.GetSelectedCard() != null) {
            if (pickInfo != null && this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
                var stack = this.Deck.GetStackFromPick(pickInfo);
                if (stack == null && pickInfo.pickedMesh.name == "ground1") {
                    stack = this.Deck.GetStacks()[0];
                }
                if (stack != null) {
                    stack.Game = this;
                    stack.PlayCardOnStack(this.localPlayer);
                    this.OnEndLocalRound();
                }
            }
        }
    };
    Wizard.prototype.MinPlayers = function () {
        return 3;
    };
    Wizard.prototype.MaxPlayers = function () {
        return 6;
    };
    return Wizard;
}(CardGame));
export { Wizard };
