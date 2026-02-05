"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.ActionResult = exports.ActionType = exports.SetStatus = exports.MatchStatus = exports.Position = exports.UserRole = void 0;
// Enums
var UserRole;
(function (UserRole) {
    UserRole["ATHLETE"] = "ATHLETE";
    UserRole["COACH"] = "COACH";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var Position;
(function (Position) {
    Position["SETTER"] = "SETTER";
    Position["OUTSIDE_HITTER"] = "OUTSIDE_HITTER";
    Position["OPPOSITE"] = "OPPOSITE";
    Position["MIDDLE_BLOCKER"] = "MIDDLE_BLOCKER";
    Position["LIBERO"] = "LIBERO";
})(Position || (exports.Position = Position = {}));
var MatchStatus;
(function (MatchStatus) {
    MatchStatus["SCHEDULED"] = "SCHEDULED";
    MatchStatus["IN_PROGRESS"] = "IN_PROGRESS";
    MatchStatus["FINALIZED"] = "FINALIZED";
    MatchStatus["CANCELLED"] = "CANCELLED";
})(MatchStatus || (exports.MatchStatus = MatchStatus = {}));
var SetStatus;
(function (SetStatus) {
    SetStatus["IN_PROGRESS"] = "IN_PROGRESS";
    SetStatus["FINALIZED"] = "FINALIZED";
})(SetStatus || (exports.SetStatus = SetStatus = {}));
var ActionType;
(function (ActionType) {
    ActionType["SERVE"] = "SERVE";
    ActionType["ATTACK"] = "ATTACK";
    ActionType["BLOCK"] = "BLOCK";
    ActionType["RECEPTION"] = "RECEPTION";
    ActionType["DEFENSE"] = "DEFENSE";
    ActionType["SET"] = "SET";
    ActionType["SUBSTITUTION"] = "SUBSTITUTION";
    ActionType["FAULT"] = "FAULT";
    ActionType["ROTATION"] = "ROTATION";
})(ActionType || (exports.ActionType = ActionType = {}));
var ActionResult;
(function (ActionResult) {
    ActionResult["ACE"] = "ACE";
    ActionResult["SERVE_ERROR"] = "SERVE_ERROR";
    ActionResult["SERVE_IN"] = "SERVE_IN";
    ActionResult["ATTACK_POINT"] = "ATTACK_POINT";
    ActionResult["ATTACK_ERROR"] = "ATTACK_ERROR";
    ActionResult["ATTACK_BLOCKED"] = "ATTACK_BLOCKED";
    ActionResult["BLOCK_POINT"] = "BLOCK_POINT";
    ActionResult["BLOCK_TOUCH"] = "BLOCK_TOUCH";
    ActionResult["BLOCK_MISS"] = "BLOCK_MISS";
    ActionResult["RECEPTION_A"] = "RECEPTION_A";
    ActionResult["RECEPTION_B"] = "RECEPTION_B";
    ActionResult["RECEPTION_C"] = "RECEPTION_C";
    ActionResult["RECEPTION_D"] = "RECEPTION_D";
    ActionResult["DEFENSE_SUCCESS"] = "DEFENSE_SUCCESS";
    ActionResult["DEFENSE_FAIL"] = "DEFENSE_FAIL";
    ActionResult["SET_SUCCESS"] = "SET_SUCCESS";
    ActionResult["SET_ERROR"] = "SET_ERROR";
    ActionResult["SUCCESS"] = "SUCCESS";
    ActionResult["ERROR"] = "ERROR";
})(ActionResult || (exports.ActionResult = ActionResult = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["MATCH_REPORT"] = "MATCH_REPORT";
    NotificationType["SYSTEM_UPDATE"] = "SYSTEM_UPDATE";
    NotificationType["TEAM_ANNOUNCEMENT"] = "TEAM_ANNOUNCEMENT";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
