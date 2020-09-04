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
import { BaseGameGUI, PlayerGamePhase, CardGame, CardStack, StackDirection, StackType, Card, GameState, VotingUI, BaseCardDeck } from './CardGame';
var CardType;
(function (CardType) {
    CardType["Number"] = "Number";
    CardType["DirectionSwitch"] = "DirectionSwitch";
    CardType["Draw2"] = "Draw2";
    CardType["Draw4"] = "Draw4";
    CardType["Wish"] = "Wish";
    CardType["Suspend"] = "Suspend";
})(CardType || (CardType = {}));
var CardColor;
(function (CardColor) {
    CardColor["Red"] = "Red";
    CardColor["Green"] = "Green";
    CardColor["Yellow"] = "Yellow";
    CardColor["Blue"] = "Blue";
    CardColor["Black"] = "Black";
})(CardColor || (CardColor = {}));
var UNOHelper = /** @class */ (function () {
    function UNOHelper() {
    }
    UNOHelper.CardColor2BABYLON = function (ct) {
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
        if (ct == CardColor.Black) {
            return new BABYLON.Color3(0.1, 0.1, 0.1);
        }
    };
    UNOHelper.CreateMaterialForCard = function (nb, cardType) {
        var newMat = new Materials.MixMaterial("", this.scene);
        var mixTexture = new BABYLON.DynamicTexture("", { width: 512, height: 420 }, this.scene, false);
        var cardTexture = null;
        if (cardType == CardType.Number) {
            cardTexture = new BABYLON.Texture("/images/cards/card_uno.png", this.scene);
        }
        if (cardType == CardType.Draw2) {
            cardTexture = new BABYLON.Texture("/images/cards/card_uno_get2.png", this.scene);
        }
        if (cardType == CardType.Draw4) {
            cardTexture = new BABYLON.Texture("/images/cards/card_uno_get4.png", this.scene);
        }
        if (cardType == CardType.Suspend) {
            cardTexture = new BABYLON.Texture("/images/cards/card_uno_susp.png", this.scene);
        }
        if (cardType == CardType.DirectionSwitch) {
            cardTexture = new BABYLON.Texture("/images/cards/card_uno_switch.png", this.scene);
        }
        if (cardType == CardType.Wish) {
            cardTexture = new BABYLON.Texture("/images/cards/card_uno_wish.png", this.scene);
        }
        var textTexture = new BABYLON.Texture("/images/cards/white.png", this.scene);
        var font = "bold 100px monospace";
        var tmpctx = mixTexture.getContext();
        tmpctx.font = font;
        var NumberWidth = tmpctx.measureText(String(nb)).width;
        if (nb >= 0) {
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
    return UNOHelper;
}());
var UnoCard = /** @class */ (function (_super) {
    __extends(UnoCard, _super);
    function UnoCard(value, type, color, effect, scene, hl) {
        var _this = _super.call(this, value, null, scene, hl) || this;
        _this.bIsRevealed = false;
        _this.type = type;
        _this.color = color;
        _this.mesh.material = UNOHelper.CreateMaterialForCard(value, type);
        if (type == CardType.Number) {
            _this.effect = function () { };
        }
        else {
            _this.effect = effect;
        }
        return _this;
    }
    UnoCard.prototype.SetColor = function (color, force) {
        if (force === void 0) { force = false; }
        this.color = color;
        console.log("Changed color of card: " + this.mesh.name + " to: " + color.toString());
        if (this.bIsRevealed) {
            this.applyColor(force);
        }
    };
    UnoCard.prototype.GetColor = function () {
        return this.color;
    };
    UnoCard.prototype.GetType = function () {
        return this.type;
    };
    UnoCard.prototype.uplift = function (camera) {
        _super.prototype.uplift.call(this, camera);
        this.bIsRevealed = true;
        this.applyColor();
    };
    UnoCard.prototype.reveal = function () {
        _super.prototype.reveal.call(this);
        this.bIsRevealed = true;
        this.applyColor();
    };
    UnoCard.prototype.applyColor = function (force) {
        if (force === void 0) { force = false; }
        if (force || (this.type != CardType.Draw4 && this.type != CardType.Wish)) {
            this.mesh.material.diffuseColor = UNOHelper.CardColor2BABYLON(this.color);
        }
    };
    return UnoCard;
}(Card));
var UNOStack = /** @class */ (function (_super) {
    __extends(UNOStack, _super);
    function UNOStack() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UNOStack.prototype.check = function (card) {
        if (this.type === StackType.Pop) {
            return false;
        }
        if (this.Cards.length == 0)
            return true;
        console.log("Check against card: " + this.Cards[this.Cards.length - 1].GetMesh().name);
        return ((this.Cards[this.Cards.length - 1].GetValue() == card.GetValue() // if value is identical
            || (this.Cards[this.Cards.length - 1].GetColor() == card.GetColor())) // or the color is identical
            || card.GetColor() == CardColor.Black // or the card is black
            || this.Cards[this.Cards.length - 1].GetColor() == CardColor.Black); //or the card on the stack is black (was played at the beginning)
    };
    return UNOStack;
}(CardStack));
var UNOCardDeck = /** @class */ (function (_super) {
    __extends(UNOCardDeck, _super);
    function UNOCardDeck(effects, scene, hl) {
        var _this = _super.call(this) || this;
        _this.stacks = [];
        _this.stacks.push(new UNOStack(StackDirection.Undef, StackType.Pop, "MainStack"));
        _this.stacks.push(new UNOStack(StackDirection.Undef, StackType.Push, "PushStack"));
        var cards = [];
        var cards_name = new Set();
        var color_list = [CardColor.Blue,
            CardColor.Green,
            CardColor.Yellow,
            CardColor.Red];
        color_list.forEach(function (color) {
            var types_list = [CardType.DirectionSwitch,
                CardType.Draw2,
                CardType.Suspend,
                CardType.Number];
            types_list.forEach(function (type) {
                var type_val = -4;
                switch (type) {
                    case CardType.DirectionSwitch:
                        type_val = -1;
                        break;
                    case CardType.Draw2:
                        type_val = -2;
                        break;
                    case CardType.Suspend:
                        type_val = -3;
                        break;
                    case CardType.Number:
                        type_val = 0;
                        break;
                }
                if (type == CardType.Number) {
                    for (var v = 1; v <= 9; v++) {
                        for (var j = 0; j < 2; j++) {
                            var c_1 = new UnoCard(v, type, color, effects.get(type), scene, hl);
                            c_1.GetMesh().name = "Card_" + v + "_" + type.toString() + "_" + color.toString();
                            var count_1 = 1;
                            while (cards_name.has(c_1.GetMesh().name + count_1)) {
                                count_1++;
                            }
                            c_1.GetMesh().name = c_1.GetMesh().name + count_1;
                            cards_name.add(c_1.GetMesh().name);
                            cards.push(c_1);
                        }
                    }
                    // push zeros
                    var c = new UnoCard(0, type, color, effects.get(type), scene, hl);
                    c.GetMesh().name = "Card_0_" + type.toString() + "_" + color.toString();
                    var count = 1;
                    while (cards_name.has(c.GetMesh().name + count)) {
                        count++;
                    }
                    c.GetMesh().name = c.GetMesh().name + count;
                    cards_name.add(c.GetMesh().name);
                    cards.push(c);
                }
                else {
                    // action cards
                    if (type == CardType.DirectionSwitch || type == CardType.Suspend || type == CardType.Draw2) {
                        for (var i = 0; i < 2; i++) {
                            var c = new UnoCard(type_val, type, color, effects.get(type), scene, hl);
                            c.GetMesh().name = "Card_Action_" + type.toString() + "_" + color.toString();
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
            });
        });
        var black_list = [CardType.Draw4, CardType.Wish];
        //Add black cards
        black_list.forEach(function (type) {
            for (var i = 0; i < 4; i++) {
                var c = new UnoCard(-4, type, CardColor.Black, effects.get(type), scene, hl);
                c.GetMesh().name = "Card_Black_" + type.toString() + "_Black";
                var count = 1;
                while (cards_name.has(c.GetMesh().name + count)) {
                    count++;
                }
                c.GetMesh().name = c.GetMesh().name + count;
                cards_name.add(c.GetMesh().name);
                cards.push(c);
            }
        });
        console.log("Setted up stack with: " + cards.length + " cards! (diffrent names: " + cards_name.size + ")");
        _this.stacks[0].ForceSetCards(cards);
        _this.setPosition(new BABYLON.Vector3(0, 0, 0));
        return _this;
    }
    UNOCardDeck.prototype.GetNumberOfCardsInDeck = function () {
        return this.GetDrawStack().GetCardsCount();
    };
    UNOCardDeck.prototype.GetStacks = function () {
        return this.stacks.filter(function (e) { return e.GetID() != "MainStack"; });
    };
    UNOCardDeck.prototype.GetDrawStack = function () {
        return this.stacks.find(function (e) { return e.GetID() == "MainStack"; });
    };
    UNOCardDeck.prototype.ResolveWish = function (color) {
        this.GetStacks()[0].GetCards()[this.GetStacks()[0].GetCards().length - 1].SetColor(color, true);
    };
    UNOCardDeck.prototype.GetStackFromPick = function (pick) {
        if (pick.pickedMesh === null) {
            return null;
        }
        var ret = this.GetStacks().find(function (e) { return e.GetCard(pick) != null; });
        return ret;
    };
    /** Does not replicate */
    UNOCardDeck.prototype.PlayCardFromDeckOnStack = function (id, card_name, shouldReveal) {
        if (shouldReveal === void 0) { shouldReveal = true; }
        var card = null;
        this.stacks.forEach(function (element) {
            var c = element.GetCards().find(function (c) { return c.GetMesh().name == card_name; });
            if (c != null) {
                card = c;
            }
        });
        var target = this.stacks.find(function (s) { return s.GetID() == id; });
        target.addCardLocal(card, shouldReveal);
        this.setPosition(this.position);
    };
    UNOCardDeck.prototype.revealFirstCard = function () {
        this.stacks[1].Socket = this.Socket;
        this.stacks[1].GameID = this.GameID;
        this.stacks[1].addCard(this.stacks[0].DrawCard(), null);
        this.setPosition(this.position);
    };
    UNOCardDeck.prototype.GiveCardByNameTo = function (card_name, player) {
        this.GetDrawStack().GiveCardByNameTo(card_name, player);
        this.setPosition(this.position);
    };
    UNOCardDeck.prototype.drawCard = function () {
        return _super.prototype.drawCard.call(this, "MainStack");
    };
    UNOCardDeck.prototype.setPosition = function (loc) {
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
            ]
        ];
        var j = 0;
        this.GetStacks().forEach(function (s) {
            s.setPosition(new BABYLON.Vector3(positions[j][0] * card_width + loc.x, distance + loc.y, positions[j][1] * card_width + loc.z));
            j++;
        });
    };
    return UNOCardDeck;
}(BaseCardDeck));
var UNOGUI = /** @class */ (function (_super) {
    __extends(UNOGUI, _super);
    function UNOGUI(scene) {
        var _this = _super.call(this, scene) || this;
        _this.GameStateText = new GUI.TextBlock();
        _this.GameStateText.fontSize = 70;
        _this.OnEndRoundClick = function () { };
        _this.EndRoundBtn = GUI.Button.CreateSimpleButton("EndRoundBtn", "Runde Beenden");
        _this.EndRoundBtn.width = "150px";
        _this.EndRoundBtn.height = "40px";
        _this.EndRoundBtn.disabledColor = "grey";
        _this.EndRoundBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        _this.EndRoundBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        _this.EndRoundBtn.color = "white";
        _this.EndRoundBtn.cornerRadius = 20;
        _this.EndRoundBtn.background = "green";
        _this.EndRoundBtn.onPointerUpObservable.add(_this.OnClickedEndRound.bind(_this));
        _this.GUI.addControl(_this.EndRoundBtn);
        _this.PlayerList.GetTextOfPlayerLine = _this.GetTextLine.bind(_this);
        return _this;
    }
    UNOGUI.prototype.GetTextLine = function (player) {
        return player.GetID().toString() + ", Karten: " + player.GetCards().length.toString();
    };
    UNOGUI.prototype.OnClickedEndRound = function () {
        this.OnEndRoundClick();
    };
    UNOGUI.prototype.ShowEndRoundBtn = function (val) {
        this.EndRoundBtn.isEnabled = val;
        this.EndRoundBtn.background = (val) ? "green" : "grey";
    };
    UNOGUI.prototype.ShowGameState = function (gs) {
        this.GameStateText.text = (gs == GameState.Won) ? "Gewonnen!" : "Verloren!";
        this.GameStateText.color = (gs == GameState.Won) ? "green" : "red";
        this.GUI.addControl(this.GameStateText);
    };
    UNOGUI.prototype.ShowColorWish = function (ug) {
        var self = this;
        this.AVotingUI = new VotingUI(this.GUI, "Welche Farbe ist gewünscht?", ["Rot", "Grün", "Gelb", "Blau"], function (val) {
            self.AVotingUI.removeAll();
            self.Socket.send(JSON.stringify({
                type: "vote",
                id: self.GameID,
                voteType: "SelfOnly",
                voteID: "ColorWish",
                value: val
            }));
            self.AVotingUI = null;
            ug.OnEndLocalRound();
        });
    };
    UNOGUI.prototype.HideGameState = function () {
        this.GUI.removeControl(this.GameStateText);
    };
    return UNOGUI;
}(BaseGameGUI));
var UNO = /** @class */ (function (_super) {
    __extends(UNO, _super);
    function UNO(port) {
        var _this = _super.call(this, port) || this;
        _this.name = "UNO";
        _this.isSetup = false;
        _this.bIsSuspended = false;
        return _this;
    }
    UNO.prototype.CheckGameState = function () {
        if (this.isSetup) {
            // check for win conditions
            if (this.localPlayer.GetCardsCount() == 0) {
                return GameState.Won;
            }
            else {
                var ret_1 = false;
                this.players.forEach(function (p) {
                    ret_1 = ret_1 || p.GetGameState() == GameState.Won;
                });
                if (ret_1) {
                    return GameState.Lost;
                }
            }
        }
        // else state is Undetermined
        return GameState.Undetermined;
    };
    UNO.prototype.StartLocalPlayersRound = function () {
        if (this.bIsSuspended) {
            console.log("Suspended this round!");
            this.bIsSuspended = false;
            this.localPlayer.SetPhase(PlayerGamePhase.SelectingCard);
            this.OnEndLocalRound();
        }
        else {
            _super.prototype.StartLocalPlayersRound.call(this);
            this.GUI.ShowEndRoundBtn(true);
        }
    };
    UNO.prototype.OnEndLocalRound = function () {
        var _this = this;
        this.localPlayer.update();
        this.players.forEach(function (p) { return _this.GUI.PlayerList.UpdatePlayer(p); });
        _super.prototype.OnEndLocalRound.call(this);
        this.GUI.ShowEndRoundBtn(false);
    };
    UNO.prototype.StartGame = function () {
        var _this = this;
        if (this.bIsHosting) {
            this.Deck.Socket = this.Socket;
            this.Deck.GameID = this.gameID;
            this.Deck.revealFirstCard();
            this.SetInitialCardCount(7);
            this.players.forEach(function (p) {
                p.Socket = _this.Socket;
                p.GameID = _this.gameID;
                p.drawNumberOfCards(_this.Deck.GetDrawStack(), 7);
            });
        }
        _super.prototype.StartGame.call(this);
        this.bIsSuspended = false;
        if (this.players.length == 1) {
            this.InvokeNextPlayerRound();
        }
        else {
            if (this.IsHostInstance()) {
                this.Socket.send(JSON.stringify({
                    type: "setTurn",
                    player: this.players[Math.round(Math.random() * (this.players.length - 1))].GetID(),
                    id: this.gameID
                }));
            }
        }
    };
    UNO.prototype.CreateScene = function (engine, canvas) {
        _super.prototype.CreateScene.call(this, engine, canvas);
        UNOHelper.scene = this.scene;
        var self = this;
        var effectMap = new Map();
        effectMap.set(CardType.DirectionSwitch, function () {
            self.UpdateGameDirection((-1) * self.GetLocalPlayDirection());
        });
        effectMap.set(CardType.Draw2, function () {
            self.NotifyPlayer(null, "draw2!");
        });
        effectMap.set(CardType.Draw4, function () {
            self.NotifyPlayer(null, "draw4!");
            self.GUI.ShowColorWish(self);
        });
        effectMap.set(CardType.Wish, function () {
            self.GUI.ShowColorWish(self);
        });
        effectMap.set(CardType.Suspend, function () {
            self.NotifyPlayer(null, "suspend!");
        });
        effectMap.set(CardType.Number, function () {
        });
        this.Deck = new UNOCardDeck(effectMap, this.scene, this.highlightLayer);
        // GUI
        this.GUI = new UNOGUI(this.scene);
        this.GUI.OnEndRoundClick = this.OnForceEndRound.bind(this);
        this.GUI.ShowEndRoundBtn(false);
        return this.scene;
    };
    UNO.prototype.OnForceEndRound = function () {
        this.localPlayer.drawNumberOfCards(this.Deck.GetDrawStack(), 1);
        this.OnEndLocalRound();
    };
    UNO.prototype.Tick = function () {
    };
    UNO.prototype.AddPlayer = function (id, isLocal, player) {
        if (player === void 0) { player = null; }
        _super.prototype.AddPlayer.call(this, id, isLocal);
        if (isLocal) {
            this.localPlayer.SetOrigin(new BABYLON.Vector3(0, 1, -5.5));
        }
        this.Deck.GameID = this.gameID;
        this.Deck.Socket = this.Socket;
        this.GUI.GameID = this.gameID;
        this.GUI.Socket = this.Socket;
    };
    UNO.prototype.OnServerResponse = function (result) {
        _super.prototype.OnServerResponse.call(this, result);
        if (result.type == "vote") {
            if (result.voteID == "ColorWish") {
                console.log("Got voting result for wish: " + result.value);
                var wishColor = CardColor.Red;
                if (result.value == "Grün") {
                    wishColor = CardColor.Green;
                }
                if (result.value == "Gelb") {
                    wishColor = CardColor.Yellow;
                }
                if (result.value == "Blau") {
                    wishColor = CardColor.Blue;
                }
                this.Deck.ResolveWish(wishColor);
            }
            return;
        }
        if (result.type == "gameState") {
            var gs = this.CheckGameState();
            this.GUI.ShowGameState(gs);
            this.EndGame();
            return;
        }
        if (result.type == "updatePlayer") {
            if (this.bIsHosting) {
                this.players.forEach(function (p) {
                    if (p.GetID() == result.player) {
                        console.log("Initial draw card for: " + p.GetID());
                    }
                });
                this.isSetup = true;
            }
            if (this.bIsRunning)
                this.OnSelect(null, null);
            return;
        }
        if (result.type == "drawCard") {
            this.isSetup = true;
        }
        if (result.type == "nextTurn") {
            this.GUI.PlayerList.SetPlayerActive(this.players.find(function (e) { return e.GetID() == result.player; }));
            return;
        }
        if (result.type == "notifyPlayer") {
            if (result.notification == "draw2!") {
                this.localPlayer.drawNumberOfCards(this.Deck.GetDrawStack(), 2);
            }
            if (result.notification == "draw4!") {
                this.localPlayer.drawNumberOfCards(this.Deck.GetDrawStack(), 4);
            }
            if (result.notification == "suspend!") {
                if (this.localPlayer.GetPhase() == PlayerGamePhase.Spectating) {
                    this.bIsSuspended = true;
                }
                else {
                    this.OnEndLocalRound();
                }
            }
            return;
        }
        console.log("Unknown response:" + JSON.stringify(result));
    };
    UNO.prototype.OnSelect = function (evt, pickInfo) {
        _super.prototype.OnSelect.call(this, evt, pickInfo);
        if (this.localPlayer == null)
            return;
        if (this.localPlayer.GetSelectedCard() != null) {
            if (pickInfo != null && this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
                var stack = this.Deck.GetStackFromPick(pickInfo);
                if (stack != null) {
                    stack.Socket = this.Socket;
                    stack.GameID = this.gameID;
                    if (this.localPlayer.GetSelectedCard().GetColor() == CardColor.Black) {
                        stack.PlayCardOnStack(this.localPlayer);
                    }
                    else {
                        if (stack.PlayCardOnStack(this.localPlayer)) {
                            this.OnEndLocalRound();
                        }
                    }
                }
            }
        }
        var gameState = this.CheckGameState();
        if (gameState != GameState.Undetermined) {
            this.GUI.ShowGameState(gameState);
            this.localPlayer.Socket = this.Socket;
            this.localPlayer.GameID = this.gameID;
            this.localPlayer.SetGameState(gameState);
            this.EndGame();
        }
    };
    UNO.prototype.MinPlayers = function () {
        return 2;
    };
    UNO.prototype.MaxPlayers = function () {
        return 6;
    };
    return UNO;
}(CardGame));
export { UNO };
