VXApp = _.extend(VXApp || {}, {

    safeDate(value) {
        if (value instanceof Date) {
            return value
        }
        if (typeof value === "string") {
            const d = new Date(value)
            if (!isNaN(d.getTime())) {
                return d
            }
        }
        return null
    },

    makeZPNetPublishRequest(zpnetEventsSettings) {
        const publishRequest = {}
        publishRequest.criteria = {}
        if (zpnetEventsSettings.eventEndDate) {
            publishRequest.criteria.timestamp = { $lte: VXApp.safeDate(zpnetEventsSettings.eventEndDate) }
        }
        publishRequest.options = {}
        publishRequest.options.sort = { timestamp : -1 }
        publishRequest.options.limit = zpnetEventsSettings.selectedEventRows || 50
        const regexFilter = zpnetEventsSettings.selectedEventType ?
            { searchPhrase: zpnetEventsSettings.selectedEventType, propertyNames: ["event_type"] } : null
        const filteredPublishRequest =
            VXApp.applyFilters(publishRequest, publishRequest.criteria, regexFilter, true)
        return filteredPublishRequest
    }
})
