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
        }
        catch (error) {
            OLog.error(`vxapp.js handleRESTAPIRequest Error: ${error.message}`)
        }
    },

    /**
     * Given a shared subscription registry and subscription name, begin a time-based
     * aggregation function to compute a reduced output in a single row of the collection.
     *
     * @param {object} registry Shared subscription registry.
     * @param {string} subscriptionName Subscription name.
     * @param {fuction} funktion Aggregation function to call on interval.
     * @param {object} publicationContext Publication context.
     * @param {number} intervalMs Interval in milliseconds.
     */
    handlePublishAggregate(registry, subscriptionName, funktion, publicationContext, intervalMs) {
        try {
            OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} *subscribe*`)
            if (!registry[subscriptionName]) {
                OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} initializing registry entry`)
                registry[subscriptionName] = {subscriberCount: 0}
            }
            const agg = registry[subscriptionName]
            agg.subscriberCount++
            OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} subscriberCount=${agg.subscriberCount}`)
            if (agg.subscriberCount === 1) {
                VXApp.startAggregator(registry, subscriptionName, funktion, intervalMs)
            }
            publicationContext.onStop(() => {
                OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} onStop *init*`)
                const agg = registry[subscriptionName]
                if (!agg) return;
                agg.subscriberCount = Math.max(0, agg.subscriberCount - 1)
                OLog.warn(`vxapp.js handlePublishAggregate ${subscriptionName} onStop subscriberCount=${agg.subscriberCount}`)
                if (agg.subscriberCount === 0) {
                    VXApp.stopAggregator(registry, subscriptionName)
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
     * Given a shared subscription registry and subscription name, start an aggregation function.
     *
     * @param {object} registry Shared subscription registry.
     * @param {string} subscriptionName Subscription name.
     * @param {fuction} funktion Aggregation function to call on interval.
     * @param {number} intervalMs Interval in milliseconds.
     */
    startAggregator(registry, subscriptionName, funktion, intervalMs) {
        const agg = registry[subscriptionName]
        funktion(subscriptionName)
        agg.intervalHandle = Meteor.setInterval(() => {
            funktion(subscriptionName)
        }, intervalMs)
        OLog.warn(`vxapp.js startAggregator ${subscriptionName} *start* intervalMs=${intervalMs}`)
    },

    /**
     * Given a shared subscription registry and subscription name, stop an aggregation function.
     *
     * @param {object} registry Shared subscription registry.
     * @param {string} subscriptionName Subscription name.
     */
    stopAggregator(registry, subscriptionName) {
        const agg = registry[subscriptionName]
        Meteor.clearInterval(agg.intervalHandle)
        OLog.warn(`vxapp.js stopAggregator ${subscriptionName} *stop*`)
    },

    /**
     * Aggregate current battery discharge curve for real-time analysis.
     * Walk backwards from now until a discontinuity (voltage spike) is detected.
     * Downsample along the way to keep payload small.
     * Store the resulting curve in Aggregates under the subscription name.
     *
     * @param {string} subscriptionName Subscription name.
     */
    aggregateBatteryStatus(subscriptionName) {
        try {
            const now = new Date()
            const selector = {event_type: "POWER_STATUS"}
            const options = {sort: {timestamp: -1}} // newest → oldest
            const cursor = ZPNetEvents.find(selector, options)

            const VOLTAGE_RESET_THRESHOLD = 0.5  // a real swap is a big snap
            const DOWNSAMPLE_STEP = 5

            const raw = []
            let lastVoltage = null
            let stop = false
            let i = 0

            cursor.forEach(e => {
                if (stop) return

                const sensor = e.payload?.sensors?.[0]
                if (!sensor) return

                const voltage = sensor.voltage
                const ts = new Date(e.timestamp).getTime()

                if (lastVoltage !== null) {
                    const dv = Math.abs(voltage - lastVoltage)
                    if (dv > VOLTAGE_RESET_THRESHOLD) {
                        // Snap downward → new run started → stop here
                        stop = true
                        return
                    }
                }

                if (i % DOWNSAMPLE_STEP === 0) {
                    raw.push({ts, voltage})
                }

                lastVoltage = voltage
                i++
            })

            // reverse into chronological order
            const reversed = raw.reverse()

            // normalize to elapsed minutes
            const t0 = reversed[0]?.ts || now.getTime()
            const window = reversed.map(p => ({
                minutes: (p.ts - t0) / 60000,
                voltage: p.voltage
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
        }
        catch (error) {
            OLog.error(`vxapp.js aggregateBatteryStatus Error: ${error.message}`)
        }
    }
})
