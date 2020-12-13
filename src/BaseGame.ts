import * as BABYLON from 'babylonjs';
import { GameRequest, SVEAccount, SVEGame } from 'svebaselib';

export interface Commandable {
    executeCommand(cmd: string, req: GameRequest);
}

export default abstract class BaseGame extends SVEGame {
    public abstract CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    public abstract Tick(): void;
//    public abstract AddPlayer(user: SVEAccount, isLocal: Boolean): void;
    public abstract MinPlayers(): number;
    public abstract GetPlayersCount(): number;
    public OnNewPlayer: () => void;

    public MaxPlayers(): number {
        return this.maxPlayers;
    }
}