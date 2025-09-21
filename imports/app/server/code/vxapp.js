VXApp = { ...VXApp, ...{

    /**
     * Handle REST API request.
     *
     * @param {object} req HTTP request object.
     */
    handleRESTAPIRequest(req) {
        try {
            OLog.debug(`vxappl.js handleRestCall() ${req.method} ${OLog.debugString(req.body)}`)
            if (!req.body) {
                OLog.error("vxapp.js handleRESTAPIRequest Request contains no body")
                return
            }
            const event = req.body
            const domain = Domains.findOne({ name: "ZPNet Production" })
            const eventData = event
            VXApp.createEvent("POWER_STATUS", domain._id, eventData)
        }
        catch (error) {
            OLog.error(`vxapp.js handleRESTAPIRequest Error: ${error.message}`)
        }
    }
}}
