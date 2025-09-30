import React, {Component} from "react"
import PropTypes from "prop-types"
import {
    CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts"
import RightBody from "/imports/vx/client/RightBody"

export default class DashboardChartBatteryStatus extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired, aggregates: PropTypes.object.isRequired, dashboardSettings: PropTypes.object
    }

    static defaultProps = {
        id: "dashboard-chart-battery-status"
    }

    render() {
        const {aggregates, dashboardSettings} = this.props
        if (!aggregates || !aggregates.window || aggregates.window.length === 0) {
            return <div>No data available</div>
        }

        const data = aggregates.window
        const mode = dashboardSettings.batteryStatusMode || "VOLTAGE"

        let keys
        switch (mode) {
        case "VOLTAGE":
            keys = [{key: "batteryVoltage", color: "#8884d8", name: "Battery (V)"}, {
                key: "v3v3Voltage", color: "#82ca9d", name: "3.3V Rail"
            }, {key: "v5vVoltage", color: "#ff7300", name: "5V Rail"}]
            break
        case "CURRENT":
            keys = [{key: "batteryCurrent", color: "#8884d8", name: "Battery (A)"}, {
                key: "v3v3Current", color: "#82ca9d", name: "3.3V Rail"
            }, {key: "v5vCurrent", color: "#ff7300", name: "5V Rail"}]
            break
        case "POWER":
            keys = [{key: "batteryPower", color: "#8884d8", name: "Battery (W)"}, {
                key: "v3v3Power", color: "#82ca9d", name: "3.3V Rail"
            }, {key: "v5vPower", color: "#ff7300", name: "5V Rail"}]
            break
        default:
            keys = []
        }

        return (<RightBody scrollable={false} className="right-body">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart tabIndex="0" data={data}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis
                        dataKey="timeLabel"
                        type="category"
                        tick={{fontSize: 12}}
                    />
                    <YAxis domain={["auto", "auto"]}/>
                    <Tooltip
                        labelFormatter={(time) => `Time: ${time}`}
                        formatter={(value, name) => [Number(value).toFixed(3), name]}
                    />
                    <Legend/>
                    {keys.map(line => (<Line
                        key={line.key}
                        type="monotone"
                        dataKey={line.key}
                        stroke={line.color}
                        strokeWidth={3}
                        name={line.name}
                        dot={false}
                    />))}
                </LineChart>
            </ResponsiveContainer>
        </RightBody>)
    }
}
