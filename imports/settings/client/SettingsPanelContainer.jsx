import { connect } from "react-redux"

import SettingsPanel from "/imports/settings/client/SettingsPanel"

const mapStateToProps = state => {
    return {
        tabName : state.settingsTab
    }
}

export default connect(
    mapStateToProps
)(SettingsPanel)
