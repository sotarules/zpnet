/**
 * ZPNet SERVER/SYSTEM Subsystem
 *
 * Meteor port of the Pi-side system process pattern.
 *
 * This is the SERVER machine's SYSTEM subsystem — the first and
 * primary subsystem registered on the Meteor server.
 *
 * Events and timebase data arrive via the REST API (/api/events,
 * /api/timebase) using a despooler/acknowledge model for durability.
 * The pubsub bus is used only for commands.
 *
 * Commands:
 *   • REPORT   — basic SERVER health snapshot
 *   • HEALTH   — simple alive/ok response
 */

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------

let _connected = false

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
 */
ZPNetSystem = {
    init() {
        ZPNetProcess.serverSetup({
            subsystem: "SYSTEM",
            commands: {
                REPORT: cmdReport,
                HEALTH: cmdHealth,
            },
        })

        ZPNetProcess.connect()
        OLog.debug("system.js ZPNetSystem *init*")
    }
}