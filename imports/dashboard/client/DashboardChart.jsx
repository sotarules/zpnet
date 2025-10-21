import React, {Component} from "react"
import PropTypes from "prop-types"
import RightPanel from "/imports/vx/client/RightPanel"
import DashboardChartHeader from "./DashboardChartHeader"
import DashboardChartBatteryStatusHeader from "./DashboardChartBatteryStatusHeader"
import DashboardChartBatteryStatus from "./DashboardChartBatteryStatus"

export default class DashboardChart extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired,
        aggregates: PropTypes.object.isRequired,
        dashboardSettings: PropTypes.object.isRequired
    }

    static defaultProps = {
        id: "dashboard-chart"
    }

    static componentRegistry = {
        DashboardChartBatteryStatusHeader,
        DashboardChartBatteryStatus,
    }

    render() {
        const subscriptionName = this.props.dashboardSettings.subscriptionName
        const view = CX.DASHBOARD_VIEWS[subscriptionName]
        const HeaderComponent = DashboardChart.componentRegistry[view.headerComponent]
        const ChartComponent = DashboardChart.componentRegistry[view.chartComponent]
        return (
            <div id={this.props.id} className="flexi-grow">
                <RightPanel>
                    <DashboardChartHeader iconUrl={view.iconUrl}
                        name={Util.i18n(view.name)}
                        description={Util.i18n(view.description)}
                        headerComponent={(<HeaderComponent {...this.props} />)} />
                    <ChartComponent {...this.props} />
                </RightPanel>
            </div>
        )
    }
}
