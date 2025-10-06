import {WebApp} from "meteor/webapp"
import bodyParser from "body-parser"

WebApp.connectHandlers.use(bodyParser.json())

WebApp.connectHandlers.use("/api", (req, res) => {
    VXApp.handleRESTAPIRequest(req, res)
})
