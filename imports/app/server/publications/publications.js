Meteor.publish("battery_status", function(dashboardSettings) {
    try {
        OLog.warn(`publications.js battery_status *start* dashboardSettings=${OLog.warnString(dashboardSettings)}`, this.userId)
        const cursor = VXApp.handlePublishAggregate(dashboardSettings, VXApp.aggregateBatteryStatus, this, 20000)
        OLog.warn(`publications.js battery_status count=${cursor.count()}`, this.userId)
        return cursor
    }
    catch (error) {
        OLog.error(`publications.js battery_status Error: ${error.message}`, this.userId)
    }
})

Meteor.publish("zpnet_events", function(zpnetEventsSettings) {
    try {
        OLog.warn(`publications.js zpnet_events *start* zpnetEventsSettings=${OLog.warnString(zpnetEventsSettings)}`, this.userId)
        const publishRequest = VXApp.makeZPNetPublishRequest(zpnetEventsSettings)
        const cursor = ZPNetEvents.find(publishRequest.criteria, publishRequest.options)
        OLog.warn(`publications.js zpnet_events count=${cursor.count()}`, this.userId)
        return cursor
    }
    catch (error) {
        OLog.error(`publications.js zpnet_events Error: ${error.message}`, this.userId)
    }
})
