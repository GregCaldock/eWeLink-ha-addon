"use strict";
/**
 * MQTT Discovery Module for Home Assistant
 * This module publishes MQTT discovery messages for eWeLink entities
 * to properly register them with unique_id support in Home Assistant
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEntityDiscovery = exports.publishEntityState = exports.publishEntityDiscovery = exports.publishDeviceDiscovery = exports.initMQTTDiscovery = exports.generateUniqueId = void 0;
var mqtt_client_1 = require("./mqtt_client");
var logger_1 = require("../utils/logger");
var crypto = require("crypto");
var DISCOVERY_PREFIX = "homeassistant";
var EWELINK_PREFIX = "ewelink_smart_home";
/**
 * Generate a unique ID for an entity
 */
function generateUniqueId(deviceId, entityType, subId) {
    if (subId === void 0) { subId = null; }
    var input = "".concat(deviceId, "_").concat(entityType).concat(subId ? "_".concat(subId) : "");
    var hash = crypto.createHash('md5').update(input).digest('hex').slice(0, 8);
    return "".concat(EWELINK_PREFIX, "_").concat(deviceId, "_").concat(entityType, "_").concat(hash);
}
exports.generateUniqueId = generateUniqueId;
/**
 * Get the entity name from entity_id
 */
function getEntityName(entityId) {
    return entityId.split('.')[1] || entityId;
}
/**
 * Get the entity type from entity_id (switch, light, sensor, etc)
 */
function getEntityType(entityId) {
    return entityId.split('.')[0] || 'unknown';
}
/**
 * Initialize MQTT Discovery
 * This should be called after MQTT connection is established
 */
function initMQTTDiscovery() {
    return function () {
        var client = (0, mqtt_client_1.getMQTTClient)();
        if (!client) {
            logger_1.logger.warn("MQTT client not available for discovery initialization");
            return;
        }
        logger_1.logger.info("MQTT Discovery module initialized");
    };
}
exports.initMQTTDiscovery = initMQTTDiscovery;
/**
 * Publish device discovery message
 */
function publishDeviceDiscovery(device) {
    var client = (0, mqtt_client_1.getMQTTClient)();
    if (!client || !client.connected) {
        logger_1.logger.warn("MQTT client not connected, cannot publish device discovery for ".concat(device.id));
        return false;
    }
    var deviceConfig = {
        identifiers: ["ewelink_".concat(device.id)],
        name: device.name || "eWeLink Device ".concat(device.id),
        model: device.model || "Unknown",
        manufacturer: "eWeLink"
    };
    var discoveryTopic = "".concat(DISCOVERY_PREFIX, "/device/").concat(device.id, "/config");
    try {
        client.publish(discoveryTopic, JSON.stringify(deviceConfig), { retain: true }, function (err) {
            if (err) {
                logger_1.logger.error("Failed to publish device discovery: ".concat(err.message));
            }
            else {
                logger_1.logger.verbose("Published device discovery for ".concat(device.id));
            }
        });
        return true;
    }
    catch (error) {
        logger_1.logger.error("Error publishing device discovery: ".concat(error.message));
        return false;
    }
}
exports.publishDeviceDiscovery = publishDeviceDiscovery;
/**
 * Publish entity discovery message to Home Assistant
 * This creates the entity in HA's entity registry with proper unique_id
 */
function publishEntityDiscovery(entity, deviceId, stateTopic, commandTopic) {
    var client = (0, mqtt_client_1.getMQTTClient)();
    if (!client || !client.connected) {
        logger_1.logger.warn("MQTT client not connected, cannot publish entity discovery for ".concat(entity.entity_id));
        return false;
    }
    var entityType = getEntityType(entity.entity_id);
    var entityName = getEntityName(entity.entity_id);
    var uniqueId = generateUniqueId(deviceId, entityName);
    // Get platform type based on entity type
    var platform = mapEntityTypeToPlatform(entityType);
    if (!platform) {
        logger_1.logger.warn("Unknown entity type: ".concat(entityType));
        return false;
    }
    // Build base discovery payload
    var payload = {
        name: entity.entity_id.replace(/_/g, ' '),
        unique_id: uniqueId,
        device: {
            identifiers: ["ewelink_".concat(deviceId)],
            name: "eWeLink ".concat(deviceId)
        },
        availability_topic: "".concat(DISCOVERY_PREFIX, "/").concat(EWELINK_PREFIX, "/availability"),
        availability_mode: 'latest'
    };
    // Add platform-specific fields
    if (stateTopic) {
        payload.state_topic = stateTopic;
    }
    if (commandTopic && (entityType === 'switch' || entityType === 'light')) {
        payload.command_topic = commandTopic;
    }
    // Add value templates based on entity type
    switch (entityType) {
        case 'switch':
            payload.payload_on = 'on';
            payload.payload_off = 'off';
            break;
        case 'light':
            payload.brightness_scale = 255;
            payload.payload_on = 'on';
            payload.payload_off = 'off';
            break;
        case 'sensor':
            // Sensors are read-only
            if (entity.attributes && entity.attributes.unit_of_measurement) {
                payload.unit_of_measurement = entity.attributes.unit_of_measurement;
            }
            break;
        case 'binary_sensor':
            payload.payload_on = 'on';
            payload.payload_off = 'off';
            break;
    }
    var discoveryTopic = "".concat(DISCOVERY_PREFIX, "/").concat(platform, "/").concat(deviceId, "/").concat(entityName, "/config");
    try {
        client.publish(discoveryTopic, JSON.stringify(payload), { retain: true }, function (err) {
            if (err) {
                logger_1.logger.error("Failed to publish entity discovery for ".concat(entity.entity_id, ": ").concat(err.message));
            }
            else {
                logger_1.logger.verbose("Published entity discovery for ".concat(entity.entity_id, " (unique_id: ").concat(uniqueId, ")"));
            }
        });
        return true;
    }
    catch (error) {
        logger_1.logger.error("Error publishing entity discovery for ".concat(entity.entity_id, ": ").concat(error.message));
        return false;
    }
}
exports.publishEntityDiscovery = publishEntityDiscovery;
/**
 * Publish entity state update via MQTT
 */
function publishEntityState(entity, state, attributes) {
    var client = (0, mqtt_client_1.getMQTTClient)();
    if (!client || !client.connected) {
        return false;
    }
    var deviceId = (attributes && attributes.device_id) || 'unknown';
    var entityName = getEntityName(entity.entity_id);
    var stateTopic = "homeassistant/".concat(EWELINK_PREFIX, "/").concat(deviceId, "/").concat(entityName, "/state");
    var payload = JSON.stringify({
        state: state,
        attributes: attributes || {}
    });
    try {
        client.publish(stateTopic, payload, { retain: false }, function (err) {
            if (err) {
                logger_1.logger.verbose("Failed to publish state for ".concat(entity.entity_id));
            }
        });
        return true;
    }
    catch (error) {
        logger_1.logger.verbose("Error publishing state: ".concat(error.message));
        return false;
    }
}
exports.publishEntityState = publishEntityState;
/**
 * Map entity type to MQTT discovery platform
 */
function mapEntityTypeToPlatform(entityType) {
    var platformMap = {
        'switch': 'switch',
        'light': 'light',
        'sensor': 'sensor',
        'binary_sensor': 'binary_sensor',
        'climate': 'climate',
        'fan': 'fan',
        'cover': 'cover',
        'lock': 'lock'
    };
    return platformMap[entityType] || null;
}
/**
 * Remove entity discovery message
 */
function removeEntityDiscovery(entity, deviceId) {
    var client = (0, mqtt_client_1.getMQTTClient)();
    if (!client || !client.connected) {
        return false;
    }
    var entityType = getEntityType(entity.entity_id);
    var entityName = getEntityName(entity.entity_id);
    var platform = mapEntityTypeToPlatform(entityType);
    if (!platform) {
        return false;
    }
    var discoveryTopic = "".concat(DISCOVERY_PREFIX, "/").concat(platform, "/").concat(deviceId, "/").concat(entityName, "/config");
    try {
        client.publish(discoveryTopic, '', { retain: true }, function (err) {
            if (err) {
                logger_1.logger.verbose("Failed to remove entity discovery for ".concat(entity.entity_id));
            }
            else {
                logger_1.logger.verbose("Removed entity discovery for ".concat(entity.entity_id));
            }
        });
        return true;
    }
    catch (error) {
        logger_1.logger.verbose("Error removing entity discovery: ".concat(error.message));
        return false;
    }
}
exports.removeEntityDiscovery = removeEntityDiscovery;
