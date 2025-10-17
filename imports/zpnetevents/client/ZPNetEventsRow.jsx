import { Component } from "react";
import PropTypes from "prop-types";

export default class ZPNetEventsRow extends Component {

    static propTypes = {
        eventRow : PropTypes.object.isRequired
    }

    render() {
        return (
            <tr>
                <td className="events-cell">
                    <span>{this.formatDateTime()}</span>
                </td>
                <td className="events-cell">
                    <span>{this.formatType()}</span>
                </td>
                <td className="events-key">
                    <span>{this.formatPayload()}</span>
                </td>
            </tr>
        )
    }

    formatDateTime() {
        return moment(this.props.eventRow.timestamp).format("MM/DD/YYYY HH:mm:ss.SSS");
    }

    formatType() {
        return this.props.eventRow.event_type;
    }

    formatPayload() {
        return EJSON.stringify(this.props.eventRow.payload);
    }
}

