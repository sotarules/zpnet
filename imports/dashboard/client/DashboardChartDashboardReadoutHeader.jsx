import { Component } from "react"
import PropTypes from "prop-types"
import VXForm from "/imports/vx/client/VXForm"

export default class DashboardChartDashboardReadoutHeader extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        description: PropTypes.string,
        iconUrl: PropTypes.string
    }

    static defaultProps = {
        id: "dashboard-chart-dashboard-readout-header"
    }

    render() {
        return (
            <div className="chart-header">
                <VXForm id={`${this.props.id}-form`}
                    elementType="div"
                    receiveProps={true}
                    ref={(form) => { this.form = form }}>
                </VXForm>
            </div>
        )
    }
}
