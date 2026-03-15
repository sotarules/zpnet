import { WebApp } from "meteor/webapp"
import zlib from "zlib"

/*
 * ============================================================
 *  ZPNet Server — REST Ingress (gzip-only, /api scoped)
 *
 *  Policy:
 *    • All request bodies sent to /api MUST be gzip-compressed
 *    • GET requests are bodyless and bypass gzip enforcement
 *    • UI and static routes (/) are untouched
 *    • /api owns its request stream end-to-end (no bodyParser)
 *
 *  ZPNet Command Endpoint:
 *    • /zpnet/cmd accepts plain JSON POST (no gzip requirement)
 *    • Routes commands through the ZPNet pub/sub bus
 *    • Analogous to zpnet-cmd CLI on the Pi
 *
 * ============================================================
 */

/*
 * ------------------------------------------------------------
 *  GZIP INGEST + BODY PARSING — API ONLY
 * ------------------------------------------------------------
 */
WebApp.connectHandlers.use("/api", (req, res, next) => {
    const method = req.method || "GET"
    const enc = req.headers["content-encoding"]
    const type = req.headers["content-type"] || ""

    // GET requests have no body and bypass gzip enforcement
    if (method === "GET") {
        next()
        return
    }

    // Enforce gzip for all API request bodies
    if (enc !== "gzip") {
        res.writeHead(415)
        res.end("Content-Encoding gzip required")
        return
    }

    const chunks = []

    req.on("data", chunk => {
        chunks.push(chunk)
    })

    req.on("end", () => {
        const buffer = Buffer.concat(chunks)

        zlib.gunzip(buffer, (err, decoded) => {
            if (err) {
                res.writeHead(400)
                res.end("Invalid gzip body")
                return
            }

            try {
                if (type.includes("application/json")) {
                    req.body = JSON.parse(decoded.toString("utf8"))
                } else {
                    req.body = decoded
                }
                next()
            } catch (e) {
                res.writeHead(400)
                res.end("Invalid request body")
            }
        })
    })
})

/*
 * ------------------------------------------------------------
 *  JSON BODY PARSING — /zpnet scoped (plain JSON, no gzip)
 * ------------------------------------------------------------
 */
WebApp.connectHandlers.use("/zpnet", (req, res, next) => {
    if (req.method !== "POST") {
        next()
        return
    }

    const type = req.headers["content-type"] || ""
    if (!type.includes("application/json")) {
        res.writeHead(415, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "Content-Type application/json required" }))
        return
    }

    const chunks = []

    req.on("data", chunk => {
        chunks.push(chunk)
    })

    req.on("end", () => {
        try {
            req.body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
            next()
        } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: "Invalid JSON body" }))
        }
    })
})

/*
 * ------------------------------------------------------------
 *  IP / AUTH MONITORING (unchanged semantics)
 * ------------------------------------------------------------
 */
const IP_WHITELIST = ["198.54.129.52", "127.0.0.1"]

function getClientIp(req) {
    const xfwd = req.headers["x-forwarded-for"]
    if (xfwd) {
        return xfwd.split(",")[0].trim()
    }
    return (
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.connection?.socket?.remoteAddress ||
        "unknown"
    )
}

WebApp.connectHandlers.use((req, res, next) => {
    const ip = getClientIp(req)

    if (IP_WHITELIST.includes(ip)) {
        next()
        return
    }

    if (req.headers.cookie?.indexOf("x_mtok") >= 0) {
        next()
        return
    }

    next()
})

/*
 * ------------------------------------------------------------
 *  ZPNet COMMAND ENDPOINT
 *
 *  POST /zpnet/cmd
 *
 *  Body:
 *    { "machine": "PI"|"TEENSY", "subsystem": "...", "command": "...", "args": {...} }
 *
 *  Response:
 *    { "success": true|false, "message": "...", "payload": {...} }
 *
 *  Usage from Windows:
 *    curl -X POST http://localhost:3000/zpnet/cmd ^
 *      -H "Content-Type: application/json" ^
 *      -d "{\"machine\":\"PI\",\"subsystem\":\"SYSTEM\",\"command\":\"REPORT\"}"
 *
 * ------------------------------------------------------------
 */
WebApp.connectHandlers.use("/zpnet/cmd", Meteor.bindEnvironment((req, res) => {
    if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "POST only" }))
        return
    }

    const { machine, subsystem, command, args } = req.body || {}

    if (!machine || !subsystem || !command) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ error: "machine, subsystem, and command are required" }))
        return
    }

    OLog.debug(`service.js /zpnet/cmd ${machine} ${subsystem} ${command}`)

    ZPNetProcess.sendCommand(machine, subsystem, command, args || null)
        .then(Meteor.bindEnvironment((result) => {
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify(result, null, 2))
        }))
        .catch(Meteor.bindEnvironment((err) => {
            OLog.error(`service.js /zpnet/cmd error: ${err.message}`)
            res.writeHead(500, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ success: false, message: err.message }))
        }))
}))

/*
 * ------------------------------------------------------------
 *  API ROUTES
 * ------------------------------------------------------------
 */

WebApp.connectHandlers.use("/api/test", (req, res) => {
    VXApp.handleRESTAPITest(req, res)
})

WebApp.connectHandlers.use("/api/upload_test", (req, res) => {
    VXApp.handleRESTAPIUploadTest(req, res)
})

WebApp.connectHandlers.use("/api/download_test", (req, res) => {
    VXApp.handleRESTAPIDownloadTest(req, res)
})

WebApp.connectHandlers.use("/api", (req, res) => {
    VXApp.handleRESTAPIRequest(req, res)
})