import React, {Component} from "react"
import PropTypes from "prop-types"
import RightPanel from "/imports/vx/client/RightPanel"
import RightHeader from "/imports/vx/client/RightHeader"

export default class DashboardChart extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired,
        aggregates: PropTypes.object.isRequired,
        dashboardSettings: PropTypes.object.isRequired
    }

    static defaultProps = {
        id: "dashboard-chart"
    }

    render() {
        const subscriptionName = this.props.dashboardSettings.subscriptionName
        const header = CX.DASHBOARD_HEADERS[subscriptionName]
        const ComponentClass = header.chartComponent
        return (
            <div id={this.props.id} className="flexi-grow">
                <RightPanel>
                    <RightHeader iconUrl={header.iconUrl}
                        name={Util.i18n(header.name)}
                        description={Util.i18n(header.description)}/>
                    <ComponentClass {...this.props} />
                </RightPanel>
            </div>
        )
    }
}
