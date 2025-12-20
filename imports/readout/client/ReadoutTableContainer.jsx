import {withTracker} from "meteor/react-meteor-data"
import ReadoutTable from "./ReadoutTable"

export default withTracker(( ) => {
    const ready = new ReactiveVar(false)
    const subscriptionName = "dashboard_readout"
    const handles = []
    handles.push(UX.subscribe(subscriptionName))
    UX.waitSubscriptions(handles, () => {
        ready.set(true)
        UX.clearLoading()
    })
    return {
        ready : !!ready.get(),
        readout : DashboardReadout.findOne("readout")
    }
})(ReadoutTable)

