import {Component} from "react"
import PropTypes from "prop-types"
import VXForm from "/imports/vx/client/VXForm"
import VXSelect from "/imports/vx/client/VXSelect"
import VXSpin from "/imports/vx/client/VXSpin"
import VXButton from "/imports/vx/client/VXButton"

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
                <div className="col-sm-4">
                    <VXSelect id={`${this.props.id}-battery-status-mode`}
                        label={Util.i18n("common.label_battery_status_mode")}
                        codeArray={UX.makeCodeArray("batteryStatusMode")}
                        value={VXApp.getDashboardSettings("batteryStatusMode")}
                        dbName="batteryStatusMode"
                        onChange={this.handleChangeControl.bind(this)}/>
                </div>
                <div className="col-sm-4">
                    <VXSpin id={`${this.props.id}-battery-swap-index`}
                        label={Util.i18n("common.label_battery_swap_index")}
                        value={VXApp.getDashboardSettings("batterySwapIndex") || 0}
                        min={0}
                        max={5}
                        dbName="batterySwapIndex"
                        onChange={this.handleChangeControl.bind(this)}/>
                </div>
                <div className="col-sm-4">
                    <VXButton id={`${this.props.id}-swap-battery`}
                        className="btn btn-primary btn-chart-header"
                        onClick={this.handleClickSwapBattery.bind(this)}>
                        {Util.i18n("common.button_swap_battery")}
                    </VXButton>
                </div>
            </div>
        )
    }

    handleChangeControl(event, value, component) {
        console.log(`DashboardChartBatteryStatusHeader handleChangeControl dbName=${component.props.dbName} value=${value}`)
        VXApp.setDashboardSettings(component.props.dbName, value)
    }

    handleClickSwapBattery(callback) {
        const payload = {}
        payload.funktion = "createEvent"
        payload.args = {}
        payload.args.event_name = "SWAP_BATTERY"
        payload.args.payload = {}
        VXApp.createCommand("EXECUTE_FUNCTION", payload)
        callback(true)
    }
}
