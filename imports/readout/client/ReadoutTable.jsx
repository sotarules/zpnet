import React, { Component } from "react"
import PropTypes from "prop-types"
import LoadingSpinner from "/imports/vx/client/LoadingSpinner"

export default class ReadoutTable extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired,
        ready : PropTypes.bool.isRequired,
        readout: PropTypes.object
    }

    static defaultProps = {
        id: "readout-table"
    }

    render() {
        if (!(this.props.ready && this.props.readout)) {
            return (<LoadingSpinner/>)
        }
        const { header = "", body = [] } = this.props.readout
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
