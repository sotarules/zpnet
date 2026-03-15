console.log(`startup.js (app) ${CX.SYSTEM_NAME}`)

Meteor.startup(() => {
    ZPNetSystem.init({
        onEvents(payload) {
            OLog.info(`startup.js (app) onEvents payload: ${OLog.infoString(payload)}`)
        },
        onTimebase(payload) {
            OLog.info(`startup.js (app) onTimebase payload: ${OLog.infoString(payload)}`)
        }
    })
})
