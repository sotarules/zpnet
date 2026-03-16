Meteor.methods({
    sendCommand(machine, subsystem, command, args) {
        return ZPNetProcess.sendCommand(machine, subsystem, command, args)
    }
})
