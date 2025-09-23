import React, {Component} from "react"
import PropTypes from "prop-types"
import {CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts"
import RightHeader from "../../vx/client/RightHeader"
import RightBody from "../../vx/client/RightBody"

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
        if (!aggregates || !aggregates.window) {
            return <div>No data available</div>
        }

        const data = aggregates.window
        return (
            <RightBody scrollable={false} className="right-body">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis
                            dataKey="minutes"
                            type="number"
                            domain={[0, "dataMax"]}
                            tickFormatter={(m) => m.toFixed(1)}
                        />
                        <YAxis domain={["auto", "auto"]}/>
                        <Tooltip labelFormatter={(m) => `${m.toFixed(1)} min`}/>
                        <Line
                            type="monotone"
                            dataKey="voltage"
                            stroke="#8884d8"
                            name={aggregates.subscriptionName || "Battery Status"}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </RightBody>
        )
    }
}
