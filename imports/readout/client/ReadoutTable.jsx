import React, { Component } from "react"
import PropTypes from "prop-types"

export default class ReadoutTable extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired,
        aggregates: PropTypes.object.isRequired
    }

    static defaultProps = {
        id: "readout-table"
    }

    render() {
        const { aggregates } = this.props

        if (!aggregates || !aggregates.payload) {
            return (
                <div className="dashboard-readout-container">
                    <div className="dashboard-readout-screen">
                        <div className="dashboard-readout-header"></div>
                        <div className="dashboard-readout-body"></div>
                    </div>
                </div>
            )
        }

        const { header = "", body = [] } = aggregates.payload
        const bodyText = body.join("\n")

        return (
            <div className="dashboard-readout-container">
                <div className="dashboard-readout-screen">
                    <div className="dashboard-readout-header">
                        {header}
                    </div>
                    <div className="dashboard-readout-body">
                        {bodyText}
                    </div>
                </div>
            </div>
        )
    }
}
