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
import { BaseGameGUI, PlayerGamePhase, CardGame, CardStack, StackDirection, StackType, Card, VotingUI, BaseCardDeck } from './CardGame';
import { GameState } from 'svebaselib';
var TheGameCardDeck = /** @class */ (function (_super) {
    __extends(TheGameCardDeck, _super);
    function TheGameCardDeck(maxValue, duplicateCount, materials, scene, hl) {
        var _this = _super.call(this) || this;
        _this.stacks = [];
        _this.stacks.push(new CardStack(StackDirection.Undef, StackType.Pop, "MainStack"));
        var cards = [];
        for (var d = 1; d <= duplicateCount; d++) {
            for (var v = 2; v < maxValue; v++) {
                var c = new Card(v, materials, scene, hl);
                c.GetMesh().name = "Card_" + v + "_" + d;
                cards.push(c);
            }
        }
        _this.stacks[0].ForceSetCards(cards);
        var vals = [
            [1, StackDirection.Upwards],
            [1, StackDirection.Upwards],
            [maxValue, StackDirection.Downwards],
            [maxValue, StackDirection.Downwards]
        ];
        for (var i = 1; i <= 4; i++) {
            var s = new CardStack(vals[i - 1][1], StackType.Push, "PushStack_" + i);
            var c = new Card(vals[i - 1][0], materials, scene, hl);
            c.GetMesh().name = "Stack_Card_" + i;
            s.addCardLocal(c);
            _this.stacks.push(s);
        }
        _this.setPosition(new BABYLON.Vector3(0, 0, 0));
        return _this;
    }
    TheGameCardDeck.prototype.GetNumberOfCardsInDeck = function () {
        return this.stacks[0].GetCardsCount();
    };
    TheGameCardDeck.prototype.GetStacks = function () {
        return this.stacks.filter(function (e) { return e.GetID() != "MainStack"; });
    };
    TheGameCardDeck.prototype.GetDrawStack = function () {
        return this.stacks.find(function (e) { return e.GetID() == "MainStack"; });
    };
    TheGameCardDeck.prototype.GiveCardByNameTo = function (card_name, player) {
        this.GetDrawStack().GiveCardByNameTo(card_name, player);
        this.setPosition(this.position);
    };
    TheGameCardDeck.prototype.drawCard = function () {
        return _super.prototype.drawCard.call(this, "MainStack");
    };
    TheGameCardDeck.prototype.setPosition = function (loc) {
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
                -2,
                -2
            ],
            [
                2,
                -2
            ],
            [
                2,
                1
            ],
            [
                -2,
                1
            ],
        ];
        var j = 0;
        this.GetStacks().forEach(function (s) {
            s.setPosition(new BABYLON.Vector3(positions[j][0] * card_width + loc.x, distance + loc.y, positions[j][1] * card_width + loc.z));
            j++;
        });
    };
    return TheGameCardDeck;
}(BaseCardDeck));
var TheGameGUI = /** @class */ (function (_super) {
    __extends(TheGameGUI, _super);
    function TheGameGUI(scene) {
        var _this = _super.call(this, scene) || this;
        _this.AVotingUI = null;
        _this.OnNextRoundClick = function () { };
        _this.EndRoundBtn = GUI.Button.CreateSimpleButton("EndRoundBtn", "Runde Beenden");
        _this.EndRoundBtn.width = "150px";
        _this.EndRoundBtn.height = "40px";
        _this.EndRoundBtn.disabledColor = "grey";
        _this.EndRoundBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        _this.EndRoundBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        _this.EndRoundBtn.color = "white";
        _this.EndRoundBtn.cornerRadius = 20;
        _this.EndRoundBtn.background = "green";
        _this.EndRoundBtn.onPointerUpObservable.add(_this.OnEndLocalRound.bind(_this));
        _this.GameStateText = new GUI.TextBlock();
        _this.GameStateText.fontSize = 70;
        _this.CardsLeftText = new GUI.TextBlock();
        _this.CardsLeftText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        _this.CardsLeftText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        _this.CardsLeftText.fontSize = 20;
        _this.CardsLeftText.text = "Karten übrig: ?";
        _this.CardsLeftText.color = "white";
        _this.CardsLeftText.left = "-45%";
        _this.CardsLeftText.top = "0%";
        _this.GUI.addControl(_this.CardsLeftText);
        return _this;
    }
    TheGameGUI.prototype.UpdateCardCounter = function (count) {
        this.CardsLeftText.text = "Karten übrig: " + count;
    };
    TheGameGUI.prototype.ShowGameState = function (gs) {
        this.GameStateText.text = (gs == GameState.Won) ? "Gewonnen!" : "Verloren!";
        this.GameStateText.color = (gs == GameState.Won) ? "green" : "red";
        this.GUI.addControl(this.GameStateText);
    };
    TheGameGUI.prototype.ShowVotePlayerStart = function () {
        var _this = this;
        var self = this;
        this.AVotingUI = new VotingUI(this.GUI, "Wer fängt an?", this.PlayerList.GetPlayersTexts(), this.Game, function (val) {
            self.AVotingUI.removeAll();
            self.AVotingUI.onGameStartVoteResult = _this.Game.setPlayerToStart;
            self.AVotingUI.postVote("vote", "PlayerStart", val, _this.Game.GetLocalPlayer());
            self.AVotingUI = null;
        });
    };
    TheGameGUI.prototype.HideGameState = function () {
        this.GUI.removeControl(this.GameStateText);
    };
    TheGameGUI.prototype.OnEndLocalRound = function () {
        this.OnNextRoundClick();
    };
    TheGameGUI.prototype.ShowNextRoundBtn = function () {
        this.GUI.addControl(this.EndRoundBtn);
    };
    TheGameGUI.prototype.SetEnabledNextRoundBtn = function (val) {
        this.EndRoundBtn.isEnabled = val;
        this.EndRoundBtn.background = (val) ? "green" : "grey";
    };
    TheGameGUI.prototype.HideNextRoundBtn = function () {
        this.GUI.removeControl(this.EndRoundBtn);
    };
    TheGameGUI.prototype.onRequest = function (req) {
        if (this.AVotingUI !== null) {
            this.AVotingUI.onRequest(req);
        }
    };
    return TheGameGUI;
}(BaseGameGUI));
var TheGame = /** @class */ (function (_super) {
    __extends(TheGame, _super);
    function TheGame(info) {
        var _this = _super.call(this, info) || this;
        _this.gameType = "TheGame";
        _this.votesList = [];
        _this.maxPlayers = 6;
        _this.gameType = "TheGame";
        return _this;
    }
    TheGame.prototype.CheckGameState = function () {
        var _this = this;
        // check for win conditions
        if (this.Deck.GetNumberOfCardsInDeck() == 0) {
            var won = true;
            for (var i = 0; i < this.players.length; i++) {
                won = won && (this.players[i].GetCardsCount() == 0);
            }
            if (won) {
                return GameState.Won;
            }
        }
        var _loop_1 = function (i) {
            if (this_1.players[i].GetPhase() != PlayerGamePhase.Spectating) {
                var diff = 2 - (this_1.players[i].GetMaxCardCount() - this_1.players[i].GetCardsCount());
                if (diff > 0) {
                    var playableCards_1 = new Set();
                    this_1.players[i].GetCards().forEach(function (card) {
                        _this.Deck.GetStacks().forEach(function (stack) {
                            if (stack.check(card)) {
                                // found playable card
                                playableCards_1.add(card);
                            }
                        });
                    });
                    if (playableCards_1.size < diff) {
                        return { value: GameState.Lost };
                    }
                }
            }
        };
        var this_1 = this;
        // check for lost conditions
        for (var i = 0; i < this.players.length; i++) {
            var state_1 = _loop_1(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        // else state is Undetermined
        return GameState.Undetermined;
    };
    TheGame.prototype.StartLocalPlayersRound = function () {
        _super.prototype.StartLocalPlayersRound.call(this);
        this.GUI.SetEnabledNextRoundBtn(false);
    };
    TheGame.prototype.StartGame = function () {
        if (this.IsHostInstance()) {
            var cardsCount = 8;
            if (this.players.length == 2) {
                cardsCount = 7;
            }
            if (this.players.length > 2) {
                cardsCount = 6;
            }
            this.SetInitialCardCount(cardsCount);
        }
        _super.prototype.StartGame.call(this);
    };
    TheGame.prototype.onStart = function () {
        _super.prototype.onStart.call(this);
        this.GUI.ShowNextRoundBtn();
        this.GUI.SetEnabledNextRoundBtn(false);
        if (this.players.length == 1) {
            this.InvokeNextPlayerRound();
        }
        else {
            console.log("Bring up the player voting");
            this.ShowVotePlayerStartGUI();
        }
    };
    TheGame.prototype.ShowVotePlayerStartGUI = function () {
        console.log("Vote for the player to start.");
        this.votesList = [];
        this.GUI.Game = this;
        this.GUI.GameID = this.gameID;
        this.GUI.ShowVotePlayerStart();
    };
    TheGame.prototype.CreateScene = function (engine, canvas) {
        _super.prototype.CreateScene.call(this, engine, canvas);
        this.CardMaterails = new Map();
        for (var i = 1; i <= 100; i++)
            this.CreateMaterialForCard(i);
        this.Deck = new TheGameCardDeck(100, 1, this.CardMaterails, this.scene, this.highlightLayer);
        // GUI
        this.GUI = new TheGameGUI(this.scene);
        this.GUI.OnNextRoundClick = this.OnEndLocalRound.bind(this);
        return this.scene;
    };
    TheGame.prototype.OnEndLocalRound = function () {
        if (this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
            _super.prototype.OnEndLocalRound.call(this);
            this.GUI.SetEnabledNextRoundBtn(false);
            this.localPlayer.drawCards(this.Deck.GetDrawStack());
        }
        else {
            _super.prototype.OnEndLocalRound.call(this);
        }
    };
    TheGame.prototype.CreateMaterialForCard = function (nb) {
        var newMat = new Materials.MixMaterial("", this.scene);
        var mixTexture = new BABYLON.DynamicTexture("", { width: 512, height: 420 }, this.scene, false);
        var cardTexture = new BABYLON.Texture("/images/cards/card_1.png", this.scene);
        var textTexture = new BABYLON.Texture("/images/cards/white.png", this.scene);
        var font = "bold 100px monospace";
        var tmpctx = mixTexture.getContext();
        tmpctx.font = font;
        var NumberWidth = tmpctx.measureText(String(nb)).width;
        mixTexture.drawText(String(nb), 256 + ((256 - NumberWidth) / 2.0), 190, font, "#00FF00BB", "#FF0000FF");
        newMat.mixTexture1 = mixTexture;
        newMat.mixTexture2 = null;
        newMat.specularColor = new BABYLON.Color3(1, 1, 1);
        newMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        newMat.diffuseTexture1 = cardTexture;
        newMat.diffuseTexture2 = textTexture;
        newMat.diffuseTexture3 = mixTexture;
        newMat.diffuseTexture4 = mixTexture;
        this.CardMaterails.set(nb, newMat);
    };
    TheGame.prototype.Tick = function () {
    };
    TheGame.prototype.onJoined = function (id) {
        _super.prototype.onJoined.call(this, id);
        if (id.getName() == this.localUser.getName()) {
            this.localPlayer.SetOrigin(new BABYLON.Vector3(0, 1, -5.5));
        }
        this.Deck.Game = this;
        this.GUI.GameID = this.gameID;
        this.GUI.Game = this;
    };
    TheGame.prototype.onRequest = function (req) {
        _super.prototype.onRequest.call(this, req);
        this.GUI.onRequest(req);
    };
    TheGame.prototype.onPlayersRoundBegin = function (player) {
        _super.prototype.onPlayersRoundBegin.call(this, player);
        this.GUI.PlayerList.SetPlayerActive(player);
        this.GUI.UpdateCardCounter(this.Deck.GetNumberOfCardsInDeck());
        if (player.getName() == this.localPlayer.getName()) {
            this.GUI.RememberItsYourTurn();
        }
    };
    TheGame.prototype.OnGameStateChange = function (gameState) {
        _super.prototype.OnGameStateChange.call(this, gameState);
        if (gameState != GameState.Undetermined) {
            this.GUI.ShowGameState(gameState);
            this.localPlayer.Game = this;
            this.localPlayer.SetGameState(gameState);
            this.EndGame();
        }
    };
    /*
    public OnServerResponse(result: any): void {
        super.OnServerResponse(result);

        if (result.type == "gameState") {
            let gs: GameState = (result.value == "lost") ? GameState.Lost : GameState.Won;
            
            this.GUI.ShowGameState(gs);

            this.EndGame();

            return;
        }

        if (result.type == "updatePlayer") {
            if (this.bIsHosting) {
                this.players.forEach((p) => {
                    if (p.GetID() == result.player)
                    {
                        console.log("Initial draw card for: " + p.GetID());
                        p.drawCards((<TheGameCardDeck>this.Deck).GetDrawStack());
                    }
                });
            }

            if (this.bIsRunning)
                this.OnSelect(null, null);
            return;
        }

        if (result.type == "nextTurn") {
            this.GUI.PlayerList.SetPlayerActive(this.players.find(e => e.GetID() == result.player));
            this.GUI.UpdateCardCounter(this.Deck.GetNumberOfCardsInDeck());
            if(result.player == this.localPlayer.GetID()) {
                this.GUI.RememberItsYourTurn();
            }
            return;
        }

        console.log("Unknown response:" + JSON.stringify(result));
    }
    */
    TheGame.prototype.OnSelect = function (evt, pickInfo) {
        _super.prototype.OnSelect.call(this, evt, pickInfo);
        if (this.localPlayer == null)
            return;
        if (pickInfo != null && this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
            var stack = this.Deck.GetStackFromPick(pickInfo);
            if (stack != null) {
                {
                    stack.Game = this;
                    stack.PlayCardOnStack(this.localPlayer);
                }
            }
        }
        if (this.localPlayer.GetMaxCardCount() - this.localPlayer.GetCardsCount() >= 2) {
            this.GUI.SetEnabledNextRoundBtn(true);
        }
        this.SetGameState(this.CheckGameState());
    };
    TheGame.prototype.MinPlayers = function () {
        return 1;
    };
    return TheGame;
}(CardGame));
export { TheGame };
