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
import { TargetType, GameState } from 'svebaselib';
var CardType;
(function (CardType) {
    CardType["Number"] = "Number";
    CardType["Jack"] = "Jack";
    CardType["Queen"] = "Queen";
    CardType["King"] = "King";
    CardType["Ass"] = "Ass";
})(CardType || (CardType = {}));
var CardColor;
(function (CardColor) {
    CardColor["Check"] = "Karo";
    CardColor["Heart"] = "Herz";
    CardColor["Spades"] = "Piek";
    CardColor["Cross"] = "Kreuz";
})(CardColor || (CardColor = {}));
var SkatHelper = /** @class */ (function () {
    function SkatHelper() {
    }
    SkatHelper.CreateMaterialForCard = function (nb, cardType, cardColor) {
        var newMat = new Materials.MixMaterial("", this.scene);
        var mixTexture = new BABYLON.DynamicTexture("", { width: 512, height: 420 }, this.scene, false);
        var cardTexture = null;
        cardTexture = new BABYLON.Texture("/images/cards/card_skat_" + cardColor.toString() + ".png", this.scene);
        var textTexture = null;
        if (cardColor == CardColor.Check || cardColor == CardColor.Heart) {
            textTexture = new BABYLON.Texture("/images/cards/red.png", this.scene);
        }
        else {
            textTexture = new BABYLON.Texture("/images/cards/black.png", this.scene);
        }
        var font = "bold 100px monospace";
        var tmpctx = mixTexture.getContext();
        tmpctx.font = font;
        var NumberWidth = tmpctx.measureText(String(nb)).width;
        var symbol = "";
        switch (cardType) {
            case CardType.Ass:
                symbol = "A";
                break;
            case CardType.Jack:
                symbol = "J";
                break;
            case CardType.Queen:
                symbol = "Q";
                break;
            case CardType.King:
                symbol = "K";
                break;
            case CardType.Number:
                symbol = nb.toString();
                break;
            default:
                break;
        }
        // draw in each corner
        mixTexture.drawText(symbol, 266, 10, font, "#00FF00BB", "#FF0000FF");
        mixTexture.drawText(symbol, 512 - NumberWidth - 10, 10, font, "#00FF00BB", "#FF0000FF");
        mixTexture.drawText(symbol, 512 - NumberWidth - 10, 420 - 20 - NumberWidth, font, "#00FF00BB", "#FF0000FF");
        mixTexture.drawText(symbol, 266, 420 - 20 - NumberWidth, font, "#00FF00BB", "#FF0000FF");
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
    return SkatHelper;
}());
var SkatCard = /** @class */ (function (_super) {
    __extends(SkatCard, _super);
    function SkatCard(value, type, color, effect, scene, hl) {
        var _this = _super.call(this, value, null, scene, hl) || this;
        _this.bIsRevealed = false;
        _this.type = type;
        _this.color = color;
        _this.mesh.material = SkatHelper.CreateMaterialForCard(value, type, color);
        _this.effect = effect;
        return _this;
    }
    SkatCard.prototype.GetColor = function () {
        return this.color;
    };
    SkatCard.prototype.GetType = function () {
        return this.type;
    };
    SkatCard.prototype.uplift = function (camera) {
        _super.prototype.uplift.call(this, camera);
        this.bIsRevealed = true;
    };
    SkatCard.prototype.reveal = function () {
        _super.prototype.reveal.call(this);
        this.bIsRevealed = true;
    };
    return SkatCard;
}(Card));
var SkatStack = /** @class */ (function (_super) {
    __extends(SkatStack, _super);
    function SkatStack() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SkatStack.prototype.check = function (card) {
        if (this.type === StackType.Pop) {
            return false;
        }
        if (this.Cards.length == 0)
            return true;
        console.log("Check against card: " + this.Cards[this.Cards.length - 1].GetMesh().name);
        return ((this.Cards[this.Cards.length - 1].GetValue() < card.GetValue() // if value of the new card is higher
            && (this.Cards[this.Cards.length - 1].GetColor() == card.GetColor()))); // and the color is identical
    };
    return SkatStack;
}(CardStack));
var PyramidStack = /** @class */ (function (_super) {
    __extends(PyramidStack, _super);
    function PyramidStack(dir, type, id) {
        var _this = _super.call(this, dir, type, id) || this;
        _this.settingUp = true;
        _this.activeCard = null;
        _this.layedCards = new Map();
        _this.activeCardIdx = -1;
        return _this;
    }
    PyramidStack.prototype.check = function (card) {
        if (this.activeCard == null)
            return false;
        return this.activeCard.GetValue() == card.GetValue();
    };
    PyramidStack.prototype.GetCard = function (pick) {
        console.log("Check pyramid stack");
        var ret = null;
        for (var j = this.Cards.length - 1; j >= 0; j--) {
            if (pick.pickedMesh.name == this.Cards[j].GetMesh().name) {
                ret = this.Cards[j];
                break;
            }
            else {
                var cards = this.layedCards.get(this.Cards[j]);
                if (cards != null) {
                    ret = cards.find(function (c) { return c.GetMesh.name == pick.pickedMesh.name; });
                    if (ret != null) {
                        break;
                    }
                }
            }
        }
        return ret;
    };
    PyramidStack.prototype.setPosition = function (loc) {
        this.position = loc;
        var row = 1;
        var col = 0;
        for (var i = 0; i < this.Cards.length; i++) {
            if (col >= row) {
                row++;
                col = 0;
            }
            col++;
            var rowWidth = this.Cards[i].width * this.Cards[i].size * (5 / 4) * row;
            var rowHeight = this.Cards[i].size * (5 / 4);
            var newLoc = new BABYLON.Vector3((loc.x - rowWidth / 2.0) + (col - 1) * this.Cards[i].width * this.Cards[i].size * (5 / 4), this.card_distance, loc.z + (row - 1) * rowHeight);
            this.Cards[i].setPosition(newLoc);
            var cards = this.layedCards.get(this.Cards[i]);
            if (cards != null) {
                for (var j = 0; j < cards.length; j++) {
                    cards[j].setPosition(newLoc.add(new BABYLON.Vector3(0.0, this.card_distance * (j + 2), 0.0)));
                }
            }
        }
    };
    PyramidStack.prototype.revealNextCard = function () {
        this.activeCardIdx++;
        if (this.activeCardIdx >= this.Cards.length)
            return false;
        this.activeCard = this.Cards[this.activeCardIdx];
        this.activeCard.reveal();
        return true;
    };
    PyramidStack.prototype.finishSetup = function () {
        this.settingUp = false;
    };
    PyramidStack.prototype.SettingUp = function () {
        this.settingUp = true;
    };
    PyramidStack.prototype.CheckIfCardBelongsToStackOf = function (stackCard, pick) {
        var cs = this.layedCards.get(stackCard);
        if (cs != null) {
            return cs.find(function (c) { return c.GetMesh().name == pick.pickedMesh.name; }) != null;
        }
        else {
            return false;
        }
    };
    /** Does replicate */
    PyramidStack.prototype.addCard = function (card, previousOwner, shouldReveal) {
        if (shouldReveal === void 0) { shouldReveal = true; }
        if (this.settingUp) {
            _super.prototype.addCard.call(this, card, previousOwner, false);
        }
        else {
            var cards = this.layedCards.get(this.activeCard);
            if (cards == null)
                cards = [];
            cards.push(card);
            this.layedCards.set(this.activeCard, cards);
            if (previousOwner != null) {
                previousOwner.SetPoints(previousOwner.Points + 1);
            }
            card.reveal();
            this.Game.sendGameRequest({
                action: {
                    field: "!playCard",
                    value: {
                        card: card.GetMesh().name,
                        revealed: true
                    },
                },
                invoker: (previousOwner == null) ? "" : previousOwner.getName(),
                target: {
                    type: TargetType.Entity,
                    id: String(this.GetID())
                }
            });
        }
        this.setPosition(this.position);
    };
    return PyramidStack;
}(CardStack));
var BusdriverCardDeck = /** @class */ (function (_super) {
    __extends(BusdriverCardDeck, _super);
    function BusdriverCardDeck(effects, scene, hl) {
        var _this = _super.call(this) || this;
        _this.stacks = [];
        _this.stacks.push(new SkatStack(StackDirection.Undef, StackType.Pop, "MainStack"));
        _this.stacks.push(new SkatStack(StackDirection.Undef, StackType.Push, "PushStack"));
        _this.stacks.push(new PyramidStack(StackDirection.Undef, StackType.Push, "Pyramid"));
        var cards = [];
        var cards_name = new Set();
        var color_list = [CardColor.Check,
            CardColor.Cross,
            CardColor.Heart,
            CardColor.Spades];
        color_list.forEach(function (color) {
            var types_list = [CardType.Ass,
                CardType.Jack,
                CardType.Queen,
                CardType.King,
                CardType.Number];
            types_list.forEach(function (type) {
                var type_val = 0;
                switch (type) {
                    case CardType.Ass:
                        type_val = 14;
                        break;
                    case CardType.Jack:
                        type_val = 11;
                        break;
                    case CardType.King:
                        type_val = 13;
                        break;
                    case CardType.Queen:
                        type_val = 12;
                        break;
                    case CardType.Number:
                        type_val = 0;
                        break;
                }
                if (type == CardType.Number) {
                    for (var v = 7; v <= 10; v++) {
                        var c = new SkatCard(v, type, color, effects.get(type), scene, hl);
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
                else {
                    // image cards
                    var c = new SkatCard(type_val, type, color, effects.get(type), scene, hl);
                    c.GetMesh().name = "Card_" + type_val + "_" + type.toString() + "_" + color.toString();
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
    BusdriverCardDeck.prototype.GetNumberOfCardsInDeck = function () {
        return this.GetDrawStack().GetCardsCount();
    };
    BusdriverCardDeck.prototype.GetStacks = function () {
        return this.stacks.filter(function (e) { return e.GetID() != "MainStack"; });
    };
    BusdriverCardDeck.prototype.GetDrawStack = function () {
        return this.stacks.find(function (e) { return e.GetID() == "MainStack"; });
    };
    BusdriverCardDeck.prototype.GetPyramidStack = function () {
        return this.stacks.find(function (e) { return e.GetID() == "Pyramid"; });
    };
    BusdriverCardDeck.prototype.BuildPyramid = function () {
        var cardsInRow = 1;
        var cardsCount = this.GetDrawStack().GetCardsCount();
        var cardsPlayed = 0;
        var pyramidStack = this.GetPyramidStack();
        pyramidStack.SettingUp();
        pyramidStack.Game = this.Game;
        var drawStack = this.GetDrawStack();
        while (cardsCount - cardsPlayed >= cardsInRow) {
            for (var i = 0; i < cardsInRow; i++) {
                cardsPlayed++;
                pyramidStack.addCard(drawStack.DrawCard(), null, false);
            }
            cardsInRow++;
        }
    };
    /** Does not replicate */
    BusdriverCardDeck.prototype.PlayCardFromDeckOnStack = function (id, card_name, shouldReveal) {
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
    BusdriverCardDeck.prototype.revealFirstCard = function () {
        this.stacks[1].Game = this.Game;
        this.stacks[1].addCard(this.stacks[0].DrawCard(), null);
        this.setPosition(this.position);
    };
    BusdriverCardDeck.prototype.GiveCardByNameTo = function (card_name, player) {
        this.GetDrawStack().GiveCardByNameTo(card_name, player);
        this.setPosition(this.position);
    };
    BusdriverCardDeck.prototype.drawCard = function () {
        return _super.prototype.drawCard.call(this, "MainStack");
    };
    BusdriverCardDeck.prototype.setPosition = function (loc) {
        _super.prototype.setPosition.call(this, loc);
        var distance = 0.01;
        var card_width = 1.0;
        loc = new BABYLON.Vector3(loc.x + 3, loc.y, loc.z);
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
        mainStack.setPosition(new BABYLON.Vector3(loc.x + 3, distance + loc.y, loc.z));
        var positions = [
            [
                -2.5,
                0.0
            ],
            [
                -4.0,
                -2.0
            ]
        ];
        var j = 0;
        this.GetStacks().forEach(function (s) {
            s.setPosition(new BABYLON.Vector3(positions[j][0] * card_width + loc.x, distance + loc.y, positions[j][1] * card_width + loc.z));
            j++;
        });
    };
    return BusdriverCardDeck;
}(BaseCardDeck));
var BusdriverPlayer = /** @class */ (function (_super) {
    __extends(BusdriverPlayer, _super);
    function BusdriverPlayer(user, maxCardCount, isLocal) {
        var _this = _super.call(this, user, maxCardCount, isLocal) || this;
        _this.Points = 0;
        return _this;
    }
    /** Replicates */
    BusdriverPlayer.prototype.SetPoints = function (pts) {
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
    BusdriverPlayer.prototype.GetPoints = function () {
        return this.Points;
    };
    return BusdriverPlayer;
}(Player));
var Challenge = /** @class */ (function () {
    function Challenge() {
    }
    return Challenge;
}());
var BusdriverGUI = /** @class */ (function (_super) {
    __extends(BusdriverGUI, _super);
    function BusdriverGUI(scene) {
        var _this = _super.call(this, scene) || this;
        _this.GameStateText = new GUI.TextBlock();
        _this.GameStateText.fontSize = 70;
        _this.PlayerList.GetTextOfPlayerLine = _this.GetTextLine.bind(_this);
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
        return _this;
    }
    BusdriverGUI.prototype.SetEnabledNextRoundBtn = function (val) {
        this.EndRoundBtn.isEnabled = val;
        this.EndRoundBtn.background = (val) ? "green" : "grey";
    };
    BusdriverGUI.prototype.OnClickedEndRound = function () {
        this.OnEndRoundClick();
    };
    BusdriverGUI.prototype.AnnounceBusdriver = function () {
        this.GameStateText.text = "Du bist Busfahrer!";
        this.GameStateText.color = "red";
        this.GUI.addControl(this.GameStateText);
        var self = this;
        setTimeout(function () {
            self.GUI.removeControl(self.GameStateText);
        }, 5000);
    };
    BusdriverGUI.prototype.GetTextLine = function (player) {
        return player.GetID().toString() + ", Punkte: " + player.GetPoints();
    };
    BusdriverGUI.prototype.ShowGameState = function (gs) {
        this.GameStateText.text = (gs == GameState.Won) ? "Gewonnen!" : "Verloren!";
        this.GameStateText.color = (gs == GameState.Won) ? "green" : "red";
        this.GUI.addControl(this.GameStateText);
    };
    BusdriverGUI.prototype.ShowChallenge = function (bd, challenge) {
        var self = this;
        if (challenge == null) {
            bd.OnEndLocalRound();
            return;
        }
        this.AVotingUI = new VotingUI(this.GUI, challenge.ChallengeText, challenge.Answers, bd.GetPlayersCount(), function (val) {
            self.AVotingUI.removeAll();
            self.AVotingUI.postVote("SelfOnly", challenge.name, val, bd.GetLocalPlayer());
            self.AVotingUI = null;
            bd.OnEndLocalRound();
        });
    };
    BusdriverGUI.prototype.HideGameState = function () {
        this.GUI.removeControl(this.GameStateText);
    };
    return BusdriverGUI;
}(BaseGameGUI));
var RoundType;
(function (RoundType) {
    RoundType[RoundType["GuessColor"] = 0] = "GuessColor";
    RoundType[RoundType["GuessHigherOrLower"] = 1] = "GuessHigherOrLower";
    RoundType[RoundType["GuessInside"] = 2] = "GuessInside";
    RoundType[RoundType["GuessHadColor"] = 3] = "GuessHadColor";
    RoundType[RoundType["Busdriver"] = 4] = "Busdriver";
    RoundType[RoundType["Suspend"] = 5] = "Suspend";
    RoundType[RoundType["PlayingPyramid"] = 6] = "PlayingPyramid";
})(RoundType || (RoundType = {}));
var BusdriverState;
(function (BusdriverState) {
    BusdriverState[BusdriverState["Selecting"] = 0] = "Selecting";
    BusdriverState[BusdriverState["Pyramid"] = 1] = "Pyramid";
    BusdriverState[BusdriverState["Driving"] = 2] = "Driving";
})(BusdriverState || (BusdriverState = {}));
var Busdriver = /** @class */ (function (_super) {
    __extends(Busdriver, _super);
    function Busdriver() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.gameType = "Busdriver";
        _this.isSetup = false;
        _this.isBusdriver = false;
        _this.CurrentRound = RoundType.GuessColor;
        _this.CurrentState = BusdriverState.Selecting;
        return _this;
    }
    Busdriver.prototype.CheckGameState = function () {
        if (this.isSetup) {
            // check for win conditions
            var ret_1 = true;
            this.players.forEach(function (p) {
                ret_1 = ret_1 && p.GetGameState() == GameState.Won;
            });
            if (ret_1) {
                return GameState.Won;
            }
        }
        // else state is Undetermined
        return GameState.Undetermined;
    };
    Busdriver.prototype.GetChallengeFromType = function (type) {
        var _this = this;
        switch (type) {
            case RoundType.GuessColor:
                return {
                    name: "GuessColor",
                    ChallengeText: "Karten Farbe?",
                    Answers: [
                        "Rot",
                        "Schwarz"
                    ]
                };
            case RoundType.GuessHigherOrLower:
                return {
                    name: "GuessHigherOrLower",
                    ChallengeText: "Höher oder Tiefer?",
                    Answers: [
                        "Höher",
                        "Tiefer"
                    ]
                };
            case RoundType.GuessInside:
                return {
                    name: "GuessInside",
                    ChallengeText: "Innerhalb oder Außerhalb?",
                    Answers: [
                        "Innerhalb",
                        "Außerhalb"
                    ]
                };
            case RoundType.GuessHadColor:
                return {
                    name: "GuessHadColor",
                    ChallengeText: "Farbe bereits auf der Hand?",
                    Answers: [
                        "Ja",
                        "Nein"
                    ]
                };
            case RoundType.Busdriver:
                var names_1;
                this.players.forEach(function (p) {
                    if (p.GetID() != _this.localPlayer.GetID()) {
                        names_1.push(p.GetID().toString());
                    }
                });
                return {
                    name: "Busdriver",
                    ChallengeText: "Beifahrer wählen:",
                    Answers: names_1
                };
        }
        return null;
    };
    Busdriver.prototype.StartLocalPlayersRound = function () {
        var _this = this;
        if (this.CurrentRound == RoundType.Suspend) {
            if (this.CurrentState == BusdriverState.Pyramid) {
                if (this.IsHostInstance()) {
                    this.players.forEach(function (p) {
                        _this.NotifyPlayer(p, "SwitchToDriving!");
                    });
                    var busdriver = null;
                    for (var i = 0; i < this.players.length; i++) {
                        if (busdriver == null) {
                            busdriver = this.players[i];
                        }
                        else {
                            if (busdriver.Points > this.players[i].Points) {
                                busdriver = this.players[i];
                            }
                        }
                    }
                    this.NotifyPlayer(busdriver, "busdriver!");
                }
            }
            else {
                if (this.CurrentState == BusdriverState.Selecting) {
                    this.GUI.SetEnabledNextRoundBtn(false);
                    if (this.IsHostInstance()) {
                        console.log("Start Pyramid");
                        this.players.forEach(function (p) {
                            _this.NotifyPlayer(p, "SwitchToPyramid!");
                        });
                        setTimeout(function () {
                            _this.Deck.Game = _this;
                            _this.Deck.BuildPyramid();
                        }, 1000);
                        setTimeout(function () {
                            _this.players.forEach(function (p) {
                                _this.NotifyPlayer(p, "!RevealNext");
                            });
                        }, 1000);
                    }
                }
            }
            console.log("Suspended this round!");
            this.localPlayer.SetPhase(PlayerGamePhase.SelectingCard);
            this.OnEndLocalRound();
        }
        else {
            _super.prototype.StartLocalPlayersRound.call(this);
            if (this.CurrentState == BusdriverState.Pyramid) {
                this.GUI.SetEnabledNextRoundBtn(true);
                if (this.IsHostInstance()) {
                    this.players.forEach(function (p) {
                        _this.NotifyPlayer(p, "!RevealNext");
                    });
                }
            }
            else {
                this.GUI.SetEnabledNextRoundBtn(false);
                this.GUI.ShowChallenge(this, this.GetChallengeFromType(this.CurrentRound));
            }
        }
    };
    Busdriver.prototype.OnEndLocalRound = function () {
        this.localPlayer.update();
        _super.prototype.OnEndLocalRound.call(this);
    };
    Busdriver.prototype.StartGame = function () {
        var _this = this;
        this.enableZMovement = true;
        if (this.IsHostInstance()) {
            this.Deck.Game = this;
            this.SetInitialCardCount(0);
            this.players.forEach(function (p) {
                p.Game = _this;
            });
        }
        _super.prototype.StartGame.call(this);
        if (this.IsHostInstance()) {
            this.sendGameRequest({
                action: {
                    field: "!setTurn",
                    value: this.players[Math.round(Math.random() * (this.players.length - 1))].GetID(),
                },
                invoker: String(this.GetLocalPlayerID())
            });
        }
    };
    Busdriver.prototype.CreateScene = function (engine, canvas) {
        _super.prototype.CreateScene.call(this, engine, canvas);
        var self = this;
        SkatHelper.scene = this.scene;
        var effectMap = new Map();
        effectMap.set(CardType.Ass, function () {
        });
        effectMap.set(CardType.Jack, function () {
        });
        effectMap.set(CardType.King, function () {
        });
        effectMap.set(CardType.Queen, function () {
        });
        effectMap.set(CardType.Number, function () {
        });
        this.Deck = new BusdriverCardDeck(effectMap, this.scene, this.highlightLayer);
        // GUI
        this.GUI = new BusdriverGUI(this.scene);
        this.GUI.OnEndRoundClick = function () {
            self.OnEndLocalRound();
        };
        this.GUI.SetEnabledNextRoundBtn(false);
        return this.scene;
    };
    Busdriver.prototype.Tick = function () {
    };
    Busdriver.prototype.onJoined = function (user) {
        _super.prototype.onJoined.call(this, user);
        var isLocal = user.getName() === this.localUser.getName();
        if (isLocal) {
            console.log("On add new local player: " + user.getName());
        }
        else {
            console.log("On add new remote player: " + user.getName());
        }
        var player = new BusdriverPlayer(user, 0, isLocal);
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
        this.GUI.Game = this;
    };
    Busdriver.prototype.GetLocalPlayerID = function () {
        return this.localPlayer.GetID();
    };
    Busdriver.prototype.onRequest = function (result) {
        var _this = this;
        _super.prototype.onRequest.call(this, result);
        if (this.CurrentState == BusdriverState.Selecting || this.CurrentState == BusdriverState.Driving) {
            if (typeof result.action !== "string") {
                if (result.action.field == "vote" && result.invoker == this.localPlayer.GetID()) {
                    console.log("Got vote: " + JSON.stringify(result));
                    var card_1 = this.Deck.GetDrawStack().DrawCard();
                    this.localPlayer.AddCard(card_1);
                    if (result.action.value.voteID == "GuessColor") {
                        console.log("Got voting result for GuessColor: " + result.action.value.value);
                        if (result.invoker == this.localPlayer.GetID()) {
                            if (result.action.value.value == "Rot") {
                                if (card_1.GetColor() == CardColor.Check || card_1.GetColor() == CardColor.Heart) {
                                    this.CurrentRound = RoundType.GuessHigherOrLower;
                                    this.localPlayer.SetPoints(this.localPlayer.Points + 1);
                                }
                                else {
                                    if (this.isBusdriver) {
                                        this.CurrentRound = RoundType.GuessColor;
                                        this.localPlayer.dropCards();
                                    }
                                }
                            }
                            else {
                                if (card_1.GetColor() == CardColor.Cross || card_1.GetColor() == CardColor.Spades) {
                                    this.CurrentRound = RoundType.GuessHigherOrLower;
                                    this.localPlayer.SetPoints(this.localPlayer.Points + 1);
                                }
                                else {
                                    if (this.isBusdriver) {
                                        this.CurrentRound = RoundType.GuessColor;
                                        this.localPlayer.dropCards();
                                    }
                                }
                            }
                            if (!this.isBusdriver)
                                this.CurrentRound = RoundType.GuessHigherOrLower;
                        }
                    }
                    if (result.action.value.voteID == "GuessHigherOrLower") {
                        console.log("Got voting result for GuessHigherOrLower: " + result.action.value.value);
                        if (result.action.value.value == "Tiefer") {
                            if (card_1.GetValue() < this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()) {
                                this.CurrentRound = RoundType.GuessInside;
                                this.localPlayer.SetPoints(this.localPlayer.Points + 1);
                            }
                            else {
                                if (this.isBusdriver) {
                                    this.CurrentRound = RoundType.GuessColor;
                                    this.localPlayer.dropCards();
                                }
                            }
                        }
                        else {
                            if (card_1.GetValue() > this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()) {
                                this.CurrentRound = RoundType.GuessInside;
                                this.localPlayer.SetPoints(this.localPlayer.Points + 1);
                            }
                            else {
                                if (this.isBusdriver) {
                                    this.CurrentRound = RoundType.GuessColor;
                                    this.localPlayer.dropCards();
                                }
                            }
                        }
                        if (!this.isBusdriver)
                            this.CurrentRound = RoundType.GuessInside;
                    }
                    if (result.action.value.voteID == "GuessInside") {
                        console.log("Got voting result for GuessInside: " + result.action.value.value);
                        if (result.action.value.value == "Innerhalb") {
                            if ((card_1.GetValue() > this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()
                                && card_1.GetValue() < this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 3].GetValue())
                                || (card_1.GetValue() < this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()
                                    && card_1.GetValue() > this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 3].GetValue())) {
                                this.CurrentRound = RoundType.GuessHadColor;
                                this.localPlayer.SetPoints(this.localPlayer.Points + 1);
                            }
                            else {
                                if (this.isBusdriver) {
                                    this.CurrentRound = RoundType.GuessColor;
                                    this.localPlayer.dropCards();
                                }
                            }
                        }
                        else {
                            if (!((card_1.GetValue() > this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()
                                && card_1.GetValue() < this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 3].GetValue())
                                || (card_1.GetValue() < this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()
                                    && card_1.GetValue() > this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 3].GetValue()))
                                && card_1.GetValue() != this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 3].GetValue()
                                && card_1.GetValue() != this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()) {
                                this.CurrentRound = RoundType.GuessHadColor;
                                this.localPlayer.SetPoints(this.localPlayer.Points + 1);
                            }
                            else {
                                if (this.isBusdriver) {
                                    this.CurrentRound = RoundType.GuessColor;
                                    this.localPlayer.dropCards();
                                }
                            }
                        }
                        if (!this.isBusdriver)
                            this.CurrentRound = RoundType.GuessHadColor;
                    }
                    if (result.action.value.voteID == "GuessHadColor") {
                        console.log("Got voting result for GuessHadColor: " + result.action.value.value);
                        var hasColor_1 = false;
                        this.localPlayer.GetCards().forEach(function (c) {
                            if (c.GetMesh().name != card_1.GetMesh().name)
                                hasColor_1 = hasColor_1 || c.GetColor() == card_1.GetColor();
                        });
                        if (result.action.value.value == "Ja") {
                            if (hasColor_1) {
                                this.CurrentRound = RoundType.Suspend;
                                this.localPlayer.SetPoints(this.localPlayer.Points + 1);
                            }
                            else {
                                if (this.isBusdriver) {
                                    this.CurrentRound = RoundType.GuessColor;
                                    this.localPlayer.dropCards();
                                }
                            }
                        }
                        else {
                            if (!hasColor_1) {
                                this.CurrentRound = RoundType.Suspend;
                                this.localPlayer.SetPoints(this.localPlayer.Points + 1);
                            }
                            else {
                                if (this.isBusdriver) {
                                    this.CurrentRound = RoundType.GuessColor;
                                    this.localPlayer.dropCards();
                                }
                            }
                        }
                        if (!this.isBusdriver)
                            this.CurrentRound = RoundType.Suspend;
                    }
                    return;
                }
            }
        }
        this.isSetup = true;
        if (typeof result.action !== "string") {
            if (result.action.field == "!updatePlayer") {
                this.players.forEach(function (p) {
                    if (p.getName() == result.target.id) {
                        if (result.action.value.field == "points")
                            p.Points = result.action.value.field;
                        _this.GUI.PlayerList.UpdatePlayer(p);
                    }
                });
                return;
            }
        }
        console.log("Unknown response:" + JSON.stringify(result));
    };
    Busdriver.prototype.onPlayersRoundBegin = function (player) {
        _super.prototype.onPlayersRoundBegin.call(this, player);
        this.GUI.PlayerList.SetPlayerActive(player);
    };
    Busdriver.prototype.OnGameStateChange = function (gameState) {
        _super.prototype.OnGameStateChange.call(this, gameState);
        if (gameState != GameState.Undetermined) {
            this.GUI.ShowGameState(gameState);
            this.localPlayer.Game = this;
            this.localPlayer.SetGameState(gameState);
            this.EndGame();
        }
    };
    Busdriver.prototype.onNotify = function (notification, invoker, target) {
        _super.prototype.onNotify.call(this, notification, invoker, target);
        if (notification == "busdriver!" && target !== undefined && this.localUser.getName() === target.getName()) {
            this.isBusdriver = true;
            this.GUI.AnnounceBusdriver();
            this.CurrentRound = RoundType.GuessColor;
        }
        if (notification == "SwitchToDriving!") {
            this.CurrentState = BusdriverState.Driving;
            this.GUI.SetEnabledNextRoundBtn(false);
        }
        if (notification == "SwitchToPyramid!") {
            this.CurrentState = BusdriverState.Pyramid;
            this.CurrentRound = RoundType.PlayingPyramid;
            this.GUI.SetEnabledNextRoundBtn(true);
        }
        if (notification == "!RevealNext") {
            this.Deck.GetPyramidStack().finishSetup();
            if (!this.Deck.GetPyramidStack().revealNextCard()) {
                this.CurrentRound = RoundType.Suspend;
            }
        }
    };
    Busdriver.prototype.OnSelect = function (evt, pickInfo) {
        _super.prototype.OnSelect.call(this, evt, pickInfo);
        if (this.localPlayer == null)
            return;
        if (this.CurrentState == BusdriverState.Pyramid) {
            if (this.localPlayer.GetSelectedCard() != null) {
                if (pickInfo != null && this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
                    var stack = this.Deck.GetStackFromPick(pickInfo);
                    if (stack !== undefined && stack != null) {
                        if (stack.GetID() == this.Deck.GetPyramidStack().GetID()) {
                            stack.Game = this;
                            stack.PlayCardOnStack(this.localPlayer);
                        }
                    }
                }
            }
        }
    };
    Busdriver.prototype.MinPlayers = function () {
        return 2;
    };
    Busdriver.prototype.MaxPlayers = function () {
        return 6;
    };
    return Busdriver;
}(CardGame));
export { Busdriver };
