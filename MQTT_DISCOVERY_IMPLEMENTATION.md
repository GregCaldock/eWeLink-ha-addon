# MQTT Discovery Integration for eWeLink Smart Home Add-on

## Overview

This implementation adds MQTT discovery support to the eWeLink Smart Home Home Assistant add-on, allowing entities to be properly registered with unique_id support in Home Assistant's entity registry.

## Problem Solved

Previously, the eWeLink add-on created entities using the Home Assistant REST API (`/api/states/`), which only updates entity states but does not register entities in the entity registry. This caused Home Assistant to show "missing unique_id" errors for all eWeLink entities.

### Root Cause
- REST State API (`/api/states/entity_id`) is for state updates only, not entity registration
- Entity registration and unique_id assignment requires either MQTT Discovery or native Home Assistant components
- The add-on's `getHaDeviceEntityMap()` method only retrieves entities already registered in Home Assistant's entity registry

## Solution: MQTT Discovery

MQTT Discovery is the standard protocol for integrations to register entities with Home Assistant. When an entity is registered via MQTT discovery, Home Assistant:
1. Creates the entity with a unique_id in the entity registry
2. Associates it with a device
3. Properly validates unique_ids

## Implementation Details

### New Files Created

1. **`dist/mqtt/mqtt_discovery.js`**
   - Core MQTT discovery module
   - Functions:
     - `generateUniqueId()` - Generates consistent unique IDs for entities
     - `publishEntityDiscovery()` - Publishes entity discovery messages
     - `publishDeviceDiscovery()` - Publishes device information
     - `publishEntityState()` - Updates entity state via MQTT
     - `removeEntityDiscovery()` - Removes entity discovery
     - `mapEntityTypeToPlatform()` - Maps entity types to MQTT platforms

2. **`dist/lib-ha/initMqtt.js`**
   - Initializes MQTT connection for Home Assistant
   - Handles MQTT broker connection
   - Manages connection retry and error handling

### Modified Files

1. **`dist/lib-ha/WebSocket2Ha.js`**
   - Added import for `mqtt_discovery` module
   - Modified `getHaDeviceEntityMap()` method to publish discovery messages when entities are discovered
   - Each entity now triggers an MQTT discovery publish

2. **`dist/lib-ha/init.js`**
   - Added import for `initMqtt` module
   - MQTT initialization is now called at the start of `init()` function
   - Non-blocking - continues even if MQTT is unavailable

## MQTT Discovery Topics

### Device Configuration
```
homeassistant/device/{device_id}/config
```

### Entity Configuration
```
homeassistant/{platform}/{device_id}/{entity_name}/config
```

Supported platforms:
- switch
- light
- sensor
- binary_sensor
- climate
- fan
- cover
- lock

### Entity State Updates
```
homeassistant/ewelink_smart_home/{device_id}/{entity_name}/state
```

### Availability
```
homeassistant/ewelink_smart_home/availability
```
- Payload: `online` or `offline`
- Retained: true

## Unique ID Generation

Unique IDs are generated using a consistent hash-based approach:
```
ewelink_smart_home_{device_id}_{entity_type}_{hash}
```

Example:
```
ewelink_smart_home_100124a7a30_switch_a1b2c3d4
```

This ensures:
- Uniqueness across devices and entity types
- Consistency across add-on restarts
- No collisions between different entities

## Configuration

### Environment Variables
- `MQTT_BROKER` - MQTT broker URL (default: `mqtt://localhost:1883`)
- Home Assistant add-on automatically exposes MQTT via `localhost:1883`

### Connection Parameters
- Reconnect period: 5 seconds
- Client ID: `ewelink_ha_addon_{random_hex}`
- QoS: 0 (default)
- Retain: true (for discovery messages)

## How It Works

### Startup Flow
1. Add-on starts
2. `init()` function called
3. `initMqttForHomeAssistant()` establishes MQTT connection
4. MQTT discovery module initialized
5. When Home Assistant entity map is retrieved, discovery messages are published
6. Home Assistant entity registry receives discovery messages
7. Entities created with proper unique_id

### Entity Creation Flow
1. `WebSocket2Ha.getHaDeviceEntityMap()` retrieves existing entities
2. For each entity found, `publishEntityDiscovery()` is called
3. MQTT discovery message published to `homeassistant/{platform}/{device_id}/{entity_name}/config`
4. Home Assistant receives message and registers entity with unique_id
5. Entity becomes available in automations, scripts, and UI
6. No more "missing unique_id" errors

## Error Handling

- MQTT connection failures don't prevent add-on startup
- Non-critical MQTT errors logged but don't stop operation
- Add-on continues to function even without MQTT (REST API still works)
- Connection retry with 5-second intervals

## Testing

To verify the implementation:

1. Check Home Assistant logs for MQTT discovery messages:
   ```
   grep -i "mqtt" /Volumes/config/home-assistant.log
   ```

2. Verify entities in Home Assistant:
   - Settings → Devices & Services → Devices
   - Look for eWeLink devices with proper entity registry entries

3. Check entity registry for unique_id:
   ```bash
   python3 << 'EOF'
   import json
   with open('/Volumes/config/.storage/core.entity_registry') as f:
       data = json.load(f)
   ewelink_entities = [e for e in data['data']['entities'] 
                       if 'ewelink' in e.get('unique_id', '')]
   for e in ewelink_entities:
       print(f"{e['entity_id']}: {e['unique_id']}")
   EOF
   ```

## Backward Compatibility

- Existing REST API functionality preserved
- MQTT discovery runs alongside REST API updates
- Non-breaking changes to existing codebase
- Optional MQTT dependency (continues without it)

## Future Enhancements

1. Add configuration option to enable/disable MQTT discovery
2. Support for additional entity types (climate, cover, etc.)
3. MQTT command topics for bi-directional control
4. Discovery message caching to avoid redundant publishes
5. Automatic re-discovery on add-on restart

## References

- [Home Assistant MQTT Discovery Documentation](https://www.home-assistant.io/integrations/mqtt/#discovery)
- [MQTT.js Library](https://github.com/mqttjs/MQTT.js)
- [Home Assistant Entity Registry](https://developers.home-assistant.io/docs/entity_registry_index/)
