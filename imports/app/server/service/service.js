import {WebApp} from "meteor/webapp"
import bodyParser from "body-parser"

WebApp.connectHandlers.use(bodyParser.json({ limit: "50mb"}))
WebApp.connectHandlers.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }))

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
