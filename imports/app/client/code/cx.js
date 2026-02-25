CX.LOGO_PATH = CX.CLOUDFILES_IMAGE + "/" + "zpnet400x400.png"
CX.TOP_BAR_LOGO_PATH = CX.CLOUDFILES_IMAGE + "/" + "zpneticon.png"

CX.DASHBOARD_VIEWS = {
    "power_status": {
        name: "common.header_power_status_name",
        description: "common.header_power_status_description",
        iconUrl: `${CX.CLOUDFILES_PREFIX}/img/system/battery.png`,
        headerComponent: "DashboardChartPowerStatusHeader",
        chartComponent: "DashboardChartPowerStatus"
    }
}

CX.DASHBOARD_DELEGATES = {
    "ios-button-view-year": {
        iconClass: "fa-th",
        iconStyle: {fontSize: "18px", lineHeight: "20px", paddingTop: "1px"},
        title: "common.tooltip_dashboard_view_year",
        position: "left"
    },
    "ios-button-view-month": {
        iconClass: "fa-calendar",
        iconStyle: {fontSize: "18px", lineHeight: "20px"},
        title: "common.tooltip_dashboard_view_month",
        position: "left"
    },
    "ios-button-view-week": {
        iconClass: "fa-calendar-minus-o",
        iconStyle: {fontSize: "18px", lineHeight: "20px"},
        title: "common.tooltip_dashboard_view_week",
        position: "left"
    },
    "ios-button-view-day": {
        iconClass: "fa-calendar-o",
        iconStyle: {fontSize: "18px", lineHeight: "20px"},
        title: "common.tooltip_dashboard_view_day",
        position: "left"
    },
    "ios-button-view-list": {
        iconClass: "fa-list-ul",
        iconStyle: {fontSize: "18px", lineHeight: "20px", paddingTop: "1px"},
        title: "common.tooltip_dashboard_view_list",
        position: "left"
    },
    "ios-button-show-filters": {
        iconClass: "fa-filter",
        iconStyle: {fontSize: "19px", lineHeight: "20px", paddingTop: "1px"},
        title: "common.tooltip_dashboard_show_filters",
        position: "left"
    },
    "ios-button-show-preview": {
        iconClass: "fa-columns",
        iconStyle: {fontSize: "19px", lineHeight: "20px", paddingTop: "1px"},
        title: "common.tooltip_dashboard_show_preview",
        position: "left"
    }
}

