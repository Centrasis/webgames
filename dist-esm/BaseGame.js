export var GameRejectReason;
(function (GameRejectReason) {
    GameRejectReason[GameRejectReason["GameNotPresent"] = 0] = "GameNotPresent";
    GameRejectReason[GameRejectReason["PlayerLimitExceeded"] = 1] = "PlayerLimitExceeded";
})(GameRejectReason || (GameRejectReason = {}));
var BaseGame = /** @class */ (function () {
    function BaseGame() {
    }
    return BaseGame;
}());
export default BaseGame;
