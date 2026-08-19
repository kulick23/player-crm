sap.ui.define([], function () {
    "use strict";

    return {
        toCampaigns: function () {
            window.location.hash = "#/MarketingCampaigns";
        },

        toPlayers: function () {
            window.location.hash = "#/";
        }
    };
});
