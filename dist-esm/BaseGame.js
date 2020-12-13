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
import { SVEGame } from 'svebaselib';
var BaseGame = /** @class */ (function (_super) {
    __extends(BaseGame, _super);
    function BaseGame() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BaseGame.prototype.MaxPlayers = function () {
        return this.maxPlayers;
    };
    return BaseGame;
}(SVEGame));
export default BaseGame;
