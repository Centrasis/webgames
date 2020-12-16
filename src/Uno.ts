import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import * as GUI from 'babylonjs-gui';
import { BaseGameGUI, PlayerGamePhase, CardGame, CardStack, StackDirection, StackType, Card, Player, PlayerListUI, VotingUI, BaseCardDeck} from './CardGame';
import { MixMaterial } from 'babylonjs-materials';
import { GameState, GameInfo, SVEAccount, GameRequest } from 'svebaselib';
import {SVEGame} from './BaseGame';

enum CardType {
    Number = "Number",
    DirectionSwitch = "DirectionSwitch",
    Draw2 = "Draw2",
    Draw4 = "Draw4",
    Wish = "Wish",
    Suspend = "Suspend"
}

enum CardColor {
    Red = "Red",
    Green = "Green",
    Yellow = "Yellow",
    Blue = "Blue",
    Black = "Black"
}

class UNOHelper {
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
        if (ct == CardColor.Black) {
            return new BABYLON.Color3(0.1, 0.1, 0.1);
        }
    }

    static CreateMaterialForCard(nb: number, cardType: CardType): BABYLON.Material {
        var newMat = new Materials.MixMaterial("", this.scene);
        var mixTexture = new BABYLON.DynamicTexture("",  {width:512, height:420}, this.scene, false);
        var cardTexture: BABYLON.Texture = null;

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
        

        let font = "bold 100px monospace";
        let tmpctx = mixTexture.getContext();
        tmpctx.font = font;
        let NumberWidth = tmpctx.measureText(String(nb)).width;
        
        if (nb >= 0) {
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

class UnoCard extends Card {
    protected type: CardType;
    protected color: CardColor;

    constructor(value: number, type: CardType, color: CardColor, effect: () => void, scene: BABYLON.Scene, hl: BABYLON.HighlightLayer) {
        super(value, null, scene, hl);

        this.bIsRevealed = false;
        this.type = type;
        this.color = color;
        this.mesh.material = UNOHelper.CreateMaterialForCard(value, type);

        if (type == CardType.Number) {
            this.effect = () => {};
        } else {
            this.effect = effect;
        }
    }

    public SetColor(color: CardColor, force: Boolean = false) {
        this.color = color;
        console.log("Changed color of card: " + this.mesh.name + " to: " + color.toString());
        if (this.bIsRevealed) {
            this.applyColor(force);
        }
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

    protected applyColor(force: Boolean = false): void {
        if (force || (this.type != CardType.Draw4 && this.type != CardType.Wish)) {
            (<MixMaterial>this.mesh.material).diffuseColor = UNOHelper.CardColor2BABYLON(this.color);
        }
    }
}

class UNOStack extends CardStack {
    public check(card: Card): Boolean {
        if (this.type === StackType.Pop) {
            return false;
        }

        if(this.Cards.length == 0)
            return true;

        console.log("Check against card: " + this.Cards[this.Cards.length - 1].GetMesh().name);

        return ((this.Cards[this.Cards.length - 1].GetValue() == card.GetValue()    // if value is identical
                 || ((<UnoCard>this.Cards[this.Cards.length - 1]).GetColor() == (<UnoCard>card).GetColor())) // or the color is identical
                 || (<UnoCard>card).GetColor() == CardColor.Black   // or the card is black
                 || (<UnoCard>this.Cards[this.Cards.length - 1]).GetColor() == CardColor.Black);    //or the card on the stack is black (was played at the beginning)
    }
}

class UNOCardDeck extends BaseCardDeck {

    public GetNumberOfCardsInDeck(): number {
        return this.GetDrawStack().GetCardsCount();
    }

    public GetStacks(): UNOStack[] {
        return this.stacks.filter(e => e.GetID() != "MainStack");
    }

    public GetDrawStack(): UNOStack {
        return this.stacks.find(e => e.GetID() == "MainStack");
    }

    public ResolveWish(color: CardColor): void {
        (<UnoCard>this.GetStacks()[0].GetCards()[this.GetStacks()[0].GetCards().length - 1]).SetColor(color, true);
    }

    public GetStackFromPick(pick: BABYLON.PickingInfo): CardStack {
        if(pick.pickedMesh === null) {
            return null;
        }

        let ret: CardStack = this.GetStacks().find(e => e.GetCard(pick) != null);

        return ret;
    }

    constructor(effects: Map<CardType, () => void>, scene: BABYLON.Scene, hl: BABYLON.HighlightLayer) {
        super();

        this.stacks = [];
        this.stacks.push(new UNOStack(StackDirection.Undef, StackType.Pop, "MainStack"));
        this.stacks.push(new UNOStack(StackDirection.Undef, StackType.Push, "PushStack"));
        
        let cards: Card[] = [];
        let cards_name: Set<string> = new Set<string>();

        let color_list = [  CardColor.Blue,
                            CardColor.Green,
                            CardColor.Yellow,
                            CardColor.Red ];

        color_list.forEach(color => {

            let types_list = [CardType.DirectionSwitch, 
                        CardType.Draw2, 
                        CardType.Suspend,
                        CardType.Number];

            types_list.forEach(type => {
                let type_val = -4;

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
                    for (let v = 1; v <= 9; v++) {
                        for (let j = 0; j < 2; j++) {
                            let c = new UnoCard(v, type, color, effects.get(type), scene, hl);
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
                    // push zeros
                    let c = new UnoCard(0, type, color, effects.get(type), scene, hl);
                    c.GetMesh().name = "Card_0_" + type.toString() + "_" + color.toString();
                    let count = 1;
                    while(cards_name.has(c.GetMesh().name + count)) {
                        count++;
                    }
                    c.GetMesh().name = c.GetMesh().name + count;
                    cards_name.add(c.GetMesh().name);
                    cards.push(c);
                }
                else {
                    // action cards
                    if (type == CardType.DirectionSwitch || type == CardType.Suspend || type == CardType.Draw2) {
                        for (let i = 0; i < 2; i++) {
                            let c = new UnoCard(type_val, type, color, effects.get(type), scene, hl);
                            c.GetMesh().name = "Card_Action_" + type.toString() + "_" + color.toString();
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
            });
        });

        let black_list = [CardType.Draw4, CardType.Wish];
        //Add black cards
        black_list.forEach(type => {
            for(let i = 0; i < 4; i++) {
                let c = new UnoCard(-4, type, CardColor.Black, effects.get(type), scene, hl);
                c.GetMesh().name = "Card_Black_" + type.toString() + "_Black";
                let count = 1;
                while(cards_name.has(c.GetMesh().name + count)) {
                    count++;
                }
                c.GetMesh().name = c.GetMesh().name + count;
                cards_name.add(c.GetMesh().name);
                cards.push(c);
            }
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
            ]
        ];

        let j  = 0;
        this.GetStacks().forEach(s => {
            s.setPosition(new BABYLON.Vector3(positions[j][0] * card_width + loc.x, distance + loc.y, positions[j][1] * card_width + loc.z));
            j++;
        });
    }
}

class UNOGUI extends BaseGameGUI {
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

        this.PlayerList.GetTextOfPlayerLine = this.GetTextLine.bind(this);
    }

    protected GetTextLine(player: Player): string {
        return player.GetID().toString() + ", Karten: " + player.GetCards().length.toString();
    }

    protected OnClickedEndRound(): void {
        this.OnEndRoundClick();
    }

    public ShowEndRoundBtn(val: boolean): void {
        this.EndRoundBtn.isEnabled = val;
        this.EndRoundBtn.background = (val) ? "green" : "grey";
    }

    public ShowGameState(gs: GameState): void {
        this.GameStateText.text = (gs == GameState.Won) ? "Gewonnen!" : "Verloren!";
        this.GameStateText.color = (gs == GameState.Won) ? "green" : "red";
        
        this.GUI.addControl(this.GameStateText);
    }

    public ShowColorWish(ug: UNO): void {
        var self = this;
        this.AVotingUI = new VotingUI(this.GUI, "Welche Farbe ist gewünscht?", ["Rot", "Grün", "Gelb", "Blau"], self.Game, (val: String) => {
            self.AVotingUI.removeAll();

            self.AVotingUI.postVote("SelfOnly", "ColorWish", val, (self.Game as CardGame).GetLocalPlayer());

            self.AVotingUI = null;
            ug.OnEndLocalRound();
        });
    }

    public HideGameState(): void {
        this.GUI.removeControl(this.GameStateText);
    }
}

class UNO extends CardGame { 
    public gameType = "UNO";
    protected isSetup = false;
    protected GUI: UNOGUI;
    protected bIsSuspended: Boolean;

    constructor (info: GameInfo) {
        super(info);
        this.bIsSuspended = false;
        this.gameType = "UNO";
    }

    public CheckGameState(): GameState {
        if(this.isSetup) {
            // check for win conditions
            if (this.localPlayer.GetCardsCount() == 0) {
                return GameState.Won;
            } else {
                let ret = false;
                this.players.forEach(p => {
                    ret = ret || p.GetGameState() == GameState.Won;
                });
                if(ret) {
                    return GameState.Lost; 
                }
            }
        }

        // else state is Undetermined
        return GameState.Undetermined;
    }

    public StartLocalPlayersRound() {
        if (this.bIsSuspended) {
            console.log("Suspended this round!");
            this.bIsSuspended = false;
            this.localPlayer.SetPhase(PlayerGamePhase.SelectingCard);
            this.OnEndLocalRound();
        }
        else {
            super.StartLocalPlayersRound();
            this.GUI.ShowEndRoundBtn(true);
        }
    }

    public OnEndLocalRound() {
        this.localPlayer.update();
        this.players.forEach(p => this.GUI.PlayerList.UpdatePlayer(p));
        super.OnEndLocalRound();
        this.GUI.ShowEndRoundBtn(false);
    }

    public StartGame(): void {
        if (this.IsHostInstance()) {
            this.Deck.Game = this;
            (<UNOCardDeck>this.Deck).revealFirstCard();

            this.SetInitialCardCount(7);
            this.players.forEach(p => {
                p.Game = this;
                p.drawNumberOfCards((<UNOCardDeck>this.Deck).GetDrawStack(), 7);
            });
        }

        super.StartGame();

        this.bIsSuspended = false;

        if (this.players.length == 1) {
            this.InvokeNextPlayerRound();
        }
        else {
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
    }

    public CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        super.CreateScene(engine, canvas);

        UNOHelper.scene = this.scene;
        
        var self = this;

        let effectMap = new Map<CardType, () => void>();
        effectMap.set(CardType.DirectionSwitch, () => {
            self.UpdateGameDirection((-1) * self.GetLocalPlayDirection());
        });
        effectMap.set(CardType.Draw2, () => {
            self.NotifyPlayer(null, "draw2!");
        });
        effectMap.set(CardType.Draw4, () => {
            self.NotifyPlayer(null, "draw4!");
            self.GUI.ShowColorWish(self);
        });
        effectMap.set(CardType.Wish, () => {
            self.GUI.ShowColorWish(self);
        });
        effectMap.set(CardType.Suspend, () => {
            self.NotifyPlayer(null, "suspend!");
        });
        effectMap.set(CardType.Number, () => {
            
        });

        this.Deck = new UNOCardDeck(effectMap, this.scene, this.highlightLayer);

        // GUI
        this.GUI = new UNOGUI(this.scene);
        this.GUI.OnEndRoundClick = this.OnForceEndRound.bind(this);
        this.GUI.ShowEndRoundBtn(false);

        return this.scene;
    }

    public OnForceEndRound() {
        this.localPlayer.drawNumberOfCards((<UNOCardDeck>this.Deck).GetDrawStack(), 1);
        this.OnEndLocalRound();
    }

    public Tick(): void {
        
    }

    protected onPlayersRoundBegin(player) {
        super.onPlayersRoundBegin(player);
        this.GUI.PlayerList.SetPlayerActive(player);
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

    protected OnGameStateChange(state) {
        super.OnGameStateChange(state);
        
        if (state !== GameState.Undetermined) {
            this.GUI.ShowGameState(state);
            this.EndGame();
        }
    }

    public onRequest(result: GameRequest): void {
        super.onRequest(result);

        if (typeof result.action !== "string") {
            if (result.action.field == "vote") {
                if (result.action.value.voteID == "ColorWish") {
                    console.log("Got voting result for wish: " + result.action.value.vote);
                    let wishColor: CardColor = CardColor.Red;
                    if (result.action.value.vote == "Grün") {
                        wishColor = CardColor.Green;
                    }
                    if (result.action.value.vote == "Gelb") {
                        wishColor = CardColor.Yellow;
                    }
                    if (result.action.value.vote == "Blau") {
                        wishColor = CardColor.Blue;
                    }
                    (<UNOCardDeck>this.Deck).ResolveWish(wishColor);
                }
                return;
            }
        } else {
            if (result.action == "!updatePlayer") {
                if (this.IsHostInstance()) {
                    this.players.forEach((p) => {
                        if (p.getName() == result.target.id)
                        {
                            console.log("Initial draw card for: " + p.getName());
                        }
                    });
                    this.isSetup = true;
                }

                if (this.IsRunning())
                    this.OnSelect(null, null);
                return;
            }

            if (result.action == "!drawCard") {
                this.isSetup = true;
            }
        }
        console.log("Unknown response:" + JSON.stringify(result));
    }

    protected onNotify(notification: string, invoker: Player, target?: Player) {
        super.onNotify(notification, invoker, target);

        if (target !== undefined && target.getName() == this.localUser!.getName()) {
            if (notification == "draw2!") {
                this.localPlayer.drawNumberOfCards((<UNOCardDeck>this.Deck).GetDrawStack(), 2);
                this.OnEndLocalRound();
            }
            if (notification == "draw4!") {
                this.localPlayer.drawNumberOfCards((<UNOCardDeck>this.Deck).GetDrawStack(), 4);
                this.OnEndLocalRound();
            }
            if (notification == "suspend!") {
                if(this.localPlayer.GetPhase() == PlayerGamePhase.Spectating) {
                    this.bIsSuspended = true;
                } else {
                    this.OnEndLocalRound();
                }
            }
        }
    }

    public OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo) {
        super.OnSelect(evt, pickInfo);

        if (this.localPlayer == null)
            return;

        if (this.localPlayer.GetSelectedCard() != null) {
            if(pickInfo != null && this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
                let stack = this.Deck.GetStackFromPick(pickInfo);
                if (stack != null) {
                    stack.Game = this;
                    if ((<UnoCard>this.localPlayer.GetSelectedCard()).GetColor() == CardColor.Black) {
                        stack.PlayCardOnStack(this.localPlayer);
                    } else {
                        if (stack.PlayCardOnStack(this.localPlayer)) {
                            this.OnEndLocalRound();
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

export { UNO };