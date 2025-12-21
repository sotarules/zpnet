import WebSocket from "ws"

let ws = null

Meteor.publish("battery_status", function(dashboardSettings) {
    try {
        return VXApp.handlePublishAggregate(dashboardSettings, VXApp.aggregateBatteryStatus, this, 20000)
    }
    catch (error) {
        OLog.error(`publications.js battery_status Error: ${error.message}`, this.userId)
    }
})

Meteor.publish("zpnet_events", function(zpnetEventsSettings) {
    try {
        const publishRequest = VXApp.makeZPNetPublishRequest(zpnetEventsSettings)
        return ZPNetEvents.find(publishRequest.criteria, publishRequest.options)
    }
    catch (error) {
        OLog.error(`publications.js zpnet_events Error: ${error.message}`, this.userId)
    }
})

Meteor.publish("dashboard_readout", function() {

    try {

        const self = this

        if (!ws) {
            OLog.debug("publications.js dashboard_readout WebSocket *init*", this.userId)
            ws = new WebSocket("ws://127.0.0.1:8765")
        }

        self.added("dashboard_readout", "readout", {});

        self.ready()

        ws.on("message", (data) => {
            const payload = Util.parseJSON(data.toString())
            self.changed("dashboard_readout", "readout", payload)
        })

        ws.on("close", Meteor.bindEnvironment(() => {
            OLog.error("publications.js dashboard_readout WebSocket close", this.userId)
            ws = null
        }))

        ws.on("error", Meteor.bindEnvironment((error) => {
            OLog.error(`publications.js dashboard_readout WebSocket error ${error.message}`, this.userId)
            ws = null
        }))
    }
    catch (error) {
        OLog.error(`publications.js dashboard_readout error ${error.message}`, this.userId)
    }
})
