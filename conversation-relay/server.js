require('dotenv').config();
const express = require('express');
const ExpressWs = require('express-ws');
const fs = require('fs');
const snowflake = require('snowflake-sdk');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser')

const app = express();
const PORT = process.env.PORT || 3001;
const SNOWFLAKE_ACCOUNT_ID = process.env.SNOWFLAKE_ACCOUNT_ID
const SEGMENT_SPACE = process.env.SEGMENT_SPACE
const SEGMENT_BEARER_TOKEN = process.env.SEGMENT_BEARER_TOKEN


// Initialize express-ws
ExpressWs(app);
// Enable CORS
app.use(cors());

// Enable json parsing of request bodies
const jsonParser = bodyParser.json()

// Snowflake connection configuration and recommendation endpoint setup
if (SNOWFLAKE_ACCOUNT_ID) {
    connection = snowflake.createConnection({
        account: SNOWFLAKE_ACCOUNT_ID,
        username: process.env.SNOWFLAKE_USERNAME,
        password: process.env.SNOWFLAKE_PASSWORD,
        warehouse: process.env.SNOWFLAKE_WAREHOUSE,
        database: process.env.SNOWFLAKE_DATABASE,
        schema: process.env.SNOWFLAKE_SCHEMA,
    });

    // Initialize Snowflake
    connection.connect((err, conn) => {
        if (err) {
          console.error('Unable to connect to Snowflake: ' + err.message);
          process.exit(1); // Exit if connection fails
        } else {
          console.log(`Successfully connected to Snowflake. 'Get Recommendations' endpoint is available by performing a GET request to http://localhost:${PORT}/get-recommendations`);
        }
    });

    // Setup Recommendation Endpoint to allow getting trending topic per state
    app.get('/get-recommendations', (req, res) => {
    const query = `
      SELECT
        initcap(pc.PRIMARY_TOPIC) as topic,
        COUNT(*) AS topic_count
      FROM
          SEGMENT_EVENTS.TWILIO_UNIFIED_PROFILES.USERS as u
      JOIN
          SEGMENT_EVENTS.TWILIO_UNIFIED_PROFILES.PREQUAL_CALL pc ON u.id = pc.user_id
      WHERE
          date_trunc('month', pc.TIMESTAMP) >= date_trunc('month', CURRENT_DATE)
      GROUP BY 1
      ORDER BY 2 desc`;
  
    connection.execute({
      sqlText: query,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Query execution failed:', err.message);
          res.status(500).json({ error: 'Query execution failed', details: err.message });
        } else {
          console.log('Query executed successfully:', rows);
          res.json(rows);
        }
      },
    });
  });
}

// Setup the create-audience endpoint
app.post('/create-audience', jsonParser, async (req, res) => {
  console.log('creating-audience...', JSON.stringify(req.body));

  try {
    const response = await axios.post(
      `https://api.segmentapis.com/spaces/${SEGMENT_SPACE}/audiences`,
      JSON.stringify(req.body),
      {
        headers: {
          Authorization: `Bearer ${SEGMENT_BEARER_TOKEN}`,
          'Content-Type': 'application/vnd.segment.v1alpha+json'
        }
      }
    );

    console.log('Audience created:', response.data);
    res.status(201).json({audience: response.data})
  } catch (error) {
    console.log(error);
    res.status(500).json({error: error})
  }
})

// Import the GptService class
const { GptService } = require('./services/GptService');
const { getCustomer } = require('./functions/tools/get-customer');

// Import static context prompt and tools
const promptContext = fs.readFileSync('./assets/context.md', 'utf-8');
const toolManifest = require('./assets/toolManifest');

// Setup WebSocket connection endpoint
app.ws('/conversation-relay', (ws) => {
    console.log('New Conversation Relay websocket established');
    let gptService = null;

    // Handle incoming messages
    ws.on('message', async (data) => {
        let gptResponse = "";
        try {
            const message = JSON.parse(data);
            console.log(`[Conversation Relay] Message received: ${JSON.stringify(message, null, 4)}`);
            switch (message.type) {
                case 'info':
                   console.debug(`[Conversation Relay] info: ${JSON.stringify(message, null, 4)}`)
                    break;
                case 'prompt':
                    // OpenAI Model
                    console.info(`[Conversation Relay] Caller Message: ${message.voicePrompt}`);

                    gptResponse = await gptService.generateResponse('user', message.voicePrompt);

                    console.info(`[Conversation Relay] Bot Response: ${JSON.stringify(gptResponse, null, 4)}`);
                    // Send the response back to the WebSocket client
                    ws.send(JSON.stringify(gptResponse));
                    break;
                case 'interrupt':
                    // Handle interrupt message
                    console.info(`[Conversation Relay] Interrupt ...... : ${JSON.stringify(message, null, 4)}`);
                    break;
                case 'dtmf':
                    // Handle DTMF digits. We are just logging them out for now.
                    console.debug(`[Conversation Relay] DTMF: ${message.digits.digit}`);
                    break;
                case 'setup':
                    /**
                     * Handle setup message. Just logging sessionId out for now.
                     * This is the object received from Twilio:
                     * {
                            "type": "setup",
                            "sessionId": "VXxxxx",
                            "callSid": "CAxxxx",
                            "parentCallSid": "",
                            "from": "+614nnnn",
                            "to": "+612nnnn",
                            "forwardedFrom": "+612nnnnn",
                            "callerName": "",
                            "direction": "inbound",
                            "callType": "PSTN",
                            "callStatus": "RINGING",
                            "accountSid": "ACxxxxxx",
                            "applicationSid": null
                        }
                     */
                    // console.debug(`[Conversation Relay] Setup message received: ${JSON.stringify(message, null, 4)}`);
                    // Log out the to and from phone numbers
                    //LOG console.log(`4) [Conversation Relay] Setup message. Call from: ${message.from} to: ${message.to} with call SID: ${message.callSid}`);
                    
                    // Initialize GptService with context and manifest
                    // const { promptContext, toolManifest } = await fetchContextAndManifest();
                    console.log('calling', JSON.stringify(toolManifest));
                    gptService = new GptService(promptContext, toolManifest);
                    console.log('GptService initialized with Context and Manifest');
                    
                    // extract the "from" value and pass it to gptService
                    gptService.setCallParameters(message.to, message.from, message.callSid);

                    // Create a greeting message using the person's name
                    console.log('get customer data in setup', message.from);
                    const customerData = await getCustomer(message.from);
                    const customerName = customerData?.firstName;
                    let greetingText = '';
                    if (customerData) {
                      greetingText = `Greet the customer with name ${customerName} in a friendly manner. Do not constantly use their name, but drop it in occasionally. Tell them that you have to first verify their details before you can proceed to ensure confidentiality of the conversation.`;
                    } else {
                      greetingText = `Greet the customer in a friendly manner. Tell them that you have to first verify their details before you can proceed to ensure confidentiality of the conversation.`;
                    }
                    gptResponse = await gptService.generateResponse('system', greetingText);
                    console.info(`[Conversation Relay] Setup <<<<<<: ${JSON.stringify(gptResponse, null, 4)}`);
                    // Send the response back to the WebSocket client
                    ws.send(JSON.stringify(gptResponse));
                    break;
                default:
                    console.log(`[Conversation Relay] Unknown message type: ${message.type}`);
            };
        } catch (error) {
            console.error('[Conversation Relay] Error in message handling:', error);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

////////// SERVER BASICS //////////

// Basic HTTP endpoint
app.get('/', (req, res) => {
    res.send('WebSocket Server Running');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
    } else {
        console.error('Failed to start server:', error);
    }
    process.exit(1);
});
