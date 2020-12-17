const express= require('express');
const app = express();
const port=5000;
const admin = require("firebase-admin");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const serviceAccount = require("./serviceAccountKey.json");
let recipeId=56;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
const db=admin.firestore();
app.use(express.json());
/**
 * handling the resgistration route
 * validate wether a email is already present.
 * Stores the details if it is a new email.
 */
app.post('/register',async (request,response)=>{
    const userDetails=request.body;
    const email=userDetails.email
    userDetails.password=await bcrypt.hash(userDetails.password,saltRounds);
    console.log(userDetails.password);
    const validate= await validateEmail(email);
    if(validate)
    {
     adduser(userDetails);
     return response.status(200).send({message:"registered sucessfully"});   
    }
     
    response.status(406).send({message:"email already present"});
});
/**
 * handling the login route 
 * validate the email if it is present in the database
 * if not then return invalid user name
 * if username is valid then validate the password
 * return token if valid
 * else return invalid password
 */
app.post('/authenticate',async (request,response)=>{
    let user = request.body;
    let validatedUser= await validateUser(user);
   
    /**
     * validate the password
     * add the user recipes along with user details
     */
    
    if(validatedUser){
        
        delete validatedUser.password;
        validatedUser.myRecipes=await getMyRecipes(validatedUser.email)
        return response.status(200).send(validatedUser);
    }
    response.status(403).send({message:"invalid username/password"});
});
/**
 * This router allows user to add their own recipes in the data base
 */

app.post('/addrecipe',(request,response)=>{

    let recipe=request.body;
    addRecipe(recipe); 

    response.send({message:"Recipe added sucessfully"});
});
/**
 * Generate a random number.
 * find the recipe by the generated random number. 
 */

app.get('/random',async (request,response)=>{
   let randomId=Math.floor(Math.random() * (recipeId - 1) + 1);
   let recipe= await getRandomRecipe(randomId);
   response.send(recipe);
});
/**
 * get the value of category from the query parameter
 * If the category is present return a list.
 * else return category does not present.
 */

app.get('/categories',async(request, response)=>{
    let category=request.query.category;
    let items=await getByCategory(category);
    if(!items){
        return response.status(406).send({message:"category does not present"});
    }
    response.send(items);
});
/**
 * It find the dish based on the name given in the route
 * if the item present then return the item
 * else return item not found
 */

app.get('/:id',async(request,response)=>{
    let name=request.params.id;
    let items= await getByName(name);
    if(!items){
        return response.status(406).send({message:"item not present"});
    }
    response.send(items);

    

});
/**
 * Find the recipe by the value given in search query
 * if recipe is found return a list
 * else return item not found
 */

app.get('/search',async(request,response)=>{
    let name=request.query.search;
    let items= await getByName(name);
    if(!items){
        return response.status(406).send({message:"item not present"});
    }
    response.send(items);

    

});


/**
 * @param {*it comes from the register route} mail 
 * This function check Whether the given mail is present in database
 * if the mail is not present in database then return true
 * else return false
 */
async function validateEmail(mail){
    let snapshot=await db.collection("users").where('email','==',mail).get();
 if(snapshot.empty){
     return true;
 }

 return false;
}
/**
 * 
 * @param {*It comes from the resgister route} userDetails 
 * This function add the userDeatils in the database.
 */

 function adduser(userDetails){
    console.log(userDetails);
    db.collection("users").add(userDetails);
   
    index++;
    
}
/**
 * 
 * @param {*it comes from the authenticate route} mail 
 * It check whether the given mail is present in database
 * if present then return the password of the corresponding email
 * else return null 
 */
async function validateUser(user){
    let mail=user.email;
    let snapshot=await db.collection("users").where('email','==',mail).get();
    if(snapshot.empty){
        return null;
    }
    let userData=snapshot.docs[0].data();
    let valid= await bcrypt.compare(user.password, userData.password);

    if(valid){
        return userData;
    }
    return valid;
}
/**
 * user can add their own recipes using this function
 * @param {*from the addrecipe route} recipe 
 */

function addRecipe(recipe){
    recipe.item_id= recipeId;
    recipeId++;
    db.collection("recipes").add(recipe);
}

/**
 * Fetch the recipe from the  database using the given id.
 * @param {*} id 
 */

async function getRandomRecipe(id){
    let snapshot=await db.collection("recipes").where('item_id','==',id).get();
    let recipe=snapshot.docs[0].data();
    return recipe;
}
/**
 * This function Get all the recipes wich matches  the given category 
 * if category present retun a list og categories
 * else return null.
 * @param {*fromt the categories route} category 
 */

async function getByCategory(category){
    let snapshot= await db.collection("recipes").where('category','==',category).get();
    let items=[];
    if(snapshot.empty){
        return null;
    }
    snapshot.forEach((docs)=>{
       
        items.push(docs.data());
        
    });
    return items;
}
/**
 * The funcion get the recipes by its name
 * if no recipe name is found then it return null
 * @param {*} name 
 */
async function getByName(name){
    let snapshot= await db.collection("recipes").where('name','==',name).get();
    let items=[];
    if(snapshot.empty){
        return null;
    }
    snapshot.forEach((docs)=>{
       
        items.push(docs.data());
        
    });
    return items;
}
/**
 * this function return all the recipes added by a particular user
 * if no recipe is added then return null
 * @param {*} id 
 */
async function getMyRecipes(id){
    let snapshot= await db.collection("recipes").where('owner_id','==',id).get();
    let items=[];
    if(snapshot.empty){
        return null;
    }
    snapshot.forEach((docs)=>{
       
        items.push(docs.data());
        
    });
    return items;
}

app.listen(port,()=>{
    console.log(`server is running on the port ${port}`);
    });

     
 