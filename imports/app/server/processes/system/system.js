/**
 * ZPNet SERVER/SYSTEM Subsystem
 *
 * Meteor port of the Pi-side system process pattern.
 *
 * This is the SERVER machine's SYSTEM subsystem — the first and
 * primary subsystem registered on the Meteor server.
 *
 * Subscriptions:
 *   • EVENTS   — live event stream from Teensy (for display)
 *   • TIMEBASE — time domain data for dashboard
 *
 * Commands:
 *   • REPORT   — basic SERVER health snapshot
 *   • HEALTH   — simple alive/ok response
 */

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------

let _connected = false
let _lastEventTs = null
let _lastTimebaseTs = null
let _eventCount = 0
let _timebaseCount = 0

// External handlers (set by caller at init time)
let _onEvents = null
let _onTimebase = null

// ---------------------------------------------------------------------
// Subscription handlers
// ---------------------------------------------------------------------

function onEvents(payload) {
    _eventCount++
    _lastEventTs = new Date().toISOString()
    if (_onEvents) {
        _onEvents(payload)
    }
}

function onTimebase(payload) {
    _timebaseCount++
    _lastTimebaseTs = new Date().toISOString()
    if (_onTimebase) {
        _onTimebase(payload)
    }
}

// ---------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------

function cmdReport() {
    return {
        success: true,
        message: "OK",
        payload: {
            machine: "SERVER",
            subsystem: "SYSTEM",
            connected: _connected,
            event_count: _eventCount,
            timebase_count: _timebaseCount,
            last_event_ts: _lastEventTs,
            last_timebase_ts: _lastTimebaseTs,
        },
    }
}

function cmdHealth() {
    return {
        success: true,
        message: "OK",
        payload: {
            health_state: _connected ? "NOMINAL" : "DOWN",
        },
    }
}

// ---------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------

ZPNetProcess.onConnect(() => {
    _connected = true
    OLog.debug("system.js SERVER *connected* to ZPNet bus")
})

ZPNetProcess.onDisconnect(() => {
    _connected = false
    OLog.debug("system.js SERVER *disconnected* from ZPNet bus")
})

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Initialize the SERVER/SYSTEM subsystem.
 *
 * Call from Meteor.startup() or doAppServerStartup().
 *
 * @param {object} [opts]
 * @param {function} [opts.onEvents] - Handler for EVENTS publications
 * @param {function} [opts.onTimebase] - Handler for TIMEBASE publications
 */
ZPNetSystem = {
    init(opts = {}) {
        if (opts.onEvents) _onEvents = opts.onEvents
        if (opts.onTimebase) _onTimebase = opts.onTimebase

        ZPNetProcess.serverSetup({
            subsystem: "SYSTEM",
            commands: {
                REPORT: cmdReport,
                HEALTH: cmdHealth,
            },
            subscriptions: {
                EVENTS: onEvents,
                TIMEBASE: onTimebase,
            },
        })

        ZPNetProcess.connect()
        OLog.debug("system.js ZPNetSystem *init*")
    }
}
