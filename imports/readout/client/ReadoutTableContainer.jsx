import React, {Component} from "react"
import ReadoutTable from "./ReadoutTable"

export default class ReadoutTableContainer extends Component {

    constructor(props) {
        super(props)
        this.state = {
            aggregates: {}
        }
    }

    componentDidMount() {
        this.ws = new WebSocket("ws://localhost:8765")
        this.ws.onmessage = (evt) => {
            const payload = JSON.parse(evt.data)
            this.setState({
                aggregates: {
                    payload
                }
            })
        }
    }

    componentWillUnmount() {
        if (this.ws) {
            this.ws.close()
        }
    }

    render() {
        return (
            <ReadoutTable
                aggregates={this.state.aggregates}
            />
        )
    }
}

