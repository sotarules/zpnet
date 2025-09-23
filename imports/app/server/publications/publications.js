const registry = {}

Meteor.publish("battery_status", function() {
    try {
        OLog.warn("publications.js battery_status *start*", this.userId)
        const cursor = VXApp.handlePublishAggregate(registry, "battery_status", VXApp.aggregateBatteryStatus, this, 10000)
        OLog.warn(`publications.js battery_status count=${cursor.count()}`, this.userId)
        return cursor
    }
    catch (error) {
        OLog.error(`publications.js battery_status Error: ${error.message}`, this.userId)
    }
})
