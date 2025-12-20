import {Component} from "react"
import ReadoutTableContainer from "./ReadoutTableContainer"

export default class Readout extends Component {
    render() {
        return (
            <div className="flex-grow">
                <ReadoutTableContainer />
            </div>
        )
    }
}
