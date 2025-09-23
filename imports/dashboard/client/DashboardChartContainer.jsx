import {withTracker} from "meteor/react-meteor-data"
import DashboardChart from "./DashboardChart"

export default withTracker(props => {
    const subscriptionName = props.dashboardSettings.subscriptionName
    const aggregates = Aggregates.findOne({subscriptionName})
    return {
        aggregates,
        dashboardSettings: props.dashboardSettings
    }
})(DashboardChart)
