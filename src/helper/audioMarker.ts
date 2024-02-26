const audioMarkers = [
    {name : 'click-sfx', start: 0, duration: .2, config:{ volume: .5 } },

    {name : 'select-sfx', start: 1, duration: .4, config:{ volume: .3 } },
    {name : 'deselect-sfx', start: 2, duration: .4, config:{ volume: .3 } },
    {name : 'tallyloop-sfx', start: 3, duration: .48, config:{ volume: .3, loop : true } },
    {name : 'envelope-sfx', start: 4, duration: .2, config:{ volume: .3 } },
    {name : 'dice-sfx', start: 5, duration: .3, config:{volume : .5, loop : true , rate : .6 } },

    {name : 'win-sfx', start: 6, duration: 1.5, config:{ volume: .5 } },
    {name : 'coin-cling-sfx', start: 8, duration: .2, config:{ volume: .2 } },
]
export default audioMarkers