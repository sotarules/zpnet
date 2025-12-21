import WebSocket from "ws"

Meteor.publish("battery_status", function (dashboardSettings) {
    try {
        return VXApp.handlePublishAggregate(dashboardSettings, VXApp.aggregateBatteryStatus, this, 20000)
    }
    catch (error) {
        OLog.error(`publications.js battery_status Error: ${error.message}`, this.userId)
    }
})

Meteor.publish("zpnet_events", function (zpnetEventsSettings) {
    try {
        const publishRequest = VXApp.makeZPNetPublishRequest(zpnetEventsSettings)
        return ZPNetEvents.find(publishRequest.criteria, publishRequest.options)
    }
    catch (error) {
        OLog.error(`publications.js zpnet_events Error: ${error.message}`, this.userId)
    }
})

Meteor.publish("dashboard_readout", function() {

    const self = this

    const COLLECTION = "dashboard_readout"
    const DOC_ID = "readout"

    function ensureWebSocket(state) {
        if (state.ws) return

        state.ws = new WebSocket("ws://127.0.0.1:8765")

        state.ws.on("message", (data) => {
            let payload
            try {
                payload = JSON.parse(data.toString())
            }
            catch {
                return
            }

            const first = !state.lastPayload
            state.lastPayload = payload

            state.subscribers.forEach((sub) => {
                if (first) {
                    sub.added(COLLECTION, DOC_ID, payload)
                }
                else {
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
