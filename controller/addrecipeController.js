const addRecipe=require('../service/addRecipe');
let recipeId=57;
let addrecipeRoute=(request,response)=>{

    let recipe=request.body;
    addRecipe(recipe); 
    response.send({message:"Recipe added sucessfully"});
}
module.exports=addrecipeRoute;