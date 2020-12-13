import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import * as GUI from 'babylonjs-gui';
import { BaseGameGUI, PlayerGamePhase, CardGame, CardStack, StackDirection, StackType, Card, Player, PlayerListUI, VotingUI, BaseCardDeck} from './CardGame';
import { MixMaterial } from 'babylonjs-materials';
import {GameInfo, GameRequest, GameState, SVEAccount, SVEGame, TargetType} from 'svebaselib';

enum CardType {
    Number = "Number",
    Fool = "Fool",
    Wizard = "Wizard"
}

enum CardColor {
    Red = "Red",
    Green = "Green",
    Yellow = "Yellow",
    Blue = "Blue"
}

class WizardHelper {
    public static scene: BABYLON.Scene;

    static CardColor2BABYLON(ct: CardColor): BABYLON.Color3 {
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
    }

    static CreateMaterialForCard(nb: number, cardType: CardType): BABYLON.Material {
        var newMat = new Materials.MixMaterial("", this.scene);
        var mixTexture = new BABYLON.DynamicTexture("",  {width:512, height:420}, this.scene, false);
        var cardTexture: BABYLON.Texture = null;

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
        

        let font = "bold 100px monospace";
        let tmpctx = mixTexture.getContext();
        tmpctx.font = font;
        let NumberWidth = tmpctx.measureText(String(nb)).width;
        
        if (cardType == CardType.Number) {
            mixTexture.drawText(String(nb), 256 + ((256 - NumberWidth) / 2.0), 250, font, "#00FF00BB", "#FF0000FF");
        } else {
            mixTexture.drawText("", 256 + ((256 - NumberWidth) / 2.0), 250, font, "#00FF00BB", "#FF0000FF");
        }

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

class WizardCard extends Card {
    protected type: CardType;
    protected color: CardColor;

    constructor(value: number, type: CardType, color: CardColor, scene: BABYLON.Scene, hl: BABYLON.HighlightLayer) {
        super(value, null, scene, hl);

        this.bIsRevealed = false;
        this.type = type;
        this.color = color;
        this.mesh.material = WizardHelper.CreateMaterialForCard(value, type);
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
        this.applyColor();
    }

    public reveal(): void {
        super.reveal();
        this.bIsRevealed = true;
        this.applyColor();
    }

    public cover(): void {
        super.cover();
        this.bIsRevealed = false;
        (<MixMaterial>this.mesh.material).diffuseColor = BABYLON.Color3.White();
    }

    protected applyColor(): void {
        (<MixMaterial>this.mesh.material).diffuseColor = WizardHelper.CardColor2BABYLON(this.color);
    }
}

class WizardPlayer extends Player {
    public Points: number;
    public RoundPoints: number;
    public TargetPoints: number; //target to reach
    protected bFirstRound = false;
    protected playerNamePanel: BABYLON.Mesh;
    protected nameTexture: GUI.AdvancedDynamicTexture;

    constructor(user: SVEAccount, maxCardCount: number, isLocal: Boolean, scene: BABYLON.Scene) {
        super(user, maxCardCount, isLocal);
        this.Points = 0;
        this.RoundPoints = 0;
        this.TargetPoints = -1;
        this.playerNamePanel = BABYLON.Mesh.CreatePlane("", 4, scene);
        this.playerNamePanel.setEnabled(false);
        this.bFirstRound = false;
        this.nameTexture = GUI.AdvancedDynamicTexture.CreateForMesh(this.playerNamePanel);

        let text = new GUI.TextBlock();
        text.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        text.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        text.fontSize = 40;
        text.color = "orange";
        text.text = user.getName();

        this.nameTexture.addControl(text);
    }

    /** Replicates */
    protected SetPoints(pts: number): void {
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

    public IsFirstRound(val: boolean, idx: number, camera: BABYLON.FreeCamera): void {
        if (this.bFirstRound == val)
            return;

        this.bFirstRound = val;
        this.GetCards()[0].GetMesh().setEnabled(((val) ? !this.IsLocalPlayer().valueOf() : this.IsLocalPlayer().valueOf()));
        this.GetCards()[0].GetMesh().isPickable = (val) ? false : this.IsLocalPlayer().valueOf();
        this.playerNamePanel.parent = (val) ? this.GetCards()[0].GetMesh() : null;
        this.playerNamePanel.setEnabled(((val) ? !this.IsLocalPlayer().valueOf() : false));

        let loc = new BABYLON.Vector3(-6 + 2*idx, 3, -4.5);
        this.GetCards()[0].setPosition(loc);
        this.playerNamePanel.position = new BABYLON.Vector3(0, 0.2, 1);

        this.GetCards()[0].uplift(camera);
    }

    /** Replicates */
    public EvaluateRound(): void {
        let pts = this.Points;
        if (this.RoundPoints == this.TargetPoints) {
            pts++;
        }
        this.SetPoints(pts);
        this.RoundPoints = 0;
        this.TargetPoints = -1;
    }

    /** Replicates */
    public SetTargetPoints(pts: number) {
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
    }

    /** Replicates */
    public SetRoundPoints(pts: number): void {
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
    }

    public GetPoints(): number {
        return this.Points;
    }

    public GetRoundPoints(): number {
        return this.RoundPoints;
    }

    public GetTargetPoints(): number {
        return this.TargetPoints;
    }
}

class WizardStack extends CardStack {
    protected playerOwnership: Player[];

    constructor(dir: StackDirection, type: StackType, id: String) {
        super(dir, type, id);
        this.playerOwnership = [];
    }

    public check(card: Card): Boolean {
        if (this.type === StackType.Pop) {
            return false;
        }

        return true;
    }

    public addCard(card: Card, previousOwner: Player, shouldReveal: Boolean = true): void {
        super.addCard(card, previousOwner, shouldReveal);
        if (previousOwner != null)
            this.playerOwnership.push(previousOwner);
    }

    public Clear() {
        this.playerOwnership = [];
        this.Cards = [];
        this.setPosition(this.position);
    }

    public GetWinnerFromTrump(trump: CardColor): Player {
        let highVal = 0;
        let player: Player = null;

        for(let i = 0; i < this.Cards.length; i++) {
            if ((<WizardCard>this.Cards[i]).GetType() == CardType.Wizard) {
                highVal = 100;
                player = this.playerOwnership[i];
                break;
            }

            if(this.Cards[i].GetValue() > highVal && (<WizardCard>this.Cards[i]).GetColor() == trump) {
                player = this.playerOwnership[i];
                highVal = this.Cards[i].GetValue();
            }
        }

        if (highVal == 0) {
            for(let i = 0; i < this.Cards.length; i++) {
                if(this.Cards[i].GetValue() > highVal) {
                    player = this.playerOwnership[i];
                    highVal = this.Cards[i].GetValue();
                }
            }
        }

        return player;
    }
}

class WizardCardDeck extends BaseCardDeck {
    protected TrumpCard: CardColor;

    public SetTrumpCard(t: CardColor): void {
        this.TrumpCard = t;
    }

    public GetTrumpCard(): CardColor {
        return this.TrumpCard;
    }

    public ResetPlayedCards(): void {
        let card = null;
        if(this.GetDrawStack().GetCardsCount() > 0)
            this.GetDrawStack().GetCards()[this.GetDrawStack().GetCardsCount() - 1].cover();
        this.GetStacks().forEach(stack => {
            do {
                card = stack.DrawCard();
                if(card != null) {
                    this.GetDrawStack().addCard(card, null, false);
                }
            } while(card != null);
            stack.Clear();
        });
    }

    public ClearPlayedCards(): void {
        let card = null;
        if(this.GetDrawStack().GetCardsCount() > 0) {
            if (this.GetDrawStack().GetCards()[this.GetDrawStack().GetCardsCount() - 1].IsRevealed()) {
                let name = this.GetDrawStack().GetCards()[this.GetDrawStack().GetCardsCount() - 1].GetMesh().name;
                this.GetStacks()[1].addCard(this.GetDrawStack().TakeCardByName(name), null, true);
            }
        }
        do {
            card = this.GetStacks()[0].DrawCard();
            if(card != null) {
                this.GetStacks()[1].addCard(card, null, true);
            }
        } while(card != null);

        this.GetStacks()[0].Clear();
    }

    public RevealTrumpCard(): void {
        this.ClearPlayedCards();
        let stack = this.GetDrawStack();
        let c = <WizardCard>stack.DrawCard();
        if(c != null) {
            console.log("Trump is: " + c.GetColor().toString());
            stack.Game = this.Game;
            stack.addCard(c, null, true);
            stack.update();
            this.TrumpCard = c.GetColor();
        } else {
            this.TrumpCard = null;
        }
    }

    public GetWinnerOfRound(): Player {
        return this.GetStacks()[0].GetWinnerFromTrump(this.TrumpCard);
    }

    public GetNumberOfCardsInDeck(): number {
        return this.GetDrawStack().GetCardsCount();
    }

    public GetStacks(): WizardStack[] {
        return <WizardStack[]>(this.stacks.filter(e => e.GetID() != "MainStack"));
    }

    public GetDrawStack(): WizardStack {
        return <WizardStack>this.stacks.find(e => e.GetID() == "MainStack");
    }

    public GetStackFromPick(pick: BABYLON.PickingInfo): CardStack {
        if(pick.pickedMesh === null) {
            return null;
        }

        let ret: CardStack = this.GetStacks().find(e => e.GetCard(pick) != null);

        return ret;
    }

    constructor(scene: BABYLON.Scene, hl: BABYLON.HighlightLayer) {
        super();

        this.stacks = [];
        this.stacks.push(new WizardStack(StackDirection.Undef, StackType.Pop, "MainStack"));
        this.stacks.push(new WizardStack(StackDirection.Undef, StackType.Push, "PushStack"));
        this.stacks.push(new WizardStack(StackDirection.Undef, StackType.Push, "Finished"));
        
        let cards: Card[] = [];
        let cards_name: Set<string> = new Set<string>();

        let color_list = [  CardColor.Blue,
                            CardColor.Green,
                            CardColor.Yellow,
                            CardColor.Red ];

        color_list.forEach(color => {

            let types_list = [CardType.Fool, 
                        CardType.Number, 
                        CardType.Wizard];

            types_list.forEach(type => {
                let type_val = -4;

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
                    for (let v = 1; v <= 13; v++) {
                        for (let j = 0; j < 2; j++) {
                            let c = new WizardCard(v, type, color, scene, hl);
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
                }
                else {
                    let c = new WizardCard(type_val, type, color, scene, hl);
                    c.GetMesh().name = "Card_" + type.toString() + "_" + color.toString();
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
        console.log("Received drawn card("+card_name+") for stack: " + id);
        let card: Card = null;
        
        this.stacks.forEach(element => {
            let c = element.TakeCardByName(card_name);
            if(c != null)
                card = c;
        });

        let target: CardStack = this.stacks.find(s => { return s.GetID() == id;});
        target.addCardLocal(card, shouldReveal);
        
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
                -2.5,
                0.0
            ],
            [
                2.5,
                0.0
            ]
        ];

        let j  = 0;
        this.GetStacks().forEach(s => {
            s.setPosition(new BABYLON.Vector3(positions[j][0] * card_width + loc.x, distance + loc.y, positions[j][1] * card_width + loc.z));
            j++;
        });
    }
}

class WizardGUI extends BaseGameGUI {
    protected GameStateText: GUI.TextBlock;
    public AVotingUI: VotingUI;
    public GameID: String;
    public Game: SVEGame;

    constructor(scene: BABYLON.Scene) {
        super(scene);
    
        this.GameStateText = new GUI.TextBlock();
        this.GameStateText.fontSize = 70;

        this.PlayerList.GetTextOfPlayerLine = this.GetTextLine.bind(this);
    }

    protected GetTextLine(player: Player): string {
        return player.GetID().toString() + ", Stiche: " + (<WizardPlayer>player).GetPoints() + ", Vorher: " + (<WizardPlayer>player).GetTargetPoints();
    }

    public ShowGameState(gs: GameState): void {
        this.GameStateText.text = (gs == GameState.Won) ? "Gewonnen!" : "Verloren!";
        this.GameStateText.color = (gs == GameState.Won) ? "green" : "red";
        
        this.GUI.addControl(this.GameStateText);
    }

    public ShowPointsGuess(ug: Wizard): void {
        var self = this;
        let list = [];
        for (let i = 0; i <= ug.roundCount; i++) {
            list.push(i.toString());
        }
        this.AVotingUI = new VotingUI(this.GUI, "Wie viele Stiche wirst du bekommen?", list, (val: String) => {
            self.AVotingUI.removeAll();
            
            self.Game.sendGameRequest({
                action: { 
                    field: "!vote",
                    value: {
                        voteType: "SelfOnly",
                        voteID: "PointsGuess_" + ug.GetLocalPlayerID(),
                        value: val
                    }
                },
                invoker: String(ug.GetLocalPlayerID())
            });

            self.AVotingUI = null;
            ug.OnEndLocalRound();
        });
    }

    public HideGameState(): void {
        this.GUI.removeControl(this.GameStateText);
    }
}

class Wizard extends CardGame {
    public gameType = "Wizard";
    protected isSetup = false;
    protected GUI: WizardGUI;
    protected bIsSuspended: Boolean;
    public roundCount = 0;
    public maxRoundCount = 1;
    protected lastPlayerBeganID: String;
    protected hadPlayedSinceReset = false;

    constructor (info: GameInfo) {
        super(info);
        this.gameType = "Wizard";
        this.bIsSuspended = false;
    }

    public CheckGameState(): GameState {
        if(this.roundCount >= this.maxRoundCount) {
            // check for win conditions
            let playerWon: String = "";
            let high = 0;
            for(let i = 0; i < this.players.length; i++) {
                if(high < (<WizardPlayer>this.players[i]).GetPoints()) {
                    high = (<WizardPlayer>this.players[i]).GetPoints();
                    playerWon = this.players[i].GetID();
                }
            }

            return (playerWon == this.localPlayer.GetID()) ? GameState.Won : GameState.Lost;
        }

        // else state is Undetermined
        return GameState.Undetermined;
    }

    public StartLocalPlayersRound() {
        if (this.localPlayer.GetCardsCount() == 0) {
            console.log("Suspended this round!");
            this.bIsSuspended = false;

            if(this.IsHostInstance()) {
                
                this.players.forEach(p => {
                    this.NotifyPlayer(p, "!reset");
                });
                
            } else {
                this.localPlayer.SetPhase(PlayerGamePhase.SelectingCard);
                this.OnEndLocalRound();
            }
        }
        else {
            super.StartLocalPlayersRound();

            console.log("Prepare " + this.roundCount + " round:");

            let i = 0;
            this.players.forEach((p) => {
                (<WizardPlayer>p).IsFirstRound(false, i, this.camera);
                i++;
            });
            this.localPlayer.update();

            if (this.lastPlayerBeganID == this.localPlayer.GetID() && this.hadPlayedSinceReset) {
                let player = (<WizardCardDeck>this.Deck).GetWinnerOfRound();
                if(player != null) {
                    console.log("Player: " + player.GetID() + " Won round!");
                    (<WizardPlayer>player).SetRoundPoints((<WizardPlayer>player).GetRoundPoints() + 1);
                }
                console.log("Get next trump!");
                (<WizardCardDeck>this.Deck).Game = this;
                (<WizardCardDeck>this.Deck).RevealTrumpCard();
                this.players.forEach(p => {
                    this.sendGameRequest({
                        invoker: "",
                        target: {
                            type: TargetType.Player,
                            id: p.getName()
                        },
                        action: {
                            field: "TrumpCard",
                            value: (<WizardCardDeck>this.Deck).GetTrumpCard()
                        }
                    });
                });
            }
            this.hadPlayedSinceReset = true;
        }
    }

    public OnEndLocalRound() {
        this.localPlayer.update();
        this.players.forEach(p => this.GUI.PlayerList.UpdatePlayer(p));
        super.OnEndLocalRound();
    }

    public StartGame(): void {
        this.roundCount = 0;
        this.maxRoundCount = 20;
        if (this.players.length >= 4) {
            this.maxRoundCount = 15
        }
        if (this.players.length >= 5) {
            this.maxRoundCount = 10;
        }
        this.lastPlayerBeganID = "";
        super.StartGame();

        this.bIsSuspended = false;

        if (this.IsHostInstance()) {
            this.Deck.Game = this;       

            this.SetInitialCardCount(1);
            this.players.forEach(p => {
                this.NotifyPlayer(p, "!reset");
            });
        }
    }

    public CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        super.CreateScene(engine, canvas);

        WizardHelper.scene = this.scene;
        
        var self = this;

        this.Deck = new WizardCardDeck(this.scene, this.highlightLayer);

        // GUI
        this.GUI = new WizardGUI(this.scene);

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
        let player = new WizardPlayer(user, 1, isLocal, this.scene);

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
        this.GUI.GameID = this.gameID;
        this.GUI.Game = this;
    }

    public onRequest(result: GameRequest): void {
        super.onRequest(result);

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
    }

    protected OnGameStateChange(gs) {
        super.OnGameStateChange(gs);
        if (gs != GameState.Undetermined) {
            this.GUI.ShowGameState(gs); 

            this.localPlayer.Game = this;
            this.localPlayer.SetGameState(gs);

            this.EndGame();
        }
    }

    protected onPlayersRoundBegin(player: Player) {
        super.onPlayersRoundBegin(player);
        this.GUI.PlayerList.SetPlayerActive(player);
        if (this.lastPlayerBeganID == "") {
            this.lastPlayerBeganID = player.getName();
        }

        if(this.localPlayer.getName() == player.getName()) {
            if (this.localPlayer.GetCardsCount() == 0) {
                this.OnEndLocalRound();
            }
        }
    }

    protected onNotify(notification: string, invoker: Player, target: Player) {
        if(notification == "!reset") {
            this.lastPlayerBeganID = "";
            this.hadPlayedSinceReset = false;
            this.roundCount++;
            if (this.roundCount > this.maxRoundCount) {
                this.OnSelect(null, null);
                return;
            }
            console.log("Start round: " + this.roundCount);
            if (this.IsHostInstance()) {
                (<WizardCardDeck>this.Deck).Game = this;
                (<WizardCardDeck>this.Deck).ResetPlayedCards();
                
                if(this.roundCount > 1) {
                    this.players.forEach(p => {
                        (<WizardPlayer>p).EvaluateRound();
                        p.GetCards().forEach(c => {
                            (<WizardCardDeck>this.Deck).GetDrawStack().addCard(c, p, false);
                        });
                    });
                }

                setTimeout(() => {
                    this.players.forEach(p => {
                        p.Game = this;
                        p.drawNumberOfCards((<WizardCardDeck>this.Deck).GetDrawStack(), this.roundCount);
                    });

                    console.log("Reveal trump!");
                    (<WizardCardDeck>this.Deck).Game = this;
                    (<WizardCardDeck>this.Deck).RevealTrumpCard();

                    if (this.roundCount == 1) {
                        console.log("Prepare first round host:");
        
                        let i = 0;
                        this.players.forEach((p) => {
                            (<WizardPlayer>p).IsFirstRound(true, i, this.camera);
                            i++;
                        });
                    }
                }, 1000);
            }
            this.localPlayer.SetPhase(PlayerGamePhase.Spectating);

            this.GUI.ShowPointsGuess(this);
        }
    }

    public OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo) {
        super.OnSelect(evt, pickInfo);

        if (this.localPlayer == null)
            return;

        if (this.localPlayer.GetSelectedCard() != null) {
            if(pickInfo != null && this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
                let stack = this.Deck.GetStackFromPick(pickInfo);
                if(stack == null && pickInfo.pickedMesh.name == "ground1") {
                    stack = (<WizardCardDeck>this.Deck).GetStacks()[0];
                }
                if (stack != null) {
                    stack.Game = this;
                    stack.PlayCardOnStack(this.localPlayer);
                    this.OnEndLocalRound();
                }
            }
        }

    }

    public MinPlayers(): number {
        return 3;
    }

    public MaxPlayers(): number {
        return 6;
    }
}

export { Wizard };