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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios"));
var AuthClass_1 = __importDefault(require("../class/AuthClass"));
var url_1 = require("../config/url");
var logger_1 = require("./logger");
var dataUtil_1 = require("./dataUtil");
var registerEntityWithUniqueId = function (entityId, uniqueId) { return __awaiter(void 0, void 0, void 0, function () {
    var restRequest, registryData, error_1;
    return __generator(this, function (_a) {
        // Store unique_id mapping locally for persistence
        try {
            registryData = (0, dataUtil_1.getDataSync)('entity_registry.json', {}) || {};
            registryData[entityId] = uniqueId;
            (0, dataUtil_1.setData)('entity_registry.json', registryData);
        } catch (e) {
            logger_1.logger.debug("Could not store entity registry locally");
        }
        _a.trys.push([0, 2, , 3]);
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
        return [4, restRequest({
            method: 'PATCH',
            url: "/api/config/entity_registry/".concat(entityId.replace('.', '/')),
            data: {
                unique_id: uniqueId,
            },
        }).catch(function () {
            // Try alternative endpoint
            return restRequest({
                method: 'POST',
                url: '/api/config/entity_registry/update',
                data: {
                    entity_id: entityId,
                    unique_id: uniqueId,
                },
            });
        })];
        case 1:
        _a.sent();
        logger_1.logger.debug("Entity registry update sent for: ".concat(entityId));
        return [3, 3];
        case 2:
        error_1 = _a.sent();
        logger_1.logger.debug("Entity registry API not available (may need manual fix in HA)");
        return [3, 3];
        case 3:
        return [2];
    });
}); };
exports.default = registerEntityWithUniqueId;
