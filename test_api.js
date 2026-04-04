const axios = require('axios');

async function testApi() {
    console.log('--- Seeding Database with Activities ---');
    
    const activities = [
        { user_id: 'user_123', type: 'login', description: 'User Logged In' },
        { user_id: 'user_123', type: 'action', description: 'User Clicked Home Page' },
        { user_id: 'user_456', type: 'login', description: 'User Logged In' },
        { user_id: 'user_123', type: 'logout', description: 'User Logged Out' }
    ];

    try {
        for (const activity of activities) {
            const resp = await axios.post('http://localhost:3000/api/activities', activity);
            console.log('Logged:', activity.user_id, activity.type, '(ID: ' + resp.data.id + ')');
        }

        console.log('\n--- Fetching All Activities ---');
        const allResp = await axios.get('http://localhost:3000/api/activities');
        console.log('Count:', allResp.data.count);
        allResp.data.activities.forEach(a => {
            console.log(`[${a.timestamp}] ${a.user_id}: ${a.type} - ${a.description}`);
        });

        console.log('\n--- Fetching Activities for user_123 ---');
        const userResp = await axios.get('http://localhost:3000/api/activities?user_id=user_123');
        console.log('Found:', userResp.data.count);

        console.log('\n--- Filtering by Activity Type (login) ---');
        const typeResp = await axios.get('http://localhost:3000/api/activities?type=login');
        console.log('Found:', typeResp.data.count);

    } catch (err) {
        console.error('Error during testing:', err.message);
        if (err.response) {
            console.log('Response Error:', err.response.data);
        }
    }
}

// Check if server is running before testing
setTimeout(testApi, 2000);
