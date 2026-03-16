import { WebApp } from "meteor/webapp"
import zlib from "zlib"

/*
 * ============================================================
 *  ZPNet Server — REST Ingress
 *
 *  All ZPNet REST endpoints live under /api:
 *
 *    POST /api/events        — event stream ingestion
 *    POST /api/timebase      — timebase record ingestion (future)
 *    POST /api/cmd           — command bridge (ZPNetProcess.sendCommand)
 *    GET  /api/test          — definitive health probe
 *    POST /api/upload_test   — network throughput (upload)
 *    GET  /api/download_test — network throughput (download)
 *
 *  Body parsing policy:
 *    • POST bodies may be gzip-compressed or plain JSON
 *    • If Content-Encoding is "gzip", the body is decompressed
 *    • Otherwise the body is parsed as plain JSON
 *    • GET requests are bodyless and bypass parsing entirely
 *
 * ============================================================
 */

/*
 * ------------------------------------------------------------
 *  BODY PARSING — /api scoped (gzip optional)
 * ------------------------------------------------------------
 */
WebApp.connectHandlers.use("/api", (req, res, next) => {
    const method = req.method || "GET"

    // GET requests have no body — pass through
    if (method === "GET") {
        next()
        return
    }

    const enc = req.headers["content-encoding"]
    const type = req.headers["content-type"] || ""

    const chunks = []

    req.on("data", chunk => {
        chunks.push(chunk)
    })

    req.on("end", () => {
        const buffer = Buffer.concat(chunks)

        if (enc === "gzip") {
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
        } else {
            try {
                if (type.includes("application/json")) {
                    req.body = JSON.parse(buffer.toString("utf8"))
                } else {
                    req.body = buffer
                }
                next()
            } catch (e) {
                res.writeHead(400)
                res.end("Invalid request body")
            }
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
 *  /api/events — POST event stream ingestion
 * ------------------------------------------------------------
 */
WebApp.connectHandlers.use("/api/events", Meteor.bindEnvironment((req, res) => {
    if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "application/json", "Connection": "close" })
        res.end(JSON.stringify({ error: "POST only" }))
        return
    }
    VXApp.handleEvents(req, res)
}))

/*
 * ------------------------------------------------------------
 *  /api/timebase — POST timebase record ingestion (future)
 * ------------------------------------------------------------
 */
WebApp.connectHandlers.use("/api/timebase", Meteor.bindEnvironment((req, res) => {
    if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "application/json", "Connection": "close" })
        res.end(JSON.stringify({ error: "POST only" }))
        return
    }
    VXApp.handleTimebase(req, res)
}))

/*
 * ------------------------------------------------------------
 *  /api/cmd — POST command bridge
 *
 *  Body:
 *    { "machine": "PI"|"TEENSY"|"SERVER",
 *      "subsystem": "...", "command": "...", "args": {...} }
 *
 *  Response:
 *    { "success": true|false, "message": "...", "payload": {...} }
 *
 *  Usage from Windows:
 *    curl -X POST http://sota.ddns.net/api/cmd ^
 *      -H "Content-Type: application/json" ^
 *      -d "{\"machine\":\"PI\",\"subsystem\":\"SYSTEM\",\"command\":\"REPORT\"}"
 *
 * ------------------------------------------------------------
 */
WebApp.connectHandlers.use("/api/cmd", Meteor.bindEnvironment((req, res) => {
    if (req.method !== "POST") {
        res.writeHead(405, { "Content-Type": "application/json", "Connection": "close" })
        res.end(JSON.stringify({ error: "POST only" }))
        return
    }

    const { machine, subsystem, command, args } = req.body || {}

    if (!machine || !subsystem || !command) {
        res.writeHead(400, { "Content-Type": "application/json", "Connection": "close" })
        res.end(JSON.stringify({ error: "machine, subsystem, and command are required" }))
        return
    }

    OLog.debug(`service.js /api/cmd ${machine} ${subsystem} ${command}`)

    ZPNetProcess.sendCommand(machine, subsystem, command, args || null)
        .then(Meteor.bindEnvironment((result) => {
            res.writeHead(200, { "Content-Type": "application/json", "Connection": "close" })
            res.end(JSON.stringify(result, null, 2))
        }))
        .catch(Meteor.bindEnvironment((err) => {
            OLog.error(`service.js /api/cmd error: ${err.message}`)
            res.writeHead(500, { "Content-Type": "application/json", "Connection": "close" })
            res.end(JSON.stringify({ success: false, message: err.message }))
        }))
}))

/*
 * ------------------------------------------------------------
 *  /api/test — GET definitive health probe
 * ------------------------------------------------------------
 */
WebApp.connectHandlers.use("/api/test", (req, res) => {
    VXApp.handleRESTAPITest(req, res)
})

/*
 * ------------------------------------------------------------
 *  /api/upload_test — POST network throughput (upload)
 * ------------------------------------------------------------
 */
WebApp.connectHandlers.use("/api/upload_test", (req, res) => {
    VXApp.handleRESTAPIUploadTest(req, res)
})

/*
 * ------------------------------------------------------------
 *  /api/download_test — GET network throughput (download)
 * ------------------------------------------------------------
 */
WebApp.connectHandlers.use("/api/download_test", (req, res) => {
    VXApp.handleRESTAPIDownloadTest(req, res)
})