"use strict";
/**
 * MQTT Initialization Module
 * Initializes MQTT connection for Home Assistant discovery
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMqttForHomeAssistant = void 0;
var mqtt_client_1 = require("../mqtt/mqtt_client");
var mqtt_discovery_1 = require("../mqtt/mqtt_discovery");
var logger_1 = require("../utils/logger");
/**
 * Initialize MQTT for Home Assistant Integration
 * This should be called during add-on initialization
 */
function initMqttForHomeAssistant() {
    return new Promise(function (resolve) {
        try {
            // Home Assistant add-on exposes MQTT broker via localhost
            var mqttBroker = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
            
            logger_1.logger.info("Initializing MQTT for Home Assistant at ".concat(mqttBroker));
            
            var mqttClient = (0, mqtt_client_1.initMQTT)(mqttBroker, {
                reconnectPeriod: 5000,
                clientId: "ewelink_ha_addon_".concat(Math.random().toString(16).slice(2, 8)),
            });
            
            if (mqttClient) {
                // Wait for connection before proceeding
                var connectionTimeout = setTimeout(function () {
                    logger_1.logger.warn("MQTT connection timeout");
                    resolve(false);
                }, 10000);
                
                mqttClient.on('connect', function () {
                    clearTimeout(connectionTimeout);
                    logger_1.logger.info("MQTT connected successfully");
                    
                    // Initialize MQTT discovery
                    (0, mqtt_discovery_1.initMQTTDiscovery())();
                    
                    // Publish availability topic
                    mqttClient.publish("homeassistant/ewelink_smart_home/availability", "online", { retain: true });
                    
                    resolve(true);
                });
                
                mqttClient.on('error', function (error) {
                    clearTimeout(connectionTimeout);
                    logger_1.logger.warn("MQTT error: ".concat(error.message));
                    resolve(false);
                });
            }
            else {
                logger_1.logger.warn("Failed to create MQTT client");
                resolve(false);
            }
        }
        catch (error) {
            logger_1.logger.error("Error initializing MQTT: ".concat(error.message));
            resolve(false);
        }
    });
}
exports.initMqttForHomeAssistant = initMqttForHomeAssistant;
