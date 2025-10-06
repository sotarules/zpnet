/*
 * Set up MongoDB indexes.
 */
Meteor.startup(() => {
    console.log("indexes.js (app) ensuring presence of MongoDB indexes")
    ZPNetEvents._ensureIndex({ timestamp: 1})
    ZPNetEvents._ensureIndex({ event_type: 1, timestamp: 1})
    ZPNetCommands._ensureIndex({ timestamp: 1})
    ZPNetCommands._ensureIndex({ command_type: 1, timestamp: 1})
    Aggregates._ensureIndex({ subscriptionName: 1})
    console.log("indexes.js (app) indexes have been ensured")
})
