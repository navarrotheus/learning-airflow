const { MongoClient } = require('mongodb');
const axios = require('axios');
require('dotenv').config();
const url = require('url');

// Conexao com o banco
async function dbConnection(uri) {
  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const dbName = url.parse(uri).pathname.substr(1);

  const db = client.db(dbName);

  return { db, client };
}

// Pega os pokemons da api e monta da forma que queremos
async function getPokemons() {
  let { data } = await axios.get('https://pokeapi.co/api/v2/pokemon');

  const pokemons = [];

  let count = 0;
  
  while (!!data.next && count !== 10) {
    data.results.forEach(async pokemon => {
      const { data: pokemonData } = await axios.get(pokemon.url);
      const { id, name, height, weight, abilities, types } = pokemonData;

      const mappedAbilities = abilities.map(item => item.ability.name);
      const mappedTypes = types.map(item => item.type.name);

      const newPokemon = {
        _id: id,
        name,
        height,
        weight,
        abilities: mappedAbilities,
        types: mappedTypes
      };
      
      pokemons.push(newPokemon);
    });

    const response = await axios.get(data.next);
    data = response.data;
    console.log(count++);
  }

  return pokemons;
}

// Utiliza as funcoes anteriores para alimentar o banco
async function script()  {
  const { db, client } = await dbConnection(process.env.MONGO_URI);

  const collection = db.collection('pokemons');

  const pokemons = await getPokemons();

  collection.insertMany(pokemons, () => client.close());
}

script();
