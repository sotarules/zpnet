import WebSocket from "ws"

Meteor.publish("battery_status", function (dashboardSettings) {
    try {
        OLog.warn(`publications.js battery_status *start* dashboardSettings=${OLog.warnString(dashboardSettings)}`, this.userId)
        const cursor = VXApp.handlePublishAggregate(dashboardSettings, VXApp.aggregateBatteryStatus, this, 20000)
        OLog.warn(`publications.js battery_status count=${cursor.count()}`, this.userId)
        return cursor
    } catch (error) {
        OLog.error(`publications.js battery_status Error: ${error.message}`, this.userId)
    }
})

Meteor.publish("zpnet_events", function (zpnetEventsSettings) {
    try {
        OLog.warn(`publications.js zpnet_events *start* zpnetEventsSettings=${OLog.warnString(zpnetEventsSettings)}`, this.userId)
        const publishRequest = VXApp.makeZPNetPublishRequest(zpnetEventsSettings)
        const cursor = ZPNetEvents.find(publishRequest.criteria, publishRequest.options)
        OLog.warn(`publications.js zpnet_events count=${cursor.count()}`, this.userId)
        return cursor
    } catch (error) {
        OLog.error(`publications.js zpnet_events Error: ${error.message}`, this.userId)
    }
})

Meteor.publish("dashboard_readout", function() {

    const self = this

    const COLLECTION = "dashboard_readout"
    const DOC_ID = "readout"

    // ---- ensure websocket exists ----
    function ensureWebSocket(state) {
        if (state.ws) return

        state.ws = new WebSocket("ws://127.0.0.1:8765")

        state.ws.on("message", (data) => {
            let payload
            try {
                payload = JSON.parse(data.toString())
            } catch {
                return
            }

            const first = !state.lastPayload
            state.lastPayload = payload

            state.subscribers.forEach((sub) => {
                if (first) {
                    sub.added(COLLECTION, DOC_ID, payload)
                } else {
                    sub.changed(COLLECTION, DOC_ID, payload)
                }
            })
        })

        state.ws.on("close", () => {
            state.ws = null
            state.lastPayload = null
        })

        state.ws.on("error", () => {
            state.ws = null
            state.lastPayload = null
        })
    }

    try {

        OLog.warn(`publications.js dashboard_readout *start* user=${this.userId}`, this.userId)

        // ---- static per-process state (closed over) ----
        if (!Meteor._dashboardReadoutState) {
            Meteor._dashboardReadoutState = {
                ws: null,
                lastPayload: null,
                subscribers: new Set()
            }
        }

        const state = Meteor._dashboardReadoutState

        // ---- subscription start ----
        state.subscribers.add(self)
        ensureWebSocket(state)

        // If we already have a frame, immediately publish it
        if (state.lastPayload) {
            self.added(COLLECTION, DOC_ID, state.lastPayload)
        }

        self.ready()

        // ---- cleanup ----
        self.onStop(() => {
            state.subscribers.delete(self)

            // Optional: close WS when no subscribers remain
            if (state.subscribers.size === 0 && state.ws) {
                try {
                    state.ws.close()
                } catch {
                    // ignore
                }
                state.ws = null
                state.lastPayload = null
            }
        })
    }
    catch (error) {
        OLog.error(`publications.js dashboard_readout Error: ${error.message}`, this.userId)
    }
})
