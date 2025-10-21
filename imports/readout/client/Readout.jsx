import { Component } from "react"
import PropTypes from "prop-types"
import LoadingSpinner from "/imports/vx/client/LoadingSpinner"
import ReadoutTableContainer from "./ReadoutTableContainer"

export default class Readout extends Component {

    static propTypes = {
        ready : PropTypes.bool.isRequired
    }

    render() {
        if (!this.props.ready) {
            return (<LoadingSpinner/>)
        }
        return (
            <div className="flex-grow">
                <ReadoutTableContainer />
            </div>
        )
    }
}
