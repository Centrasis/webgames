import * as BABYLON from 'babylonjs';
import * as Materials from 'babylonjs-materials';
import * as GUI from 'babylonjs-gui';
import BaseGame, { SVEGame } from './BaseGame';
import { SVEAccount, GameState, GameInfo, GameRequest } from 'svebaselib';
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
    onRequest(req: GameRequest): void;
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
    protected static Game: SVEGame;
    protected caption: GUI.TextBlock;
    protected static votesList: string[];
    protected static playersCount: number;
    static onGameStartVoteResult: (res: string) => void;
    constructor(gui: GUI.AdvancedDynamicTexture, caption: string, votes: string[], game: SVEGame, onVote: (val: String) => void);
    removeAll(): void;
    postVote(voteType: "vote" | "SelfOnly", voteID: string, value: any, player: Player): void;
    static onRequest(req: GameRequest): void;
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
    protected playerIndexThatHasTurn: number;
    protected Deck: BaseCardDeck;
    protected localPlayer: Player;
    protected gameID: String;
    protected highlightLayer: BABYLON.HighlightLayer;
    protected GUI: BaseGameGUI;
    protected enableZMovement: boolean;
    constructor(info: GameInfo);
    CheckGameState(): GameState;
    StartLocalPlayersRound(): void;
    SetInitialCardCount(cardsCount: number): void;
    onStart(): void;
    setPlayerToStart(name: string): void;
    CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    protected OnEndLocalRound(): void;
    InvokeNextPlayerRound(): void;
    onJoined(user: SVEAccount): void;
    protected onPlayersRoundBegin(player: Player): void;
    protected onNotify(notification: string, invoker: Player, target?: Player): void;
    onRequest(req: GameRequest): void;
    UpdateGameDirection(dir: number): void;
    protected onGameDirectionChanged(): void;
    GetLocalPlayDirection(): number;
    GetLocalPlayerID(): String;
    GetLocalPlayer(): Player;
    OnSelect(evt: PointerEvent, pickInfo: BABYLON.PickingInfo): void;
    onEnd(): void;
    GetPlayersCount(): number;
}
//# sourceMappingURL=CardGame.d.ts.map