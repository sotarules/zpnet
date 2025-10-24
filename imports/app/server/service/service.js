import {WebApp} from "meteor/webapp"
import bodyParser from "body-parser"

WebApp.connectHandlers.use(bodyParser.json({limit: "50mb"}))
WebApp.connectHandlers.use(bodyParser.urlencoded({extended: true, limit: "50mb"}))

const IP_WHITELIST = ["198.54.129.52", "127.0.0.1"]

function getClientIp(req) {
    const xfwd = req.headers["x-forwarded-for"]
    if (xfwd) {
        // may contain multiple IPs: "client, proxy1, proxy2"
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
    OLog.warn(`service.js HTTP monitor ${ip} ${req.method} ${req.url} ${OLog.warnString(req.headers)}`)
    next()
})

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
