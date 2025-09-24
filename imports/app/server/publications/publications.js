const registry = {}

Meteor.publish("battery_status", function(dashboardSettings) {
    try {
        OLog.warn(`publications.js battery_status *start* dashboardSettings=${OLog.warnString(dashboardSettings)}`, this.userId)
        const cursor = VXApp.handlePublishAggregate(registry, dashboardSettings, VXApp.aggregateBatteryStatus, this, 20000)
        OLog.warn(`publications.js battery_status count=${cursor.count()}`, this.userId)
        return cursor
    }
    catch (error) {
        OLog.error(`publications.js battery_status Error: ${error.message}`, this.userId)
    }
})
