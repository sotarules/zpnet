Meteor.i18nMessages.codes = _.extend(Meteor.i18nMessages.codes, {

    eventType : { ...{
        POWER_STATUS : {
            en : "When power status message is received",
            rx : "$When power status message is received$",
            notification : {
                type : "INFO",
                icon : "CHECK",
                key : "common.alert_power_status"
            },
            notificationDefaults : [ "PNOTIFY" ]
        },
        ...Meteor.i18nMessages.codes.eventType }
    },
    powerStatusMode : {
        VOLTAGE : {
            en : "Voltage",
            rx : "$Voltage$"
        },
        CURRENT : {
            en : "Current",
            rx : "$Current$"
        },
        POWER : {
            en : "Power",
            rx : "$Power$"
        }
    }
})