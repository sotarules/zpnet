import React, { Component } from "react"
import PropTypes from "prop-types"
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts"
import RightBody from "/imports/vx/client/RightBody"

export default class DashboardChartPowerStatus extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired,
        aggregates: PropTypes.object.isRequired,
        dashboardSettings: PropTypes.object
    }

    static defaultProps = {
        id: "dashboard-chart-power-status"
    }

    /**
     * Stable-ish color palette for dynamic rails.
     * (We keep explicit hexes like the original component.)
     */
    static railColors = [
        "#8884d8", // purple
        "#82ca9d", // green
        "#ff7300", // orange
        "#ff2200", // red
        "#00c0ff", // cyan
        "#a0a0a0", // gray
        "#7cfc00", // lawn green
        "#ffd700", // gold
        "#ff69b4", // hot pink
        "#8a2be2"  // blue violet
    ]

    /**
     * Pick a deterministic color based on rail key + optional address.
     * Avoids color-shuffling as rails come/go.
     */
    pickColor(railKey, railObj, indexFallback) {
        try {
            const seed = `${railKey}|${railObj?.address || ""}|${railObj?.label || ""}`
            let h = 0
            for (let i = 0; i < seed.length; i++) {
                h = ((h << 5) - h) + seed.charCodeAt(i)
                h |= 0
            }
            const idx = Math.abs(h) % DashboardChartPowerStatus.railColors.length
            return DashboardChartPowerStatus.railColors[idx]
        }
        catch (e) {
            const idx = indexFallback % DashboardChartPowerStatus.railColors.length
            return DashboardChartPowerStatus.railColors[idx]
        }
    }

    /**
     * Convert aggregated samples into chart rows with dynamic keys.
     * Each row will have:
     *   - timeLabel
     *   - one key per rail for the selected metric (voltage/current/power)
     */
    buildChartData(payload, mode) {
        const metricKey = this.metricKeyForMode(mode)

        return payload.map(sample => {
            const row = { timeLabel: sample.timeLabel }

            const rails = sample.rails || {}
            Object.keys(rails).forEach(railKey => {
                const r = rails[railKey] || {}
                if (r[metricKey] == null) return
                row[railKey] = r[metricKey]
            })

            return row
        })
    }

    metricKeyForMode(mode) {
        switch (mode) {
        case "CURRENT":
            return "current_ma"
        case "POWER":
            return "power_w"
        case "VOLTAGE":
        default:
            return "voltage_v"
        }
    }

    unitForMode(mode) {
        switch (mode) {
        case "CURRENT":
            return "mA"
        case "POWER":
            return "W"
        case "VOLTAGE":
        default:
            return "V"
        }
    }

    /**
     * Build the set of rails to chart by scanning the payload and collecting
     * all unique rail keys. Also capture a representative object for label/address.
     */
    collectRails(payload) {
        const railsMap = {} // railKey -> {label, address, ...}
        payload.forEach(sample => {
            const rails = sample.rails || {}
            Object.keys(rails).forEach(railKey => {
                if (!railsMap[railKey]) {
                    railsMap[railKey] = rails[railKey] || {}
                }
            })
        })
        return railsMap
    }

    render() {
        const { aggregates, dashboardSettings } = this.props

        if (!aggregates || !aggregates.payload || aggregates.payload.length === 0) {
            return <div>No data available</div>
        }

        const payload = aggregates.payload
        const mode = (dashboardSettings && dashboardSettings.powerStatusMode) || "VOLTAGE"
        const metricKey = this.metricKeyForMode(mode)
        const unit = this.unitForMode(mode)

        // Determine which rails exist in this dataset (dynamic)
        const railsMap = this.collectRails(payload)
        const railKeys = Object.keys(railsMap)

        if (railKeys.length === 0) {
            return <div>No rail data available</div>
        }

        // Chart data: each row contains timeLabel + per-rail metric values
        const data = this.buildChartData(payload, mode)

        return (
            <RightBody scrollable={false} className="right-body">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart tabIndex="0" data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timeLabel"
                            type="category"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis domain={["auto", "auto"]} />
                        <Tooltip
                            labelFormatter={(time) => `Time: ${time}`}
                            formatter={(value, name) => {
                                const num = Number(value)
                                const label = railsMap[name]?.label || name
                                const pretty = Number.isFinite(num) ? num.toFixed(3) : value
                                return [`${pretty}`, `${label} (${unit})`]
                            }}
                        />
                        <Legend
                            formatter={(value) => {
                                const label = railsMap[value]?.label || value
                                return label
                            }}
                        />

                        {railKeys.map((railKey, idx) => {
                            const railObj = railsMap[railKey] || {}
                            const color = this.pickColor(railKey, railObj, idx)

                            // Only render the line if at least one point has a value
                            const hasAny = data.some(row => row[railKey] != null)
                            if (!hasAny) return null

                            return (
                                <Line
                                    key={`${mode}:${metricKey}:${railKey}`}
                                    type="monotone"
                                    dataKey={railKey}
                                    stroke={color}
                                    strokeWidth={3}
                                    name={railKey}
                                    dot={false}
                                />
                            )
                        })}
                    </LineChart>
                </ResponsiveContainer>
            </RightBody>
        )
    }
}
