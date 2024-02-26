var _a;
class BetHandler {
}
_a = BetHandler;
BetHandler.bet_amount = 0;
BetHandler.bet_index = 0;
BetHandler.bet_denomination = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 5000, 10000];
BetHandler.addBet = () => {
    _a.bet_index++;
    if (_a.bet_index > _a.bet_denomination.length - 1) {
        _a.bet_index = 0;
    }
    _a.bet_amount = _a.bet_denomination[_a.bet_index];
    return _a.bet_amount;
};
BetHandler.minusBet = () => {
    _a.bet_index--;
    if (_a.bet_index < 0) {
        _a.bet_index = _a.bet_denomination.length - 1;
    }
    _a.bet_amount = _a.bet_denomination[_a.bet_index];
    return _a.bet_amount;
};
BetHandler.getBetAmount = () => {
    return _a.bet_amount;
};
BetHandler.hasBalance = (bet, balance) => {
    return (bet <= balance);
};
export default BetHandler;
//# sourceMappingURL=betHandler.js.map