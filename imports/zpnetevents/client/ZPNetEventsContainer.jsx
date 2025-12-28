import { connect } from "react-redux"
import { withTracker } from "meteor/react-meteor-data"
import ZPNetEvents from "/imports/zpnetevents/client/ZPNetEvents"

const MeteorContainer = withTracker(props => {
    const ready = new ReactiveVar(false)
    const handles = []
    handles.push(UX.subscribe("zpnet_events", props.zpnetEventsSettings))
    UX.waitSubscriptions(handles, () => {
        ready.set(true)
        UX.clearLoading()
    })
    OLog.debug(`ZPNetEventsContainer.jsx withTracker *fire* subscriptionName=zpnet-events ready=${ready.get()}`)
    return {
        ready : !!ready.get()
    }
})(ZPNetEvents)

const mapStateToProps = state => {
    return {
        zpnetEventsSettings: state.zpnetEventsSettings
    }
}

export default connect(
    mapStateToProps
)(MeteorContainer)
