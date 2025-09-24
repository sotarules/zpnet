VXApp = _.extend(VXApp || {}, {

    /**
     * Handle REST API request.
     *
     * @param {object} req HTTP request object.
     */
    handleRESTAPIRequest(req) {
        try {
            OLog.debug(`vxapp.js handleRESTAPIRequest() ${req.method}`)
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
     * Given a shared subscription registry and subscription name, begin a time-based
     * aggregation function to compute a reduced output in a single row of the collection.
     *
     * @param {object} registry Shared subscription registry.
@param {object} dashboardSettings Dashboard settings.
     * @param {fuction} funktion Aggregation function to call on interval.
     * @param {object} publicationContext Publication context.
     * @param {number} intervalMs Interval in milliseconds.
     */
    handlePublishAggregate(registry, dashboardSettings, funktion, publicationContext, intervalMs) {
        try {
            const subscriptionName = dashboardSettings.subscriptionName
            OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} *subscribe*`)
            if (!registry[subscriptionName]) {
                OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} initializing registry entry`)
                registry[subscriptionName] = {subscriberCount: 0}
            }
            const agg = registry[subscriptionName]
            agg.subscriberCount++
            OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} subscriberCount=${agg.subscriberCount}`)
            if (agg.subscriberCount === 1) {
                VXApp.startAggregator(registry, dashboardSettings, funktion, intervalMs)
            }
            publicationContext.onStop(() => {
                OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} onStop *init*`)
                const agg = registry[subscriptionName]
                if (!agg) return;
                agg.subscriberCount = Math.max(0, agg.subscriberCount - 1)
                OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} onStop subscriberCount=${agg.subscriberCount}`)
                if (agg.subscriberCount === 0) {
                    VXApp.stopAggregator(registry, dashboardSettings)
                    delete registry[subscriptionName]
                }
            })
            OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} returning cursor`)
            return Aggregates.find({subscriptionName})
        } catch (error) {
            OLog.error(`vxapp.js handlePublishAggregate Error: ${error.message}`)
        }
    },

    /**
     * Given a shared subscription registry and subscription name in dashboard settings,
     * start an aggregation function.
     *
     * @param {object} registry Shared subscription registry.
     * @param {object} dashboardSettings Dashboard settings.
     * @param {fuction} funktion Aggregation function to call on interval.
     * @param {number} intervalMs Interval in milliseconds.
     */
    startAggregator(registry, dashboardSettings, funktion, intervalMs) {
        const subscriptionName = dashboardSettings.subscriptionName
        const agg = registry[subscriptionName]
        funktion(dashboardSettings)
        agg.intervalHandle = Meteor.setInterval(() => {
            funktion(dashboardSettings)
        }, intervalMs)
        OLog.warn(`vxapp.js startAggregator ${subscriptionName} *start* intervalMs=${intervalMs}`)
    },

    /**
     * Given a shared subscription registry and subscription name, stop an aggregation function.
     *
     * @param {object} registry Shared subscription registry.
     * @param {object} dashboardSettings Dashboard settings.
     */
    stopAggregator(registry, dashboardSettings) {
        const subscriptionName = dashboardSettings.subscriptionName
        const agg = registry[subscriptionName]
        Meteor.clearInterval(agg.intervalHandle)
        OLog.warn(`vxapp.js stopAggregator ${subscriptionName} *stop*`)
    },

    /**
     * Aggregate current rail voltages for real-time analysis.
     * Walk backwards from now until a discontinuity (voltage spike) is detected.
     * Downsample along the way to keep payload small.
     * Store the resulting curve in Aggregates under the subscription name.
     *
     * @param {object} dashboardSettings Dashboard settings object.
     */
    aggregateBatteryStatus(dashboardSettings) {
        try {
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

            cursor.forEach(e => {
                if (stop) return

                const sensors = e.payload?.sensors
                if (!sensors || sensors.length < 3) return

                const batteryVoltage = sensors[0]?.voltage
                const v3v3Voltage = sensors[1]?.voltage
                const v5vVoltage = sensors[2]?.voltage

                if (batteryVoltage == null || v3v3Voltage == null || v5vVoltage == null) return

                if (lastBatteryVoltage !== null) {
                    const dv = Math.abs(batteryVoltage - lastBatteryVoltage)
                    if (dv > VOLTAGE_RESET_THRESHOLD) {
                        // Snap downward → new run started → stop here
                        stop = true
                        return
                    }
                }

                if (i % DOWNSAMPLE_STEP === 0) {
                    const ts = new Date(e.timestamp)
                    // Format as HH:MM in America/Los_Angeles time
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
                        v3v3Voltage,
                        v5vVoltage
                    })
                }

                lastBatteryVoltage = batteryVoltage
                i++
            })

            OLog.warn(`vxapp.js aggregateBatteryStatus ${subscriptionName} raw.length=${samples.length}`)

            // Pass through with timeLabel instead of minutes
            const window = samples.map(p => ({
                timeLabel: p.timeLabel,
                batteryVoltage: p.batteryVoltage,
                v3v3Voltage: p.v3v3Voltage,
                v5vVoltage: p.v5vVoltage
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
