import BetHandler from "./betHandler.js";
const result = {
    isWin: false,
    odds: 0,
    win_amount: 0,
};
const DummyData = {
    balance: 20,
    bet_amount: BetHandler.getBetAmount(),
    getBalance: () => {
        return DummyData.balance;
    },
    getOdds: (odds) => {
        if (typeof odds !== 'undefined') {
            return odds;
        }
        const loseOdds = [.1, .2, .3, .4, .5, .6, .7, .8, .9, 1];
        const winOdds = [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2,
            2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3,
            3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4,
            4.1, 4.2, 4.3, 4.4, 4.5];
        let isWin = Math.random() > .5;
        let result = 0;
        if (isWin) {
            result = loseOdds[Math.floor(Math.random() * loseOdds.length)];
        }
        else {
            result = winOdds[Math.floor(Math.random() * winOdds.length)];
        }
        return result;
    },
    SetResult: (odd) => {
        const _odds = DummyData.getOdds(odd);
        result.isWin = _odds > 1;
        result.odds = _odds;
        result.win_amount = _odds * BetHandler.getBetAmount();
        console.log(`%cBET AMOUNT:  ${BetHandler.getBetAmount()}`, 'color : lime');
        console.log(result);
    },
    GetResult: () => {
        return result;
    }
};
export default DummyData;
//# sourceMappingURL=dummyData.js.map