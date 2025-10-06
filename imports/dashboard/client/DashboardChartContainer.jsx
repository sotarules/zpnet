import {withTracker} from "meteor/react-meteor-data"
import DashboardChart from "./DashboardChart"

export default withTracker(props => {
    const aggregateName = props.dashboardSettings.aggregateName
    const aggregates = Aggregates.findOne({aggregate_name: aggregateName})
    return {
        aggregates,
        dashboardSettings: props.dashboardSettings
    }
})(DashboardChart)
