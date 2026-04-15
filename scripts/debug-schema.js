const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
// ... (env loading logic same as before)
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        if (key && value) {
            envVars[key] = value;
        }
    }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Environment Variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const outputFile = path.resolve(__dirname, 'debug_output.txt');
const logStream = fs.createWriteStream(outputFile, { flags: 'w' });

function log(message) {
    console.log(message);
    logStream.write(message + '\n');
}

async function inspectTable(tableName) {
    log(`\n--- Inspecting ${tableName} ---`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        log(`Error fetching ${tableName}: ${error.message}`);
    } else if (data && data.length > 0) {
        log(`Columns: ${JSON.stringify(Object.keys(data[0]))}`);
        log(`Sample Data: ${JSON.stringify(data[0], null, 2)}`);
    } else {
        log(`Table ${tableName} is empty or not accessible.`);
    }
}

async function main() {
    await inspectTable('city_analytic');
    await inspectTable('transactions');
    await inspectTable('profiles');
    await inspectTable('community_prices');
    logStream.end();
}

main();
