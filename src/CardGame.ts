import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import * as GUI from 'babylonjs-gui';
import BaseGame, {Commandable, GameRejectReason} from './BaseGame';
import { isUndefined } from 'util';
import { SessionUserInitializer, SVEAccount, SVEGame, GameState, TargetType, SetDataRequest, ActionTarget, GameInfo, GameRequest, BasicUserInitializer } from 'svebaselib';

export enum PlayerGamePhase {
    Spectating,
    SelectingCard,
    SelectingStack
}

export class Card {
    protected mesh: BABYLON.Mesh;
    protected value: number;
    public width: number;
    public size: number;
    protected bIsSelected: Boolean;
    protected highlightLayer: BABYLON.HighlightLayer;
    protected upVector: BABYLON.Vector3;
    protected effect: () => void;
    protected bIsRevealed: Boolean;

    public GetMesh(): BABYLON.AbstractMesh {
        return this.mesh;
    }

    public SetEffect(effect: () => void): void {
        this.effect = effect;
    }

    public InvokeEffect(): void {
        this.effect();
    }

    public GetValue(): number {
        return this.value;
    }

    public IsSelected(): Boolean {
        return this.bIsSelected;
    }

    constructor(value: number, materials: Map<number, Materials.MixMaterial>, scene: BABYLON.Scene, hl: BABYLON.HighlightLayer) {
        this.effect = () => {};
        this.bIsRevealed = false;
        this.upVector = new BABYLON.Vector3(0, 1, 0);
        this.bIsSelected = false;
        this.highlightLayer = hl;
        this.value = value;
        this.width = 0.665;
        this.size = 2;
        
        let f = new BABYLON.Vector4(0.5,0, 1, 1); // front image = half the whole image along the width 
        let b = new BABYLON.Vector4(0,0, 0.5, 1); // back image = second half along the width

        this.mesh = BABYLON.MeshBuilder.CreatePlane("", {height: 1 * this.size, width: this.width * this.size, sideOrientation: BABYLON.Mesh.DOUBLESIDE, frontUVs: f, backUVs: b}, scene);
        this.mesh.isPickable = true;
        if (materials != null) {
            this.mesh.material = materials.get(value);
        }
        this.mesh.rotate(BABYLON.Axis.X, -Math.PI / 2.0, BABYLON.Space.LOCAL);
    }

    public toogleSelect() {
        this.bIsSelected = !this.bIsSelected;
        this.highlightLayer.removeAllMeshes();
        if (this.bIsSelected) {
            this.highlightLayer.addMesh(this.mesh, BABYLON.Color3.Red());
        }
    }

    public setPosition(loc: BABYLON.Vector3): void {
        this.mesh.position = loc;
    }

    public uplift(camera: BABYLON.FreeCamera): void {
        //let upliftAngle = 3.0 * Math.PI / 4.0;
        //this.mesh.rotate(BABYLON.Axis.X, upliftAngle, BABYLON.Space.LOCAL);

        if (isUndefined(camera) || camera == null) {
            return;
        }
        let dir = BABYLON.Ray.CreateNewFromTo(camera.position, camera.getTarget()).direction;
        this.mesh.lookAt(new BABYLON.Vector3(this.mesh.position.x + dir.x, this.mesh.position.y  + dir.y, this.mesh.position.z + dir.z));
        //this.mesh.rotate(BABYLON.Axis.Y, -Math.PI / 2.0, BABYLON.Space.WORLD);

        //let m = BABYLON.Matrix.RotationAxis(BABYLON.Axis.X, upliftAngle);

        //this.upVector = BABYLON.Vector3.TransformCoordinates(this.upVector, m);
    }

    public reveal(): void {
        this.mesh.lookAt(new BABYLON.Vector3(this.mesh.position.x, this.mesh.position.y - 2, this.mesh.position.z));
        this.mesh.rotate(BABYLON.Axis.Y, -Math.PI / 2.0, BABYLON.Space.WORLD);
        this.bIsRevealed = true;
    }

    public IsRevealed(): Boolean {
        return this.bIsRevealed;
    }

    public cover(): void {
        this.mesh.lookAt(new BABYLON.Vector3(this.mesh.position.x, this.mesh.position.y + 2, this.mesh.position.z));
        this.mesh.rotate(BABYLON.Axis.Y, -Math.PI / 2.0, BABYLON.Space.WORLD);
        this.bIsRevealed = false;
    }
}

export enum StackDirection {
    Upwards,
    Downwards,
    Undef
}

export enum StackType { // Type of stack if cards are drawn, pushed or both
    Push,
    Pop,
    FreeForEverything
}

export class CardStack {
    protected Cards: Card[];
    protected direction: StackDirection;
    protected type: StackType; 
    protected position: BABYLON.Vector3;
    protected id: String;
    public Game: SVEGame;
    protected card_distance: number;

    constructor(dir: StackDirection, type: StackType, id: String) {
        this.id = id;
        this.Cards = [];
        this.type = type;
        this.direction = dir;
        this.card_distance = 0.01;

        this.setPosition(new BABYLON.Vector3(0, 0, 0));
    }

    public GetID(): String {
        return this.id;
    }

    public GetCards(): Card[] {
        return this.Cards;
    }

    // returns if card can be played on this stack
    public check(card: Card): Boolean {
        if (this.type == StackType.Pop) {
            return false;
        }

        if(this.Cards.length == 0)
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
    }

    public GiveCardByNameTo(card_name: String, player: Player): void {
        let card = null;
        for (let i = 0; i < this.Cards.length; i++) {
            if (this.Cards[i].GetMesh().name == card_name) {
                card = this.Cards[i];
            }
        };

        this.Cards = this.Cards.filter((e) => { return e.GetMesh().name != card_name; })
    
        if(card != null) {
            player.AddCardLocal(card);
        }

        this.setPosition(this.position);
    }

    /** No Replication */
    public TakeCardByName(card_name: String): Card {
        let card = null;
        for (let i = 0; i < this.Cards.length; i++) {
            if (this.Cards[i].GetMesh().name == card_name) {
                card = this.Cards[i];
            }
        };

        if (card != null) {
            this.Cards = this.Cards.filter((e) => { return e.GetMesh().name != card_name; })
            this.setPosition(this.position);
        }
        return card;
    }

    public setPosition(loc: BABYLON.Vector3): void {
        this.position = loc;

        let i = 0;
        this.Cards.forEach(element => {
            i++;
            element.setPosition(new BABYLON.Vector3(0 + loc.x, this.card_distance * i + loc.y, 0 + loc.z));
        });
    }

    /** Does not replicate */
    public addCardLocal(card: Card, shouldReveal: Boolean = true): void {
        this.Cards.push(card);
        if(shouldReveal) {
            card.reveal();
        } else {
            card.cover();
        }
    }

    public update() {
        this.setPosition(this.position);
    }

    /** Does replicate */
    public addCard(card: Card, previousOwner: Player, shouldReveal: Boolean = true): void {
        this.Game.sendGameRequest({
            action: {
                field: "!playCard",
                value: { 
                    card: card.GetMesh().name,
                    revealed: shouldReveal
                },
            },
            invoker: (previousOwner == null) ? "" : previousOwner.getName(),
            target: {
                type: TargetType.Entity,
                id: String(this.GetID())
            }
        });

        this.addCardLocal(card, shouldReveal);
    }

    public GetCard(pick: BABYLON.PickingInfo): Card {
        let ret = null;
        for(let j = this.Cards.length - 1; j >= 0; j--) {
            if (pick.pickedMesh.name == this.Cards[j].GetMesh().name) {
                ret = this.Cards[j];
                break;
            }
        }
        return ret;
    }

    /** Does not replicate */
    public DrawCard(): Card {
        if (this.Cards.length >= 1)
        {
            let c = this.Cards[Math.round(Math.random() * (this.Cards.length - 1))];
            
            this.Cards = this.Cards.filter(card => card !== c);

            this.setPosition(this.position);

            return c;
        }
        else
        {
            return null;
        }
    }

    public ForceSetCards(cards: Card[]): void {
        this.Cards = cards;
        this.setPosition(this.position);
    }

    public GetCardsCount(): number {
        return this.Cards.length;
    }

    /** replicates */
    public PlayCardOnStack(player: Player): boolean {
        if (player === null) {
            return false;
        }

        if(this.check(player.GetSelectedCard())) {
            this.addCard(player.PlaySelectedCard(), player);
            this.setPosition(this.position);
            return true;
        } else {
            console.log("Could not play card: " + player.GetSelectedCard().GetMesh().name);
        }

        return false;
    }
}

export abstract class BaseCardDeck {
    protected stacks: CardStack[];
    protected position: BABYLON.Vector3;
    public Game: SVEGame;

    public abstract GetNumberOfCardsInDeck(): number;

    public setPosition(loc: BABYLON.Vector3): void {
        this.position = loc;
    }

    public drawCard(stackID: String): Card {
        return this.stacks.find(e => e.GetID() == stackID).DrawCard();
    }

    public PlayCardFromDeckOnStack(id: String, card_name: String, shouldReveal: Boolean = true) {
        console.log("Empty call: PlayCardFromDeckOnStack");
    }

    /** Dose not replicate */
    public PlayCardByNameOnStack(id: String, card_name: String, player: Player, shouldReveal: Boolean = true): void {
        let card: Card = player.GetCards().find(c => c.GetMesh().name == card_name);

        if(card != null) {
            let stack: CardStack = this.stacks.find((e) => { return e.GetID() == id; });
            if(stack.check(card)) {
                card.GetMesh().setEnabled(true);
                stack.addCardLocal(card, shouldReveal);
                this.setPosition(this.position);
            }
        }
    }

    public PlayCardOnStack(id: String, player: Player): void {
        let stack: CardStack = this.stacks.find((e) => { return e.GetID() == id; });
        if (stack === null) {
            return;
        }
        if (player === null) {
            return;
        }

        stack.Game = this.Game;
        stack.PlayCardOnStack(player);
    }

    public GetStackFromPick(pick: BABYLON.PickingInfo): CardStack {
        if(pick.pickedMesh === null) {
            return null;
        }

        let ret: CardStack = this.stacks.find(e => e.GetCard(pick) != null);

        return ret;
    }

    public abstract GiveCardByNameTo(card_name: String, player: Player): void;
}

export class Player extends SVEAccount {
    protected cards: Card[];
    protected maxCardCount: number;
    protected cardOrigin: BABYLON.Vector3;
    protected phase: PlayerGamePhase;
    protected bHasTurn: Boolean;
    public Game: SVEGame;
    protected isLocal: Boolean;
    protected gameState: GameState;
    public camera: BABYLON.FreeCamera;

    constructor(decoratee: SVEAccount, maxCardCount: number, isLocal: Boolean) {
        super(decoratee.getInitializer(), (u) => {});
        this.phase = PlayerGamePhase.Spectating;
        this.isLocal = isLocal;
        this.maxCardCount = maxCardCount;
        this.cards = [];
        this.cardOrigin = new BABYLON.Vector3(0, 1, -6);
    }

    public GetPhase(): PlayerGamePhase {
        return this.phase;
    }

    public SetPhase(p: PlayerGamePhase): void {
        this.phase = p;
    }

    public commitToServer(): void {
        this.Game.sendGameRequest({
            action: {
                field: "maxCardCount",
                value: this.maxCardCount
            },
            invoker: this.getName(),
            target: {
                type: TargetType.Player,
                id: this.getName()
            }
        });
    }

    /** No replication */
    public dropCards(): void {
        this.cards = [];
        this.update();
    }

    public SetHasTurn(val: Boolean): void {
        this.bHasTurn = val;
    }

    public GetID(): String {
        return this.name;
    }

    public SetMaxCardCount(count: number): void {
        this.maxCardCount = count;
    }

    public GetCards(): Card[] {
        return this.cards;
    }

    // Returns other than null if a owned card was selected
    public GetOwnCard(pick: BABYLON.PickingInfo): Card {
        if(pick.pickedMesh === null) {
            return null;
        }

        let ret = null;
        for (let i = 0; i < this.cards.length; i++)
        {
            if (pick.pickedMesh.name == this.cards[i].GetMesh().name)
            {
                ret = this.cards[i];
                break;
            }
        };

        return ret;
    }

    public UnSelectAll(): void {
        this.cards.forEach(element => {
            if(element.IsSelected())
            {
                element.toogleSelect();
            }
        });
    }

    public GetCardsCount(): number {
        return this.cards.length;
    }

    public GetMaxCardCount(): number {
        return this.maxCardCount;
    }

    public GetSelectedCard(): Card {
        let ret: Card = null;

        for (let i = 0; i < this.cards.length; i++)
        {
            if (this.cards[i].IsSelected())
            {
                ret = this.cards[i];
                break;
            }
        };

        return ret;
    }

    public PlaySelectedCard(): Card {
        let ret = this.GetSelectedCard();

        if(ret != null) {
            ret.toogleSelect();
            this.cards = this.cards.filter(c => { return c !== ret; });
            ret.GetMesh().setEnabled(true);
            ret.InvokeEffect();
        }

        return ret;
    }

    public drawCards(stack: CardStack): void {
        this.SetPhase(PlayerGamePhase.Spectating);
        
        while(this.maxCardCount > this.cards.length) {
            let card = stack.DrawCard();
            if (card === null)
            {
                break;
            }
            this.AddCard(card);
        } 
    }

    public drawNumberOfCards(stack: CardStack, count: number): void {    
        for (let i = 0; i < count; i++) {
            let card = stack.DrawCard();
            if (card === null)
            {
                break;
            }

            this.AddCard(card);
        }
    }

    public update() {
        let posX = null;
        for(let i = 0; i < this.cards.length; i++) {
            let card = this.cards[i];
            if (posX === null) {
                posX = -1 * (card.width * card.size * (5/4) * this.cards.length) / 2.0;
            }
            card.setPosition(new BABYLON.Vector3(this.cardOrigin.x + posX, this.cardOrigin.y, this.cardOrigin.z));
            posX += card.width * (5/4) * card.size;
        }
    }

    public SetOrigin(loc: BABYLON.Vector3): void {
        this.cardOrigin = loc;
        this.update();
    }

    /** Replicates */
    public AddCard(card: Card): void {
        this.AddCardLocal(card);

        this.Game.sendGameRequest({
            action: {
                field: "!drawCard",
                value: card.GetMesh().name
            },
            invoker: this.getName(),
            target: {
                type: TargetType.Player,
                id: this.getName()
            }
        });
    }

    public AddCardLocal(card: Card): void {
        this.cards.push(card);
        card.uplift(this.camera);
        card.GetMesh().setEnabled(<boolean>this.isLocal);

        this.update();
    }

    public IsLocalPlayer(): Boolean {
        return this.isLocal;
    }

    public SetGameState(gs: GameState): void {
        this.gameState = gs;

        if (gs != GameState.Undetermined) {
            this.Game.sendGameRequest({
                action: {
                    field: "gameState",
                    value: gs
                },
                invoker: this.getName(),
                target: {
                    type: TargetType.Game,
                    id: ""
                }
            });
        }
    }

    public GetGameState(): GameState {
        return this.gameState;
    }
}



export class PlayerListUI {
    protected GUI: GUI.AdvancedDynamicTexture;
    protected players: Map<Player, GUI.TextBlock>;
    protected textColor: string;
    protected textActiveColor: string;
    public GetTextOfPlayerLine: (player: Player) => string;

    constructor(GUI: GUI.AdvancedDynamicTexture) {
        this.GUI = GUI;
        this.players = new Map<Player, GUI.TextBlock>();
        this.GetTextOfPlayerLine = this.GetTextOfPlayerMethod.bind(this);
    }

    public AddPlayer(player: Player) {
        this.textColor = "orange"
        this.textActiveColor = "white";

        let text = new GUI.TextBlock();
        text.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        text.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        text.fontSize = 30;
        text.color = this.textColor;
        text.left = "-40%";
        text.top = "-" + (50 - ((this.players.size + 1) * 5)) + "%";
        this.players.set(player, text);
        this.GUI.addControl(text);

        this.UpdatePlayer(player);
    }

    public UpdatePlayer(player: Player): void {
        this.players.get(player).text = this.GetTextOfPlayerLine(player);
    }

    private GetTextOfPlayerMethod(player: Player): string {
        return player.GetID().toString();
    }

    public GetPlayersTexts(): string[] {
        let list: string[] = [];
        this.players.forEach(p => {
            list.push(p.text);
        });

        return list;
    }

    public SetPlayerActive(player: Player) {
        this.players.forEach(e => e.color = this.textColor);
        let p = this.players.get(player);
        if (p !== null) {
            p.color = this.textActiveColor;
        }
    }
}

export class VotingUI {
    protected GUI: GUI.AdvancedDynamicTexture;
    protected votes: GUI.Button[];
    protected caption: GUI.TextBlock;

    constructor(gui: GUI.AdvancedDynamicTexture, caption: string, votes: string[], onVote: (val: String) => void) {
        this.GUI = gui;
        this.votes = [];
        this.caption = new GUI.TextBlock("", caption);
        this.caption.fontSize = 30;
        this.caption.color = "blue";
        this.caption.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.caption.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.GUI.addControl(this.caption);

        let i = 0;
        votes.forEach((p) => {
            var id = p;

            var btn = GUI.Button.CreateSimpleButton("", id.toString());
            btn.width = "150px"
            btn.height = "40px";
            btn.disabledColor = "grey";
            btn.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            btn.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            btn.color = "white";
            btn.cornerRadius = 20;
            btn.background = "orange";
            btn.top = "-" + (50 - ((i + 1) * 10)) + "%";
            btn.onPointerUpObservable.add(function() {
                onVote(id);
            });

            this.GUI.addControl(btn);
            this.votes.push(btn);

            i++;
        });
    }

    public removeAll(): void {
        this.votes.forEach((b) => {
            this.GUI.removeControl(b);
        })

        this.GUI.removeControl(this.caption);
    }
}

export class BaseGameGUI {
    protected GUI: GUI.AdvancedDynamicTexture;
    public PlayerList: PlayerListUI;
    public NextRoundSound: BABYLON.Sound;

    constructor(scene: BABYLON.Scene) {
        this.GUI = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.PlayerList = new PlayerListUI(this.GUI);

        this.NextRoundSound = new BABYLON.Sound("Ping", "/sounds/ping.wav", scene, null, {
            loop: false,
            autoplay: false,
            volume: 1
        });
    }

    RememberItsYourTurn(): void {
        this.NextRoundSound.play();
    }
}

export abstract class CardGame extends BaseGame implements Commandable { 
    private playDirection: number;
    protected scene: BABYLON.Scene;
    protected camera: BABYLON.FreeCamera;
    protected players: Player[];
    protected Deck: BaseCardDeck;
    protected localPlayer: Player;
    protected bIsRunning: Boolean;
    protected gameID: String;
    protected bIsHosting: Boolean;
    protected highlightLayer: BABYLON.HighlightLayer;
    protected GUI: BaseGameGUI;
    protected enableZMovement = false;

    constructor (info: GameInfo) {
        super(info);
        this.players = [];
        this.playDirection = 1;
        this.bIsRunning = false;
        this.bIsHosting = false;
        this.localPlayer = null;
        this.Deck = null;
        this.GUI = null;
    }

    public abstract CheckGameState(): GameState;

    public StartLocalPlayersRound() {
        if (this.localPlayer.GetPhase() == PlayerGamePhase.Spectating)
        {
            this.GUI.RememberItsYourTurn();
            this.localPlayer.SetPhase(PlayerGamePhase.SelectingCard);
            this.OnSelect(null, null);
        }
    }

    public SetInitialCardCount(cardsCount: number): void {
        this.players.forEach(player => {
            player.SetMaxCardCount(cardsCount);
            player.Game = this;
            player.commitToServer();
        });
    }

    public StartGame(): void {
        this.bIsRunning = true;

        this.scene.onPointerDown = this.OnSelect.bind(this);

        this.localPlayer.SetPhase(PlayerGamePhase.Spectating);

        if (this.bIsHosting) {
            this.sendGameRequest({
                action: "!startGame",
                invoker: this.localPlayer.getName(),
                target: {
                    type: TargetType.Game,
                    id: ""
                }
            })
        }
    }

    public IsRunning(): Boolean {
        return this.bIsRunning;
    }

    public IsHostInstance(): Boolean {
        return this.bIsHosting;
    }

    public CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
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
        
        let deskMat = new BABYLON.StandardMaterial("", this.scene);
        deskMat.specularColor = new BABYLON.Color3(1,1,1);
        deskMat.diffuseColor = new BABYLON.Color3(1,1,1);
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
        var prevPoint = [ -1.0, -1.0 ];

        var remove_event = function(ev: PointerEvent) {
            // Remove this event from the target's cache
            for (var i = 0; i < evCache.length; i++) {
              if (evCache[i].pointerId == ev.pointerId) {
                evCache.splice(i, 1);
                break;
              }
            }
        }

        canvas.onpointerdown = function(ev) {
            evCache.push(ev);
        };

        var pointerup_handler = function(ev: PointerEvent) {
            remove_event(ev);
          
            // If the number of pointers down is less than two then reset diff tracker
            if (evCache.length < 2) {
                prevDiff = -1;
            }

            if (evCache.length < 1) {
                prevPoint = [ -1.0, -1.0 ];
            }
        };

        canvas.onpointerup = pointerup_handler;
        canvas.onpointercancel = pointerup_handler;
        canvas.onpointerout = pointerup_handler;
        canvas.onpointerleave = pointerup_handler;

        canvas.onpointermove = function(ev) {
            for (var i = 0; i < evCache.length; i++) {
                if (ev.pointerId == evCache[i].pointerId) {
                   evCache[i] = ev;
                break;
                }
            }

            // if pinch
            if (evCache.length == 2) {
                var curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);
                let delta = 0.0;
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
                let curPoint = [ evCache[0].clientX, evCache[0].clientY ];
                let delta = [ 0.0, 0.0 ];
                if (prevPoint[0] > 0) {
                    delta = [ curPoint[0] - prevPoint[0], curPoint[1] - prevPoint[1] ];
                }

                self.camera.position = self.camera.position.add(new BABYLON.Vector3(-delta[0] / 100.0, 0.0, (self.enableZMovement) ? delta[1] / 100.0 : 0.0));
                
                if(self.camera.position.x > 10.0) {
                    self.camera.position.x = 10.0;
                }

                if(self.camera.position.x < -10.0) {
                    self.camera.position.x = -10.0;
                }

                if(self.camera.position.y > 10.0) {
                    self.camera.position.y = 10.0;
                }

                if(self.camera.position.y < -10.0) {
                    self.camera.position.y = -10.0;
                }

                prevPoint = curPoint;
            }
        }

        return this.scene;
    }

    protected OnEndLocalRound() {
        if (this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
            this.localPlayer.SetPhase(PlayerGamePhase.Spectating);
            this.InvokeNextPlayerRound();
        }
    }

    public GiveUp(): void {
        this.sendGameRequest({
            action: {
                field: "gameState",
                value: GameState.Lost
            },
            invoker: String(this.GetLocalPlayerID()),
            target: {
                id: "",
                type: TargetType.Game
            }
        });

        this.EndGame();
    }

    public InvokeNextPlayerRound() {
        console.log("Invoke next round");
        this.sendGameRequest({
            action: { 
                field: "!nextTurn",
                value: this.playDirection
            },
            invoker: this.localPlayer.getName(),
            target: {
                type: TargetType.Game,
                id: ""
            }
        });
    }

    public AddPlayer(user: SVEAccount, isLocal: Boolean, player: Player = null): void {
        if (isLocal) {
            console.log("On add new local player: " + user.getName());
        }
        else {
            console.log("On add new remote player: " + user.getName());
        }
        if (player == null)
            player = new Player(user, 6, isLocal);

        this.GUI.PlayerList.AddPlayer(player);

        if (isLocal) {
            this.localPlayer = player;
            this.localPlayer.camera = this.camera;
            this.localPlayer.Game = this;
        }
        this.players.push(player);

        player.Game = this;

        this.OnNewPlayer();
    }

    public onJoined() {
        console.log("Card game joined!");
        this.OnConnected(true);
    }

    public executeCommand(cmd: string, req: GameRequest) {
        if("!join" == cmd) {
            new SVEAccount({id: Number(req.invoker)} as BasicUserInitializer, (user) => {
                this.AddPlayer(user, false);
            });
            return;
        }

        if("!startGame" == cmd) {
            if (req.invoker == this.host)
                this.StartGame();
            if(this.bIsRunning) {
                this.OnSelect(null, null);
            }
            return;
        }

        if("!notify" == cmd) {
            console.log("Notify: " + (req.action as SetDataRequest).value);
            return;
        }

        if("!endGame" == cmd) {
            if (req.invoker == this.host)
                this.EndGame();
            if(this.bIsRunning) {
                this.OnSelect(null, null);
            }
            return;
        }

        if("!drawCard" == cmd) {
            this.players.forEach((p) => {
                if (p.getName() == req.target.id) {
                    this.Deck.Game = this;
                    this.Deck.GiveCardByNameTo((req.action as SetDataRequest).value, p);
                    this.GUI.PlayerList.UpdatePlayer(p);
                }
            });
            return;
        }

        if("!nextTurn" == cmd) {
            if (this.localPlayer.getName() == req.target.id) {
                this.StartLocalPlayersRound();
            }
            return;
        }

        if("!playCard" == cmd) {
            let result = (req.action as SetDataRequest).value;
            if (req.invoker == "") {
                this.Deck.PlayCardFromDeckOnStack(req.target.id, result.card, result.revealed);
            } else {
                this.players.forEach((p) => {
                    if (p.getName() == req.invoker) {
                        console.log("Play Card from player: " + req.invoker);
                        this.Deck.Game = this;
                        this.Deck.PlayCardByNameOnStack(req.target.id, result.card, p, result.revealed);
                        this.GUI.PlayerList.UpdatePlayer(p);
                    }
                });
            }
            return;
        }
    }

    public onRequest(req: GameRequest) {
        if (typeof req.action === "string") {
            if (req.action.startsWith("!")) {
                if (req.target === undefined || req.target.type === TargetType.Game) {
                    this.executeCommand(req.action, req);
                }
            }
        } else {
            if (req.action.field.startsWith("!")) {
                // execute action
                this.executeCommand(req.action.field, req);
            } else {
                // set field
                if (req.target !== undefined) {
                    if (req.target.type === TargetType.Game) {
                        (this as any)[req.action.field] = req.action.value;
                    } else {
                        if (req.target.type === TargetType.Player) {
                            this.players.forEach(p => {
                                if(p.getName() === req.target.id) {
                                    (p as any)[(req.action as SetDataRequest).field] = (req.action as SetDataRequest).value;
                                    this.GUI.PlayerList.UpdatePlayer(p);
                                }
                            });
                        } else {
                            if (req.target.type === TargetType.Entity) {
                                (this.Deck as any)[(req.action as SetDataRequest).field] = (req.action as SetDataRequest).value;
                            }
                        }
                    }
                } else {
                    // default to game scope
                    (this as any)[req.action.field] = req.action.value;
                }
            }
        }
    }

    public onEnd() {
        console.log("Socket closed!");
        this.bIsRunning = false;
        this.OnSelect(null, null);
    }

    public UpdateGameDirection(dir: number): void {
        this.playDirection = dir;
        this.sendGameRequest({
            action: { 
                field: "playDirection",
                value: this.playDirection
            },
            invoker: this.localPlayer.getName(),
            target: {
                type: TargetType.Game,
                id: ""
            }
        });
    }

    // player null means the next one
    public NotifyPlayer(player: Player, notification: String): void {
        this.sendGameRequest({
            action: { 
                field: "!notify",
                value: notification
            },
            invoker: this.localPlayer.getName(),
            target: {
                type: TargetType.Player,
                id: player.getName()
            }
        });
    }

    public GetLocalPlayDirection(): number {
        return this.playDirection;
    }

    public GetLocalPlayerID(): String {
        return this.localPlayer.GetID();
    }

    public OnServerResponse(result: any): void {
        if (result.type == "addPlayer") {
            this.AddPlayer(result.player, false);
            return;
        }

        if (result.type == "PlayerWelcome") {
            if (result.Succeeded) {
                // nothing to do
            }
            else {
                this.OnGameRejected(GameRejectReason.PlayerLimitExceeded);
            }
            
            return;
        }

        if (result.type == "gameState") {
            let gs: GameState = (result.value == "lost") ? GameState.Lost : GameState.Won;
            
            if (result.player == this.localPlayer.GetID()) {
                this.localPlayer.SetGameState(gs);
            }

            return;
        }

        if (result.type == "updatePlayer") {
            this.players.forEach(p => {
                if(p.GetID() == result.player) {
                    if (result.field == "maxCardCount")
                        p.SetMaxCardCount(result.value);
                    this.GUI.PlayerList.UpdatePlayer(p);
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
            } else {
                this.players.forEach((p) => {
                    if (p.GetID() == result.player) {
                        console.log("Play Card from player: " + result.player);
                        this.Deck.Game = this;
                        this.Deck.PlayCardByNameOnStack(result.stack, result.card, p, result.revealed);
                        this.GUI.PlayerList.UpdatePlayer(p);
                    }
                });
            }
            return;
        }

        if (result.type == "drawCard") {
            this.players.forEach((p) => {
                if (p.GetID() == result.player) {
                    this.Deck.Game = this;
                    this.Deck.GiveCardByNameTo(result.card, p);
                    this.GUI.PlayerList.UpdatePlayer(p);
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
    }

    public OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo) {
        if (this.localPlayer == null)
            return;
        
        if (pickInfo != null && this.localPlayer.GetPhase() != PlayerGamePhase.Spectating) {
            let card = this.localPlayer.GetOwnCard(pickInfo);
            if (card !== null) {
                this.localPlayer.UnSelectAll();
                card.toogleSelect();
            }
        }
    }

    public EndGame(): void {
        this.sendGameRequest({
            action: "!endGame",
            invoker: this.localPlayer.getName()
        });

        this.bIsRunning = false;
        this.players.forEach(p => { p.SetPhase(PlayerGamePhase.Spectating); });
    }

    public GetPlayersCount(): number {
        return this.players.length;
    }
}