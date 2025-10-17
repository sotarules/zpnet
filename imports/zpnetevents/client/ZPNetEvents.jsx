import { Component } from "react"
import PropTypes from "prop-types"
import LoadingSpinner from "/imports/vx/client/LoadingSpinner"
import ZPNetEventsControls from "/imports/zpnetevents/client/ZPNetEventsControls"
import ZPNetEventsTableContainer from "/imports/zpnetevents/client/ZPNetEventsTableContainer"

export default class ZPNetEvents extends Component {

    static propTypes = {
        ready : PropTypes.bool.isRequired,
        zpnetEventsSettings : PropTypes.object.isRequired
    }

    render() {
        if (!this.props.ready) {
            return (<LoadingSpinner/>)
        }
        const timezone = Util.getUserTimezone(Meteor.userId())
        return (
            <div className="fill flex-section">
                <ZPNetEventsControls zpnetEventsSettings={this.props.zpnetEventsSettings}
                    rowsArray={UX.makeRowsArray()}
                    timezone={timezone}/>
                {this.props.ready &&
                    <ZPNetEventsTableContainer zpnetEventsSettings={this.props.zpnetEventsSettings} />
                }
            </div>
        )
    }
}
