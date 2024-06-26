const { Client } = require('pg');



db.on('connect', async () => {
    try {
        //  function to fetch the database name for the client
        const clientDatabaseName = await fetchClientDatabaseName();
        
        // Set the database name obtained from your own database
        client.options.database = clientDatabaseName;

        console.log(`Successfully connected to database "${clientDatabaseName}"`);
    } catch (error) {
        console.error("Error setting database name:", error);
    }
});

client.connect();

async function fetchClientDatabaseName() {
    // Your logic to fetch the database name for the client from your own database
    // This could involve querying a table or performing some other operation
    // For this example, let's return a hardcoded value
    return "client_database_name";
}

module.exports = client;
