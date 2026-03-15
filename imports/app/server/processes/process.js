import net from "net"

/**
 * ZPNet Process Runtime (Server-Side)
 *
 * Meteor port of the Pi-side processes.py pattern.
 *
 * A process declares:
 *   • its subsystem name
 *   • the commands it serves
 *   • the topics it subscribes to (topic → handler)
 *   • no routing logic whatsoever
 *
 * All transport (TCP to Pi pubsub) is owned here.
 *
 * Machine routing:
 *   • SERVER  — local dispatch (never leaves this process)
 *   • PI      — via pubsub TCP bridge
 *   • TEENSY  — via pubsub TCP bridge
 *
 * Wire protocol (must match Pi pubsub/core.py):
 *   • { "type": "subscribe", "subscriptions": [...] }
 *   • { "type": "command",   "req_id": N, "machine": "...", ... }
 *   • { "type": "response",  "req_id": N, "success": bool, ... }
 *   • { "type": "publish",   "topic": "...", "payload": {...} }
 */

// ---------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------

const PUBSUB_HOST = "127.0.0.1"
const PUBSUB_PORT = 9800
const RECONNECT_INTERVAL_MS = 5000
const COMMAND_TIMEOUT_MS = 30000

// ---------------------------------------------------------------------
// Connection state
// ---------------------------------------------------------------------

let _conn = null
let _recvBuf = ""
let _reqIdCounter = 1
let _reconnectTimer = null

// Pending command responses: req_id → { resolve, reject, timer }
const _pendingCommands = new Map()

// Registered subsystems: subsystem → { commands, subscriptions }
const _subsystems = new Map()

// Publication handlers: topic → [handler, handler, ...]
const _topicHandlers = new Map()

// Command handlers: "SUBSYSTEM.COMMAND" → handler
const _commandHandlers = new Map()

// Connection state callbacks
const _connectCallbacks = []
const _disconnectCallbacks = []

// ---------------------------------------------------------------------
// TCP connection management
// ---------------------------------------------------------------------

function connect() {
    if (_conn) return

    const conn = net.createConnection({ host: PUBSUB_HOST, port: PUBSUB_PORT }, Meteor.bindEnvironment(() => {
        OLog.debug(`process.js connect *connected* ${PUBSUB_HOST}:${PUBSUB_PORT}`)
        _conn = conn
        _recvBuf = ""
        _connectCallbacks.forEach(cb => {
            try { cb() } catch (e) { OLog.error(`process.js connect callback error: ${e.message}`) }
        })
        _sendSubscriptions()
    }))

    conn.setEncoding("utf8")

    conn.on("data", Meteor.bindEnvironment((chunk) => {
        _recvBuf += chunk
        let nlIdx
        while ((nlIdx = _recvBuf.indexOf("\n")) !== -1) {
            const line = _recvBuf.slice(0, nlIdx).trim()
            _recvBuf = _recvBuf.slice(nlIdx + 1)
            if (!line) continue
            const msg = JSON.parse(line)
            _dispatch(msg)
        }
    }))

    conn.on("error", Meteor.bindEnvironment((err) => {
        OLog.warn(`process.js connection error: ${err.message}`)
    }))

    conn.on("close", Meteor.bindEnvironment(() => {
        OLog.debug("process.js connection *close*")
        _conn = null
        _recvBuf = ""
        for (const [reqId, pending] of _pendingCommands) {
            clearTimeout(pending.timer)
            pending.reject(new Error("disconnected"))
        }
        _pendingCommands.clear()
        _disconnectCallbacks.forEach(cb => {
            try { cb() } catch (e) { OLog.error(`process.js disconnect callback error: ${e.message}`) }
        })
        _scheduleReconnect()
    }))
}

function disconnect() {
    if (_reconnectTimer) {
        clearTimeout(_reconnectTimer)
        _reconnectTimer = null
    }
    if (_conn) {
        _conn.destroy()
        _conn = null
    }
}

function _scheduleReconnect() {
    if (_reconnectTimer) return
    _reconnectTimer = setTimeout(Meteor.bindEnvironment(() => {
        _reconnectTimer = null
        connect()
    }), RECONNECT_INTERVAL_MS)
}

function isConnected() {
    return _conn !== null
}

// ---------------------------------------------------------------------
// Wire protocol — send
// ---------------------------------------------------------------------

function _send(msg) {
    if (!_conn) return false
    const line = JSON.stringify(msg) + "\n"
    _conn.write(line)
    return true
}

function _sendSubscriptions() {
    const subscriptions = []
    for (const [subsystem, config] of _subsystems) {
        const topicNames = Object.keys(config.subscriptions || {})
        subscriptions.push({
            machine: "SERVER",
            subsystem,
            subscriptions: topicNames.map(name => ({ name })),
        })
    }
    _send({ type: "subscribe", subscriptions })
}

// ---------------------------------------------------------------------
// Wire protocol — receive dispatch
// ---------------------------------------------------------------------

function _dispatch(msg) {
    switch (msg.type) {
    case "publish":
        _handlePublish(msg)
        break
    case "command":
        _handleCommand(msg)
        break
    case "response":
        _handleResponse(msg)
        break
    default:
        OLog.warn(`process.js dispatch unknown message type: ${msg.type}`)
    }
}

function _handlePublish(msg) {
    const handlers = _topicHandlers.get(msg.topic)
    if (!handlers || handlers.length === 0) return
    for (const handler of handlers) {
        handler(msg.payload)
    }
}

function _handleCommand(msg) {
    const key = `${msg.subsystem}.${msg.command}`
    const handler = _commandHandlers.get(key)
    let resp
    if (!handler) {
        resp = {
            type: "response",
            req_id: msg.req_id,
            success: false,
            message: "unknown command",
            payload: { error: `${key} not registered` },
        }
    } else {
        const result = handler(msg.args || null)
        resp = {
            type: "response",
            req_id: msg.req_id,
            success: result.success !== undefined ? result.success : true,
            message: result.message || "OK",
            payload: result.payload || {},
        }
    }
    _send(resp)
}

function _handleResponse(msg) {
    const pending = _pendingCommands.get(msg.req_id)
    if (!pending) {
        OLog.warn(`process.js response for unknown req_id=${msg.req_id}`)
        return
    }
    _pendingCommands.delete(msg.req_id)
    clearTimeout(pending.timer)
    pending.resolve({
        success: msg.success,
        message: msg.message,
        payload: msg.payload || {},
    })
}

// ---------------------------------------------------------------------
// Public API — sendCommand (returns Promise)
// ---------------------------------------------------------------------

/**
 * Send a command to a machine on the ZPNet bus.
 *
 * Machine routing:
 *   • SERVER  — dispatched locally (never leaves this process)
 *   • PI      — relayed via pubsub TCP bridge
 *   • TEENSY  — relayed via pubsub TCP bridge
 *
 * @param {string} machine - Target machine: "SERVER", "PI", or "TEENSY"
 * @param {string} subsystem - Target subsystem
 * @param {string} command - Command name
 * @param {object} [args] - Optional arguments
 * @returns {Promise<{success, message, payload}>}
 */
function sendCommand(machine, subsystem, command, args) {
    // LOCAL dispatch — SERVER commanding itself
    if (machine === "SERVER") {
        const key = `${subsystem}.${command}`
        const handler = _commandHandlers.get(key)
        if (!handler) {
            return Promise.resolve({
                success: false,
                message: `unknown command: ${key}`,
                payload: {},
            })
        }
        const result = handler(args || null)
        return Promise.resolve({
            success: result.success !== undefined ? result.success : true,
            message: result.message || "OK",
            payload: result.payload || {},
        })
    }

    // REMOTE dispatch — PI or TEENSY via pubsub TCP bridge
    return new Promise((resolve, reject) => {
        if (!_conn) {
            reject(new Error("not connected to pubsub"))
            return
        }
        const reqId = _reqIdCounter++
        const timer = setTimeout(() => {
            _pendingCommands.delete(reqId)
            reject(new Error(`command timeout: ${machine}.${subsystem}.${command}`))
        }, COMMAND_TIMEOUT_MS)
        _pendingCommands.set(reqId, { resolve, reject, timer })
        const wireMsg = { type: "command", req_id: reqId, machine, subsystem, command }
        if (args !== undefined && args !== null) {
            wireMsg.args = args
        }
        if (!_send(wireMsg)) {
            _pendingCommands.delete(reqId)
            clearTimeout(timer)
            reject(new Error("send failed"))
        }
    })
}

// ---------------------------------------------------------------------
// Public API — publish (fire-and-forget)
// ---------------------------------------------------------------------

/**
 * Publish a message to the ZPNet bus.
 *
 * @param {string} topic - Topic name
 * @param {object} payload - Message payload
 */
function zpnetPublish(topic, payload) {
    _send({ type: "publish", topic, payload })
}

// ---------------------------------------------------------------------
// Public API — process registration (declarative)
// ---------------------------------------------------------------------

/**
 * Register a SERVER-side subsystem.
 *
 * Modeled directly after Python server_setup():
 *   • Declares commands and subscriptions
 *   • Commands are dispatch table entries
 *   • Subscriptions are topic → handler mappings
 *
 * Call before connect(). Multiple subsystems may be registered.
 *
 * @param {object} opts
 * @param {string} opts.subsystem - Subsystem name (e.g., "SYSTEM")
 * @param {object} [opts.commands] - { COMMAND_NAME: handler(args) → {success, message, payload} }
 * @param {object} [opts.subscriptions] - { TOPIC_NAME: handler(payload) }
 */
function serverSetup({ subsystem, commands = {}, subscriptions = {} }) {
    _subsystems.set(subsystem, { commands, subscriptions })
    for (const [cmd, handler] of Object.entries(commands)) {
        _commandHandlers.set(`${subsystem}.${cmd}`, handler)
    }
    for (const [topic, handler] of Object.entries(subscriptions)) {
        if (!_topicHandlers.has(topic)) {
            _topicHandlers.set(topic, [])
        }
        _topicHandlers.get(topic).push(handler)
    }
    // Implicit SUBSCRIPTIONS command (same as Python)
    _commandHandlers.set(`${subsystem}.SUBSCRIPTIONS`, () => ({
        success: true,
        message: "OK",
        payload: {
            machine: "SERVER",
            subsystem,
            subscriptions: Object.keys(subscriptions).map(name => ({ name })),
        },
    }))
    OLog.debug(`process.js serverSetup *registered* subsystem=${subsystem}`)
}

// ---------------------------------------------------------------------
// Public API — lifecycle hooks
// ---------------------------------------------------------------------

function onConnect(cb) { _connectCallbacks.push(cb) }
function onDisconnect(cb) { _disconnectCallbacks.push(cb) }

// ---------------------------------------------------------------------
// Exports (ZPNet global for Meteor consistency)
// ---------------------------------------------------------------------

ZPNetProcess = {
    connect,
    disconnect,
    isConnected,
    serverSetup,
    sendCommand,
    publish: zpnetPublish,
    onConnect,
    onDisconnect,
}