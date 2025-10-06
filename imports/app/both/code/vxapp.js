VXApp = _.extend(VXApp || {}, {
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
    }
})
