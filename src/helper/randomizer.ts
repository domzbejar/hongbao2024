const Randomizer = {
    username : (): string =>{
        const alphabet = "abcdefghijklmnopqrstuvwxyz"
        let name : string = "****";
        for(let i = 0; i < 3; i++){
            const ranChar = alphabet[Math.floor( Math.random() * alphabet.length )]
            name = `${name}${ranChar}`
        }
        return name;
    },
    spitNumber : (sum : number, splitCount : number = 5 ) : string[] =>{
        let result :string[] = [];
        let _temp_sum = sum;

        while( result.length < 5 ){
            const ran = Math.random() * (_temp_sum/2);
            if(result.length === 4 && _temp_sum !== 0){
                result.push(_temp_sum.toFixed(2))
            }else{
                if(_temp_sum >= ran ){
                    result.push(ran.toFixed(2))
                    _temp_sum-=ran
                }else if(ran >= _temp_sum && _temp_sum !== 0){
                    result.push(_temp_sum.toFixed(2))
                    _temp_sum = 0
                }else{
                    result.push(_temp_sum.toFixed(2))
                }
            }
        }
        return result
    }
}
export default Randomizer