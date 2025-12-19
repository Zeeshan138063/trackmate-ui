const https = require('https');

const SUPABASE_URL = "https://jdplobgtxzncwxhordah.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcGxvYmd0eHpuY3d4aG9yZGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzcwMzksImV4cCI6MjA3MTIxMzAzOX0.ior862XnLyAtFwo-h2Umhj8tADMlv1dZOUwLCZWOV-c";

const options = {
    hostname: 'jdplobgtxzncwxhordah.supabase.co',
    // path: '/rest/v1/dream_companies?limit=1&select=name,industry,company_size,location,website_url,linkedin_company_url,notes,status,priority',
    path: '/rest/v1/dream_companies?limit=1&select=name,dream_company_reminders(id)',
    method: 'GET',
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                if (json.length > 0) {
                    console.log('Columns:', Object.keys(json[0]));
                } else {
                    console.log('Table exists but is empty. Cannot infer columns from data.');
                }
            } catch (e) {
                console.log('Error parsing JSON:', e);
            }
        } else {
            console.log('Error response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
