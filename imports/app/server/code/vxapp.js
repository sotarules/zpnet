VXApp = _.extend(VXApp || {}, {

    /**
     * Handle REST API request.
     *
     * @param {object} req HTTP request object.
     * @param {object} res HTTP response object.
     */
    handleRESTAPIRequest(req, res) {
        try {
            OLog.debug(`vxapp.js handleRESTAPIRequest() ${req.method}`)
            switch (req.method) {
            case "POST":
                this.handlePost(req, res)
                break;
            case "GET":
                this.handleGet(req, res)
                break;
            default:
                OLog.warn(`vxapp.js handleRESTAPIRequest Unsupported method: ${req.method}`)
                res.writeHead(405, {"Content-Type": "text/plain"})
                res.end("Method Not Allowed")
                break;
            }
        } catch (error) {
            OLog.error(`vxapp.js handleRESTAPIRequest Error: ${error.message}`)
            res.writeHead(500, {"Content-Type": "text/plain"})
            res.end("Internal Server Error")
        }
    },

    /**
     * Handle POST from ZPNet (array of events).
     */
    handlePost(req, res) {
        try {
            OLog.debug(`vxapp.js handlePost() ${OLog.debugString(req.body)}`)
            if (!req.body) {
                OLog.error("vxapp.js handlePost Request contains no body")
                res.writeHead(400);
                return res.end("Missing request body");
            }
            if (!Array.isArray(req.body)) {
                OLog.error("vxapp.js handlePost Request body must be of type array")
                res.writeHead(400);
                return res.end("Body must be array")
            }
            req.body.forEach(event => {
                const zpnetEvent = {
                    id: event.id,
                    timestamp: moment(`${event.timestamp}Z`).toDate(),
                    event_type: event.event_type,
                    device: event.device,
                    device_description: event.device_description,
                    payload: Util.parseJSON(event.payload)
                }
                ZPNetEvents.insert(zpnetEvent)
            })
            res.writeHead(200, {"Content-Type": "text/plain"})
            res.end("POST received")
        }
        catch (error) {
            OLog.error(`vxapp.js handlePost Error: ${error.message}`)
            res.writeHead(500);
            res.end("Error processing POST")
        }
    },

    /**
     * Handle GET from ZPNet (return pending commands).
     *
     * @param {object} req HTTP request object.
     * @param {object} res HTTP response object.
     */
    handleGet(req, res) {
        try {
            OLog.debug(`vxapp.js handleGet() ${req.url}`)
            const selector = {}
            selector.despooled = { $exists: false }
            const pendingCommands = ZPNetCommands.find(selector).fetch()
            res.writeHead(200, {"Content-Type": "application/json"})
            res.end(JSON.stringify(pendingCommands))
            pendingCommands.forEach(command => {
                const modifier = {}
                modifier.$set = {}
                modifier.$set.despooled = new Date()
                ZPNetCommands.update(command._id, modifier)
            })
        }
        catch (error) {
            OLog.error(`vxapp.js handleGet Error: ${error.message}`)
            res.writeHead(500)
            res.end("Error processing GET")
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
            const aggregateName = dashboardSettings.aggregateName
            OLog.warn(`vxapp.js handlePublishAggregate ${aggregateName} *subscribe*`)
            const intervalHandle = VXApp.startAggregator(dashboardSettings, funktion, intervalMs)
            publicationContext.onStop(() => {
                OLog.warn(`vxapp.js handlePublishAggregate ${aggregateName} onStop *init*`)
                VXApp.stopAggregator(dashboardSettings, intervalHandle)
            })
            OLog.warn(`vxapp.js handlePublishAggregate ${aggregateName} returning cursor`)
            return Aggregates.find({aggregate_name: aggregateName})
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
        const aggregateName = dashboardSettings.aggregateName
        funktion(dashboardSettings)
        const intervalHandle = Meteor.setInterval(() => {
            funktion(dashboardSettings)
        }, intervalMs)
        OLog.warn(`vxapp.js startAggregator ${aggregateName} *start* intervalMs=${intervalMs}`)
        return intervalHandle
    },

    /**
     * Stop an aggregate function.
     *
     * @param {object} dashboardSettings Dashboard settings.
     * @param {object} intervalHandle Interval handle.
     */
    stopAggregator(dashboardSettings, intervalHandle) {
        const aggregateName = dashboardSettings.aggregateName
        Meteor.clearInterval(intervalHandle)
        OLog.warn(`vxapp.js stopAggregator ${aggregateName} *stop*`)
    },

    /**
     * Aggregate rail voltages/currents/power for real-time analysis.
     * Uses the most recent SWAP_BATTERY event (or Nth most recent if
     * batterySwapIndex > 0) to delimit the window of interest.
     * Only POWER_STATUS events occurring after that timestamp are considered.
     * Downsamples the result to keep payload small, and stores the resulting
     * curve in the Aggregates collection under the name "BATTERY_STATUS".
     *
     * @param {object} dashboardSettings Dashboard settings object.
     */
    aggregateBatteryStatus(dashboardSettings) {
        try {
            OLog.warn("vxapp.js aggregateBatteryStatus *fire* " +
             `dashboardSettings=${OLog.debugString(dashboardSettings)}`)

            const now = new Date()
            const DOWNSAMPLE_STEP = 10
            const batterySwapIndex = dashboardSettings.batterySwapIndex || 0

            // --- Step 1: Find the Nth most recent SWAP_BATTERY event ---
            const swapCursor = ZPNetEvents.find(
                { event_type: "SWAP_BATTERY" },
                { sort: { timestamp: -1 }, skip: batterySwapIndex, limit: 1 }
            )
            const swapEvent = swapCursor.fetch()[0]

            if (!swapEvent) {
                OLog.warn("vxapp.js aggregateBatteryStatus No SWAP_BATTERY event " +
                 `found (batterySwapIndex=${batterySwapIndex})`)
                return
            }

            const swapTime = swapEvent.timestamp
            OLog.warn(`vxapp.js aggregateBatteryStatus Using SWAP_BATTERY at ${swapTime.toISOString()}`)

            // --- Step 2: Collect POWER_STATUS events since that swap ---
            const selector = {
                event_type: "POWER_STATUS",
                timestamp: { $gte: swapTime }
            }
            const options = { sort: { timestamp: 1 } } // oldest → newest
            const cursor = ZPNetEvents.find(selector, options)

            const samples = []
            let i = 0

            cursor.forEach(e => {
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

                if (
                    batteryVoltage == null ||
                    v3v3Voltage == null ||
                    v5vVoltage == null
                ) {
                    return
                }

                if (i % DOWNSAMPLE_STEP === 0) {
                    const ts = new Date(e.timestamp)
                    const timeLabel = ts.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "America/Los_Angeles"
                    })

                    samples.push({
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
                i++
            })

            OLog.warn(`vxapp.js aggregateBatteryStatus samples.length=${samples.length}`)

            const payload = samples.map(p => ({
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
                timestamp: now,
                swapTime: swapTime,
                sampleCount: samples.length,
                batterySwapIndex,
                payload
            }

            Aggregates.upsert(
                { aggregate_name: "BATTERY_STATUS"},
                { $set: aggregate }
            )
        }
        catch (error) {
            OLog.error(`vxapp.js aggregateBatteryStatus Error: ${error.message}`)
        }
    }
})
