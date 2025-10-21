import ReadoutContainer from "/imports/readout/client/ReadoutContainer"
import DashboardViewContainer from "/imports/dashboard/client/DashboardContainer"
import ZPNetEventsContainer from "/imports/zpnetevents/client/ZPNetEventsContainer"

Routes = _.extend(Routes || {}, {
    getAppRoutes() {
        return [
            { path: "/readout", layoutName: "LayoutDiagContainer", component: ReadoutContainer },
            { path: "/dashboard", layoutName: "LayoutStandardContainer", component: DashboardViewContainer },
            { path: "/zpnetevents", layoutName: "LayoutDiagContainer", component: ZPNetEventsContainer },
        ]
    },

    doAppRouteAfter() {
        OLog.debug(`routes.jsx doAppRouteAfter [${Util.routePath()}] *fire*`)
    }
})

