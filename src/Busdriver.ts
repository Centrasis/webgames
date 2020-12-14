import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import * as GUI from 'babylonjs-gui';
import { BaseGameGUI, PlayerGamePhase, CardGame, CardStack, StackDirection, StackType, Card, Player, PlayerListUI, VotingUI, BaseCardDeck} from './CardGame';
import {SVEGame} from './BaseGame';
import { SVEAccount, TargetType, GameState, GameRequest, SetDataRequest } from 'svebaselib';

enum CardType {
    Number = "Number",
    Jack = "Jack",
    Queen = "Queen",
    King = "King",
    Ass = "Ass"
}

enum CardColor {
    Check = "Karo",
    Heart = "Herz",
    Spades = "Piek",
    Cross = "Kreuz"
}

class SkatHelper {
    public static scene: BABYLON.Scene;

    static CreateMaterialForCard(nb: number, cardType: CardType, cardColor: CardColor): BABYLON.Material {
        var newMat = new Materials.MixMaterial("", this.scene);
        var mixTexture = new BABYLON.DynamicTexture("",  {width:512, height:420}, this.scene, false);
        var cardTexture: BABYLON.Texture = null;

        
        cardTexture = new BABYLON.Texture("/images/cards/card_skat_" + cardColor.toString() + ".png", this.scene);
        
        var textTexture: BABYLON.Texture = null;
        if (cardColor == CardColor.Check || cardColor == CardColor.Heart) {
            textTexture = new BABYLON.Texture("/images/cards/red.png", this.scene);
        } else {
            textTexture = new BABYLON.Texture("/images/cards/black.png", this.scene);
        }
        
        

        let font = "bold 100px monospace";
        let tmpctx = mixTexture.getContext();
        tmpctx.font = font;
        let NumberWidth = tmpctx.measureText(String(nb)).width;
        
        
        let symbol = "";
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
        newMat.specularColor = new BABYLON.Color3(1,1,1);
        newMat.diffuseColor  = new BABYLON.Color3(1,1,1);

        newMat.diffuseTexture1 = cardTexture;
        newMat.diffuseTexture2 = textTexture;
        newMat.diffuseTexture3 = mixTexture;
        newMat.diffuseTexture4 = mixTexture;
        
        return newMat;
    }
}

class SkatCard extends Card {
    protected type: CardType;
    protected color: CardColor;

    constructor(value: number, type: CardType, color: CardColor, effect: () => void, scene: BABYLON.Scene, hl: BABYLON.HighlightLayer) {
        super(value, null, scene, hl);

        this.bIsRevealed = false;
        this.type = type;
        this.color = color;
        this.mesh.material = SkatHelper.CreateMaterialForCard(value, type, color);

        this.effect = effect;
    }

    public GetColor(): CardColor {
        return this.color;
    }

    public GetType(): CardType {
        return this.type;
    }

    public uplift(camera: BABYLON.FreeCamera): void {
        super.uplift(camera);
        this.bIsRevealed = true;
    }

    public reveal(): void {
        super.reveal();
        this.bIsRevealed = true;
    }
}

class SkatStack extends CardStack {
    public check(card: Card): Boolean {
        if (this.type === StackType.Pop) {
            return false;
        }

        if(this.Cards.length == 0)
            return true;

        console.log("Check against card: " + this.Cards[this.Cards.length - 1].GetMesh().name);

        return ((this.Cards[this.Cards.length - 1].GetValue() < card.GetValue()    // if value of the new card is higher
                 && ((<SkatCard>this.Cards[this.Cards.length - 1]).GetColor() == (<SkatCard>card).GetColor()))); // and the color is identical
    }
}

class PyramidStack extends CardStack {
    protected activeCard: SkatCard;
    protected activeCardIdx: number;
    protected settingUp = true;
    protected layedCards: Map<Card, Card[]>;

    constructor(dir: StackDirection, type: StackType, id: String) {
        super(dir, type, id);
        this.activeCard = null;
        this.layedCards = new Map<Card, Card[]>();
        this.activeCardIdx = -1;
    }

    public check(card: Card): Boolean {
        if (this.activeCard == null)
            return false;

        return this.activeCard.GetValue() == card.GetValue();
    }

    public GetCard(pick: BABYLON.PickingInfo): Card {
        console.log("Check pyramid stack");
        let ret = null;
        for(let j = this.Cards.length - 1; j >= 0; j--) {
            if (pick.pickedMesh.name == this.Cards[j].GetMesh().name) {
                ret = this.Cards[j];
                break;
            } else {                
                let cards = this.layedCards.get(this.Cards[j]);
                if(cards != null) {
                    ret = cards.find(c => c.GetMesh.name == pick.pickedMesh.name);
                    if (ret != null) {
                        break;
                    }
                }
            }
        }
        return ret;
    }

    public setPosition(loc: BABYLON.Vector3): void {
        this.position = loc;
        let row = 1;
        let col = 0;
        for (let i = 0; i < this.Cards.length; i++) {
            if(col >= row) {
                row++;
                col = 0;
            }
            col++;

            let rowWidth  = this.Cards[i].width * this.Cards[i].size * (5/4) * row;
            let rowHeight = this.Cards[i].size * (5/4);
            let newLoc = new BABYLON.Vector3(
                (loc.x - rowWidth / 2.0) + (col - 1) * this.Cards[i].width * this.Cards[i].size * (5/4),
                this.card_distance, 
                loc.z + (row - 1) * rowHeight);

            this.Cards[i].setPosition(newLoc);
            let cards = this.layedCards.get(this.Cards[i]);
            if(cards != null) {
                for(let j=0; j < cards.length; j++) {
                    cards[j].setPosition(newLoc.add(new BABYLON.Vector3(0.0, this.card_distance * (j+2), 0.0)));
                }
            }
        }
    }

    public revealNextCard(): Boolean {
        this.activeCardIdx++;
        if(this.activeCardIdx >= this.Cards.length)
            return false;

        this.activeCard = <SkatCard>this.Cards[this.activeCardIdx];
        this.activeCard.reveal();
        return true;
    }

    public finishSetup(): void {
        this.settingUp = false;
    }

    public SettingUp(): void {
        this.settingUp = true;
    }

    public CheckIfCardBelongsToStackOf(stackCard: Card, pick: BABYLON.PickingInfo): boolean {
        let cs = this.layedCards.get(stackCard);
        if(cs != null) {
            return cs.find(c => c.GetMesh().name == pick.pickedMesh.name) != null;
        } else {
            return false;
        }
    }

    /** Does replicate */
    public addCard(card: Card, previousOwner: Player, shouldReveal: Boolean = true): void {
        if(this.settingUp) {
            super.addCard(card, previousOwner, false);
        } else {
            let cards = this.layedCards.get(this.activeCard);
            if(cards == null)
                cards = [];
            cards.push(card);
            this.layedCards.set(this.activeCard, cards);

            if(previousOwner != null) {
                (<BusdriverPlayer>previousOwner).SetPoints((<BusdriverPlayer>previousOwner).Points + 1);
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
    }
}

class BusdriverCardDeck extends BaseCardDeck {

    public GetNumberOfCardsInDeck(): number {
        return this.GetDrawStack().GetCardsCount();
    }

    public GetStacks(): SkatStack[] {
        return this.stacks.filter(e => e.GetID() != "MainStack");
    }

    public GetDrawStack(): SkatStack {
        return this.stacks.find(e => e.GetID() == "MainStack");
    }

    public GetPyramidStack(): PyramidStack {
        return <PyramidStack>this.stacks.find(e => e.GetID() == "Pyramid");
    }

    public BuildPyramid(): void {
        let cardsInRow = 1;
        let cardsCount = this.GetDrawStack().GetCardsCount();
        let cardsPlayed = 0;
        let pyramidStack = this.GetPyramidStack();
        pyramidStack.SettingUp();
        pyramidStack.Game = this.Game;
        let drawStack = this.GetDrawStack();
        while(cardsCount - cardsPlayed >= cardsInRow) {
            for (let i = 0; i < cardsInRow; i++) {
                cardsPlayed++;
                pyramidStack.addCard(drawStack.DrawCard(), null, false);
            }
            cardsInRow++;
        }
    }

    constructor(effects: Map<CardType, () => void>, scene: BABYLON.Scene, hl: BABYLON.HighlightLayer) {
        super();

        this.stacks = [];
        this.stacks.push(new SkatStack(StackDirection.Undef, StackType.Pop, "MainStack"));
        this.stacks.push(new SkatStack(StackDirection.Undef, StackType.Push, "PushStack"));
        this.stacks.push(new PyramidStack(StackDirection.Undef, StackType.Push, "Pyramid"));
        
        let cards: Card[] = [];
        let cards_name: Set<string> = new Set<string>();

        let color_list = [  CardColor.Check,
                            CardColor.Cross,
                            CardColor.Heart,
                            CardColor.Spades ];

        color_list.forEach(color => {

            let types_list = [  CardType.Ass, 
                                CardType.Jack, 
                                CardType.Queen,
                                CardType.King,
                                CardType.Number];

            types_list.forEach(type => {
                let type_val = 0;

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
                    for (let v = 7; v <= 10; v++) {
                        let c = new SkatCard(v, type, color, effects.get(type), scene, hl);
                        c.GetMesh().name = "Card_" + v + "_" + type.toString() + "_" + color.toString();
                        let count = 1;
                        while(cards_name.has(c.GetMesh().name + count)) {
                            count++;
                        }
                        c.GetMesh().name = c.GetMesh().name + count;
                        cards_name.add(c.GetMesh().name);
                        cards.push(c);
                    }
                }
                else {
                    // image cards
                    let c = new SkatCard(type_val, type, color, effects.get(type), scene, hl);
                    c.GetMesh().name = "Card_" + type_val + "_" + type.toString() + "_" + color.toString();
                    let count = 1;
                    while(cards_name.has(c.GetMesh().name + count)) {
                        count++;
                    }
                    c.GetMesh().name = c.GetMesh().name + count;
                    cards_name.add(c.GetMesh().name);
                    cards.push(c);
                }
            });
        });

        console.log("Setted up stack with: " + cards.length + " cards! (diffrent names: " + cards_name.size + ")");

        this.stacks[0].ForceSetCards(cards);

        this.setPosition(new BABYLON.Vector3(0, 0, 0));
    }

    /** Does not replicate */
    public PlayCardFromDeckOnStack(id: String, card_name: String, shouldReveal: Boolean = true) {
        let card: Card = null;
        
        this.stacks.forEach(element => {
            let c: Card = element.GetCards().find(c => { return c.GetMesh().name == card_name;});
            if(c != null) {
                card = c;
            }
        });

        let target: CardStack = this.stacks.find(s => { return s.GetID() == id;});
        target.addCardLocal(card, shouldReveal);
        
        this.setPosition(this.position);
    }

    public revealFirstCard() {
        this.stacks[1].Game = this.Game;
        this.stacks[1].addCard(this.stacks[0].DrawCard(), null);

        this.setPosition(this.position);
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

        loc = new BABYLON.Vector3(loc.x + 3, loc.y, loc.z);

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


        mainStack.setPosition(new BABYLON.Vector3(loc.x + 3, distance + loc.y, loc.z));

        let positions = [ //X, Y
            [
                -2.5,
                0.0
            ],
            [
                -4.0,
                -2.0
            ]
        ];

        let j  = 0;
        this.GetStacks().forEach(s => {
            s.setPosition(new BABYLON.Vector3(positions[j][0] * card_width + loc.x, distance + loc.y, positions[j][1] * card_width + loc.z));
            j++;
        });
    }
}

class BusdriverPlayer extends Player {
    public Points: number;

    constructor(user: SVEAccount, maxCardCount: number, isLocal: Boolean) {
        super(user, maxCardCount, isLocal);
        this.Points = 0;
    }

    /** Replicates */
    public SetPoints(pts: number): void {
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
    }

    public GetPoints(): number {
        return this.Points;
    }
}

class Challenge {
    public CardValue: number;
    public ChallengeText: string;
    public name: string;
    public Answers: string[];
}

class BusdriverGUI extends BaseGameGUI {
    protected GameStateText: GUI.TextBlock;
    public AVotingUI: VotingUI;
    public GameID: String;
    public Game: SVEGame;
    protected EndRoundBtn: GUI.Button;
    public OnEndRoundClick: () => void;

    constructor(scene: BABYLON.Scene) {
        super(scene);
    
        this.GameStateText = new GUI.TextBlock();
        this.GameStateText.fontSize = 70;

        this.PlayerList.GetTextOfPlayerLine = this.GetTextLine.bind(this);

        this.OnEndRoundClick = () => {};
        this.EndRoundBtn = GUI.Button.CreateSimpleButton("EndRoundBtn", "Runde Beenden");
        this.EndRoundBtn.width = "150px"
        this.EndRoundBtn.height = "40px";
        this.EndRoundBtn.disabledColor = "grey";
        this.EndRoundBtn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.EndRoundBtn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.EndRoundBtn.color = "white";
        this.EndRoundBtn.cornerRadius = 20;
        this.EndRoundBtn.background = "green";
        this.EndRoundBtn.onPointerUpObservable.add(this.OnClickedEndRound.bind(this));
        
        this.GUI.addControl(this.EndRoundBtn);
    }

    public SetEnabledNextRoundBtn(val: boolean): void {
        this.EndRoundBtn.isEnabled = val;
        this.EndRoundBtn.background = (val) ? "green" : "grey";
    }

    protected OnClickedEndRound(): void {
        this.OnEndRoundClick();
    }

    public AnnounceBusdriver() {
        this.GameStateText.text = "Du bist Busfahrer!";
        this.GameStateText.color = "red";
        
        this.GUI.addControl(this.GameStateText);
        var self = this;
        setTimeout(() => {
            self.GUI.removeControl(self.GameStateText);
        }, 5000);
    }

    public GetTextLine(player: Player): string {
        return player.GetID().toString() + ", Punkte: " + (<BusdriverPlayer>player).GetPoints();
    }

    public ShowGameState(gs: GameState): void {
        this.GameStateText.text = (gs == GameState.Won) ? "Gewonnen!" : "Verloren!";
        this.GameStateText.color = (gs == GameState.Won) ? "green" : "red";
        
        this.GUI.addControl(this.GameStateText);
    }

    public ShowChallenge(bd: Busdriver, challenge: Challenge): void {
        var self = this;
        if (challenge == null) {
            bd.OnEndLocalRound();
            return;
        }
        this.AVotingUI = new VotingUI(this.GUI, challenge.ChallengeText, challenge.Answers, (val: String) => {
            self.AVotingUI.removeAll();

            self.Game.sendGameRequest({
                action: { 
                    field: "!vote",
                    value: {
                        voteType: "SelfOnly",
                        voteID: String(challenge.name),
                        value: val
                    }
                },
                invoker: String(bd.GetLocalPlayerID())
            });

            self.AVotingUI = null;
            bd.OnEndLocalRound();
        });
    }

    public HideGameState(): void {
        this.GUI.removeControl(this.GameStateText);
    }
}

enum RoundType {
    GuessColor = 0,
    GuessHigherOrLower,
    GuessInside,
    GuessHadColor,
    Busdriver,
    Suspend,
    PlayingPyramid
}

enum BusdriverState {
    Selecting,
    Pyramid,
    Driving
}

class Busdriver extends CardGame { 
    public gameType = "Busdriver";
    protected isSetup = false;
    protected isBusdriver = false;
    protected CurrentRound = RoundType.GuessColor;
    protected CurrentState = BusdriverState.Selecting;
    protected GUI: BusdriverGUI;

    public CheckGameState(): GameState {
        if(this.isSetup) {
            // check for win conditions
            let ret = true;
            this.players.forEach(p => {
                ret = ret && p.GetGameState() == GameState.Won;
            });
            if(ret) {
                return GameState.Won; 
            }
        }

        // else state is Undetermined
        return GameState.Undetermined;
    }

    protected GetChallengeFromType(type: RoundType): Challenge {
        switch (type) {
            case RoundType.GuessColor:
                return <Challenge>{
                    name: "GuessColor",
                    ChallengeText: "Karten Farbe?",
                    Answers: [
                        "Rot",
                        "Schwarz"
                    ]
                };

            case RoundType.GuessHigherOrLower:
                return <Challenge>{
                    name: "GuessHigherOrLower",
                    ChallengeText: "Höher oder Tiefer?",
                    Answers: [
                        "Höher",
                        "Tiefer"
                    ]
                };

            case RoundType.GuessInside:
                return <Challenge>{
                    name: "GuessInside",
                    ChallengeText: "Innerhalb oder Außerhalb?",
                    Answers: [
                        "Innerhalb",
                        "Außerhalb"
                    ]
                };

            case RoundType.GuessHadColor:
                return <Challenge>{
                    name: "GuessHadColor",
                    ChallengeText: "Farbe bereits auf der Hand?",
                    Answers: [
                        "Ja",
                        "Nein"
                    ]
                };

            case RoundType.Busdriver:
                let names: string[];
                this.players.forEach(p => {
                    if(p.GetID() != this.localPlayer.GetID())
                    {
                        names.push(p.GetID().toString())
                    }
                });
                return <Challenge>{
                    name: "Busdriver",
                    ChallengeText: "Beifahrer wählen:",
                    Answers: names
                };
        }

        return null;
    }

    public StartLocalPlayersRound() {
        if (this.CurrentRound == RoundType.Suspend) {
            if(this.CurrentState == BusdriverState.Pyramid) {
                if (this.IsHostInstance()) {
                    this.players.forEach(p => {
                        this.NotifyPlayer(p, "SwitchToDriving!");
                    });
                    let busdriver: BusdriverPlayer = null;
                    for(let i = 0; i < this.players.length; i++) {
                        if(busdriver == null) {
                            busdriver = <BusdriverPlayer>this.players[i];
                        }
                        else {
                            if (busdriver.Points > (<BusdriverPlayer>this.players[i]).Points)
                            {
                                busdriver = <BusdriverPlayer>this.players[i];
                            }
                        }
                    }
                    this.NotifyPlayer(busdriver, "busdriver!");
                }
            } else {
                if (this.CurrentState == BusdriverState.Selecting) {
                    this.GUI.SetEnabledNextRoundBtn(false);
                    if (this.IsHostInstance()) {
                        console.log("Start Pyramid");
                        this.players.forEach(p => {
                            this.NotifyPlayer(p, "SwitchToPyramid!");
                        });

                        setTimeout(() => {
                            (<BusdriverCardDeck>this.Deck).Game = this;
                            (<BusdriverCardDeck>this.Deck).BuildPyramid();
                        }, 1000);

                        setTimeout(() => {
                            this.players.forEach(p => {
                                this.NotifyPlayer(p, "!RevealNext");
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
            super.StartLocalPlayersRound();
            if (this.CurrentState == BusdriverState.Pyramid) {
                this.GUI.SetEnabledNextRoundBtn(true);
                if (this.IsHostInstance()) {
                    this.players.forEach(p => {
                        this.NotifyPlayer(p, "!RevealNext");
                    });
                }
            } else {
                this.GUI.SetEnabledNextRoundBtn(false);
                this.GUI.ShowChallenge(this, this.GetChallengeFromType(this.CurrentRound));
            }
        }
    }

    public OnEndLocalRound() {
        this.localPlayer.update();
        super.OnEndLocalRound();
    }

    public StartGame(): void {
        this.enableZMovement = true;
        if (this.IsHostInstance()) {
            this.Deck.Game = this;

            this.SetInitialCardCount(0);
            this.players.forEach(p => {
                p.Game = this;
            });
        }

        super.StartGame();

        if (this.IsHostInstance()) {
            this.sendGameRequest({
                action: {
                    field: "!setTurn",
                    value: this.players[Math.round(Math.random() * (this.players.length - 1))].GetID(),
                },
                invoker: String(this.GetLocalPlayerID())
            });
        }
    }

    public CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        super.CreateScene(engine, canvas);

        var self = this;

        SkatHelper.scene = this.scene;

        let effectMap = new Map<CardType, () => void>();
        effectMap.set(CardType.Ass, () => {
            
        });
        effectMap.set(CardType.Jack, () => {
            
        });
        effectMap.set(CardType.King, () => {
            
        });
        effectMap.set(CardType.Queen, () => {
            
        });
        effectMap.set(CardType.Number, () => {
            
        });

        this.Deck = new BusdriverCardDeck(effectMap, this.scene, this.highlightLayer);

        // GUI
        this.GUI = new BusdriverGUI(this.scene);
        
        this.GUI.OnEndRoundClick = () => {
            self.OnEndLocalRound();
        };

        this.GUI.SetEnabledNextRoundBtn(false);

        return this.scene;
    }

    public Tick(): void {
        
    }

    public onJoined(user: SVEAccount): void {
        super.onJoined(user);

        let isLocal = user.getName() === this.localUser.getName();
        if (isLocal) {
            console.log("On add new local player: " + user.getName());
        } else {
            console.log("On add new remote player: " + user.getName());
        }
        let player = new BusdriverPlayer(user, 0, isLocal);

        this.GUI.PlayerList.AddPlayer(player);

        if (isLocal) {
            this.localPlayer = player;
            this.localPlayer.camera = this.camera;
            this.localPlayer.Game = this;
        }
        this.players.push(player);

        player.Game = this;

        this.OnNewPlayer();

        if(isLocal) {
            this.localPlayer.SetOrigin(new BABYLON.Vector3(0, 1, -5.5));
        }

        this.Deck.Game = this;
        this.GUI.Game = this;
    }

    public GetLocalPlayerID(): String {
        return this.localPlayer.GetID();    
    }

    public onRequest(result: GameRequest): void {
        super.onRequest(result);

        if (this.CurrentState == BusdriverState.Selecting || this.CurrentState == BusdriverState.Driving) {
            if (typeof result.action !== "string") {
                if (result.action.field == "vote" && result.invoker == this.localPlayer.GetID()) {
                    console.log("Got vote: " + JSON.stringify(result));
                    let card = <SkatCard>(<BusdriverCardDeck>this.Deck).GetDrawStack().DrawCard();
                    this.localPlayer.AddCard(card);
                    if (result.action.value.voteID == "GuessColor") {
                        console.log("Got voting result for GuessColor: " + result.action.value.value);
                        
                        if (result.invoker == this.localPlayer.GetID()) {
                            if (result.action.value.value == "Rot") {
                                if(card.GetColor() == CardColor.Check || card.GetColor() == CardColor.Heart) {
                                    this.CurrentRound = RoundType.GuessHigherOrLower;
                                    (<BusdriverPlayer>this.localPlayer).SetPoints((<BusdriverPlayer>this.localPlayer).Points + 1);
                                } else {
                                    if (this.isBusdriver) {
                                        this.CurrentRound = RoundType.GuessColor;
                                        this.localPlayer.dropCards();
                                    }
                                }
                                
                            } else {
                                if(card.GetColor() == CardColor.Cross || card.GetColor() == CardColor.Spades) {
                                    this.CurrentRound = RoundType.GuessHigherOrLower;
                                    (<BusdriverPlayer>this.localPlayer).SetPoints((<BusdriverPlayer>this.localPlayer).Points + 1);
                                } else {
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
                            if(card.GetValue() < this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()) {
                                this.CurrentRound = RoundType.GuessInside;
                                (<BusdriverPlayer>this.localPlayer).SetPoints((<BusdriverPlayer>this.localPlayer).Points + 1);
                            } else {
                                if (this.isBusdriver) {
                                    this.CurrentRound = RoundType.GuessColor;
                                    this.localPlayer.dropCards();
                                }
                            }
                        } else {
                            if(card.GetValue() > this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()) {
                                this.CurrentRound = RoundType.GuessInside;
                                (<BusdriverPlayer>this.localPlayer).SetPoints((<BusdriverPlayer>this.localPlayer).Points + 1);
                            } else {
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
                            if((card.GetValue() > this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()
                            && card.GetValue() < this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 3].GetValue())
                            || (card.GetValue() < this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()
                            && card.GetValue() > this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 3].GetValue())) {
                                this.CurrentRound = RoundType.GuessHadColor;
                                (<BusdriverPlayer>this.localPlayer).SetPoints((<BusdriverPlayer>this.localPlayer).Points + 1);
                            } else {
                                if (this.isBusdriver) {
                                    this.CurrentRound = RoundType.GuessColor;
                                    this.localPlayer.dropCards();
                                }
                            }
                        } else {
                            if(!((card.GetValue() > this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()
                            && card.GetValue() < this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 3].GetValue())
                            || (card.GetValue() < this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()
                            && card.GetValue() > this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 3].GetValue()))
                            && card.GetValue() != this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 3].GetValue()
                            && card.GetValue() != this.localPlayer.GetCards()[this.localPlayer.GetCards().length - 2].GetValue()) {
                                this.CurrentRound = RoundType.GuessHadColor;
                                (<BusdriverPlayer>this.localPlayer).SetPoints((<BusdriverPlayer>this.localPlayer).Points + 1);
                            } else {
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
                            
                        let hasColor = false;
                        this.localPlayer.GetCards().forEach(c => {
                            if (c.GetMesh().name != card.GetMesh().name)
                                hasColor = hasColor || (<SkatCard>c).GetColor() == card.GetColor();
                        });
                        
                        if (result.action.value.value == "Ja") {
                            if(hasColor) {
                                this.CurrentRound = RoundType.Suspend;
                                (<BusdriverPlayer>this.localPlayer).SetPoints((<BusdriverPlayer>this.localPlayer).Points + 1);
                            } else {
                                if (this.isBusdriver) {
                                    this.CurrentRound = RoundType.GuessColor;
                                    this.localPlayer.dropCards();
                                }
                            }
                        } else {
                            if(!hasColor) {
                                this.CurrentRound = RoundType.Suspend;
                                (<BusdriverPlayer>this.localPlayer).SetPoints((<BusdriverPlayer>this.localPlayer).Points + 1);
                            } else {
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
                this.players.forEach(p => {
                    if(p.getName() == result.target.id) {
                        if ((result.action as SetDataRequest).value.field == "points")
                            (<BusdriverPlayer>p).Points = (result.action as SetDataRequest).value.field;
                        this.GUI.PlayerList.UpdatePlayer(p);
                    }
                });

                return;
            }
        }

        console.log("Unknown response:" + JSON.stringify(result));
    }

    protected onPlayersRoundBegin(player: Player) {
        super.onPlayersRoundBegin(player);
        this.GUI.PlayerList.SetPlayerActive(player);
    }

    protected OnGameStateChange(gameState) {
        super.OnGameStateChange(gameState);
        if (gameState != GameState.Undetermined) {
            this.GUI.ShowGameState(gameState); 

            this.localPlayer.Game = this;
            this.localPlayer.SetGameState(gameState);

            this.EndGame();
        }
    }

    protected onNotify(notification: string, invoker: Player, target?: Player) {
        super.onNotify(notification, invoker, target);
        if (notification == "busdriver!" && target !== undefined && this.localUser!.getName() === target.getName()) {
            this.isBusdriver = true;
            this.GUI.AnnounceBusdriver();
            this.CurrentRound = RoundType.GuessColor;
        }
        if(notification == "SwitchToDriving!") {
            this.CurrentState = BusdriverState.Driving;
            this.GUI.SetEnabledNextRoundBtn(false);
        }
        if(notification == "SwitchToPyramid!") {
            this.CurrentState = BusdriverState.Pyramid;
            this.CurrentRound = RoundType.PlayingPyramid;
            this.GUI.SetEnabledNextRoundBtn(true);
        }

        if(notification == "!RevealNext") {
            (<BusdriverCardDeck>this.Deck).GetPyramidStack().finishSetup();
            if(!(<BusdriverCardDeck>this.Deck).GetPyramidStack().revealNextCard()) {
                this.CurrentRound = RoundType.Suspend;
            }
        }
    }

    public OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo) {
        super.OnSelect(evt, pickInfo);

        if (this.localPlayer == null)
            return;

        if (this.CurrentState == BusdriverState.Pyramid) {
            if (this.localPlayer.GetSelectedCard() != null) {
                if(pickInfo != null && this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
                    let stack = this.Deck.GetStackFromPick(pickInfo);
                    if (stack !== undefined && stack != null) {
                        if (stack.GetID() == (<BusdriverCardDeck>this.Deck).GetPyramidStack().GetID()) {
                            stack.Game = this;
                            stack.PlayCardOnStack(this.localPlayer);
                        }
                    }
                }
            }
        }
    }

    public MinPlayers(): number {
        return 2;
    }

    public MaxPlayers(): number {
        return 6;
    }
}

export { Busdriver };