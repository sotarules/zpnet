/*
 * Set up MongoDB indexes.
 */
Meteor.startup(() => {
    console.log("indexes.js (app) ensuring presence of MongoDB indexes")
    ZPNetEvents._ensureIndex({ domain : 1, id: 1, timestamp: 1})
    console.log("indexes.js (app) indexes have been ensured")
})
