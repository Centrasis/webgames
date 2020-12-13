import * as BABYLON from 'babylonjs';
import { GameRequest, SVEGame } from 'svebaselib';
export interface Commandable {
    executeCommand(cmd: string, req: GameRequest): any;
}
export default abstract class BaseGame extends SVEGame {
    abstract CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
    abstract Tick(): void;
    abstract MinPlayers(): number;
    abstract GetPlayersCount(): number;
    OnNewPlayer: () => void;
    MaxPlayers(): number;
}
//# sourceMappingURL=BaseGame.d.ts.map