import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;


const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});



db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisited(){
   const result=await db.query("SELECT * FROM visited_countries");
   let countries=[];
   result.rows.forEach((country) => {
      countries.push(country.country_code);
   });
   return countries;
}

app.get("/", async (req, res) => {

   const countries=await checkVisited();
   res.render("index.ejs",{
       countries:countries,
       total:countries.length

   });
   console.log(countries);

});

app.post("/add",async(req,res)=>{
   try{
    let new_country=req.body['country'];
    let result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",[new_country.toLowerCase()]);
    const data = result.rows[0];
    const countryCode = data.country_code;
    try{
    await db.query(`INSERT INTO visited_countries(country_code)VALUES('${countryCode}') `);
    return res.redirect("/");
    }catch(err){
      console.log(err);
      const countries = await checkVisited();
       return res.render("index.ejs",{
            
       countries:countries,
       total:countries.length,
       error:"Country Aldready added"
   });
    }
    res.redirect("/");
   }catch(err){
      console.log(err);
      const countries = await checkVisited();
      return res.render("index.ejs",{
       countries:countries,
       total:countries.length,
       error:"Invalid country,try again!"
   });
   }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
