console.log(`startup.js (app) ${CX.SYSTEM_NAME}`)

Meteor.startup(() => {
    ZPNetSystem.init()
})
