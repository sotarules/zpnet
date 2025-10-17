import { Component } from "react"
import PropTypes from "prop-types"
import VXForm from "/imports/vx/client/VXForm"
import VXInput from "/imports/vx/client/VXInput"
import VXSelect from "/imports/vx/client/VXSelect"
import VXDate from "/imports/vx/client/VXDate"

export default class ZPNetEventsControls extends Component {

    static propTypes = {
        rowsArray : PropTypes.array.isRequired,
        zpnetEventsSettings : PropTypes.object.isRequired,
        timezone : PropTypes.string.isRequired
    }

    render() {
        return (
            <div className="events-control-container flex-section-fixed">
                <VXForm id="events-control-form">
                    <div id="events-control-row" className="row">
                        <div className="col-sm-2">
                            <div className="events-top-control">
                                <VXInput id="event-type"
                                    value={this.props.zpnetEventsSettings.selectedEventType}
                                    onUpdate={this.handleChangeSelectedEventType.bind(this)}/>
                            </div>
                        </div>
                        <div className="col-sm-2">
                            <div className="events-top-control">
                                <VXSelect id="event-rows"
                                    codeArray={this.props.rowsArray}
                                    value={this.props.zpnetEventsSettings.selectedEventRows}
                                    onChange={this.handleChangeSelectedEventRows.bind(this)}/>
                            </div>
                        </div>
                        <div className="col-sm-3">
                            <div className="events-top-control">
                                <VXDate id={"end-date"}
                                    format="MM/DD/YYYY HH:mm:ss"
                                    value={VXApp.safeDate(this.props.zpnetEventsSettings.eventEndDate)}
                                    timezone={this.props.zpnetEventsSettings.timezone}
                                    onChange={this.handleChangeEventEndDate.bind(this)}/>
                            </div>
                        </div>
                    </div>
                </VXForm>
            </div>
        )
    }

    handleChangeSelectedEventType(event) {
        const selectedEventType = event.target.value
        VXApp.setZPNetEventsSettings("selectedEventType", selectedEventType)
    }

    handleChangeSelectedEventRows(event) {
        const selectedEventRows = parseInt(event.target.value);
        VXApp.setZPNetEventsSettings("selectedEventRows", selectedEventRows)
    }

    handleChangeEventEndDate(event) {
        OLog.debug(`EventsControls.jsx handleChangeEndDate date=${event.date}`)
        const eventEndDate = event.date ? event.date.toDate() : null
        VXApp.setZPNetEventsSettings("eventEndDate", eventEndDate)
    }
}
