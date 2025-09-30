import {Component} from "react"
import PropTypes from "prop-types"
import VXForm from "/imports/vx/client/VXForm"
import VXSelect from "/imports/vx/client/VXSelect"
import VXSpin from "/imports/vx/client/VXSpin"

export default class DashboardChartBatteryStatusHeader extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired
    }

    static defaultProps = {
        id: "dashboard-chart-battery-status-header"
    }

    render() {
        return (
            <div className="chart-header">
                <VXForm id={`${this.props.id}-form`}
                    elementType="div"
                    receiveProps={true}
                    ref={(form) => {
                        this.form = form
                    }}>
                    <div className="row">
                        <div className="col-sm-12">
                            {this.renderRow()}
                        </div>
                    </div>
                </VXForm>
            </div>
        )
    }

    renderRow() {
        return (
            <div className="row">
                <div className="col-sm-2">
                    <VXSelect id={`${this.props.id}-battery-status-mode`}
                        label={Util.i18n("common.label_battery_status_mode")}
                        codeArray={UX.makeCodeArray("batteryStatusMode")}
                        value={VXApp.getDashboardSettings("batteryStatusMode")}
                        dbName="batteryStatusMode"
                        onChange={this.handleChangeControl.bind(this)}/>
                </div>
                <div className="col-sm-2">
                    <VXSpin id={`${this.props.id}-battery-swap-index`}
                        label={Util.i18n("common.label_battery_swap_index")}
                        value={VXApp.getDashboardSettings("batterySwapIndex") || 0}
                        min={0}
                        max={5}
                        dbName="batterySwapIndex"
                        onChange={this.handleChangeControl.bind(this)}/>
                </div>
            </div>
        )
    }

    handleChangeControl(event, value, component) {
        console.log(`DashboardChartBatteryStatusHeader handleChangeControl dbName=${component.props.dbName} value=${value}`)
        VXApp.setDashboardSettings(component.props.dbName, value)
    }
}
