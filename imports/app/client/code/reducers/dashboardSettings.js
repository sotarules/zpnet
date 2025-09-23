export default function(state = VXApp.dashboardSettingsDefaults(), action) {
    switch (action.type) {
    case "SET_DASHBOARD_SETTINGS":
        return action.payload
    default:
        return state
    }
}
