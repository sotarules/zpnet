import { withTracker } from "meteor/react-meteor-data"
import ZPNetEventsTable from "/imports/zpnetevents/client/ZPNetEventsTable"

export default withTracker(props => {

    const publishRequest = VXApp.makeZPNetPublishRequest(props.zpnetEventsSettings)

    return {
        eventRows : ZPNetEvents.find(publishRequest.criteria, publishRequest.options).fetch()
    }

})(ZPNetEventsTable)
