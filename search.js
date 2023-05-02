const fs = require('fs')
const express = require('express');
const helmet = require('helmet');
const cors = require("cors");
//const {addNewMarket, createDB, searchTerms} = require("./lyra")
//   const regex = require("regex")      // tool for validating input into the api 
const { persistToFile, restoreFromFile } = require('@lyrasearch/plugin-data-persistence')

const {insert, search, create} = require("@lyrasearch/lyra");

const logger = require("./logger")
  


app = express()
app.use(helmet())
app.use(cors()); 
app.use(express.json())
port = process.env.PORT || 4000;


let filePath = __dirname;



const mysqlDb = require("./conectDB");
const { Timestamp } = require('mongodb');
const { timeStamp } = require('console');


createSearchTable = "CREATE TABLE searchTable ( id int, shopName varchar(255), tags varchar(255) )";

mysqlDb.query(createSearchTable,(err,result)=>{
    console.log("creating table in search Db");
})

createSearchTermsTable = "CREATE TABLE searchterms (id int NOT NULL AUTO_INCREMENT,timestamp , terms )";
mysqlDb.query(createSearchTermsTable,(err,result)=>{});







//creating database
let marketDb=create({
    schema:{
        shop:'string',
        shopName:'string', 
        tags:'string'
},
    defaultLanguage:'english'
});

//after creating a local db populate it with data from the database 

getData = "select * from searchtable";
mysqlDb.query(getData,(err, result)=>{
    result.forEach((row)=>{
        res = insert(marketDb,{
                shop: row.id.toString(),
                shopName:row.shopName,
                tags:row.tags
})
    })
   
})



fs.readdir(filePath, (error, files) => {

    try{
        // if (error){
        //     throw new Error("Error occured while saving file");
        // }

        files.forEach(file =>{
             
            if(file === "MarketSearchDB.msp"){ 
                fs.readFile(file, (err, data)=>{
                    if(data.length !== 0){
                        marketDb  =  restoreFromFile('json','./MarketSearchDB.msp')
                    }else {
                        console.log("unlinking file")
                        fs.unlink(file, (err)=>{
                            if(err)// next(err)
                            {
                                console.log(err.stack)
                            }
                        })
                        
                    }
                })
                
                // console.log("line 45 restore from file", marketDb)
                }
        }
        )
    }catch(err){
        console.log("Saving to the filesystem",err.name , err.message, err.stack)
    }
})



app.use(logger)


//endpoint to add a new market 
app.post('/addNew',(req,res)=>{
        if(!marketDb){
            throw new Error("No DB avilable")
        }
       //validate data into the api using regex 
       let id = req.body.id;
       let shopName = req.body.shopName;
       let keyWords = req.body.keyWords;
       let result;
       //call db to add the new items 
       try{
           // result = addNewMarket(marketDB,id, shopName, keyWords);
           result = insert(marketDb,{
                shop: id,
                shopName:shopName,
                tags:keyWords
           })


        
        
           insertData = `INSERT INTO searchTable (id, shopName,tags) VALUES ('${id}', '${shopName}', '${keyWords}');`


            mysqlDb.query(insertData, (err, result)=>{
               
               if(err) throw new Error("Could not insert data to the database");
            });

          
            
            if(result){
                res.statusMessage = "New shop has been added"
                res.status(200).end()
               // console.log("inside insert line 50 ",result, marketDB)
            }else{
                let errorMessage = "could not add the new shop"
                res.statusMessage = errorMessage
                res.status(500).end()
                throw new Error(errorMessage)
                
            }
           
        } catch(err){
            //throw error incase params required are not
           // res.status(500).json({"error":"could not add a new shop"})
           next(err)
        }
        
})


//endpoint to search a new market
app.get('/search/:terms',(req,res)=>{
    let searchTerm = req.params.terms;
    let result;
    let date = new Date().toJSON();
    try{

        addSearchedTerm = `INSERT INTO searchterms ( timestamp, terms) VALUES ( '${date}', '${searchTerm}');`
        mysqlDb.query(addSearchedTerm,(err, result)=>{
            if (err) throw new Error("Failed to add a new searhed term");
        })
        //searchTerms(marketDB,search)
        result = search(marketDb,{
            term:searchTerm,
            properties:'*'
        })
        //console.log("line 57 ", result)
        //console.log("line 23 second function",marketDB,search, typeof search)
            
        if(!result){
            res.statusMessage = "Could not match to any shops"
            res.status(400).end()
            throw new Error(res.statusMessage)
        }else{
           res.status(200).json(
            {
                "result":result.hits,
                "noOfHits":result.count
            }) 
        }
      
    }catch(err){
        console.log("Error when searching for terms", err) //later substitute for data logger
    }
    
})



app.listen(port,()=>{
    console.log(`search engine server running on port ${port}`);
    //Emitting the event 
   
    
});
// app.on('close',()=>{
//     console.log("closing the application")
// })




