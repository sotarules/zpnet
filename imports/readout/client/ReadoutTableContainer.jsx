import {withTracker} from "meteor/react-meteor-data"
import ReadoutTable from "./ReadoutTable"

export default withTracker(() => {
    const aggregates = Aggregates.findOne({aggregate_name: "DASHBOARD_READOUT"})
    return {
        aggregates
    }
})(ReadoutTable)
