"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }); 
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) { _.ops.pop();
                    _.trys.pop(); continue;
                }
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios"));
var AuthClass_1 = __importDefault(require("../class/AuthClass"));
var url_1 = require("../config/url");
var logger_1 = require("./logger");
var registerEntityWithUniqueId = function (entityId, uniqueId) { return __awaiter(void 0, void 0, void 0, function () {
    var restRequest, entityRegistryData, entityRegistry, matchedEntity, updateData, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                restRequest = axios_1.default.create({
                    baseURL: url_1.HaRestURL,
                    timeout: 5000,
                });
                restRequest.interceptors.request.use(function (val) {
                    val.headers = {
                        Authorization: "Bearer ".concat(AuthClass_1.default.curAuth),
                        'Content-Type': 'application/json',
                    };
                    return val;
                });
                return [4, restRequest.get('/api/config/entity_registry/list')];
            case 1:
                entityRegistryData = _a.sent();
                if (!entityRegistryData.data) return [3, 4];
                entityRegistry = entityRegistryData.data;
                matchedEntity = entityRegistry.find(function (e) { return e.entity_id === entityId; });
                if (!matchedEntity) return [3, 4];
                updateData = {
                    unique_id: uniqueId,
                };
                return [4, restRequest({
                        method: 'POST',
                        url: "/api/config/entity_registry/update/".concat(matchedEntity.id),
                        data: updateData,
                    })];
            case 2:
                _a.sent();
                logger_1.logger.debug("Updated unique_id in HA entity registry: ".concat(entityId, " -> ").concat(uniqueId));
                return [3, 5];
            case 3:
                error_1 = _a.sent();
                logger_1.logger.debug("Could not update entity registry for ".concat(entityId, ": ").concat(error_1.message));
                return [3, 5];
            case 4: return [2];
            case 5: return [2];
        }
    });
}); };
exports.default = registerEntityWithUniqueId;
