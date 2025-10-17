export default function(state = VXApp.zpnetEventsSettingsDefaults(), action) {
    switch (action.type) {
    case "SET_ZPNET_EVENTS_SETTINGS":
        return action.payload
    default:
        return state
    }
}
