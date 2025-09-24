import {Component} from "react"
import PropTypes from "prop-types"

export default class DashboardChartHeader extends Component {

    static propTypes = {
        iconUrl: PropTypes.string.isRequired,
        name: PropTypes.string,
        description: PropTypes.string,
        message: PropTypes.string,
        headerComponent: PropTypes.element
    }

    render() {
        return (
            <div className={`top-header flexi-fixed ${this.props.className || ""}`}>
                <div className="row">
                    <div className="col-sm-2">
                        <table className="top-table">
                            <tbody>
                                <tr>
                                    <td className="chart-left">
                                        <img className={"top-image"}
                                            src={this.props.iconUrl}/>
                                    </td>
                                    <td className="chart-center">
                                        <div className="top-text">
                                            {this.props.name &&
                                                <div className="top-name">
                                                    {this.props.name}
                                                </div>
                                            }
                                            {this.props.description &&
                                                <div className="top-description">
                                                    {this.props.description}
                                                </div>
                                            }
                                            {this.props.message &&
                                                <div className="top-message">
                                                    {this.props.message}
                                                </div>
                                            }
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="col-sm-10">
                        {this.props.headerComponent}
                    </div>
                </div>
            </div>
        )
    }
}
