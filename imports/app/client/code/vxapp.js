import allReducersApp from "/imports/app/client/code/reducers/allReducers"
import allReducersVx from "/imports/vx/client/code/reducers/allReducers"
import {setDashboardSettings, setZPNetEventsSettings} from "/imports/app/client/code/actions"

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
        const userRoutes = ["readout", "dashboard", "zpnetevents"]
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
    },

    getZPNetEventsSettings(propertyName) {
        const zpnetEventsSettings = Store.getState().zpnetEventsSettings
        return zpnetEventsSettings[propertyName]
    },

    setZPNetEventsSettings(propertyName, value) {
        const zpnetEventsSettings = Store.getState().zpnetEventsSettings
        Store.dispatch(setZPNetEventsSettings( { ...zpnetEventsSettings, ...{ [propertyName] : value } } ))
    },

    zpnetEventsSettingsDefaults() {
        return {

        }
    },

    clearTerminal(element) {
        if (!element) return
        element.textContent = ""
    },

    initTerminalTyping(element, text, speed = 2) {
        if (!element) return null
        element.textContent = ""
        let i = 0
        const timer = setInterval(() => {
            if (!element || i >= text.length) {
                clearInterval(timer)
                return
            }
            element.textContent += text[i]
            i++
        }, speed)
        return timer
    },

    clearTerminalTyping(timer) {
        if (timer) {
            clearInterval(timer)
        }
    }
})
