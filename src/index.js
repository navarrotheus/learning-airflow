const { MongoClient } = require('mongodb');
const axios = require('axios');
require('dotenv').config();

async function dbConnection(uri, dbName) {
  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const db = client.db(dbName);

  return db;
}

async function script()  {
  let { data } = await axios.get('https://pokeapi.co/api/v2/pokemon');
  
  const db = await dbConnection(process.env.MONGO_URI, process.env.MONGO_DB);

  const collection = db.collection('pokemons');

  let count = 0;

  while (!!data.next && count !== 10) {
    data.results.forEach(async pokemon => {
      const { data: pokemonData } = await axios.get(pokemon.url);
      const { id, name, height, weight, abilities, types } = pokemonData;

      const mappedAbilities = abilities.map(item => item.ability.name);
      const mappedTypes = types.map(item => item.type.name);

      const newPokemon = {
        id,
        name,
        height,
        weight,
        abilities: mappedAbilities,
        types: mappedTypes
      };
      
      await collection.insertOne(newPokemon);
    });

    const response = await axios.get(data.next);
    data = response.data;

    console.log(count++);
  }
}

script();
