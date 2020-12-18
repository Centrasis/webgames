import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import * as GUI from 'babylonjs-gui';
import { BaseGameGUI, PlayerGamePhase, CardGame, CardStack, StackDirection, StackType, Card, Player, PlayerListUI, VotingUI, BaseCardDeck} from './CardGame';
import {SVEGame} from './BaseGame';
import { GameState, GameInfo, SVEAccount, GameRequest, SetDataRequest } from 'svebaselib';

class TheGameCardDeck extends BaseCardDeck {

    public GetNumberOfCardsInDeck(): number {
        return this.stacks[0].GetCardsCount();
    }

    public GetStacks(): CardStack[] {
        return this.stacks.filter(e => e.GetID() != "MainStack");
    }

    public GetDrawStack(): CardStack {
        return this.stacks.find(e => e.GetID() == "MainStack");
    }

    constructor(maxValue: number, duplicateCount: number, materials: Map<number, Materials.MixMaterial>, scene: BABYLON.Scene, hl: BABYLON.HighlightLayer) {
        super();

        this.stacks = [];
        this.stacks.push(new CardStack(StackDirection.Undef, StackType.Pop, "MainStack"));
        
        let cards = []
        for (let d = 1; d <= duplicateCount; d++) {
            for (let v = 2; v < maxValue; v++) {
                let c = new Card(v, materials, scene, hl);
                c.GetMesh().name = "Card_" + v + "_" + d;
                cards.push(c);
            }
        }
        this.stacks[0].ForceSetCards(cards);

        let vals = [
            [1, StackDirection.Upwards],
            [1, StackDirection.Upwards], 
            [maxValue, StackDirection.Downwards], 
            [maxValue, StackDirection.Downwards]
        ];
        
        for (let i = 1; i <= 4; i++) {
            let s = new CardStack(vals[i-1][1], StackType.Push, "PushStack_" + i);
            let c = new Card(vals[i-1][0], materials, scene, hl);
            c.GetMesh().name = "Stack_Card_" + i;
            s.addCardLocal(c);
            this.stacks.push(s);
        }

        this.setPosition(new BABYLON.Vector3(0, 0, 0));
    }

    public GiveCardByNameTo(card_name: String, player: Player): void {
        this.GetDrawStack().GiveCardByNameTo(card_name, player);

        this.setPosition(this.position);
    }

    public drawCard(): Card {
        return super.drawCard("MainStack");
    }

    public setPosition(loc: BABYLON.Vector3): void {
        super.setPosition(loc);

        let distance = 0.01;
        let card_width = 1.0;

        // get the cards size
        let mainStack = this.GetDrawStack();
        if (mainStack.GetCardsCount() > 0) {
            card_width = mainStack.GetCards()[0].width * mainStack.GetCards()[0].size;
        } else {
            this.stacks.forEach(e => {
                if (e.GetCardsCount() > 0) {
                    card_width = e.GetCards()[0].width * e.GetCards()[0].size;
                }
            })
        }


        mainStack.setPosition(new BABYLON.Vector3(loc.x, distance + loc.y, loc.z));

        let positions = [ //X, Y
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

        let j  = 0;
        this.GetStacks().forEach(s => {
            s.setPosition(new BABYLON.Vector3(positions[j][0] * card_width + loc.x, distance + loc.y, positions[j][1] * card_width + loc.z));
            j++;
        });
    }
}

class TheGameGUI extends BaseGameGUI {
    protected EndRoundBtn: GUI.Button;
    protected GameStateText: GUI.TextBlock;
    protected CardsLeftText: GUI.TextBlock;
    public AVotingUI: VotingUI = null;
    public GameID: String;
    public Game: SVEGame;
    public OnNextRoundClick: () => void;

    constructor(scene: BABYLON.Scene) {
        super(scene);

        this.OnNextRoundClick = () => {};

        this.EndRoundBtn = GUI.Button.CreateSimpleButton("EndRoundBtn", "Runde Beenden");
        this.EndRoundBtn.width = "150px"
        this.EndRoundBtn.height = "40px";
        this.EndRoundBtn.disabledColor = "grey";
        this.EndRoundBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.EndRoundBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.EndRoundBtn.color = "white";
        this.EndRoundBtn.cornerRadius = 20;
        this.EndRoundBtn.background = "green";
        this.EndRoundBtn.onPointerUpObservable.add(this.OnEndLocalRound.bind(this));
    
        this.GameStateText = new GUI.TextBlock();
        this.GameStateText.fontSize = 70;

        this.CardsLeftText = new GUI.TextBlock();
        this.CardsLeftText.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.CardsLeftText.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.CardsLeftText.fontSize = 20;
        this.CardsLeftText.text = "Karten übrig: ?";
        this.CardsLeftText.color = "white";
        this.CardsLeftText.left = "-45%";
        this.CardsLeftText.top = "0%";
        this.GUI.addControl(this.CardsLeftText);
    }

    UpdateCardCounter(count: number): void {
        this.CardsLeftText.text = "Karten übrig: " + count;
    }

    public ShowGameState(gs: GameState): void {
        this.GameStateText.text = (gs == GameState.Won) ? "Gewonnen!" : "Verloren!";
        this.GameStateText.color = (gs == GameState.Won) ? "green" : "red";
        
        this.GUI.addControl(this.GameStateText);
    }

    public ShowVotePlayerStart(): void {
        var self = this;
        this.AVotingUI = new VotingUI(this.GUI, "Wer fängt an?", this.PlayerList.GetPlayersTexts(), this.Game, (val: String) => {
            self.AVotingUI.removeAll();

            VotingUI.onGameStartVoteResult = (res) => (self.Game as CardGame).setPlayerToStart(res);

            self.AVotingUI.postVote("vote", "PlayerStart", val, (this.Game as CardGame).GetLocalPlayer());

            self.AVotingUI = null;
        });
    }

    public HideGameState(): void {
        this.GUI.removeControl(this.GameStateText);
    }

    protected OnEndLocalRound(): void {
        this.OnNextRoundClick();
    }

    public ShowNextRoundBtn(): void {
        this.GUI.addControl(this.EndRoundBtn);
    }

    public SetEnabledNextRoundBtn(val: boolean): void {
        this.EndRoundBtn.isEnabled = val;
        this.EndRoundBtn.background = (val) ? "green" : "grey";
    }

    public HideNextRoundBtn(): void {
        this.GUI.removeControl(this.EndRoundBtn);
    }

    public onRequest(req: GameRequest) {
        VotingUI.onRequest(req);
    }
}

class TheGame extends CardGame { 
    public gameType = "TheGame";
    protected CardMaterails: Map<number, Materials.MixMaterial>;
    protected GUI: TheGameGUI;
    protected votesList: any[] = [];

    constructor (info: GameInfo) {
        super(info);
        this.maxPlayers = 6;
        this.gameType = "TheGame";
    }

    public CheckGameState(): GameState {
        // check for win conditions
        if(this.Deck.GetNumberOfCardsInDeck() == 0) {
            let won = true;
            for (let i = 0; i < this.players.length; i++) {
                won = won && (this.players[i].GetCardsCount() == 0);
            }
            if (won) {
                return GameState.Won;
            }
        }

        // check for lost conditions
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].GetPhase() != PlayerGamePhase.Spectating) {
                let diff = 2 - (this.players[i].GetMaxCardCount() - this.players[i].GetCardsCount());
                if (diff > 0) {
                    let playableCards = new Set<Card>();
                    this.players[i].GetCards().forEach(card => {
                        (<TheGameCardDeck>this.Deck).GetStacks().forEach(stack => {
                            if (stack.check(card)) {
                                // found playable card
                                playableCards.add(card);
                            }
                        });
                    });

                    if(playableCards.size < diff) {
                        return GameState.Lost;
                    }
                }
            }
        }

        // else state is Undetermined
        return GameState.Undetermined;
    }

    public StartLocalPlayersRound() {
        super.StartLocalPlayersRound();
        this.GUI.SetEnabledNextRoundBtn(false);
    }

    public StartGame(): void {
        if (this.IsHostInstance()) {
            let cardsCount = 8;
            if(this.players.length == 2) {
                cardsCount = 7;
            }

            if(this.players.length > 2) {
                cardsCount = 6;
            }

            this.SetInitialCardCount(cardsCount);
            // initialize all players
            this.players.forEach(p => {
                p.drawCards((<TheGameCardDeck>this.Deck).GetDrawStack());
                p.GetCards().forEach(c => c.reveal());
            });
        }

        super.StartGame();
    }

    public onStart() {
        super.onStart();
        this.GUI.ShowNextRoundBtn();
        this.GUI.SetEnabledNextRoundBtn(false);

        if (this.IsRunning())
            this.OnSelect(null, null);

        if (this.players.length == 1) {
            this.InvokeNextPlayerRound();
        }
        else {
            console.log("Bring up the player voting");
            this.ShowVotePlayerStartGUI();
        }
    }

    public ShowVotePlayerStartGUI() {
        console.log("Vote for the player to start.");
        this.votesList = [];
        this.GUI.Game = this;
        this.GUI.GameID = this.gameID;
        this.GUI.ShowVotePlayerStart();
    }

    public CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        super.CreateScene(engine, canvas);

        this.CardMaterails = new Map<number, Materials.MixMaterial>();

        for(let i = 1; i <= 100; i++)
            this.CreateMaterialForCard(i);
        
        this.Deck = new TheGameCardDeck(100, 1, this.CardMaterails, this.scene, this.highlightLayer);

        // GUI
        this.GUI = new TheGameGUI(this.scene);

        this.GUI.OnNextRoundClick = this.OnEndLocalRound.bind(this);

        return this.scene;
    }

    protected OnEndLocalRound() {
        if (this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
            super.OnEndLocalRound();

            this.GUI.SetEnabledNextRoundBtn(false);
            this.localPlayer.drawCards((<TheGameCardDeck>this.Deck).GetDrawStack());
            this.localPlayer.GetCards().forEach(c => c.reveal());
        } else {
            super.OnEndLocalRound();
        }
    }

    protected CreateMaterialForCard(nb: number): void {
        var newMat = new Materials.MixMaterial("", this.scene);
        var mixTexture = new BABYLON.DynamicTexture("",  {width:512, height:420}, this.scene, false);
        var cardTexture = new BABYLON.Texture("/images/cards/card_1.png", this.scene);
        var textTexture = new BABYLON.Texture("/images/cards/white.png", this.scene);
        

        let font = "bold 100px monospace";
        let tmpctx = mixTexture.getContext();
        tmpctx.font = font;
        let NumberWidth = tmpctx.measureText(String(nb)).width;
        
        mixTexture.drawText(String(nb), 256 + ((256 - NumberWidth) / 2.0), 190, font, "#00FF00BB", "#FF0000FF");

        newMat.mixTexture1 = mixTexture;
        newMat.mixTexture2 = null;
        newMat.specularColor = new BABYLON.Color3(1,1,1);
        newMat.diffuseColor = new BABYLON.Color3(1,1,1);

        newMat.diffuseTexture1 = cardTexture;
        newMat.diffuseTexture2 = textTexture;
        newMat.diffuseTexture3 = mixTexture;
        newMat.diffuseTexture4 = mixTexture;
        
        this.CardMaterails.set(nb, newMat);
    }

    public Tick(): void {
        
    }

    public onJoined(id: SVEAccount): void {
        super.onJoined(id);

        if(id.getName() == this.localUser!.getName()) {
            this.localPlayer.SetOrigin(new BABYLON.Vector3(0, 1, -5.5));
        }

        this.Deck.Game = this;
        this.GUI.GameID = this.gameID;
        this.GUI.Game = this;
    }

    public onRequest(req: GameRequest) {
        super.onRequest(req);

        this.GUI.onRequest(req);
    }

    protected onPlayersRoundBegin(player: Player) {
        super.onPlayersRoundBegin(player);
        this.GUI.PlayerList.SetPlayerActive(player);
        this.GUI.UpdateCardCounter(this.Deck.GetNumberOfCardsInDeck());
        if(player.getName() == this.localPlayer.getName()) {
            this.GUI.RememberItsYourTurn();
        }
    }

    protected OnGameStateChange(gameState: GameState) {
        super.OnGameStateChange(gameState);
        if (gameState != GameState.Undetermined) {
            this.GUI.ShowGameState(gameState); 

            this.localPlayer.Game = this;
            this.localPlayer.SetGameState(gameState);

            this.EndGame();
        }
    }

    public OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo) {
        super.OnSelect(evt, pickInfo);

        if (this.localPlayer == null)
            return;

        if (pickInfo != null && this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
            let stack = this.Deck.GetStackFromPick(pickInfo);
            if (stack != null) {
            {
                stack.Game = this;
                stack.PlayCardOnStack(this.localPlayer);
            }
            }
        }

        if(this.localPlayer.GetMaxCardCount() - this.localPlayer.GetCardsCount() >= 2) {
            this.GUI.SetEnabledNextRoundBtn(true);
        }

        this.SetGameState(this.CheckGameState());
    }

    public MinPlayers(): number {
        return 1;
    }
}

export { TheGame };