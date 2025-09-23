import DashboardViewContainer from "/imports/dashboard/client/DashboardContainer"

Routes = _.extend(Routes || {}, {
    getAppRoutes() {
        return [
            { path: "/dashboard", layoutName: "LayoutStandardContainer", component: DashboardViewContainer },
        ]
    },

    doAppRouteAfter() {
        OLog.debug(`routes.jsx doAppRouteAfter [${Util.routePath()}] *fire*`)
    }
})

