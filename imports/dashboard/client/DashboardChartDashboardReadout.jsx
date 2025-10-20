import React, { Component } from "react"
import PropTypes from "prop-types"
import RightBody from "/imports/vx/client/RightBody"

/**
 * DashboardChartDashboardReadout
 *
 * Emulates the Pi terminal display on the web dashboard.
 * - Renders header (white) and body (green)
 * - Auto-scales to maintain 800x480 (Pi aspect ratio)
 * - Characters "type in" over time using VXApp helper
 * - Clears interval timers on unmount or update to avoid text corruption
 *
 * Requires VXApp helpers:
 *   VXApp.initTerminalTyping(element, text, speed)
 *   VXApp.clearTerminalTyping(timer)
 *   VXApp.clearTerminal(element)
 */
export default class DashboardChartDashboardReadout extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired,
        aggregates: PropTypes.object.isRequired,
        dashboardSettings: PropTypes.object
    }

    static defaultProps = {
        id: "dashboard-chart-dashboard-readout"
    }

    constructor(props) {
        super(props)
        this.terminalRef = React.createRef()
        this.headerRef = React.createRef()
        this.typingTimer = null
    }

    componentDidMount() {
        this.renderReadout()
    }

    componentDidUpdate(prevProps) {
        // When new aggregate data arrives, restart typing
        if (prevProps.aggregates !== this.props.aggregates) {
            VXApp.clearTerminalTyping(this.typingTimer)
            this.renderReadout()
        }
    }

    componentWillUnmount() {
        // Prevent orphaned intervals from running after unmount
        VXApp.clearTerminalTyping(this.typingTimer)
    }

    renderReadout() {
        const { aggregates } = this.props
        if (!aggregates || !aggregates.payload) {
            VXApp.clearTerminal(this.terminalRef.current)
            return
        }

        const payload = aggregates.payload
        const headerText = payload.header || ""
        const bodyLines = payload.body || []

        // Clear screen before rendering new content
        VXApp.clearTerminal(this.terminalRef.current)

        // Update header line
        if (this.headerRef.current) {
            this.headerRef.current.textContent = headerText
        }

        // Combine body lines and start typing animation
        const fullText = bodyLines.join("\n")
        this.typingTimer = VXApp.initTerminalTyping(this.terminalRef.current, fullText, 1)
    }

    render() {
        return (
            <RightBody scrollable={false} className="right-body">
                <div className="dashboard-readout-container">
                    <div className="dashboard-readout-screen">
                        <pre
                            ref={this.headerRef}
                            className="dashboard-readout-header"
                        />
                        <pre
                            ref={this.terminalRef}
                            className="dashboard-readout-body"
                        />
                    </div>
                </div>
            </RightBody>
        )
    }
}
