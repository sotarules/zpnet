import React, {Component} from "react"
import PropTypes from "prop-types"
import {CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts"
import RightBody from "/imports/vx/client/RightBody"

export default class DashboardChartBatteryStatus extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired,
        aggregates: PropTypes.object.isRequired,
        dashboardSettings: PropTypes.object
    }

    static defaultProps = {
        id: "dashboard-chart-battery-status"
    }

    render() {
        const {aggregates} = this.props

        // Safety check
        if (!aggregates || !aggregates.window || aggregates.window.length === 0) {
            return <div>No data available</div>
        }

        const data = aggregates.window
        return (
            <RightBody scrollable={false} className="right-body">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
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
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="batteryVoltage"
                            stroke="#8884d8"
                            strokeWidth={3}
                            name="Battery Rail"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="v3v3Voltage"
                            stroke="#82ca9d"
                            strokeWidth={3}
                            name="3.3V Rail"
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="v5vVoltage"
                            stroke="#ff7300"
                            strokeWidth={3}
                            name="5V Rail"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </RightBody>
        )
    }
}
