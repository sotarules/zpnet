VXApp = _.extend(VXApp || {}, {

    /**
     * Handle REST API request.
     *
     * @param {object} req HTTP request object.
     */
    handleRESTAPIRequest(req) {
        try {
            OLog.debug(`vxapp.js handleRESTAPIRequest() ${req.method} ${OLog.debugString(req.body)}`)
            if (!req.body) {
                OLog.error("vxapp.js handleRESTAPIRequest Request contains no body")
                return
            }
            if (!_.isArray(req.body)) {
                OLog.error("vxapp.js handleRESTAPIRequest Request body must be of type array")
                return
            }
            //const domain = Domains.findOne({ name: "ZPNet Production" })
            req.body.forEach(event => {
                const zpnetEvent = {}
                zpnetEvent.id = event.id
                zpnetEvent.timestamp = moment(`${event.timestamp}Z`).toDate()
                zpnetEvent.event_type = event.event_type
                zpnetEvent.device = event.device
                zpnetEvent.device_description = event.device_description
                zpnetEvent.payload = Util.parseJSON(event.payload)
                ZPNetEvents.insert(zpnetEvent)
            })
        } catch (error) {
            OLog.error(`vxapp.js handleRESTAPIRequest Error: ${error.message}`)
        }
    },

    /**
     * Given a subscription name, begin a time-based aggregation function to compute a reduced output in a single row of the collection.
     *
     * @param {object} dashboardSettings Dashboard settings.
     * @param {fuction} funktion Aggregation function to call on interval.
     * @param {object} publicationContext Publication context.
     * @param {number} intervalMs Interval in milliseconds.
     */
    handlePublishAggregate(dashboardSettings, funktion, publicationContext, intervalMs) {
        try {
            const subscriptionName = dashboardSettings.subscriptionName
            OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} *subscribe*`)
            const intervalHandle = VXApp.startAggregator(dashboardSettings, funktion, intervalMs)
            publicationContext.onStop(() => {
                OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} onStop *init*`)
                VXApp.stopAggregator(dashboardSettings, intervalHandle)
            })
            OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} returning cursor`)
            return Aggregates.find({subscriptionName})
        } catch (error) {
            OLog.error(`vxapp.js handlePublishAggregate Error: ${error.message}`)
        }
    },

    /**
     * Start an aggregation function.
     *
     * @param {object} dashboardSettings Dashboard settings.
     * @param {fuction} funktion Aggregation function to call on interval.
     * @param {number} intervalMs Interval in milliseconds.
     * @return {object} Interval handle.
     */
    startAggregator(dashboardSettings, funktion, intervalMs) {
        const subscriptionName = dashboardSettings.subscriptionName
        funktion(dashboardSettings)
        const intervalHandle = Meteor.setInterval(() => {
            funktion(dashboardSettings)
        }, intervalMs)
        OLog.warn(`vxapp.js startAggregator ${subscriptionName} *start* intervalMs=${intervalMs}`)
        return intervalHandle
    },

    /**
     * Stop an aggregate function.
     *
     * @param {object} dashboardSettings Dashboard settings.
     * @param {object} intervalHandle Interval handle.
     */
    stopAggregator(dashboardSettings, intervalHandle) {
        const subscriptionName = dashboardSettings.subscriptionName
        Meteor.clearInterval(intervalHandle)
        OLog.warn(`vxapp.js stopAggregator ${subscriptionName} *stop*`)
    },

    /**
     * Aggregate rail voltages/currents/power for real-time analysis.
     * Walk backwards from now until a discontinuity (voltage spike) is detected.
     * Downsample along the way to keep payload small. Store the resulting curve
     * in Aggregates under the subscription name. Note: now you can supply
     * batterySwapIndex in dashboardSettings to go back in time
     * (1 = last swap 2 = earlier swap, etc).
     *
     * @param {object} dashboardSettings Dashboard settings object.
     */
    aggregateBatteryStatus(dashboardSettings) {
        try {
            OLog.warn(`vxapp.js aggregateBatteryStatus *fire* dashboardSettings=${OLog.debugString(dashboardSettings)}`)
            const subscriptionName = dashboardSettings.subscriptionName
            const now = new Date()
            const selector = {event_type: "POWER_STATUS"}
            const options = {sort: {timestamp: -1}} // newest → oldest
            const cursor = ZPNetEvents.find(selector, options)

            const VOLTAGE_RESET_THRESHOLD = 0.5  // a real swap is a big snap
            const DOWNSAMPLE_STEP = 10

            const samples = []
            let lastBatteryVoltage = null
            let stop = false
            let i = 0
            let batterySwapIndex = dashboardSettings.batterySwapIndex

            cursor.forEach(e => {
                if (stop) return

                const sensors = e.payload?.sensors
                if (!sensors || sensors.length < 3) return

                const batteryVoltage = sensors[0]?.voltage
                const batteryCurrent = sensors[0]?.current
                const batteryPower = sensors[0]?.power

                const v3v3Voltage = sensors[1]?.voltage
                const v3v3Current = sensors[1]?.current
                const v3v3Power = sensors[1]?.power

                const v5vVoltage = sensors[2]?.voltage
                const v5vCurrent = sensors[2]?.current
                const v5vPower = sensors[2]?.power

                if (batteryVoltage == null || v3v3Voltage == null || v5vVoltage == null) return

                if (lastBatteryVoltage !== null) {
                    const dv = Math.abs(batteryVoltage - lastBatteryVoltage)
                    if (dv > VOLTAGE_RESET_THRESHOLD) {
                        OLog.warn(`vxapp.js aggregateBatteryStatus ${subscriptionName} detected voltage *reset*` +
                            ` batteryVoltage=${batteryVoltage.toFixed(3)}V lastBatteryVoltage=${lastBatteryVoltage.toFixed(3)}V` +
                            ` deltaV=${dv.toFixed(3)} batterySwapIndex=${batterySwapIndex}`)
                        if (batterySwapIndex === 0) {
                            stop = true
                            return
                        }
                        batterySwapIndex--
                    }
                }

                if (i % DOWNSAMPLE_STEP === 0) {
                    const ts = new Date(e.timestamp)
                    const timeLabel = ts.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "America/Los_Angeles"
                    })

                    samples.unshift({
                        ts: ts.getTime(),
                        timeLabel,
                        batteryVoltage,
                        batteryCurrent,
                        batteryPower,
                        v3v3Voltage,
                        v3v3Current,
                        v3v3Power,
                        v5vVoltage,
                        v5vCurrent,
                        v5vPower
                    })
                }

                lastBatteryVoltage = batteryVoltage
                i++
            })

            OLog.warn(`vxapp.js aggregateBatteryStatus ${subscriptionName} raw.length=${samples.length}`)

            const window = samples.map(p => ({
                timeLabel: p.timeLabel,
                batteryVoltage: p.batteryVoltage,
                batteryCurrent: p.batteryCurrent,
                batteryPower: p.batteryPower,
                v3v3Voltage: p.v3v3Voltage,
                v3v3Current: p.v3v3Current,
                v3v3Power: p.v3v3Power,
                v5vVoltage: p.v5vVoltage,
                v5vCurrent: p.v5vCurrent,
                v5vPower: p.v5vPower
            }))

            const aggregate = {
                subscriptionName,
                timestamp: now,
                window
            }

            Aggregates.upsert(
                {subscriptionName},
                {$set: aggregate}
            )
        } catch (error) {
            OLog.error(`vxapp.js aggregateBatteryStatus Error: ${error.message}`)
        }
    }
})
