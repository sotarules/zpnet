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

    createCommand(commandType, payload) {
        try {
            OLog.debug(`vxapp.js createCommand commandType=${commandType} payload=${OLog.debugString(payload)}`)
            const command = {}
            command.command_type = commandType
            command.timestamp = new Date()
            command.payload = payload
            const commandId = ZPNetCommands.insert(command)
            OLog.info(`vxapp.js createCommand commandId=${commandId}`)
            return commandId
        }
        catch (error) {
            OLog.error(`vxapp.js createCommand Error: ${error.message}`)
        }
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
