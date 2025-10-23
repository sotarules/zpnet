import React, { Component } from "react"
import PropTypes from "prop-types"

export default class ReadoutTable extends Component {

    static propTypes = {
        id: PropTypes.string.isRequired,
        aggregates: PropTypes.object.isRequired
    }

    static defaultProps = {
        id: "readout-table"
    }

    constructor(props) {
        super(props)
        this.typingTimer = null
        this.state = {
            headerText: "",
            renderedText: ""
        }
    }

    componentDidMount() {
        this.renderReadout()
    }

    componentDidUpdate(prevProps) {
        const prevTimestamp = prevProps.aggregates?.timestamp
        const nextTimestamp = this.props.aggregates?.timestamp
        if (prevTimestamp !== nextTimestamp) {
            this.clearTypingTimer()
            this.renderReadout()
        }
    }

    componentWillUnmount() {
        this.clearTypingTimer()
    }

    clearTypingTimer() {
        if (this.typingTimer) {
            clearInterval(this.typingTimer)
            this.typingTimer = null
        }
    }

    renderReadout() {
        const { aggregates } = this.props
        if (!aggregates || !aggregates.payload) {
            this.setState({ headerText: "", renderedText: "" })
            return
        }

        const payload = aggregates.payload
        const headerText = payload.header || ""
        const bodyLines = payload.body || []
        const fullText = bodyLines.join("\n")

        this.setState({ headerText, renderedText: "" }, () => {
            let i = 0
            this.typingTimer = setInterval(() => {
                if (i < fullText.length) {
                    this.setState(prev => ({
                        renderedText: prev.renderedText + fullText[i++]
                    }))
                } else {
                    clearInterval(this.typingTimer)
                    this.typingTimer = null
                }
            }, 10)
        })
    }

    render() {
        const { headerText, renderedText } = this.state
        return (
            <div className="dashboard-readout-container">
                <div className="dashboard-readout-screen">
                    <div className="dashboard-readout-header">{headerText}</div>
                    <div className="dashboard-readout-body">{renderedText}</div>
                </div>
            </div>
        )
    }
}
