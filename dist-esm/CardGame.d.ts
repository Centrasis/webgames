import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import * as GUI from 'babylonjs-gui';
import BaseGame from './BaseGame';
import { SVEAccount, SVEGame, GameState, GameInfo, GameRequest } from 'svebaselib';
export declare enum PlayerGamePhase {
    Spectating = 0,
    SelectingCard = 1,
    SelectingStack = 2
}
export declare class Card {
    protected mesh: BABYLON.Mesh;
    protected value: number;
    width: number;
    size: number;
    protected bIsSelected: Boolean;
    protected highlightLayer: BABYLON.HighlightLayer;
    protected upVector: BABYLON.Vector3;
    protected effect: () => void;
    protected bIsRevealed: Boolean;
    GetMesh(): BABYLON.AbstractMesh;
    SetEffect(effect: () => void): void;
    InvokeEffect(): void;
    GetValue(): number;
    IsSelected(): Boolean;
    constructor(value: number, materials: Map<number, Materials.MixMaterial>, scene: BABYLON.Scene, hl: BABYLON.HighlightLayer);
    toogleSelect(): void;
    setPosition(loc: BABYLON.Vector3): void;
    uplift(camera: BABYLON.FreeCamera): void;
    reveal(): void;
    IsRevealed(): Boolean;
    cover(): void;
}
export declare enum StackDirection {
    Upwards = 0,
    Downwards = 1,
    Undef = 2
}
export declare enum StackType {
    Push = 0,
    Pop = 1,
    FreeForEverything = 2
}
export declare class CardStack {
    protected Cards: Card[];
    protected direction: StackDirection;
    protected type: StackType;
    protected position: BABYLON.Vector3;
    protected id: String;
    Game: SVEGame;
    protected card_distance: number;
    constructor(dir: StackDirection, type: StackType, id: String);
    GetID(): String;
    GetCards(): Card[];
    check(card: Card): Boolean;
    GiveCardByNameTo(card_name: String, player: Player): void;
    /** No Replication */
    TakeCardByName(card_name: String): Card;
    setPosition(loc: BABYLON.Vector3): void;
    /** Does not replicate */
    addCardLocal(card: Card, shouldReveal?: Boolean): void;
    update(): void;
    /** Does replicate */
    addCard(card: Card, previousOwner: Player, shouldReveal?: Boolean): void;
    GetCard(pick: BABYLON.PickingInfo): Card;
    /** Does not replicate */
    DrawCard(): Card;
    ForceSetCards(cards: Card[]): void;
    GetCardsCount(): number;
    /** replicates */
    PlayCardOnStack(player: Player): boolean;
}
export declare abstract class BaseCardDeck {
    protected stacks: CardStack[];
    protected position: BABYLON.Vector3;
    Game: SVEGame;
    abstract GetNumberOfCardsInDeck(): number;
    setPosition(loc: BABYLON.Vector3): void;
    drawCard(stackID: String): Card;
    PlayCardFromDeckOnStack(id: String, card_name: String, shouldReveal?: Boolean): void;
    /** Dose not replicate */
    PlayCardByNameOnStack(id: String, card_name: String, player: Player, shouldReveal?: Boolean): void;
    PlayCardOnStack(id: String, player: Player): void;
    GetStackFromPick(pick: BABYLON.PickingInfo): CardStack;
    abstract GiveCardByNameTo(card_name: String, player: Player): void;
}
export declare class Player extends SVEAccount {
    protected cards: Card[];
    protected maxCardCount: number;
    protected cardOrigin: BABYLON.Vector3;
    protected phase: PlayerGamePhase;
    protected bHasTurn: Boolean;
    Game: SVEGame;
    protected isLocal: Boolean;
    protected gameState: GameState;
    camera: BABYLON.FreeCamera;
    constructor(decoratee: SVEAccount, maxCardCount: number, isLocal: Boolean);
    GetPhase(): PlayerGamePhase;
    SetPhase(p: PlayerGamePhase): void;
    commitToServer(): void;
    /** No replication */
    dropCards(): void;
    SetHasTurn(val: Boolean): void;
    GetID(): String;
    SetMaxCardCount(count: number): void;
    GetCards(): Card[];
    GetOwnCard(pick: BABYLON.PickingInfo): Card;
    UnSelectAll(): void;
    GetCardsCount(): number;
    GetMaxCardCount(): number;
    GetSelectedCard(): Card;
    PlaySelectedCard(): Card;
    drawCards(stack: CardStack): void;
    drawNumberOfCards(stack: CardStack, count: number): void;
    update(): void;
    SetOrigin(loc: BABYLON.Vector3): void;
    /** Replicates */
    AddCard(card: Card): void;
    AddCardLocal(card: Card): void;
    IsLocalPlayer(): Boolean;
    SetGameState(gs: GameState): void;
    GetGameState(): GameState;
}
export declare class PlayerListUI {
    protected GUI: GUI.AdvancedDynamicTexture;
    protected players: Map<Player, GUI.TextBlock>;
    protected textColor: string;
    protected textActiveColor: string;
    GetTextOfPlayerLine: (player: Player) => string;
    constructor(GUI: GUI.AdvancedDynamicTexture);
    AddPlayer(player: Player): void;
    UpdatePlayer(player: Player): void;
    private GetTextOfPlayerMethod;
    GetPlayersTexts(): string[];
    SetPlayerActive(player: Player): void;
}
export declare class VotingUI {
    protected GUI: GUI.AdvancedDynamicTexture;
    protected votes: GUI.Button[];
    protected caption: GUI.TextBlock;
    constructor(gui: GUI.AdvancedDynamicTexture, caption: string, votes: string[], onVote: (val: String) => void);
    removeAll(): void;
}
export declare class BaseGameGUI {
    protected GUI: GUI.AdvancedDynamicTexture;
    PlayerList: PlayerListUI;
    NextRoundSound: BABYLON.Sound;
    constructor(scene: BABYLON.Scene);
    RememberItsYourTurn(): void;
}
export declare abstract class CardGame extends BaseGame {
    private playDirection;
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
    protected enableZMovement: boolean;
    constructor(info: GameInfo);
    abstract CheckGameState(): GameState;
    StartLocalPlayersRound(): void;
    SetInitialCardCount(cardsCount: number): void;
    StartGame(): void;
    IsRunning(): Boolean;
    IsHostInstance(): Boolean;
    CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    protected OnEndLocalRound(): void;
    GiveUp(): void;
    InvokeNextPlayerRound(): void;
    AddPlayer(user: SVEAccount, isLocal: Boolean, player?: Player): void;
    onJoined(): void;
    onRequest(req: GameRequest): void;
    onEnd(): void;
    UpdateGameDirection(dir: number): void;
    NotifyPlayer(player: Player, notification: String): void;
    GetLocalPlayDirection(): number;
    GetLocalPlayerID(): String;
    OnServerResponse(result: any): void;
    OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo): void;
    EndGame(): void;
    GetPlayersCount(): number;
}
//# sourceMappingURL=CardGame.d.ts.map