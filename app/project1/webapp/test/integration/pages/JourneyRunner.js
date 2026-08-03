sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"project1/test/integration/pages/PlayersList.gen",
	"project1/test/integration/pages/PlayersObjectPage.gen"
], function (JourneyRunner, PlayersListGenerated, PlayersObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('project1') + '/test/flp.html#app-preview',
        pages: {
			onThePlayersListGenerated: PlayersListGenerated,
			onThePlayersObjectPageGenerated: PlayersObjectPageGenerated
        },
        async: true
    });

    return runner;
});

