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

    OLog.warn(
        `service.js HTTP monitor ${ip} ${req.method} ${req.url} ${OLog.warnString(req.headers)}`
    )
    next()
})

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
