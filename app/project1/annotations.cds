using PlayerCRMService as service from '../../srv/player-crm-service';
annotate service.Players with {
    preference @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'Preferences',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : preference_ID,
                ValueListProperty : 'ID',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'favoriteMode',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'preferredRarity',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'notes',
            },
        ],
    }
};

