import { Component } from "react"
import PropTypes from "prop-types"
import BasicPanel from "/imports/vx/client/BasicPanel"
import LoadingSpinner from "/imports/vx/client/LoadingSpinner"
import DashboardChartContainer from "./DashboardChartContainer"

export default class Dashboard extends Component {

    static propTypes = {
        ready : PropTypes.bool.isRequired,
        dashboardSettings : PropTypes.object.isRequired
    }

    render() {
        if (!this.props.ready) {
            return (<LoadingSpinner/>)
        }
        return (
            <BasicPanel id="dashboard-view">
                <DashboardChartContainer dashboardSettings={this.props.dashboardSettings}/>
            </BasicPanel>
        )
    }
}


