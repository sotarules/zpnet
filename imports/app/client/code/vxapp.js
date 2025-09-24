import allReducersApp from "/imports/app/client/code/reducers/allReducers"
import allReducersVx from "/imports/vx/client/code/reducers/allReducers"
import { setDashboardSettings } from "/imports/app/client/code/actions"

VXApp = _.extend(VXApp || {}, {

    isLogoutOnBrowserClose() {
        return false
    },

    unionedReducers() {
        return { ...allReducersApp, ...allReducersVx }
    },

    isAppExemptRoute() {
        return false
    },

    isAppAuthorizedRoute(meteorUserId) {
        const userRoutes = ["dashboard"]
        if (Util.isRoutePath(userRoutes)) {
            return !!meteorUserId
        }
        return false
    },

    isAppWideRoute() {
        return true
    },

    onLogin() {
        OLog.debug(`vxapp.js onLogin *fire* userId=${Meteor.userId()}`)
    },

    getDashboardSettings(propertyName) {
        const dashboardSettings = Store.getState().dashboardSettings
        return dashboardSettings[propertyName]
    },

    setDashboardSettings(propertyName, value) {
        const dashboardSettings = Store.getState().dashboardSettings
        Store.dispatch(setDashboardSettings( { ...dashboardSettings, ...{ [propertyName] : value } } ))
    },

    dashboardSettingsDefaults() {
        return {
            subscriptionName: null,
            batteryStatusMode: "VOLTAGE"
        }
    }
})
