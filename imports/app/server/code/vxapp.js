VXApp = _.extend(VXApp || {}, {

    /**
     * Handle REST API test — definitive health probe.
     *
     * GET /api/test → { status: "OK" }
     */
    handleRESTAPITest(req, res) {
        try {
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Connection": "close"
            })
            res.end(JSON.stringify({ message: "ZPNet OK" }))
        }
        catch (error) {
            OLog.error(`vxapp.js handleRESTAPITest Error: ${error.message}`)
            res.writeHead(500, {
                "Content-Type": "application/json",
                "Connection": "close"
            })
            res.end(JSON.stringify({ error: "Internal Server Error" }))
        }
    },

    /**
     * Handle REST API upload test — network throughput (upload direction).
     *
     * POST /api/upload_test
     */
    handleRESTAPIUploadTest(req, res) {
        try {
            const body = { message: "ZPNet Upload OK" }
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Content-Encoding": "identity",
                "Connection": "close"
            })
            res.end(JSON.stringify(body))
        }
        catch (error) {
            OLog.error(`vxapp.js handleRESTAPIUploadTest Error: ${error.message}`)
            res.writeHead(500, {
                "Content-Type": "application/json",
                "Connection": "close"
            })
            res.end(JSON.stringify({ error: "Internal Server Error" }))
        }
    },

    /**
     * Handle REST API download test — network throughput (download direction).
     *
     * GET /api/download_test
     */
    handleRESTAPIDownloadTest(req, res) {
        try {
            const payload = Array.from({ length: 1024 * 1024 }, () =>
                String.fromCharCode(65 + Math.floor(Math.random() * 26))
            ).join("")
            const body = { message: "ZPNet Download OK", payload }
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Content-Encoding": "identity",
                "Connection": "close"
            })
            res.end(JSON.stringify(body))
        }
        catch (error) {
            OLog.error(`vxapp.js handleRESTAPIDownloadTest Error: ${error.message}`)
            res.writeHead(500, {
                "Content-Type": "application/json",
                "Connection": "close"
            })
            res.end(JSON.stringify({ error: "Internal Server Error" }))
        }
    },

    /**
     * Handle event stream ingestion from ZPNet Sensor Suite.
     *
     * POST /api/events
     *
     * Body is an array of event objects. Each event is stored
     * raw in MongoDB for durability and long-term preservation.
     */
    handleEvents(req, res) {
        OLog.debug(`vxapp.js handleEvents received POST with body: ${OLog.debugString(req.body)}`)
        try {
            if (!req.body) {
                OLog.error("vxapp.js handleEvents request contains no body")
                res.writeHead(400, {
                    "Content-Type": "application/json",
                    "Connection": "close"
                })
                return res.end(JSON.stringify({ error: "Missing request body" }))
            }
            if (!Array.isArray(req.body)) {
                OLog.error("vxapp.js handleEvents request body must be of type array")
                res.writeHead(400, {
                    "Content-Type": "application/json",
                    "Connection": "close"
                })
                return res.end(JSON.stringify({ error: "Body must be array" }))
            }
            req.body.forEach(event => {
                const record = {
                    id: event.id,
                    timestamp: moment(`${event.ts}`).toDate(),
                    event_type: event.event_type,
                    payload: event.payload
                }
                ZPNetEvents.insert(record)
            })
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Connection": "close"
            })
            res.end(JSON.stringify({ message: "POST received" }))
        }
        catch (error) {
            OLog.error(`vxapp.js handleEvents Error: ${error.message}`)
            res.writeHead(500, {
                "Content-Type": "application/json",
                "Connection": "close"
            })
            res.end(JSON.stringify({ error: "Error processing events" }))
        }
    },

    /**
     * Handle timebase record ingestion.
     *
     * POST /api/timebase
     *
     */
    handleTimebase(req, res) {
        OLog.debug(`vxapp.js handleTimebase received POST with body: ${OLog.debugString(req.body)}`)
        try {
            if (!req.body) {
                OLog.error("vxapp.js handleTimebase request contains no body")
                res.writeHead(400, {
                    "Content-Type": "application/json",
                    "Connection": "close"
                })
                return res.end(JSON.stringify({ error: "Missing request body" }))
            }
            if (!Array.isArray(req.body)) {
                OLog.error("vxapp.js handleTimebase request body must be of type array")
                res.writeHead(400, {
                    "Content-Type": "application/json",
                    "Connection": "close"
                })
                return res.end(JSON.stringify({ error: "Body must be array" }))
            }
            req.body.forEach(timebase => {
                const record = {
                    id: timebase.id,
                    timestamp: moment(`${timebase.ts}`).toDate(),
                    campaign: timebase.campaign,
                    payload: timebase.payload
                }
                Timebase.insert(record)
            })
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Connection": "close"
            })
            res.end(JSON.stringify({ message: "POST received" }))
        }
        catch (error) {
            OLog.error(`vxapp.js handleTimeabse Error: ${error.message}`)
            res.writeHead(500, {
                "Content-Type": "application/json",
                "Connection": "close"
            })
            res.end(JSON.stringify({ error: "Error processing events" }))
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
            OLog.debug(`vxapp.js handlePublishAggregate ${aggregateName} *subscribe*`)
            const intervalHandle = VXApp.startAggregator(dashboardSettings, funktion, intervalMs)
            publicationContext.onStop(() => {
                OLog.debug(`vxapp.js handlePublishAggregate ${aggregateName} onStop *init*`)
                VXApp.stopAggregator(dashboardSettings, intervalHandle)
            })
            OLog.debug(`vxapp.js handlePublishAggregate ${aggregateName} returning cursor`)
            return Aggregates.find({aggregate_name: aggregateName})
        }
        catch (error) {
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
        OLog.debug(`vxapp.js startAggregator ${aggregateName} *start* intervalMs=${intervalMs}`)
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
        OLog.debug(`vxapp.js stopAggregator ${aggregateName} *stop*`)
    },

    /**
     * Aggregate rail voltages/currents/power for real-time power analysis.
     * Uses the most recent SWAP_BATTERY event (or Nth most recent if
     * batterySwapIndex > 0) to delimit the window of interest.
     *
     * Consumes SYSTEM_STATUS events and flattens all power rails across
     * all I²C buses into a single rail map suitable for visualization.
     *
     * HARD CONTRACT:
     *   • SYSTEM_STATUS.payload.power exists
     *   • payload.power contains bus objects (i2c-*)
     *   • each bus contains rail objects with required fields
     *
     * Any violation is a bug and MUST throw.
     *
     * @param {object} dashboardSettings Dashboard settings object.
     */
    aggregatePowerStatus(dashboardSettings) {
        try {
            OLog.debug(
                "vxapp.js aggregatePowerStatus *fire* " +
                `dashboardSettings=${OLog.debugString(dashboardSettings)}`
            )

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
                throw new Error(
                    `SWAP_BATTERY not found (batterySwapIndex=${batterySwapIndex})`
                )
            }

            const swapTime = new Date(swapEvent.timestamp)

            // --- Step 2: Collect SYSTEM_STATUS events since swap ---
            const selector = {
                event_type: "SYSTEM_STATUS",
                timestamp: { $gte: swapTime }
            }
            const options = { sort: { timestamp: 1 } } // oldest → newest
            const cursor = ZPNetEvents.find(selector, options)

            OLog.debug(`vxapp.js aggregatePowerStatus Found ${cursor.count()} SYSTEM_STATUS events since swap at ${swapTime.toISOString()}`)

            const samples = []
            let i = 0

            cursor.forEach(e => {
                const power = e.payload.power  // MUST exist

                if (i % DOWNSAMPLE_STEP === 0) {
                    const ts = new Date(e.timestamp)
                    const elapsedMs = ts - swapTime
                    const elapsedMinutes = Math.floor(elapsedMs / 60000)
                    const hours = Math.floor(elapsedMinutes / 60)
                    const minutes = elapsedMinutes % 60

                    const timeLabel =
                        `${hours.toString().padStart(2, "0")}:` +
                        `${minutes.toString().padStart(2, "0")}`

                    const railSnapshot = {}

                    // --- Flatten all buses into a single rail map ---
                    Object.entries(power).forEach(([busKey, bus]) => {
                        if (busKey === "health_state") return

                        Object.values(bus).forEach(r => {
                            const key = r.label
                                .toLowerCase()
                                .replace(/\s+/g, "_")
                                .replace(/[^a-z0-9_]/g, "")

                            railSnapshot[key] = {
                                label: r.label,
                                voltage_v: r.volts,
                                current_ma: r.amps,
                                power_w: r.watts,
                                ideal_voltage_v: r.ideal_voltage_v,
                                address: r.address
                            }
                        })
                    })

                    samples.push({
                        ts: ts.getTime(),
                        timeLabel,
                        rails: railSnapshot
                    })
                }

                i++
            })

            const payload = samples.map(s => ({
                timeLabel: s.timeLabel,
                rails: s.rails
            }))

            const aggregate = {
                timestamp: now,
                swapTime,
                sampleCount: samples.length,
                batterySwapIndex,
                payload
            }

            Aggregates.upsert(
                { aggregate_name: "POWER_STATUS" },
                { $set: aggregate }
            )
        }
        catch (error) {
            OLog.error(
                `vxapp.js aggregatePowerStatus Error: ${error.message}`
            )
        }
    }
})