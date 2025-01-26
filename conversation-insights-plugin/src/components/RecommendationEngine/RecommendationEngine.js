import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { Stack } from '@twilio-paste/core/stack';
import { Button } from '@twilio-paste/core/button';
import { configureApis, unwrap } from '@segment/public-api-sdk-typescript'
import config from '../../config/config.local'

const {
    GET_RECOMMENDATIONS_URL,
    CREATE_AUDIENCE_URL
} = config;

const RecommendationEngine = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [error, setError] = useState(null);
    const [buttonState, setButtonState] = useState('idle'); // 'idle', 'loading', 'success', or 'error'
    
    // Grab the most common topic from the recommendations
    const mostCommonTopic = recommendations[0]?.TOPIC || '';
    const mostCommonTopicCount = recommendations[0]?.TOPIC_COUNT || 0;
    const mostCommonTopicLowercase = mostCommonTopic.toLowerCase();

    useEffect(() => {
        // Fetch data from the backend
        axios
        .get(GET_RECOMMENDATIONS_URL)
        .then((response) => {
            console.log('Data fetched:', response.data);
            setRecommendations(response.data); // Update state with data
        })
        .catch((err) => {
            console.error('Error fetching recommendations:', err);
            setError(err.message);
        });
    }, []);

    const onClickCreateAudience = async () => {
        setButtonState('loading');

        const audienceBody = {
            "name": `Topic: ${mostCommonTopic}`,
            "description": `Customers who have called in recently (30 days) to discuss ${mostCommonTopic}`,
            "enabled": true,
            "definition": {
                "query": `event('Prequal Call').where( property('primary topic') = '${mostCommonTopicLowercase}' OR property('primary topic') = '${mostCommonTopic}').within(30 days).count() >= 1`,
                "type": "USERS"
            },
            "options": {
                "includeAnonymousUsers": true,
                "includeHistoricalData": true
            }
        };

        try {
            const result = await axios.post(
                CREATE_AUDIENCE_URL,
                audienceBody
            );

            setButtonState('success');
            console.log(JSON.stringify(result))
        } catch (e) {
        setButtonState('error');
        console.log('ERROR:', e)
        }
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!recommendations.length) {
        return <div>Loading recommendations...</div>;
    }

    return (
        <div>
            <div
                style={{
                backgroundColor: '#f9f9f9',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                marginBottom: '2rem'
                }}
            >
                The trending topic identified from your customer data is <span style={{fontWeight: 'bold'}}>{mostCommonTopic}</span>. It was discussed <span style={{fontWeight: 'bold'}}>{mostCommonTopicCount}</span> times in the last 30 days. We recommend creating an outreach campaign targeted at all customers who are likely to be concerned with <span style={{fontWeight: 'bold'}}>{mostCommonTopic}</span>.
                <br></br><br></br>This campaign should address customers' concerns and highlight how your services can help address their needs.
                <br></br><br></br>To maximize engagement, we recommend conducting the outreach over each customer's preferred communication channel. Create an audience of all customers interested in <span style={{fontWeight: 'bold'}}>{mostCommonTopic}</span>.
            </div>
            <Stack orientation="horizontal" spacing="space30" style={{ marginTop: '16px' }}>
                <Button
                    variant="primary"
                    onClick={onClickCreateAudience}
                    disabled={buttonState === 'loading'}
                >
                    {buttonState === 'loading' ? 'Creating...' : 'Create Audience'}
                </Button>
                {buttonState === 'success' && <p style={{ color: 'green' }}>Audience created successfully!</p>}
                {buttonState === 'error' && <p style={{ color: 'red' }}>Failed to create audience. Try again.</p>}
            </Stack>
        </div>
    );
};

export default RecommendationEngine;
