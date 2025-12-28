import WebSocket from "ws"

const readoutSubscription = { ws: null, messageHandlers: new Set()
}

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

    try {
        if (!readoutSubscription.ws) {
            readoutSubscription.ws = new WebSocket("ws://127.0.0.1:8765")
            readoutSubscription.ws.on("close", Meteor.bindEnvironment(() => {
                OLog.warn("publications.js dashboard_readout *close*")
                readoutSubscription.ws = null
            }))
            readoutSubscription.ws.on("error", Meteor.bindEnvironment((error) => {
                OLog.error(`publications.js dashboard_readout *error* ${error.message}`)
                readoutSubscription.ws = null
            }))
        }
        const onMessage = Meteor.bindEnvironment((data) => {
            const payload = Util.parseJSON(data.toString())
            if (!payload) return
            self.changed("dashboard_readout", "readout", payload)
        })
        readoutSubscription.ws.on("message", onMessage)
        readoutSubscription.messageHandlers.add(onMessage)
        self.added("dashboard_readout", "readout", {})
        self.ready()
        self.onStop(() => {
            if (readoutSubscription.ws) {
                readoutSubscription.ws.off("message", onMessage)
            }
            readoutSubscription.messageHandlers.delete(onMessage)
            if (readoutSubscription.messageHandlers.size === 0 && readoutSubscription.ws) {
                readoutSubscription.ws.close()
                readoutSubscription.ws = null
            }
        })
    }
    catch (error) {
        OLog.error(`publications.js dashboard_readout publish error ${error.message}`, self.userId)
    }
})


