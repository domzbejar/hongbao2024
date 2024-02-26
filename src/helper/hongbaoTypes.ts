export interface GameState{
    [name : string] : number
}
export default class HongbaoType{
    static GAME_STATES : GameState= {
        INTRO_STATE : 0,
        START_BET : 1,
        END_BET : 2,
        START_GAME : 3,
        END_GAME : 4,
        NEW_GAME : 5,
        SKIP_ANIMATION:6,
        STAND_BY : 7,
        AUTO_MODE : 8
    }
}