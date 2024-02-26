class BetHandler{
    static bet_amount = 0;
    static bet_index = 0;
    static bet_denomination = [1,2,5,10,25,50,100,250,500,1000,5000,10000];
    
    static addBet = () :number => {
        this.bet_index++;
        if(this.bet_index > this.bet_denomination.length-1){
            this.bet_index = 0
        }
        this.bet_amount = this.bet_denomination[ this.bet_index ]
        return this.bet_amount
    }

    static minusBet = () :number => {
        this.bet_index--;
        if(this.bet_index < 0){
            this.bet_index = this.bet_denomination.length-1
        }
        this.bet_amount = this.bet_denomination[ this.bet_index ]
        return this.bet_amount
    }

    static getBetAmount = () : number=>{
        return this.bet_amount
    }

    static hasBalance = (bet:number,balance : number) : boolean=> {
        //const bet = this.getBetAmount()
        return (bet <= balance)
    }
}

export default BetHandler;