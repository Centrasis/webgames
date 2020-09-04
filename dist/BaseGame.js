"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRejectReason = void 0;
var GameRejectReason;
(function (GameRejectReason) {
    GameRejectReason[GameRejectReason["GameNotPresent"] = 0] = "GameNotPresent";
    GameRejectReason[GameRejectReason["PlayerLimitExceeded"] = 1] = "PlayerLimitExceeded";
})(GameRejectReason = exports.GameRejectReason || (exports.GameRejectReason = {}));
var BaseGame = /** @class */ (function () {
    function BaseGame() {
    }
    return BaseGame;
}());
exports.default = BaseGame;
