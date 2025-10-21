import { connect } from "react-redux"
import { withTracker } from "meteor/react-meteor-data"
import Readout from "/imports/readout/client/Readout"

const MeteorContainer = withTracker(() => {
    const ready = new ReactiveVar(false)
    const dashboardSettings = {}
    dashboardSettings.aggregateName = "DASHBOARD_READOUT"
    const handles = []
    handles.push(UX.subscribe("dashboard_readout", dashboardSettings))
    UX.waitSubscriptions(handles, () => {
        ready.set(true)
        UX.clearLoading()
    })
    OLog.warn(`ReadoutContainer.jsx withTracker *fire* subscriptionName=dashboard_readout ready=${ready.get()}`)
    return {
        ready : !!ready.get()
    }
})(Readout)

const mapStateToProps = () => {
    return {
    }
}

export default connect(
    mapStateToProps
)(MeteorContainer)
