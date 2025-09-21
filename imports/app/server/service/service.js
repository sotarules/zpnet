import {WebApp} from "meteor/webapp"
import bodyParser from "body-parser"

WebApp.connectHandlers.use(bodyParser.json())

WebApp.connectHandlers.use("/api", (req, res) => {
    res.writeHead(200)
    res.end(`Hello world from: ${Meteor.release}`)
    VXApp.handleRESTAPIRequest(req)
})
