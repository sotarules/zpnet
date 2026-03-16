import {Component} from "react"
import PropTypes from "prop-types"
import VXForm from "/imports/vx/client/VXForm"
import VXSelect from "/imports/vx/client/VXSelect"
import VXSpin from "/imports/vx/client/VXSpin"
import VXButton from "/imports/vx/client/VXButton"

export default class DashboardChartPowerStatusHeader extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired
    }

    static defaultProps = {
        id: "dashboard-chart-power-status-header"
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
                    <VXSelect id={`${this.props.id}-power-status-mode`}
                        label={Util.i18n("common.label_power_status_mode")}
                        codeArray={UX.makeCodeArray("powerStatusMode")}
                        value={VXApp.getDashboardSettings("powerStatusMode")}
                        dbName="powerStatusMode"
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
        console.log(`DashboardChartPowerStatusHeader handleChangeControl dbName=${component.props.dbName} value=${value}`)
        VXApp.setDashboardSettings(component.props.dbName, value)
    }

    handleClickSwapBattery(callback) {
        Meteor.call("sendCommand", "PI", "SYSTEM", "SWAP_BATTERY", {}, (error) => {
            if (error) {
                OLog.error(`DashboardChartPowerStatusHeader handleClickSwapBattery error: ${error.message}`)
            }
            callback(!error)
        })
    }
}
