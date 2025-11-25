"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMQTTClient = exports.initMQTT = void 0;
var mqtt = require("mqtt");
var logger_1 = require("../utils/logger");
var mqttClient = null;
var initMQTT = function (brokerUrl, options) {
    try {
        mqttClient = mqtt.connect(brokerUrl, options || {
            reconnectPeriod: 5000,
            clientId: "ewelink_ha_addon_".concat(Math.random().toString(16).slice(2, 8)),
        });
        mqttClient.on('connect', function () {
            logger_1.logger.info("Connected to MQTT broker");
            mqttClient.publish("homeassistant/ewelink/availability", "online", { retain: true });
        });
        mqttClient.on('error', function (error) {
            logger_1.logger.warn("MQTT connection error: ".concat(error.message));
        });
        mqttClient.on('disconnect', function () {
            logger_1.logger.info("Disconnected from MQTT broker");
            mqttClient.publish("homeassistant/ewelink/availability", "offline", { retain: true });
        });
        return mqttClient;
    }
    catch (error) {
        logger_1.logger.warn("Failed to initialize MQTT: ".concat(error.message));
        return null;
    }
};
exports.initMQTT = initMQTT;
var getMQTTClient = function () {
    return mqttClient;
};
exports.getMQTTClient = getMQTTClient;
