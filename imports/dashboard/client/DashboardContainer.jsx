import {connect} from "react-redux"
import {withTracker} from "meteor/react-meteor-data"
import Dashboard from "/imports/dashboard/client/Dashboard"

const MeteorContainer = withTracker(props => {
    const ready = new ReactiveVar(false)
    const subscriptionName = props.dashboardSettings.subscriptionName
    const handles = []
    handles.push(UX.subscribe(subscriptionName, props.dashboardSettings))
    UX.waitSubscriptions(handles, () => {
        ready.set(true)
        UX.clearLoading()
    })
    OLog.warn(`DashboardContainer.jsx withTracker *fire* subscriptionName=${subscriptionName} ready=${ready.get()}`)
    return {
        ready : !!ready.get()
    }
})(Dashboard)

const mapStateToProps = state => {
    return {
        dashboardSettings: state.dashboardSettings
    }
}

export default connect(
    mapStateToProps
)(MeteorContainer)

